/**
 * Cloudflare R2 Provider Registration
 *
 * Registers the unified Cloudflare R2 provider handlers via WordPress hooks.
 * Uses the StorageService adapter pattern for true provider instance isolation.
 *
 * Each provider instance gets its own StorageService via the 'altolith.storage.service.create'
 * filter, ensuring complete isolation between instances.
 *
 * This unified provider handles all output types (static site, blueprint) based on
 * user configuration, replacing the separate static-site and blueprint-bundle providers.
 *
 * @package
 */

import { addFilter, doAction } from '@wordpress/hooks';
import { CloudflareR2Provider } from './CloudflareR2Provider';

// Register Cloudflare credentials profile type
import '../../profiles';
import { initCloudflareR2ModalHooks } from './modal-hooks';
import ProviderRegistry from '@altolith/providers/registry/ProviderRegistry';
import { StorageService } from '../services/storageService';
import { uploadFile as uploadToWorker } from '../../utils/workerEndpointClient';

// Register provider class in JavaScript registry
ProviderRegistry.register( CloudflareR2Provider.ID, CloudflareR2Provider );

// Also trigger the hook for any listeners
doAction( 'altolith.providers.register', CloudflareR2Provider );

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
 * @param {Object} storageConfig  Storage configuration.
 * @return {Object} Upload adapter with upload() method.
 */
function createUploadAdapter( workerEndpoint, storageConfig ) {
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

			// If this is a server-side file, fetch it first
			// Server-side files are indicated by sourceUrl or sourcePath with empty blob
			if ( file.size === 0 && ( options.sourceUrl || options.sourcePath ) ) {
				let sourceUrl = options.sourceUrl;

				// If sourcePath is provided, convert it to a URL
				if ( ! sourceUrl && options.sourcePath ) {
					// Construct URL to fetch the file via REST API
					// The sourcePath is a local file path, we need to serve it via REST
					const siteUrl = options.metadata?.siteUrl || window.location.origin;
					// Encode the sourcePath to pass it as a query parameter
					const encodedPath = encodeURIComponent( options.sourcePath );
					// Use the export-file endpoint to serve the file
					sourceUrl = `${ siteUrl }/wp-json/altolith/deploy/export-file?path=${ encodedPath }`;
				}

				if ( sourceUrl ) {
					try {
						// Get nonce for authenticated request
						const nonce =
							typeof window !== 'undefined' &&
							window.altolithData?.nonce
								? window.altolithData.nonce
								: '';

						const headers = {
							'Content-Type': 'application/octet-stream',
						};

						// Add nonce header for WordPress REST API authentication
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
			}

			// Apply path prefix if configured
			const pathPrefix = storageConfig.path || '';
			const fullKey = pathPrefix
				? pathPrefix.replace( /\/$/, '' ) +
				  '/' +
				  key.replace( /^\//, '' )
				: key;

			return uploadToWorker( workerEndpoint, fullKey, fileToUpload, {
				contentType: options.contentType || fileToUpload.type,
			} );
		},
	};
}

/**
 * Register storage service creation filter.
 *
 * This filter intercepts storage service creation for cloudflare-r2
 * provider instances. Each instance gets its own StorageService with an adapter
 * configured for its specific worker endpoint, achieving true instance isolation.
 */
addFilter(
	'altolith.storage.service.create',
	'altolith/cloudflare-r2',
	( service, staticPath, config, providerId, providerConfig ) => {
		// Only handle this provider type
		if ( ! providerId?.startsWith( 'cloudflare-r2:' ) ) {
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
			return null;
		}

		// Build config for StorageService with R2-specific settings
		const storageConfig = {
			...config,
			public_url: effectiveConfig.public_url || null,
			provider_id: providerId,
			path: effectiveConfig.path || '',
		};

		// Create upload adapter
		const uploadAdapter = createUploadAdapter(
			effectiveConfig.worker_endpoint,
			storageConfig
		);

		// Return new StorageService with the adapter
		return new StorageService(
			effectiveConfig.worker_endpoint,
			effectiveConfig.bucket_name,
			storageConfig,
			uploadAdapter
		);
	},
	10
);

/**
 * Register blueprint path filter for cloudflare-r2 provider.
 *
 * Uses the blueprint_subfolder config field if available, otherwise returns
 * the default path unchanged.
 */
addFilter(
	'altolith.blueprint.path',
	'altolith/cloudflare-r2',
	( path, providerConfig, providerId ) => {
		// Only handle this provider type
		if ( ! providerId?.startsWith( 'cloudflare-r2:' ) ) {
			return path;
		}

		// Use blueprint_subfolder from config if available
		if ( providerConfig?.blueprint_subfolder ) {
			return providerConfig.blueprint_subfolder;
		}

		// Return default path unchanged
		return path;
	},
	10
);

/**
 * Register URL rewriting filter for path prefix support.
 *
 * When a path prefix is configured (e.g., "new-site/"), this filter ensures
 * all rewritten URLs in HTML include the prefix.
 */
addFilter(
	'altolith.url.rewrite',
	'altolith/cloudflare-r2/path-prefix',
	( rewrittenUrl, context ) => {
		const { providerId, providerConfig } = context;

		// Only apply to our provider instances
		if ( ! providerId?.startsWith( 'cloudflare-r2:' ) ) {
			return rewrittenUrl;
		}

		// Get path prefix from config
		const pathPrefix = providerConfig?.path;
		if ( ! pathPrefix ) {
			return rewrittenUrl;
		}

		// Normalize path prefix (ensure leading slash, no trailing slash)
		const normalizedPrefix = '/' + pathPrefix.replace( /^\/|\/$/g, '' );

		// Insert path prefix after the origin
		try {
			const urlObj = new URL( rewrittenUrl );
			urlObj.pathname = normalizedPrefix + urlObj.pathname;
			return urlObj.toString();
		} catch {
			// For relative URLs, prepend the prefix
			if ( rewrittenUrl.startsWith( '/' ) ) {
				return normalizedPrefix + rewrittenUrl;
			}
			return rewrittenUrl;
		}
	},
	10
);

// Initialize modal hooks
initCloudflareR2ModalHooks( 'cloudflare-r2' );
