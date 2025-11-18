/**
 * Cloudflare R2 Provider
 *
 * JavaScript implementation of the Cloudflare R2 provider.
 * Provides object storage and edge worker deployment capabilities.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import {
	AbstractAWSProvider,
	CAP_STORAGE,
	CAP_MEDIA,
} from '../aws/AbstractAWSProvider';
import { CAP_STATIC_SITE } from '../base/AbstractProvider';
import { ConfigFieldBuilder } from '../utils/configFieldBuilder';
import { EdgeService } from '../services/edgeService';

/**
 * CloudflareR2Provider class
 *
 * Provides Cloudflare R2 object storage with zero egress fees.
 * Extends AbstractAWSProvider to inherit S3-compatible storage functionality.
 */
export class CloudflareR2Provider extends AbstractAWSProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'cloudflare-r2';

	/**
	 * Provider capabilities.
	 *
	 * Note: Cloudflare R2 is a storage provider, not an edge provider.
	 * While it can deploy a worker (via the edge provider), it should not
	 * be listed in the edge providers dropdown. The edge provider should
	 * be Cloudflare Workers (CloudflareWorkersProvider).
	 *
	 * Cloudflare R2 supports media offloading (CAP_MEDIA) since it can
	 * store and serve media files through its object storage.
	 *
	 * @type {Array<string>}
	 */
	capabilities = [ CAP_STORAGE, CAP_MEDIA, CAP_STATIC_SITE ];

	/**
	 * Whether this provider requires a worker to be deployed.
	 *
	 * @type {boolean}
	 */
	requiresWorker = true;

	/**
	 * Worker type for deployment.
	 *
	 * @type {string}
	 */
	workerType = 'r2';

	/**
	 * Edge service instance.
	 *
	 * @type {EdgeService|null}
	 */
	edgeService = null;

	/**
	 * Storage service instance.
	 *
	 * @type {Object|null}
	 */
	storageService = null;

	/**
	 * Get the unique provider identifier.
	 *
	 * @return {string} Provider ID
	 */
	getId() {
		return this.registeredId || CloudflareR2Provider.ID;
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * @return {string} Provider name
	 */
	getName() {
		return __( 'Cloudflare R2', 'aether' );
	}

	/**
	 * Get the provider type.
	 *
	 * @return {string} Provider type
	 */
	getType() {
		return 'cloud-storage';
	}

	/**
	 * Get the provider description.
	 *
	 * @return {string} Provider description
	 */
	getDescription() {
		return __(
			'Cloudflare R2 object storage with zero egress fees. Includes edge worker deployment for WordPress Playground compatibility.',
			'aether'
		);
	}

	/**
	 * Get the provider icon.
	 *
	 * @return {string} Provider icon
	 */
	getIcon() {
		return '☁️';
	}

	/**
	 * Get configuration fields for this provider.
	 *
	 * Includes common S3 fields from AbstractAWSProvider plus R2-specific fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getConfigFields() {
		// Get base S3 fields from AbstractAWSProvider (already built)
		const baseFields = super.getConfigFields();

		// Add R2-specific fields
		const r2Fields = ConfigFieldBuilder.buildAll( [
			ConfigFieldBuilder.text( 'cloudflare_account_id' )
				.label( __( 'Cloudflare Account ID', 'aether' ) )
				.description(
					__(
						'Your Cloudflare account ID (found in R2 dashboard)',
						'aether'
					)
				)
				.required()
				.pattern(
					'^[a-f0-9]{32}$',
					__(
						'Account ID must be a 32-character hexadecimal string',
						'aether'
					)
				)
				.sensitive(),

			ConfigFieldBuilder.url( 'worker_endpoint' )
				.label( __( 'Worker Endpoint URL', 'aether' ) )
				.description(
					__(
						'Deployed Cloudflare Worker endpoint for upload proxy (auto-populated after deployment)',
						'aether'
					)
				),

			ConfigFieldBuilder.url( 'custom_domain' )
				.label( __( 'Custom Domain (Optional)', 'aether' ) )
				.description(
					__(
						'Custom domain for R2 bucket access (e.g., https://cdn.example.com)',
						'aether'
					)
				),

			ConfigFieldBuilder.checkbox( 'public_access' )
				.label( __( 'Enable Public Access', 'aether' ) )
				.description(
					__(
						'Allow public read access to bucket contents',
						'aether'
					)
				)
				.default( false ),
		] );

		// Combine base fields and R2-specific fields
		// Put cloudflare_account_id first, then base fields, then other R2 fields
		return [
			r2Fields[ 0 ], // cloudflare_account_id
			...baseFields, // access_key_id, secret_access_key, bucket_name, region, endpoint
			...r2Fields.slice( 1 ), // worker_endpoint, custom_domain, public_access
		];
	}

	/**
	 * Get provider status.
	 *
	 * @return {Promise<Object>} Status object
	 */
	async getStatus() {
		const status = await super.getStatus();

		// Add deployment status for edge capability
		const config = await this.getConfig();
		status.deployed = Boolean( config.worker_endpoint );

		return status;
	}

	/**
	 * Get edge service instance (lazy-loaded).
	 *
	 * @protected
	 * @return {Promise<EdgeService|null>} Edge service instance
	 */
	async getEdgeService() {
		if ( this.edgeService ) {
			return this.edgeService;
		}

		const config = await this.getConfig();

		if ( ! config.cloudflare_account_id || ! config.access_key_id ) {
			return null;
		}

		this.edgeService = new EdgeService(
			config.cloudflare_account_id,
			config.access_key_id, // API token
			config
		);

		return this.edgeService;
	}

	/**
	 * Get the storage endpoint URL.
	 *
	 * Returns the Worker endpoint for R2 (browser-based access).
	 *
	 * @return {Promise<string>} Storage endpoint URL
	 */
	async getStorageEndpoint() {
		const config = await this.getConfig();
		return config.worker_endpoint || '';
	}

	/**
	 * Get storage service configuration.
	 *
	 * Returns config with workerEndpoint, bucketName, and R2-specific settings.
	 *
	 * @return {Promise<Object>} Storage service configuration object
	 */
	async getStorageServiceConfig() {
		const config = await this.getConfig();
		return {
			worker_endpoint: config.worker_endpoint || '',
			bucket_name: config.bucket_name || '',
			custom_domain: config.custom_domain || '',
			public_access: config.public_access || false,
			...config,
		};
	}

	/**
	 * Test connection to R2 storage.
	 *
	 * Tests connection via Worker endpoint.
	 *
	 * @return {Promise<Object>} Connection test result
	 */
	async testConnection() {
		const storage = await this.getStorageService();
		if ( ! storage ) {
			return {
				success: false,
				error: __(
					'Storage service not available. Please configure worker_endpoint and bucket_name.',
					'aether'
				),
			};
		}

		return await storage.testConnection();
	}

	/**
	 * Get public URL for an object.
	 *
	 * Constructs R2 public URL using custom domain or default R2 domain.
	 *
	 * @param {string} key Object key/path.
	 * @return {string} Public URL
	 */
	getPublicUrl( key ) {
		const config = this.config;
		if ( config.custom_domain ) {
			return `${ config.custom_domain }/${ key }`;
		}

		// Default R2 public URL format (if publicAccess is enabled)
		// Note: This is a placeholder - actual URL construction may vary
		if ( config.public_url ) {
			return `${ config.public_url }/${ key }`;
		}

		// Fallback: use worker endpoint for serving files
		if ( config.worker_endpoint ) {
			return `${ config.worker_endpoint }/${ key }`;
		}

		return '';
	}
}

export default CloudflareR2Provider;
