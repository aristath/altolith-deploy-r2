/**
 * Manifest Cache - Persistent cache for file-manifest.json
 *
 * Caches the file manifest locally in IndexedDB to avoid fetching from remote
 * storage on every publish. Provides 2-5 second improvement per publish by
 * eliminating network round trip for manifest download.
 *
 * Cache Key Strategy:
 * Uses provider ID as cache key. Each storage provider has its own manifest.
 *
 * Features:
 * - Persistent storage across browser sessions
 * - 1-hour cache expiration (manifests update frequently)
 * - Per-provider caching (different providers have different manifests)
 * - Automatic cleanup of old entries
 * - Works in WordPress Playground WASM environment
 *
 * Performance Impact:
 * - First publish: Fetch from remote, cache locally (no improvement)
 * - Subsequent publishes within 1 hour: Use cached manifest (2-5 second improvement)
 * - After manifest updates: Cache is automatically updated
 *
 * @package
 */

import IndexedDBStore from './indexedDB';

/**
 * Cache schema version
 * Increment this when making breaking changes to cache structure.
 * This will automatically invalidate old cached data.
 */
const CACHE_SCHEMA_VERSION = 2; // Incremented for IndexedDB keyPath fix

/**
 * Cache configuration
 */
const MANIFEST_CACHE_CONFIG = {
	dbName: 'aether-manifest-cache',
	version: 1,
	stores: {
		manifests: {
			keyPath: 'cacheKey',
			indexes: [
				{ name: 'timestamp', keyPath: 'timestamp', unique: false },
				{ name: 'providerId', keyPath: 'providerId', unique: false },
			],
		},
	},
};

/**
 * Cache expiration time (1 hour)
 * Manifests update frequently during development/publishing, so short TTL
 */
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Manifest Cache Manager
 *
 * Provides persistent caching of file manifests
 */
export class ManifestCache {
	/**
	 * Constructor
	 */
	constructor() {
		this.store = new IndexedDBStore( 'manifests', MANIFEST_CACHE_CONFIG );
		this.cleanupPromise = null; // Track cleanup to avoid concurrent runs
	}

	/**
	 * Generate cache key from provider ID
	 *
	 * @param {string} providerId - Storage provider ID
	 * @return {string} Cache key
	 */
	getCacheKey( providerId ) {
		return `manifest:${ providerId }`;
	}

	/**
	 * Get cached manifest for a provider
	 *
	 * @param {string} providerId - Storage provider ID
	 * @return {Promise<Object|null>} Cached manifest or null if not found/expired
	 */
	async get( providerId ) {
		const cacheKey = this.getCacheKey( providerId );

		try {
			const cached = await this.store.get( cacheKey );

			// Check if cache entry exists
			if ( cached && cached.timestamp ) {
				// Check schema version - invalidate if mismatched
				if (
					cached.schemaVersion !== undefined &&
					cached.schemaVersion !== CACHE_SCHEMA_VERSION
				) {
					console.log(
						`[ManifestCache] Cache schema version mismatch for ${ providerId } (cached: ${ cached.schemaVersion }, current: ${ CACHE_SCHEMA_VERSION }). Invalidating cache.`
					);
					await this.store.delete( cacheKey );
					return null;
				}

				// Check if cache is expired
				const age = Date.now() - cached.timestamp;

				if ( age < CACHE_EXPIRATION_MS ) {
					return cached.manifest;
				}

				// Cache expired - delete it
				await this.store.delete( cacheKey );
			}
		} catch ( error ) {
			console.error(
				`[ManifestCache] Error getting cache for ${ providerId }:`,
				error
			);
		}

		return null; // Cache miss or error
	}

	/**
	 * Set cached manifest for a provider
	 *
	 * @param {string} providerId - Storage provider ID
	 * @param {Object} manifest   - Manifest object to cache
	 * @return {Promise<boolean>} True if successfully cached
	 */
	async set( providerId, manifest ) {
		const cacheKey = this.getCacheKey( providerId );

		try {
			await this.store.set(
				cacheKey,
				{ manifest },
				{
					providerId,
					schemaVersion: CACHE_SCHEMA_VERSION,
				}
			);
			return true;
		} catch ( error ) {
			console.error(
				`[ManifestCache] Error setting cache for ${ providerId }:`,
				error
			);
			return false;
		}
	}

	/**
	 * Invalidate cached manifest for a provider
	 *
	 * Use this after uploading a new manifest to force refresh on next publish
	 *
	 * @param {string} providerId - Storage provider ID
	 * @return {Promise<boolean>} True if deleted successfully
	 */
	async invalidate( providerId ) {
		const cacheKey = this.getCacheKey( providerId );

		try {
			await this.store.delete( cacheKey );
			return true;
		} catch ( error ) {
			console.error(
				`[ManifestCache] Error invalidating cache for ${ providerId }:`,
				error
			);
			return false;
		}
	}

	/**
	 * Clean up expired cache entries
	 *
	 * Runs automatically on initialization, removes entries older than 1 hour
	 *
	 * @return {Promise<number>} Number of entries cleaned up
	 */
	async cleanup() {
		// Prevent concurrent cleanup runs
		if ( this.cleanupPromise ) {
			return this.cleanupPromise;
		}

		this.cleanupPromise = ( async () => {
			try {
				const deleted =
					await this.store.deleteOlderThan( CACHE_EXPIRATION_MS );

				if ( deleted > 0 ) {
					console.log(
						`[ManifestCache] Cleaned up ${ deleted } expired cache entries`
					);
				}

				return deleted;
			} catch ( error ) {
				console.error( '[ManifestCache] Error during cleanup:', error );
				return 0;
			} finally {
				this.cleanupPromise = null;
			}
		} )();

		return this.cleanupPromise;
	}

	/**
	 * Clear all cached data
	 *
	 * @return {Promise<boolean>} True if successful
	 */
	async clear() {
		return this.store.clear();
	}

	/**
	 * Get cache statistics
	 *
	 * @return {Promise<Object>} Cache statistics
	 */
	async getStats() {
		try {
			const totalCount = await this.store.count();

			return {
				totalCached: totalCount,
			};
		} catch ( error ) {
			console.error( '[ManifestCache] Error getting stats:', error );
			return {
				totalCached: 0,
			};
		}
	}
}

// Create singleton instance
let cacheInstance = null;

/**
 * Get manifest cache instance (singleton)
 *
 * @return {ManifestCache} Cache instance
 */
export function getManifestCache() {
	if ( ! cacheInstance ) {
		cacheInstance = new ManifestCache();

		// Run cleanup on first initialization
		cacheInstance.cleanup().catch( ( error ) => {
			console.error( '[ManifestCache] Initial cleanup failed:', error );
		} );
	}

	return cacheInstance;
}

export default getManifestCache;
