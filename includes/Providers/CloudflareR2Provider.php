<?php

/**
 * Cloudflare R2 Provider
 *
 * PHP provider class for Cloudflare R2 object storage.
 * Provides object storage and edge worker deployment capabilities.
 *
 * @package Aether\SiteExporterProviders\Providers
 */

namespace Aether\SiteExporterProviders\Providers;

use Aether\SiteExporter\Providers\BaseProvider;

/**
 * Cloudflare R2 provider class.
 *
 * Provides Cloudflare R2 object storage with zero egress fees.
 */
class CloudflareR2Provider extends BaseProvider
{
	/**
	 * Provider ID.
	 *
	 * @var string
	 */
	private const PROVIDER_ID = 'cloudflare-r2';

	/**
	 * Get the unique provider identifier.
	 *
	 * @return string Provider ID
	 */
	public function getId(): string
	{
		return self::PROVIDER_ID;
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * @return string Provider name
	 */
	public function getName(): string
	{
		return \__('Cloudflare R2', 'aether-site-exporter-providers');
	}

	/**
	 * Get the provider description.
	 *
	 * @return string Provider description
	 */
	public function getDescription(): string
	{
		return \__('Cloudflare R2 object storage with zero egress fees. Includes edge worker deployment for WordPress Playground compatibility.', 'aether-site-exporter-providers');
	}

	/**
	 * Get deployment types this provider supports.
	 *
	 * @return array<string> Array of deployment types
	 */
	public function getDeploymentTypes(): array
	{
		return ['static_site', 'blueprint_bundle'];
	}

	/**
	 * Get provider type.
	 *
	 * @return string Provider type
	 */
	public function getType(): string
	{
		return 'cloud-storage';
	}

	/**
	 * Get provider-specific settings fields definition.
	 *
	 * Note: The deployment_types field is automatically added by BaseProvider::getSettings().
	 *
	 * @return array<array<string, mixed>> Array of field definitions
	 */
	public function getProviderSettings(): array
	{
		return [
			[
				'type' => 'text',
				'label' => \__('Cloudflare Account ID', 'aether-site-exporter-providers'),
				'name' => 'cloudflare_account_id',
				'hidden' => true, // Hidden - configured in Cloudflare Workers (edge) provider
				'sanitize_callback' => function ($value) {
					if (! \is_string($value)) {
						return '';
					}
					$value = \sanitize_text_field($value);
					// Validate pattern: 32-character hexadecimal string
					if (! \preg_match('/^[a-f0-9]{32}$/', $value)) {
						return '';
					}
					return $value;
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['cloudflare_account_id'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['cloudflare_account_id'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'text',
				'label' => \__('Access Key ID', 'aether-site-exporter-providers'),
				'name' => 'access_key_id',
				'required' => true,
				'sanitize_callback' => function ($value) {
					if (! \is_string($value)) {
						return '';
					}
					$value = \sanitize_text_field($value);
					// Validate length: min 16, max 128
					$length = \strlen($value);
					if ($length < 16 || $length > 128) {
						return '';
					}
					return $value;
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['access_key_id'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['access_key_id'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'password',
				'label' => \__('Secret Access Key', 'aether-site-exporter-providers'),
				'name' => 'secret_access_key',
				'required' => true,
				'sanitize_callback' => function ($value) {
					if (! \is_string($value)) {
						return '';
					}
					// Validate length: min 32, max 128
					$length = \strlen($value);
					if ($length < 32 || $length > 128) {
						return '';
					}
					return $value; // Store as-is, encryption handled by REST API
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['secret_access_key'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['secret_access_key'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'text',
				'label' => \__('Bucket Name', 'aether-site-exporter-providers'),
				'name' => 'bucket_name',
				'required' => true,
				'sanitize_callback' => function ($value) {
					if (! \is_string($value)) {
						return '';
					}
					$value = \sanitize_text_field($value);
					// Validate pattern: ^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$
					// Length: min 3, max 63
					$length = \strlen($value);
					if ($length < 3 || $length > 63) {
						return '';
					}
					if (! \preg_match('/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/', $value)) {
						return '';
					}
					return $value;
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['bucket_name'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['bucket_name'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'text',
				'label' => \__('Region (Optional)', 'aether-site-exporter-providers'),
				'name' => 'region',
				'is_advanced' => true,
				'sanitize_callback' => function ($value) {
					if (empty($value)) {
						return '';
					}
					return \sanitize_text_field($value);
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['region'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['region'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'url',
				'label' => \__('Endpoint URL (Optional)', 'aether-site-exporter-providers'),
				'name' => 'endpoint',
				'is_advanced' => true,
				'sanitize_callback' => function ($value) {
					if (empty($value)) {
						return '';
					}
					return \esc_url_raw($value);
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['endpoint'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['endpoint'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'url',
				'label' => \__('Worker Endpoint URL', 'aether-site-exporter-providers'),
				'name' => 'worker_endpoint',
				'is_advanced' => true,
				'sanitize_callback' => function ($value) {
					if (empty($value)) {
						return '';
					}
					return \esc_url_raw($value);
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['worker_endpoint'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['worker_endpoint'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'url',
				'label' => \__('Custom Domain (Optional)', 'aether-site-exporter-providers'),
				'name' => 'custom_domain',
				'is_advanced' => true,
				'sanitize_callback' => function ($value) {
					if (empty($value)) {
						return '';
					}
					return \esc_url_raw($value);
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['custom_domain'] ?? '';
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['custom_domain'] = $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
			[
				'type' => 'checkbox',
				'label' => \__('Enable Public Access', 'aether-site-exporter-providers'),
				'name' => 'public_access',
				'is_advanced' => true,
				'sanitize_callback' => function ($value) {
					return (bool) $value;
				},
				'get' => function () {
					$settings = \get_option('aether_site_exporter_settings', []);
					return $settings['providers'][self::PROVIDER_ID]['public_access'] ?? false;
				},
				'set' => function ($value) {
					$settings = \get_option('aether_site_exporter_settings', []);
					if (! isset($settings['providers']) || ! \is_array($settings['providers'])) {
						$settings['providers'] = [];
					}
					if (! isset($settings['providers'][self::PROVIDER_ID]) || ! \is_array($settings['providers'][self::PROVIDER_ID])) {
						$settings['providers'][self::PROVIDER_ID] = [];
					}
					$settings['providers'][self::PROVIDER_ID]['public_access'] = (bool) $value;
					\update_option('aether_site_exporter_settings', $settings);
				},
			],
		];
	}

	/**
	 * Get provider dependencies.
	 *
	 * Cloudflare R2 requires Cloudflare Workers provider to be enabled and configured.
	 *
	 * @return array<string> Array of provider IDs this provider depends on
	 */
	public function getDependencies(): array
	{
		return ['cloudflare'];
	}
}
