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

import { addFilter, addAction, doAction } from '@wordpress/hooks';
import { CloudflareR2Provider } from './CloudflareR2Provider';

// Register Cloudflare credentials profile type
import '../../profiles';
import { initCloudflareR2ModalHooks } from './modal-hooks';
import ProviderRegistry from '@altolith/providers/registry/ProviderRegistry';
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
			path: `/altolith/deploy/providers/${ providerId }/config`,
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
ProviderRegistry.register( CloudflareR2Provider.ID, CloudflareR2Provider );

// Also trigger the hook for any listeners
doAction( 'altolith.providers.register', CloudflareR2Provider );

// Track processed files per provider to avoid duplicate processing
const processedFiles = new Map();

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
			// Server-side files are indicated by sourceUrl and empty blob
			if ( options.sourceUrl && file.size === 0 ) {
				try {
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
 * Get storage service for a provider instance.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<StorageService|null>} Storage service or null if not configured.
 */
async function getStorageService( providerId ) {
	const config = await loadProviderConfig( providerId );

	if ( ! config?.worker_endpoint || ! config?.bucket_name ) {
		return null;
	}

	const storageConfig = {
		public_url: config.public_url || null,
		provider_id: providerId,
		path: config.path || '',
	};

	const uploadAdapter = createUploadAdapter(
		config.worker_endpoint,
		storageConfig
	);

	return new StorageService(
		config.worker_endpoint,
		config.bucket_name,
		storageConfig,
		uploadAdapter
	);
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
 * Handle unified file upload for R2 provider.
 *
 * Handles both static site files and blueprint bundle uploads based on fileType.
 *
 * @param {Object} fileContext Unified file context from altolith.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload( fileContext ) {
	const { fileType, providerId, filePath, storageKey } = fileContext;

	// Only handle requests for cloudflare-r2 providers
	if ( ! providerId || ! providerId.startsWith( 'cloudflare-r2:' ) ) {
		return;
	}

	// Create a unique key for this file+provider combination
	const fileKey = `${ providerId }:${ storageKey || filePath }`;

	// Check if file is already processed or in progress
	const existingEntry = processedFiles.get( fileKey );
	if ( existingEntry === true ) {
		return;
	}
	if ( existingEntry instanceof Promise ) {
		try {
			await existingEntry;
		} catch {
			if ( processedFiles.get( fileKey ) === existingEntry ) {
				processedFiles.delete( fileKey );
			}
		}
		if ( processedFiles.get( fileKey ) === true ) {
			return;
		}
	}

	const processingPromise = ( async () => {
		try {
			const storage = await getStorageService( providerId );
			if ( ! storage ) {
				throw new Error(
					'Storage service not available. Please configure worker_endpoint and bucket_name.'
				);
			}

			if ( ! filePath ) {
				throw new Error( 'File path is required' );
			}

			// Handle blueprint bundle uploads (server-side files)
			if ( fileType === 'blueprint-bundle' ) {
				if (
					! filePath.startsWith( 'http://' ) &&
					! filePath.startsWith( 'https://' )
				) {
					throw new Error(
						'Blueprint bundle must be provided as a URL for R2 uploads'
					);
				}

				const response = await fetch( filePath, {
					method: 'GET',
					credentials: 'omit',
				} );
				if ( ! response.ok ) {
					throw new Error(
						`Failed to fetch blueprint bundle: HTTP ${ response.status }`
					);
				}

				// Get bundle path from config or use default
				const config = await loadProviderConfig( providerId );
				const blueprintSubfolder =
					config?.blueprint_subfolder || 'playground';
				const bundleKey =
					storageKey || `${ blueprintSubfolder }/bundle.zip`;

				const result = await storage.upload(
					bundleKey,
					await response.blob(),
					{
						contentType: 'application/zip',
					}
				);

				if ( ! result.success ) {
					throw new Error(
						result.error || 'Blueprint bundle upload failed'
					);
				}

				fileContext.result = { success: true, url: result.url };
			}
			// Static site files are handled via the storage service filter
		} catch ( error ) {
			fileContext.result = {
				success: false,
				error: error.message || 'Unknown error',
			};
			throw error;
		}
		processedFiles.set( fileKey, true );
	} )().catch( ( error ) => {
		if ( processedFiles.get( fileKey ) === processingPromise ) {
			processedFiles.delete( fileKey );
		}
		throw error;
	} );

	processedFiles.set( fileKey, processingPromise );
	await processingPromise;
}

/**
 * Register unified file upload action hook.
 */
addAction(
	'altolith.file.upload',
	'altolith/cloudflare-r2',
	( fileContext ) => {
		if ( ! fileContext._uploadPromises ) {
			fileContext._uploadPromises = [];
		}
		fileContext._uploadPromises.push(
			handleUnifiedFileUpload( fileContext )
		);
	},
	10
);

/**
 * Register test connection handler hook.
 */
addFilter(
	'altolith.provider.test',
	'altolith/cloudflare-r2',
	( handler, providerId ) => {
		if ( ! providerId?.startsWith( 'cloudflare-r2:' ) ) {
			return handler;
		}
		return async () => {
			const storage = await getStorageService( providerId );
			if ( ! storage ) {
				return {
					success: false,
					error: 'Storage service not configured. Please set worker_endpoint and bucket_name.',
				};
			}
			return storage.testConnection();
		};
	},
	10
);

/**
 * Register upload strategy filter.
 */
addFilter(
	'altolith.provider.upload_strategy',
	'altolith/cloudflare-r2',
	( strategy, providerId ) => {
		if ( providerId?.startsWith( 'cloudflare-r2:' ) ) {
			return 'worker';
		}
		return strategy;
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
