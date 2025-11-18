<?php

/**
 * Plugin Name: Aether Site Exporter - Providers
 * Plugin URI: https://github.com/aristath/aether-site-exporter-providers
 * Description: Provider implementations (Cloudflare R2, Cloudflare Workers, GitLab, GitLab Pages) for Aether Site Exporter
 * Version: 1.0.0
 * Author: Aristath
 * Author URI: https://aristath.github.io
 * License: GPL-3.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: aether-site-exporter-providers
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * Requires Plugins: aether-site-exporter
 *
 * @package Aether\SiteExporterProviders
 */

namespace Aether\SiteExporterProviders;

// Exit if accessed directly.
if (! defined('ABSPATH')) {
	exit;
}

// Define plugin constants.
define('AETHER_SEP_VERSION', '1.0.0');
define('AETHER_SEP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('AETHER_SEP_PLUGIN_URL', plugin_dir_url(__FILE__));
define('AETHER_SEP_PLUGIN_FILE', __FILE__);
define('AETHER_SEP_REQUIRED_PARENT', 'aether-site-exporter/aether-site-exporter.php');

// Load Composer autoloader if it exists.
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
	require_once __DIR__ . '/vendor/autoload.php';
}

// Load plugin class file.
require_once __DIR__ . '/includes/autoloader.php';

/**
 * Initialize the plugin.
 *
 * @return void
 */
function init(): void
{
	// Check if parent plugin is active.
	if (! is_plugin_active(AETHER_SEP_REQUIRED_PARENT)) {
		add_action('admin_notices', __NAMESPACE__ . '\\showParentPluginNotice');
		return;
	}

	// Initialize the plugin.
	Plugin::getInstance();
}

add_action('plugins_loaded', __NAMESPACE__ . '\\init', 20); // Load after parent plugin (priority 10).

/**
 * Show admin notice when parent plugin is not active.
 *
 * @return void
 */
function showParentPluginNotice(): void
{
	?>
	<div class="notice notice-error">
		<p>
			<?php
			printf(
				/* translators: %s: parent plugin name */
				esc_html__('Aether Site Exporter - Providers requires the %s plugin to be installed and activated.', 'aether-site-exporter-providers'),
				'<strong>' . esc_html__('Aether Site Exporter', 'aether-site-exporter-providers') . '</strong>'
			);
			?>
		</p>
	</div>
	<?php
}

/**
 * Activation hook - check for parent plugin.
 *
 * @return void
 */
function activate(): void
{
	// Check if parent plugin is active.
	if (! is_plugin_active(AETHER_SEP_REQUIRED_PARENT)) {
		wp_die(
			sprintf(
				/* translators: %s: parent plugin name */
				esc_html__('Aether Site Exporter - Providers requires the %s plugin to be installed and activated.', 'aether-site-exporter-providers'),
				'<strong>' . esc_html__('Aether Site Exporter', 'aether-site-exporter-providers') . '</strong>'
			),
			esc_html__('Plugin Activation Error', 'aether-site-exporter-providers'),
			['back_link' => true]
		);
	}
}

register_activation_hook(__FILE__, __NAMESPACE__ . '\\activate');
