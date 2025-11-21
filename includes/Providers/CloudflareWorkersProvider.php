<?php

/**
 * Cloudflare Workers Provider
 *
 * PHP provider class for Cloudflare Workers edge computing platform.
 * Provides edge function deployment and management capabilities.
 *
 * @package Aether\SiteExporterProviders\Providers
 */

namespace Aether\SiteExporterProviders\Providers;

use Aether\SiteExporter\Providers\BaseProvider;

/**
 * Cloudflare Workers provider class.
 *
 * Provides Cloudflare Workers edge computing platform integration.
 */
class CloudflareWorkersProvider extends BaseProvider
{
	/**
	 * Provider ID.
	 *
	 * @var string
	 */
	private const PROVIDER_ID = 'cloudflare';

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
		return \__('Cloudflare Workers', 'aether-site-exporter-providers');
	}

	/**
	 * Get the provider description.
	 *
	 * @return string Provider description
	 */
	public function getDescription(): string
	{
		return \__('Deploy edge functions to 200+ global locations with Cloudflare Workers', 'aether-site-exporter-providers');
	}

	/**
	 * Get deployment types this provider supports.
	 *
	 * @return array<string> Array of deployment types
	 */
	public function getDeploymentTypes(): array
	{
		return ['edge_functions'];
	}

	/**
	 * Get provider type.
	 *
	 * @return string Provider type
	 */
	public function getType(): string
	{
		return 'edge-computing';
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
				'label' => \__('Account ID', 'aether-site-exporter-providers'),
				'name' => 'account_id',
				'required' => true,
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
			],
			[
				'type' => 'password',
				'label' => \__('API Token', 'aether-site-exporter-providers'),
				'name' => 'api_token',
				'required' => true,
				'sanitize_callback' => function ($value) {
					if (! \is_string($value)) {
						return '';
					}
					// Validate length: min 20
					$length = \strlen($value);
					if ($length < 20) {
						return '';
					}
					return $value; // Store as-is, encryption handled by REST API
				},
			],
		];
	}
}
