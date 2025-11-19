/**
 * Cloudflare R2 Provider Registration
 *
 * Registers the Cloudflare R2 provider handlers via WordPress hooks.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */

import { addFilter, addAction } from '@wordpress/hooks';
import { CloudflareR2Provider } from './CloudflareR2Provider';
import { initCloudflareR2ModalHooks } from './modal-hooks';

// Create provider instance for hook registration
const provider = new CloudflareR2Provider();

/**
 * Register upload handler hook.
 *
 * Providers register upload handlers via aether.provider.upload filter.
 */
addFilter(
	'aether.provider.upload',
	'aether/cloudflare-r2',
	( handler, providerId ) => {
		// Only handle requests for this provider
		if ( providerId !== 'cloudflare-r2' ) {
			return handler; // Return existing handler or null
		}

		// Return upload handler function
		return async ( filePath, fileName, context ) => {
			return await provider.uploadFile( filePath, fileName, context );
		};
	},
	10
);

/**
 * Register test connection handler hook.
 *
 * Providers register test handlers via aether.provider.test filter.
 */
addFilter(
	'aether.provider.test',
	'aether/cloudflare-r2',
	( handler, providerId, config ) => {
		// Only handle requests for this provider
		if ( providerId !== 'cloudflare-r2' ) {
			return handler; // Return existing handler or null
		}

		// Return test handler function
		return async ( testConfig ) => {
			return await provider.testConnection( testConfig || config );
		};
	},
	10
);

/**
 * Register upload strategy filter.
 *
 * Providers can override upload strategy via aether.provider.upload_strategy filter.
 */
addFilter(
	'aether.provider.upload_strategy',
	'aether/cloudflare-r2',
	( strategy, providerId ) => {
		if ( providerId === 'cloudflare-r2' ) {
			return 'worker'; // Cloudflare R2 uses worker endpoint for uploads
		}
		return strategy;
	},
	10
);

/**
 * Register hooks for static site generation workflow.
 *
 * Cloudflare R2 provider can customize various aspects of the upload process.
 */

// Customize storage service configuration for R2
addFilter(
	'aether.storage.service.config',
	'aether/cloudflare-r2',
	( config, staticPath, providerId, providerConfig ) => {
		if ( providerId !== 'cloudflare-r2' ) {
			return config;
		}

		// R2-specific configuration
		return {
			...config,
			// Add R2-specific config if needed
		};
	},
	10
);

// Customize HTML processing for R2 (e.g., add R2-specific meta tags)
addFilter(
	'aether.static.html.process',
	'aether/cloudflare-r2',
	( html, url, siteUrl, staticSiteUrl, providerId ) => {
		if ( providerId !== 'cloudflare-r2' ) {
			return html;
		}

		// Example: Add R2-specific meta tags or modifications
		// This is a placeholder - customize as needed
		return html;
	},
	10
);

// Customize asset processing for R2 (e.g., optimize images, modify paths)
addFilter(
	'aether.static.asset.process',
	'aether/cloudflare-r2',
	( assetData, providerId ) => {
		if ( providerId !== 'cloudflare-r2' ) {
			return assetData;
		}

		// Example: Modify asset blob, path, or metadata
		// This is a placeholder - customize as needed
		return assetData;
	},
	10
);

// Customize manifest handling for R2
addFilter(
	'aether.manifest.fetch',
	'aether/cloudflare-r2',
	( manifest, storageService, providerId ) => {
		if ( providerId !== 'cloudflare-r2' ) {
			return manifest; // Return null to use default fetching
		}

		// Return null to use default manifest fetching
		// Or return custom manifest object if needed
		return null;
	},
	10
);

// Customize file upload options for R2 (e.g., cache control, metadata)
addFilter(
	'aether.upload.file.options',
	'aether/cloudflare-r2',
	( options, key, blob, contentType, metadata ) => {
		// Customize upload options for R2
		// Example: Set specific cache control headers
		return {
			...options,
			// R2-specific options can be added here
			// cacheControl: 'public, max-age=31536000, immutable',
		};
	},
	10
);

// Hook into pre-scan phase for R2-specific setup
addAction(
	'aether.static.pre_scan.before',
	'aether/cloudflare-r2',
	( urls, providerId, config ) => {
		if ( providerId !== 'cloudflare-r2' ) {
			return;
		}

		// R2-specific pre-scan setup
		// Example: Validate R2 configuration, check bucket access, etc.
	}
);

// Hook into upload phase for R2-specific monitoring
addAction(
	'aether.static.upload.before',
	'aether/cloudflare-r2',
	( urls, totalFiles, providerId ) => {
		if ( providerId !== 'cloudflare-r2' ) {
			return;
		}

		// R2-specific upload phase setup
		// Example: Initialize R2-specific tracking, set up monitoring
	}
);

// Hook into file uploads for R2-specific processing
addAction(
	'aether.upload.file.before',
	'aether/cloudflare-r2',
	( fileData ) => {
		// R2-specific file upload preparation
		// Example: Validate file, check permissions, etc.
	}
);

addAction(
	'aether.upload.file.after',
	'aether/cloudflare-r2',
	( result, displayName ) => {
		// R2-specific file upload completion handling
		// Example: Track uploads, update statistics, etc.
	}
);

// Initialize modal hooks for custom content (e.g., Deploy Worker button)
initCloudflareR2ModalHooks();
