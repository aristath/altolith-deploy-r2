/**
 * Cloudflare R2 Provider
 *
 * JavaScript implementation of the Cloudflare R2 provider.
 * Provides object storage and edge worker deployment capabilities.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { AbstractAWSProvider } from '../aws/AbstractAWSProvider';
import { EdgeService } from '../services/edgeService';
import { DEPLOYMENT_TYPES } from '@aether/base/constants/deploymentTypes';
import apiFetch from '../../utils/api';

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
	 * Get supported deployment types.
	 *
	 * Cloudflare R2 supports static sites and blueprint bundles through S3-compatible storage.
	 * Inherits from AbstractAWSProvider but can be overridden here if needed.
	 *
	 * @return {Array<string>} Supported deployment types
	 */
	getSupportedDeploymentTypes() {
		return [
			DEPLOYMENT_TYPES.STATIC_SITE,
			DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE,
		];
	}

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
	 * Get provider-specific configuration fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getProviderSpecificConfigFields() {
		return [
			{
				id: 'cloudflare_account_id',
				label: __( 'Cloudflare Account ID', 'aether' ),
				type: 'text',
				required: true,
				sensitive: true,
				hidden: true, // Hidden - configured in Cloudflare Workers (edge) provider
				validation: {
					pattern: /^[a-f0-9]{32}$/,
					message: __(
						'Account ID must be a 32-character hexadecimal string',
						'aether'
					),
				},
			},
			{
				id: 'access_key_id',
				label: __( 'Access Key ID', 'aether' ),
				type: 'text',
				required: true,
				sensitive: true,
				validation: {
					minLength: 16,
					maxLength: 128,
					message: __(
						'Access Key ID must be between 16 and 128 characters',
						'aether'
					),
				},
			},
			{
				id: 'secret_access_key',
				label: __( 'Secret Access Key', 'aether' ),
				type: 'text',
				required: true,
				sensitive: true,
				validation: {
					minLength: 32,
					maxLength: 128,
					message: __(
						'Secret Access Key must be between 32 and 128 characters',
						'aether'
					),
				},
			},
			{
				id: 'bucket_name',
				label: __( 'Bucket Name', 'aether' ),
				type: 'text',
				required: true,
				sensitive: false,
				validation: {
					pattern: /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/,
					minLength: 3,
					maxLength: 63,
					message: __(
						'Bucket name must be 3-63 characters, start and end with alphanumeric, and contain only lowercase letters, numbers, and hyphens',
						'aether'
					),
				},
			},
			{
				id: 'region',
				label: __( 'Region (Optional)', 'aether' ),
				type: 'text',
				required: false,
				sensitive: false,
				isAdvanced: true,
			},
			{
				id: 'endpoint',
				label: __( 'Endpoint URL (Optional)', 'aether' ),
				type: 'url',
				required: false,
				sensitive: false,
				isAdvanced: true,
			},
			{
				id: 'worker_endpoint',
				label: __( 'Worker Endpoint URL', 'aether' ),
				type: 'url',
				required: false,
				sensitive: false,
				isAdvanced: true,
				help: __(
					'URL of the deployed Cloudflare Worker that handles file uploads',
					'aether'
				),
			},
			{
				id: 'custom_domain',
				label: __( 'Custom Domain (Optional)', 'aether' ),
				type: 'url',
				required: false,
				sensitive: false,
				isAdvanced: true,
			},
			{
				id: 'public_access',
				label: __( 'Enable Public Access', 'aether' ),
				type: 'checkbox',
				required: false,
				sensitive: false,
				isAdvanced: true,
				default: false,
			},
		];
	}

	/**
	 * Get provider dependencies.
	 *
	 * Cloudflare R2 requires Cloudflare Workers provider to be enabled and configured.
	 *
	 * @return {Array<string>} Array of provider IDs this provider depends on
	 */
	getDependencies() {
		return [ 'cloudflare' ];
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
	 * Gets Cloudflare account ID and API token from the edge provider (cloudflare),
	 * not from R2 provider's own config, since those credentials are managed by the edge provider.
	 *
	 * @protected
	 * @return {Promise<EdgeService|null>} Edge service instance
	 */
	async getEdgeService() {
		if ( this.edgeService ) {
			return this.edgeService;
		}

		// Get R2 provider config for storage settings
		const config = await this.getConfig();

		// Get edge provider (cloudflare) credentials from settings
		const settingsResponse = await apiFetch( {
			path: '/aether/site-exporter/settings',
		} );
		const settings = settingsResponse.settings || {};
		const edgeProvider = settings.providers?.cloudflare || {};

		// Use account_id and api_token from edge provider, not from R2 config
		const accountId = edgeProvider.account_id || '';
		const apiToken = edgeProvider.api_token || '';

		if ( ! accountId || ! apiToken ) {
			return null;
		}

		this.edgeService = new EdgeService( accountId, apiToken, config );

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
	 * Upload a file to R2 storage.
	 *
	 * @param {string} filePath Source file path (URL or local path).
	 * @param {string} fileName Destination file name/key in storage.
	 * @param {Object} context  Optional upload context.
	 * @return {Promise<Object>} Upload result with success status and URL.
	 */
	async uploadFile( filePath, fileName, context = {} ) {
		try {
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

			// Fetch the file from the filePath (could be a URL or local path)
			let file;
			if (
				filePath.startsWith( 'http://' ) ||
				filePath.startsWith( 'https://' )
			) {
				// Fetch from URL
				const response = await fetch( filePath );
				if ( ! response.ok ) {
					return {
						success: false,
						error: __( 'Failed to fetch file from URL', 'aether' ),
					};
				}
				const blob = await response.blob();
				file = new File( [ blob ], fileName, { type: blob.type } );
			} else {
				// For local paths, we need to fetch via REST API
				// This is a simplified implementation - may need adjustment based on actual file handling
				return {
					success: false,
					error: __(
						'Local file upload not yet implemented for R2',
						'aether'
					),
				};
			}

			// Upload to storage
			const result = await storage.upload( fileName, file, {
				contentType: file.type,
				onProgress: context.onProgress || null,
			} );

			if ( ! result.success ) {
				return result;
			}

			// Get public URL
			const publicUrl = this.getPublicUrl( fileName );

			return {
				success: true,
				url: publicUrl || result.url || '',
				path: fileName,
				message: __( 'File uploaded successfully', 'aether' ),
			};
		} catch ( error ) {
			return {
				success: false,
				error: error.message || __( 'File upload failed', 'aether' ),
			};
		}
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
