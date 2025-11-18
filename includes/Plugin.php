<?php

/**
 * Main Plugin Class
 *
 * @package Aether\SiteExporterProviders
 */

namespace Aether\SiteExporterProviders;

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

		// Enqueue provider scripts.
		\add_action('admin_enqueue_scripts', [ $this, 'enqueueProviderScripts' ]);
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
	 * Enqueue provider scripts.
	 *
	 * Only enqueue on Aether Site Exporter admin pages.
	 *
	 * @param string $hook Current admin page hook.
	 * @return void
	 */
	public function enqueueProviderScripts(string $hook): void
	{
		// Only enqueue on Aether Site Exporter pages.
		if (strpos($hook, 'aether-site-exporter') === false) {
			return;
		}

		$pluginUrl = AETHER_SEP_PLUGIN_URL;
		$buildDir = AETHER_SEP_PLUGIN_DIR . 'assets/build/';

		// List of providers to enqueue.
		$providers = [
			'cloudflare',
			'cloudflare-r2',
			'gitlab',
			'gitlab-pages',
		];

		// Enqueue each provider script.
		foreach ($providers as $provider) {
			$assetFile = $buildDir . "provider-{$provider}.asset.php";

			// Skip if asset file doesn't exist.
			if (! file_exists($assetFile)) {
				continue;
			}

			$asset = require $assetFile;

			\wp_enqueue_script(
				"aether-sep-{$provider}",
				$pluginUrl . "assets/build/provider-{$provider}.js",
				$asset['dependencies'],
				$asset['version'],
				true
			);
		}
	}
}
