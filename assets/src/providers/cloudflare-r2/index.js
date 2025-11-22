/**
 * Cloudflare R2 Provider Registration
 *
 * Registers the Cloudflare R2 provider handlers via WordPress hooks.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * @package
 */

import { addFilter, addAction, doAction } from '@wordpress/hooks';
import { CloudflareR2Provider } from './CloudflareR2Provider';
import { initCloudflareR2ModalHooks } from './modal-hooks';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

// Create provider instance for hook registration
const provider = new CloudflareR2Provider();

// eslint-disable-next-line no-console
console.log( 'CloudflareR2Provider: Registering provider...', provider.getId() );

// Register provider in JavaScript registry
ProviderRegistry.register( provider.getId(), provider );

// eslint-disable-next-line no-console
console.log( 'CloudflareR2Provider: Provider registered successfully' );

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', provider );

/**
 * Handle unified file upload for a provider instance.
 *
 * @param {Object} fileContext Unified file context from aether.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload( fileContext ) {
	const {
		fileType,
		providerId,
		filePath,
		fileContent,
		contentType,
		storageKey,
	} = fileContext;

	// Only handle requests for cloudflare-r2 providers
	if ( ! providerId || ! providerId.startsWith( 'cloudflare-r2' ) ) {
		return;
	}

	try {
		const storage = await provider.getStorageService();
		if ( ! storage ) {
			throw new Error(
				'Storage service not available. Please configure worker_endpoint and bucket_name.'
			);
		}

		// Handle blueprint bundle upload
		if ( fileType === 'blueprint-bundle' ) {
			if ( ! filePath ) {
				throw new Error( 'Blueprint bundle file path is required' );
			}

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

			const bundleKey = storageKey || 'blueprint-bundle/bundle.zip';
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
			return;
		}

		// Handle static file uploads (HTML and assets)
		let fileBlob = null;
		if ( fileContent ) {
			if ( typeof fileContent === 'string' ) {
				fileBlob = new Blob( [ fileContent ], {
					type: contentType || 'text/html',
				} );
			} else if ( fileContent instanceof Blob ) {
				fileBlob = fileContent;
			}
		} else if (
			filePath?.startsWith( 'http://' ) ||
			filePath?.startsWith( 'https://' )
		) {
			const response = await fetch( filePath, {
				method: 'GET',
				credentials: 'omit',
			} );
			if ( ! response.ok ) {
				throw new Error(
					`Failed to fetch ${ filePath }: HTTP ${ response.status }`
				);
			}
			fileBlob = await response.blob();
		}

		if ( ! fileBlob ) {
			throw new Error( 'File content or valid URL is required' );
		}

		// Determine storage key from filePath if not provided
		let finalStorageKey = storageKey;
		if ( ! finalStorageKey && filePath ) {
			if (
				filePath.startsWith( 'http://' ) ||
				filePath.startsWith( 'https://' )
			) {
				try {
					const urlObj = new URL( filePath );
					finalStorageKey = urlObj.pathname;
				} catch {
					finalStorageKey = filePath;
				}
			} else {
				finalStorageKey = filePath;
			}
		}

		// Normalize storage key
		finalStorageKey =
			finalStorageKey?.replace( /^\/+/, '' ) || 'index.html';

		// Add index.html for directory paths
		if ( finalStorageKey.endsWith( '/' ) ) {
			finalStorageKey =
				finalStorageKey.replace( /\/+$/, '' ) + '/index.html';
		} else if ( ! /\.[a-zA-Z0-9]+$/.test( finalStorageKey ) ) {
			// No file extension - assume HTML directory
			finalStorageKey = finalStorageKey + '/index.html';
		}

		const uploadResult = await storage.upload( finalStorageKey, fileBlob, {
			contentType: contentType || 'text/html',
		} );

		if ( ! uploadResult.success ) {
			throw new Error( uploadResult.error || 'Upload failed' );
		}

		fileContext.result = { success: true, url: uploadResult.url };
	} catch ( error ) {
		fileContext.result = {
			success: false,
			error: error.message || 'Unknown error',
		};
	}
}

/**
 * Register unified file upload action hook.
 */
addAction(
	'aether.file.upload',
	'aether/cloudflare-r2',
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
	'aether.provider.test',
	'aether/cloudflare-r2',
	( handler, providerId, config ) => {
		if ( ! providerId?.startsWith( 'cloudflare-r2' ) ) {
			return handler;
		}
		return async ( testConfig ) =>
			provider.testConnection( testConfig || config );
	},
	10
);

/**
 * Register upload strategy filter.
 */
addFilter(
	'aether.provider.upload_strategy',
	'aether/cloudflare-r2',
	( strategy, providerId ) => {
		if ( providerId?.startsWith( 'cloudflare-r2' ) ) {
			return 'worker';
		}
		return strategy;
	},
	10
);

// Initialize modal hooks
initCloudflareR2ModalHooks();
