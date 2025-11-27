/**
 * Cloudflare R2 Blueprint Bundle Provider Registration
 *
 * Registers the Cloudflare R2 blueprint bundle provider handlers via WordPress hooks.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * @package
 */

import { addFilter, addAction, doAction } from '@wordpress/hooks';
import { CloudflareR2BlueprintBundleProvider } from './CloudflareR2BlueprintBundleProvider';
import { initCloudflareR2ModalHooks } from './modal-hooks';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
import apiFetch from '../../utils/api';
import { StorageService } from '../services/storageService';

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
	CloudflareR2BlueprintBundleProvider.ID,
	CloudflareR2BlueprintBundleProvider
);

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', CloudflareR2BlueprintBundleProvider );

// Track processed files per provider to avoid duplicate processing
const processedFiles = new Map();

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

	return new StorageService( config.worker_endpoint, config.bucket_name, {
		public_url: config.public_url || null,
		provider_id: providerId,
	} );
}

/**
 * Handle unified file upload for blueprint bundle provider.
 *
 * @param {Object} fileContext Unified file context from aether.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload( fileContext ) {
	const { fileType, providerId, filePath, storageKey } = fileContext;

	// Only handle requests for cloudflare-r2-blueprint-bundle providers
	if (
		! providerId ||
		! providerId.startsWith( 'cloudflare-r2-blueprint-bundle' )
	) {
		return;
	}

	// Only handle blueprint bundle uploads
	if ( fileType !== 'blueprint-bundle' ) {
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

			// Get bundle path from config or use default
			const config = await loadProviderConfig( providerId );
			const bundleKey =
				storageKey ||
				config?.bundle_path ||
				'blueprint-bundle/bundle.zip';

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
	'aether.file.upload',
	'aether/cloudflare-r2-blueprint-bundle',
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
	'aether/cloudflare-r2-blueprint-bundle',
	( handler, providerId ) => {
		if ( ! providerId?.startsWith( 'cloudflare-r2-blueprint-bundle' ) ) {
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
	'aether.provider.upload_strategy',
	'aether/cloudflare-r2-blueprint-bundle',
	( strategy, providerId ) => {
		if ( providerId?.startsWith( 'cloudflare-r2-blueprint-bundle' ) ) {
			return 'worker';
		}
		return strategy;
	},
	10
);

// Initialize modal hooks
initCloudflareR2ModalHooks( 'cloudflare-r2-blueprint-bundle' );
