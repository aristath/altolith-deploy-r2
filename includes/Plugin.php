<?php

/**
 * Main Plugin Class
 *
 * @package Aether\SiteExporterProviders
 */

namespace Aether\SiteExporterProviders;

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
			'aether-site-exporter-providers',
			false,
			\dirname(\plugin_basename(AETHER_SEP_PLUGIN_FILE)) . '/languages'
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

		// Register routes.
		$workerScriptController->registerRoutes();
	}

	/**
	 * Enqueue provider JavaScript files on settings page.
	 *
	 * Provider scripts register hooks (aether.provider.upload, aether.provider.test, etc.)
	 * that are used by the base plugin's JavaScript code.
	 *
	 * @param string $hook Current admin page hook.
	 * @return void
	 */
	public function enqueueProviderScripts(string $hook): void
	{
		// Only enqueue on Aether settings page.
		// Check both hook name and page parameter for reliability.
		$isAetherPage = (
			'toplevel_page_aether' === $hook ||
			(isset($_GET['page']) && 'aether' === \sanitize_text_field(\wp_unslash($_GET['page'])))
		);

		if (! $isAetherPage) {
			return;
		}

		$pluginUrl = AETHER_SEP_PLUGIN_URL;
		$pluginDir = AETHER_SEP_PLUGIN_DIR;

		// List of provider scripts to enqueue.
		$providerScripts = [
			'provider-cloudflare-r2-static-site',
			'provider-cloudflare-r2-blueprint-bundle',
			'provider-gitlab',
			'provider-gitlab-pages',
		];

		foreach ($providerScripts as $scriptHandle) {
			$assetFile = $pluginDir . 'assets/build/' . $scriptHandle . '.asset.php';
			$asset = \file_exists($assetFile) ? require $assetFile : [
				'dependencies' => [ 'wp-hooks', 'wp-i18n' ],
				'version' => AETHER_SEP_VERSION,
			];

			\wp_enqueue_script(
				'aether-sep-' . $scriptHandle,
				$pluginUrl . 'assets/build/' . $scriptHandle . '.js',
				$asset['dependencies'],
				$asset['version'],
				true
			);
		}
	}
}
