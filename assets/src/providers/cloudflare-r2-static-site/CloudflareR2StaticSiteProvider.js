/**
 * Cloudflare R2 Static Site Provider
 *
 * Static metadata class for the Cloudflare R2 static site provider.
 * All logic is handled via hooks in index.js.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

/**
 * CloudflareR2StaticSiteProvider class
 *
 * Provides Cloudflare R2 object storage for static site exports.
 * This is a static metadata class - all operational logic is in index.js.
 */
export class CloudflareR2StaticSiteProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'cloudflare-r2-static-site';

	/**
	 * Provider name.
	 *
	 * @type {string}
	 */
	static NAME = __( 'Cloudflare R2', 'aether-site-exporter-providers' );

	/**
	 * Provider type.
	 *
	 * @type {string}
	 */
	static TYPE = 'cloud-storage';

	/**
	 * Provider description.
	 *
	 * @type {string}
	 */
	static DESCRIPTION = __(
		'Cloudflare R2 object storage for static site exports with zero egress fees.',
		'aether-site-exporter-providers'
	);

	/**
	 * Provider icon.
	 *
	 * @type {string}
	 */
	static ICON = '☁️';

	/**
	 * Deployment type this provider supports.
	 *
	 * @type {string}
	 */
	static DEPLOYMENT_TYPE = 'static_site';

	/**
	 * Configuration fields.
	 *
	 * @type {Array<Object>}
	 */
	static CONFIG_FIELDS = [
		{
			id: 'account_id',
			label: __(
				'Cloudflare Account ID',
				'aether-site-exporter-providers'
			),
			type: 'text',
			required: true,
			sensitive: true,
			validation: {
				pattern: '^[a-f0-9]{32}$',
				message: __(
					'Account ID must be a 32-character hexadecimal string',
					'aether-site-exporter-providers'
				),
			},
		},
		{
			id: 'api_token',
			label: __(
				'Cloudflare API Token',
				'aether-site-exporter-providers'
			),
			type: 'password',
			required: true,
			sensitive: true,
			validation: {
				minLength: 20,
				message: __(
					'API Token must be at least 20 characters',
					'aether-site-exporter-providers'
				),
			},
		},
		{
			id: 'access_key_id',
			label: __( 'R2 Access Key ID', 'aether-site-exporter-providers' ),
			type: 'text',
			required: true,
			sensitive: true,
			validation: {
				minLength: 16,
				maxLength: 128,
				message: __(
					'Access Key ID must be between 16 and 128 characters',
					'aether-site-exporter-providers'
				),
			},
		},
		{
			id: 'secret_access_key',
			label: __(
				'R2 Secret Access Key',
				'aether-site-exporter-providers'
			),
			type: 'text',
			required: true,
			sensitive: true,
			validation: {
				minLength: 32,
				maxLength: 128,
				message: __(
					'Secret Access Key must be between 32 and 128 characters',
					'aether-site-exporter-providers'
				),
			},
		},
		{
			id: 'bucket_name',
			label: __( 'Bucket Name', 'aether-site-exporter-providers' ),
			type: 'text',
			required: true,
			sensitive: false,
			validation: {
				pattern: '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$',
				minLength: 3,
				maxLength: 63,
				message: __(
					'Bucket name must be 3-63 characters, start and end with alphanumeric, and contain only lowercase letters, numbers, and hyphens',
					'aether-site-exporter-providers'
				),
			},
		},
		{
			id: 'worker_endpoint',
			label: __(
				'Worker Endpoint URL',
				'aether-site-exporter-providers'
			),
			type: 'url',
			required: false,
			sensitive: false,
			help: __(
				'URL of the deployed Cloudflare Worker. Use the Deploy Worker button below to create one.',
				'aether-site-exporter-providers'
			),
		},
		{
			id: 'custom_domain',
			label: __(
				'Custom Domain (Optional)',
				'aether-site-exporter-providers'
			),
			type: 'url',
			required: false,
			sensitive: false,
			isAdvanced: true,
		},
	];
}

export default CloudflareR2StaticSiteProvider;
