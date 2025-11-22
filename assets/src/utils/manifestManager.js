/**
 * Manifest Manager Utility
 *
 * Manages the file manifest JSON that tracks file sizes and hashes
 * for upload optimization. The manifest is stored remotely at
 * file-manifest.json and cached locally in IndexedDB.
 *
 * Performance: Local caching saves 2-5 seconds per export by avoiding
 * remote manifest download on subsequent exportes within 1 hour.
 *
 * @package
 */

import { debug, debugWarn } from './debug';
import { getManifestCache } from './manifestCache';

/**
 * Fetch existing manifest from remote storage with local caching.
 *
 * Checks local IndexedDB cache first (1-hour TTL), falls back to remote download.
 * Saves 2-5 seconds per export by avoiding network round trip.
 *
 * @param {Object} storageService StorageService instance.
 * @param {string} providerId     Optional provider ID for caching (defaults to 'default').
 * @return {Promise<Object>} Manifest object (empty object if not found).
 */
export async function fetchManifest( storageService, providerId = 'default' ) {
	const manifestKey = 'file-manifest.json';

	// Check cache first
	const cache = getManifestCache();
	const cachedManifest = await cache.get( providerId );
	if ( cachedManifest ) {
		debug( 'Manifest loaded from cache:', {
			providerId,
			fileCount: Object.keys( cachedManifest ).length,
		} );
		return cachedManifest;
	}

	try {
		debug( 'Fetching manifest from remote:', manifestKey );

		// Try to download manifest from storage.
		const manifestBlob = await storageService.downloadManifest();

		if ( ! manifestBlob ) {
			debug( 'Manifest not found, starting with empty manifest' );
			// Cache empty manifest to avoid repeated fetches
			await cache.set( providerId, {} );
			return {};
		}

		// Parse JSON from blob.
		const manifestText = await manifestBlob.text();
		const manifest = JSON.parse( manifestText );

		debug( 'Manifest fetched successfully:', {
			fileCount: Object.keys( manifest ).length,
		} );

		// Cache the manifest
		await cache.set( providerId, manifest );

		return manifest || {};
	} catch ( error ) {
		// If manifest doesn't exist (404) or other error, start with empty manifest.
		if ( error.message && error.message.includes( '404' ) ) {
			debug( 'Manifest not found (404), starting with empty manifest' );
			// Cache empty manifest
			await cache.set( providerId, {} );
			return {};
		}

		debugWarn(
			'Failed to fetch manifest, starting with empty manifest:',
			error
		);
		// Don't cache errors to allow retry on next export
		return {};
	}
}

/**
 * Update manifest entry with size, hash, and optional content-type.
 *
 * @param {Object} manifest    Manifest object to update.
 * @param {string} storageKey  Storage key/path for the file.
 * @param {number} size        File size in bytes.
 * @param {string} hash        SHA-256 hash hex string.
 * @param {string} contentType Optional content-type header value.
 * @return {Object} Updated manifest object.
 */
export function updateManifestEntry(
	manifest,
	storageKey,
	size,
	hash,
	contentType = null
) {
	if ( ! manifest ) {
		manifest = {};
	}

	manifest[ storageKey ] = {
		size,
		hash,
	};

	// Add content-type if provided
	if ( contentType ) {
		manifest[ storageKey ].contentType = contentType;
	}

	debug( 'Updated manifest entry:', {
		storageKey,
		size,
		hashLength: hash.length,
		contentType: contentType || 'not specified',
	} );

	return manifest;
}

/**
 * Check if file should be skipped based on size and hash comparison.
 *
 * Two-stage check: size first, then hash if size matches.
 * Returns true if both size and hash match existing entry.
 *
 * @param {Object} manifest   Manifest object.
 * @param {string} storageKey Storage key/path for the file.
 * @param {number} size       File size in bytes.
 * @param {string} hash       SHA-256 hash hex string.
 * @return {boolean} True if file should be skipped (size and hash match).
 */
export function shouldSkipUpload( manifest, storageKey, size, hash ) {
	if ( ! manifest || ! manifest[ storageKey ] ) {
		// No entry in manifest, don't skip.
		return false;
	}

	const entry = manifest[ storageKey ];

	// Stage 1: Check size first (fast comparison).
	if ( entry.size !== size ) {
		debug( 'File size differs, will upload:', {
			storageKey,
			existingSize: entry.size,
			newSize: size,
		} );
		return false;
	}

	// Stage 2: Check hash if size matches.
	if ( entry.hash !== hash ) {
		debug( 'File size matches but hash differs, will upload:', {
			storageKey,
			size,
		} );
		return false;
	}

	// Both size and hash match - skip upload.
	debug( 'File unchanged, skipping upload:', {
		storageKey,
		size,
		hash: hash.substring( 0, 16 ) + '...',
	} );

	return true;
}

/**
 * Clean up manifest by removing entries not in current upload set.
 *
 * This prevents manifest from growing indefinitely as files are added/removed.
 * Returns a new manifest object containing only entries for files in currentFiles set.
 *
 * @param {Object} manifest     Existing manifest object.
 * @param {Set}    currentFiles Set of storage keys for files in current upload.
 * @return {Object} Cleaned manifest object.
 */
export function cleanupManifest( manifest, currentFiles ) {
	if ( ! manifest || ! currentFiles ) {
		return manifest || {};
	}

	const cleanedManifest = {};
	let removedCount = 0;

	// Keep only entries for files that exist in current upload
	// Also preserve wp-content.zip entries (uploaded in parallel step)
	for ( const storageKey of Object.keys( manifest ) ) {
		if (
			currentFiles.has( storageKey ) ||
			storageKey.includes( '/wp-content.zip' )
		) {
			cleanedManifest[ storageKey ] = manifest[ storageKey ];
		} else {
			removedCount++;
		}
	}

	if ( removedCount > 0 ) {
		debug( 'Manifest cleanup:', {
			before: Object.keys( manifest ).length,
			after: Object.keys( cleanedManifest ).length,
			removed: removedCount,
		} );
	}

	return cleanedManifest;
}

/**
 * Upload manifest to remote storage and update cache.
 *
 * @param {Object} storageService StorageService instance.
 * @param {Object} manifest       Manifest object to upload.
 * @param {string} providerId     Optional provider ID for cache invalidation (defaults to 'default').
 * @return {Promise<boolean>} True if upload succeeded.
 */
export async function uploadManifest(
	storageService,
	manifest,
	providerId = 'default'
) {
	const manifestKey = 'file-manifest.json';

	try {
		debug( 'Uploading manifest:', {
			manifestKey,
			fileCount: Object.keys( manifest ).length,
		} );

		// Convert manifest to JSON blob (minified for smaller file size).
		const manifestJson = JSON.stringify( manifest );
		const manifestBlob = new Blob( [ manifestJson ], {
			type: 'application/json',
		} );

		// Upload manifest via storage service.
		const result = await storageService.uploadManifest( manifestBlob );

		if ( result.success ) {
			debug( 'Manifest uploaded successfully' );

			// Update cache with new manifest
			const cache = getManifestCache();
			await cache.set( providerId, manifest );

			return true;
		}

		debugWarn( 'Manifest upload failed:', result.error );
		return false;
	} catch ( error ) {
		debugWarn( 'Failed to upload manifest:', error );
		return false;
	}
}
