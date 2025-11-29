/**
 * Cloudflare R2 Provider
 *
 * Unified provider for Cloudflare R2 object storage. Handles all output types
 * (static site, blueprint, etc.) based on user configuration.
 *
 * This replaces the separate CloudflareR2StaticSiteProvider and
 * CloudflareR2BlueprintBundleProvider with a single, extensible provider.
 */

import { __ } from '@wordpress/i18n';
import { getOutputTypeFields } from '@altolith/utils/outputTypes';
import { StorageService } from '../services/storageService';
import { uploadFile as uploadToWorker } from '../../utils/workerEndpointClient';

/**
 * CloudflareR2Provider class
 *
 * Provides Cloudflare R2 object storage for all output types.
 * Uses Cloudflare Workers for file uploads with zero egress fees.
 */
export class CloudflareR2Provider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'cloudflare-r2';

	/**
	 * Provider family for config copying compatibility.
	 *
	 * @type {string}
	 */
	static FAMILY = 'cloudflare-r2';

	/**
	 * Provider name.
	 *
	 * @type {string}
	 */
	static NAME = __( 'Cloudflare R2', 'altolith-deploy-r2' );

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
		'Cloudflare R2 object storage with zero egress fees. Supports static site exports and WordPress Playground blueprints.',
		'altolith-deploy-r2'
	);

	/**
	 * Provider icon.
	 *
	 * @type {string}
	 */
	static ICON = '☁️';

	/**
	 * Whether this provider supports parallel execution with other instances.
	 *
	 * R2 providers can run in parallel since they use separate worker endpoints.
	 *
	 * @type {boolean}
	 */
	static SUPPORTS_PARALLEL_EXECUTION = true;

	/**
	 * Core configuration fields (provider-specific).
	 *
	 * Output type fields are added dynamically via getConfigFields().
	 *
	 * @type {Array<Object>}
	 */
	static CONFIG_FIELDS = [
		{
			id: 'credential_profile',
			label: __( 'Cloudflare Credentials', 'altolith-deploy-r2' ),
			type: 'profile',
			profile_category: 'credentials',
			profile_type: 'cloudflare',
			required: true,
			help: __(
				'Select or create a Cloudflare credentials profile with your Account ID and API Token.',
				'altolith-deploy-r2'
			),
		},
		{
			id: 'bucket_name',
			label: __( 'Bucket Name', 'altolith-deploy-r2' ),
			type: 'text',
			required: true,
			sensitive: false,
			validation: {
				pattern: '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$',
				minLength: 3,
				maxLength: 63,
				message: __(
					'Bucket name must be 3-63 characters, start and end with alphanumeric, and contain only lowercase letters, numbers, and hyphens',
					'altolith-deploy-r2'
				),
			},
		},
		{
			id: 'path',
			label: __( 'Path Prefix', 'altolith-deploy-r2' ),
			type: 'text',
			required: false,
			sensitive: false,
			placeholder: 'my-site/',
			help: __(
				'Optional path prefix for all uploaded files (e.g., "my-site/" will upload files as "my-site/index.html")',
				'altolith-deploy-r2'
			),
			validation: {
				pattern: '^[a-zA-Z0-9._/-]*$',
				message: __(
					'Path can only contain letters, numbers, dots, underscores, hyphens, and forward slashes',
					'altolith-deploy-r2'
				),
			},
		},
		{
			id: 'public_url',
			label: __( 'Custom Domain (Optional)', 'altolith-deploy-r2' ),
			type: 'url',
			required: false,
			sensitive: false,
			help: __(
				'The custom domain for your site (e.g., https://example.com). If provided, the Deploy Worker button will automatically attach it to the worker. Also used for blueprint URL references.',
				'altolith-deploy-r2'
			),
		},
		{
			id: 'worker_endpoint',
			label: __( 'Worker Endpoint URL', 'altolith-deploy-r2' ),
			type: 'url',
			required: false,
			sensitive: false,
			help: __(
				'URL of the deployed Cloudflare Worker. Use the Deploy Worker button below to create one.',
				'altolith-deploy-r2'
			),
		},
	];

	/**
	 * Get all configuration fields including output type fields.
	 *
	 * This method merges the provider's core fields with fields from all
	 * registered output types (static_site, blueprint, media_offload, etc.).
	 *
	 * @return {Array<Object>} Complete array of config field definitions.
	 */
	static getConfigFields() {
		const coreFields = [ ...CloudflareR2Provider.CONFIG_FIELDS ];
		const outputTypeFields = getOutputTypeFields();

		return [ ...coreFields, ...outputTypeFields ];
	}

	/**
	 * Test connection to the provider.
	 *
	 * This method is called by the ProviderSettings component when the user
	 * clicks the "Test Connection" button. It creates a storage service and
	 * tests the connection.
	 *
	 * @param {Object} config Provider configuration object.
	 * @return {Promise<Object>} Test result with success and optional error message.
	 */
	static async testConnection( config ) {
		if ( ! config?.worker_endpoint || ! config?.bucket_name ) {
			return {
				success: false,
				error: __(
					'Storage service not configured. Please set worker_endpoint and bucket_name.',
					'altolith-deploy-r2'
				),
			};
		}

		// Create upload adapter
		const storageConfig = {
			public_url: config.public_url || null,
			path: config.path || '',
		};

		const uploadAdapter = {
			async upload( key, file, options = {} ) {
				let fileToUpload = file;

				// Handle server-side files (blueprint bundles)
				if (
					file.size === 0 &&
					( options.sourceUrl || options.sourcePath )
				) {
					let sourceUrl = options.sourceUrl;
					if ( ! sourceUrl && options.sourcePath ) {
						const siteUrl =
							options.metadata?.siteUrl ||
							window.location.origin;
						const encodedPath = encodeURIComponent(
							options.sourcePath
						);
						sourceUrl = `${ siteUrl }/wp-json/altolith/deploy/export-file?path=${ encodedPath }`;
					}

					if ( sourceUrl ) {
						try {
							const nonce =
								typeof window !== 'undefined' &&
								window.altolithData?.nonce
									? window.altolithData.nonce
									: '';

							const headers = {
								'Content-Type': 'application/octet-stream',
							};

							if ( nonce ) {
								headers[ 'X-WP-Nonce' ] = nonce;
							}

							const response = await fetch( sourceUrl, {
								credentials: 'same-origin',
								headers,
							} );

							if ( ! response.ok ) {
								return {
									success: false,
									error: `Failed to fetch server-side file: ${ response.statusText }`,
								};
							}

							fileToUpload = await response.blob();
						} catch ( error ) {
							return {
								success: false,
								error: `Failed to fetch server-side file: ${ error.message }`,
							};
						}
					}
				}

				// Apply path prefix if configured
				const pathPrefix = storageConfig.path || '';
				const fullKey = pathPrefix
					? pathPrefix.replace( /\/$/, '' ) +
					  '/' +
					  key.replace( /^\//, '' )
					: key;

				return uploadToWorker(
					config.worker_endpoint,
					fullKey,
					fileToUpload,
					{
						contentType: options.contentType || fileToUpload.type,
					}
				);
			},
		};

		// Create storage service
		const storage = new StorageService(
			config.worker_endpoint,
			config.bucket_name,
			storageConfig,
			uploadAdapter
		);

		// Test connection
		return await storage.testConnection();
	}
}

export default CloudflareR2Provider;
