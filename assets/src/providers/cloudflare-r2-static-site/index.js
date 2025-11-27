/**
 * Cloudflare R2 Static Site Provider Registration
 *
 * Registers the Cloudflare R2 static site provider handlers via WordPress hooks.
 * Uses the StorageService adapter pattern for true provider instance isolation.
 *
 * Each provider instance gets its own StorageService via the 'aether.storage.service.create'
 * filter, ensuring complete isolation between instances.
 *
 * @package
 */

import { addFilter, doAction } from '@wordpress/hooks';
import { CloudflareR2StaticSiteProvider } from './CloudflareR2StaticSiteProvider';
import { initCloudflareR2ModalHooks } from './modal-hooks';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
import apiFetch from '../../utils/api';
import { StorageService } from '../services/storageService';
import { uploadFile as uploadToWorker } from '../../utils/workerEndpointClient';

/**
 * Load provider configuration from REST API.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<Object>} Provider configuration or empty object.
 */
async function loadProviderConfig( providerId ) {
	try {
		const response = await apiFetch( {
			path: `/aether/site-exporter/providers/${ providerId }/config`,
			method: 'GET',
		} );
		return response.config || {};
	} catch ( error ) {
		if (
			error.code === 'restProviderNotConfigured' ||
			error.status === 404
		) {
			return {};
		}
		throw error;
	}
}

// Register provider class in JavaScript registry
ProviderRegistry.register(
	CloudflareR2StaticSiteProvider.ID,
	CloudflareR2StaticSiteProvider
);

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', CloudflareR2StaticSiteProvider );

/**
 * Create upload adapter for Cloudflare R2.
 *
 * The adapter encapsulates the R2-specific upload logic (via Worker endpoint)
 * while allowing the StorageService to handle common concerns.
 *
 * For server-side files (like blueprint bundles), the adapter fetches the file
 * from the server first, then uploads to R2.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @return {Object} Upload adapter with upload() method.
 */
function createUploadAdapter( workerEndpoint ) {
	return {
		/**
		 * Upload a file to Cloudflare R2 via Worker.
		 *
		 * @param {string}    key     Storage key (file path).
		 * @param {File|Blob} file    File to upload.
		 * @param {Object}    options Upload options (contentType, sourcePath, etc.).
		 * @return {Promise<Object>} Upload result.
		 */
		async upload( key, file, options = {} ) {
			let fileToUpload = file;

			// If this is a server-side file (blueprint bundle), fetch it first
			// Server-side files are indicated by sourceUrl and empty blob
			if ( options.sourceUrl && file.size === 0 ) {
				try {
					// Fetch directly from the sourceUrl (e.g., http://localhost:10003/wp-content/uploads/aether-temp/bundle.zip)
					const response = await fetch( options.sourceUrl, {
						credentials: 'same-origin',
					} );

					if ( ! response.ok ) {
						return {
							success: false,
							error: `Failed to fetch server-side file for R2 upload: ${ response.statusText }`,
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

			return uploadToWorker( workerEndpoint, key, fileToUpload, options );
		},
	};
}

/**
 * Register storage service creation filter.
 *
 * This filter intercepts storage service creation for cloudflare-r2-static-site
 * provider instances. Each instance gets its own StorageService with an adapter
 * configured for its specific worker endpoint, achieving true instance isolation.
 *
 * The filter receives the full provider instance ID (e.g., 'cloudflare-r2-static-site:uuid'),
 * and uses the providerConfig passed from the caller (which was already loaded).
 *
 * Note: WordPress filters are synchronous, so the providerConfig must be loaded
 * by the caller before invoking the filter.
 */
addFilter(
	'aether.storage.service.create',
	'aether/cloudflare-r2-static-site',
	( service, staticPath, config, providerId, providerConfig ) => {
		// Only handle this provider type
		if ( ! providerId?.startsWith( 'cloudflare-r2-static-site' ) ) {
			return service;
		}

		// Use providerConfig passed from caller (already loaded)
		// Fall back to config if providerConfig not available
		const effectiveConfig = providerConfig || config;

		if (
			! effectiveConfig?.worker_endpoint ||
			! effectiveConfig?.bucket_name
		) {
			// Return null to indicate provider is not configured
			// The caller should handle this case
			return null;
		}

		// Create instance-specific upload adapter using this instance's worker endpoint
		const uploadAdapter = createUploadAdapter(
			effectiveConfig.worker_endpoint
		);

		// Build config for StorageService with R2-specific settings
		const storageConfig = {
			...config,
			public_url: effectiveConfig.public_url || null,
			provider_id: providerId,
		};

		// Return new StorageService with the adapter
		// Parameters: workerEndpoint, bucketName, config
		return new StorageService(
			effectiveConfig.worker_endpoint,
			effectiveConfig.bucket_name,
			storageConfig
		);
	},
	10
);

/**
 * Register test connection handler hook.
 */
addFilter(
	'aether.provider.test',
	'aether/cloudflare-r2-static-site',
	( handler, providerId ) => {
		if ( ! providerId?.startsWith( 'cloudflare-r2-static-site' ) ) {
			return handler;
		}
		return async () => {
			const providerConfig = await loadProviderConfig( providerId );

			if (
				! providerConfig?.worker_endpoint ||
				! providerConfig?.bucket_name
			) {
				return {
					success: false,
					error: 'Storage service not configured. Please set worker_endpoint and bucket_name.',
				};
			}

			// Create a temporary StorageService to test connection
			const storage = new StorageService(
				providerConfig.worker_endpoint,
				providerConfig.bucket_name,
				{ public_url: providerConfig.public_url || null }
			);
			return storage.testConnection();
		};
	},
	10
);

/**
 * Register upload strategy filter.
 */
addFilter(
	'aether.provider.upload_strategy',
	'aether/cloudflare-r2-static-site',
	( strategy, providerId ) => {
		if ( providerId?.startsWith( 'cloudflare-r2-static-site' ) ) {
			return 'worker';
		}
		return strategy;
	},
	10
);

// Initialize modal hooks
initCloudflareR2ModalHooks( 'cloudflare-r2-static-site' );
