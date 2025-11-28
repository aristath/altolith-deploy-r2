<?php

/**
 * Main Plugin Class
 *
 * @package Altolith\DeployR2
 */

namespace Altolith\DeployR2;

// Providers are now registered entirely in JavaScript, not PHP.

\defined('ABSPATH') || exit;

/**
 * Main plugin orchestrator class.
 */
class Plugin
{
	/**
	 * Plugin instance.
	 *
	 * @var Plugin|null
	 */
	private static ?self $instance = null;

	/**
	 * Get plugin instance.
	 *
	 * @return Plugin
	 */
	public static function getInstance(): self
	{
		if (null === self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct()
	{
		$this->init();
	}

	/**
	 * Initialize the plugin.
	 *
	 * @return void
	 */
	private function init(): void
	{
		// Load translations.
		\add_action('init', [ $this, 'loadTextdomain' ]);

		// Register REST API routes.
		\add_action('rest_api_init', [ $this, 'registerRestRoutes' ]);

		// Enqueue provider scripts on settings page.
		// Use priority 5 to ensure provider scripts load before admin-settings (priority 10).
		\add_action('admin_enqueue_scripts', [ $this, 'enqueueProviderScripts' ], 5);

		// Providers are now registered entirely in JavaScript, not PHP.
		// See assets/src/providers/*/index.js files for registration.
	}

	/**
	 * Load plugin textdomain for translations.
	 *
	 * @return void
	 */
	public function loadTextdomain(): void
	{
		\load_plugin_textdomain(
			'altolith-deploy-r2',
			false,
			\dirname(\plugin_basename(ALTOLITH_R2_PLUGIN_FILE)) . '/languages'
		);
	}

	/**
	 * Register REST API routes.
	 *
	 * @return void
	 */
	public function registerRestRoutes(): void
	{
		// Initialize REST controllers.
		$workerScriptController = new REST\WorkerScriptController();
		$cloudflareProfileTestController = new REST\CloudflareProfileTestController();

		// Register routes.
		$workerScriptController->registerRoutes();
		$cloudflareProfileTestController->registerRoutes();

		// Register profile test filter handler.
		$this->registerProfileTestHandler();
	}

	/**
	 * Register profile test handler for Cloudflare credentials.
	 *
	 * This filter allows the base plugin's ProfilesController to delegate
	 * testing to this plugin for Cloudflare credential profiles.
	 *
	 * @return void
	 */
	private function registerProfileTestHandler(): void
	{
		\add_filter('altolith_profile_test', function ($result, $profile, $profileId) {
			// Only handle Cloudflare credentials profiles.
			if (
				$profile['category'] !== 'credentials' ||
				$profile['type'] !== 'cloudflare'
			) {
				return $result;
			}

			// Get credentials from profile fields.
			$accountId = $profile['fields']['account_id'] ?? '';
			$apiToken = $profile['fields']['api_token'] ?? '';

			if (empty($accountId) || empty($apiToken)) {
				return [
					'success' => false,
					'message' => \__('Account ID and API Token are required.', 'altolith-deploy-r2'),
				];
			}

			// Test credentials via the controller.
			$controller = new REST\CloudflareProfileTestController();
			$request = new \WP_REST_Request('POST');
			$request->set_param('account_id', $accountId);
			$request->set_param('api_token', $apiToken);

			$response = $controller->testCredentials($request);

			if (\is_wp_error($response)) {
				return [
					'success' => false,
					'message' => $response->get_error_message(),
				];
			}

			return $response->get_data();
		}, 10, 3);
	}

	/**
	 * Enqueue provider JavaScript files on settings page.
	 *
	 * Provider scripts register hooks (altolith.provider.upload, altolith.provider.test, etc.)
	 * that are used by the base plugin's JavaScript code.
	 *
	 * @param string $hook Current admin page hook.
	 * @return void
	 */
	public function enqueueProviderScripts(string $hook): void
	{
		// Only enqueue on Altolith settings page.
		// Check both hook name and page parameter for reliability.
		$isAltolithPage = (
			'toplevel_page_altolith' === $hook ||
			(isset($_GET['page']) && 'altolith' === \sanitize_text_field(\wp_unslash($_GET['page'])))
		);

		if (! $isAltolithPage) {
			return;
		}

		$pluginUrl = ALTOLITH_R2_PLUGIN_URL;
		$pluginDir = ALTOLITH_R2_PLUGIN_DIR;

		// List of provider scripts to enqueue.
		$providerScripts = [
			'provider-cloudflare-r2-static-site',
			'provider-cloudflare-r2-blueprint-bundle',
		];

		foreach ($providerScripts as $scriptHandle) {
			$assetFile = $pluginDir . 'assets/build/' . $scriptHandle . '.asset.php';
			$asset = \file_exists($assetFile) ? require $assetFile : [
				'dependencies' => [ 'wp-hooks', 'wp-i18n' ],
				'version' => ALTOLITH_R2_VERSION,
			];

			\wp_enqueue_script(
				'altolith-r2-' . $scriptHandle,
				$pluginUrl . 'assets/build/' . $scriptHandle . '.js',
				$asset['dependencies'],
				$asset['version'],
				true
			);
		}

		// Pass plugin URL to JavaScript for worker file fetching.
		\wp_add_inline_script(
			'altolith-r2-provider-cloudflare-r2-static-site',
			'window.altolithR2PluginUrl = ' . \wp_json_encode($pluginUrl) . ';',
			'before'
		);
	}
}
