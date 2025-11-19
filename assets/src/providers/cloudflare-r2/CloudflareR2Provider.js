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
	 * Settings are now handled by PHP via BaseProvider.getSettings().
	 * This method returns an empty array since JavaScript no longer defines fields.
	 *
	 * @return {Array<Object>} Empty array (settings handled by PHP)
	 */
	getProviderSpecificConfigFields() {
		// Settings are handled by PHP, not JavaScript
		return [];
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
