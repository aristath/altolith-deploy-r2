/**
 * Static Site Cache - IndexedDB-based cache for static site generation
 *
 * Provides persistent browser storage for processed HTML and discovered assets
 * during static site generation. Eliminates memory limits by storing data in
 * IndexedDB instead of RAM.
 *
 * Features:
 * - Unlimited URL caching (limited only by browser storage quota)
 * - Persistent across browser sessions
 * - Automatic cleanup of old caches
 * - Works in WordPress Playground WASM environment
 */

import IndexedDBStore, { isIndexedDBAvailable } from './indexedDB';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
	dbName: 'aether-static-site-cache',
	version: 1,
	stores: {
		urlCache: {
			keyPath: 'url',
			indexes: [
				{ name: 'timestamp', keyPath: 'timestamp', unique: false },
				{ name: 'sessionId', keyPath: 'sessionId', unique: false },
			],
		},
	},
};

/**
 * Maximum age for cached items (24 hours)
 * After this time, cached items are considered stale
 */
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Static Site Cache Manager
 *
 * Manages caching of processed HTML and assets during static site generation.
 */
export class StaticSiteCache {
	/**
	 * Constructor
	 *
	 * @param {string} sessionId - Unique session identifier for this generation run
	 */
	constructor( sessionId = null ) {
		this.sessionId = sessionId || this.generateSessionId();
		this.store = new IndexedDBStore( 'urlCache', CACHE_CONFIG );
		this.isAvailable = isIndexedDBAvailable();

		// Fallback to in-memory cache if IndexedDB unavailable
		this.memoryCache = new Map();
	}

	/**
	 * Generate unique session ID
	 *
	 * @return {string} Session ID
	 */
	generateSessionId() {
		return `session_${ Date.now() }_${ Math.random()
			.toString( 36 )
			.substring( 2, 9 ) }`;
	}

	/**
	 * Check if cache is available
	 *
	 * @return {boolean} True if IndexedDB is available
	 */
	isReady() {
		return this.isAvailable;
	}

	/**
	 * Get cached data for a URL
	 *
	 * @param {string} url - The URL to retrieve from cache
	 * @return {Promise<Object|null>} Cached data or null if not found
	 */
	async get( url ) {
		if ( ! this.isAvailable ) {
			return this.memoryCache.get( url ) || null;
		}

		try {
			const cached = await this.store.get( url );

			// Check if cache is stale
			if ( cached && cached.timestamp ) {
				const age = Date.now() - cached.timestamp;
				if ( age > MAX_CACHE_AGE_MS ) {
					// Cache is stale, delete it
					await this.delete( url );
					return null;
				}
			}

			return cached
				? {
						processedHtml: cached.processedHtml,
						assetUrls: cached.assetUrls,
						url: cached.url,
						timestamp: cached.timestamp,
				  }
				: null;
		} catch ( error ) {
			console.error(
				`[StaticSiteCache] Error getting URL "${ url }":`,
				error
			);
			return null;
		}
	}

	/**
	 * Cache processed HTML and assets for a URL
	 *
	 * @param {string}        url           - The URL being cached
	 * @param {string}        processedHtml - The processed HTML content
	 * @param {Array<string>} assetUrls     - Array of discovered asset URLs
	 * @return {Promise<boolean>} True if successful
	 */
	async set( url, processedHtml, assetUrls ) {
		if ( ! this.isAvailable ) {
			this.memoryCache.set( url, {
				processedHtml,
				assetUrls,
				url,
				timestamp: Date.now(),
			} );
			return true;
		}

		try {
			return await this.store.set(
				url,
				{
					processedHtml,
					assetUrls,
				},
				{
					sessionId: this.sessionId,
				}
			);
		} catch ( error ) {
			console.error(
				`[StaticSiteCache] Error caching URL "${ url }":`,
				error
			);
			return false;
		}
	}

	/**
	 * Delete cached data for a URL
	 *
	 * @param {string} url - The URL to delete from cache
	 * @return {Promise<boolean>} True if successful
	 */
	async delete( url ) {
		if ( ! this.isAvailable ) {
			return this.memoryCache.delete( url );
		}

		try {
			return await this.store.delete( url );
		} catch ( error ) {
			console.error(
				`[StaticSiteCache] Error deleting URL "${ url }":`,
				error
			);
			return false;
		}
	}

	/**
	 * Check if a URL is cached
	 *
	 * @param {string} url - The URL to check
	 * @return {Promise<boolean>} True if cached
	 */
	async has( url ) {
		const cached = await this.get( url );
		return cached !== null;
	}

	/**
	 * Get all cached URLs for current session
	 *
	 * @return {Promise<Array<string>>} Array of cached URLs
	 */
	async getAllUrls() {
		if ( ! this.isAvailable ) {
			return Array.from( this.memoryCache.keys() );
		}

		try {
			const items = await this.store.getByIndex(
				'sessionId',
				this.sessionId
			);
			return items.map( ( item ) => item.url );
		} catch ( error ) {
			console.error( '[StaticSiteCache] Error getting all URLs:', error );
			return [];
		}
	}

	/**
	 * Get cache statistics
	 *
	 * @return {Promise<Object>} Cache statistics
	 */
	async getStats() {
		if ( ! this.isAvailable ) {
			return {
				totalCached: this.memoryCache.size,
				sessionCached: this.memoryCache.size,
				storageUsed: null,
				storageQuota: null,
				storagePercent: null,
				usingFallback: true,
			};
		}

		try {
			const [ totalCount, sessionItems, storageEstimate ] =
				await Promise.all( [
					this.store.count(),
					this.store.getByIndex( 'sessionId', this.sessionId ),
					this.store.getStorageEstimate(),
				] );

			return {
				totalCached: totalCount,
				sessionCached: sessionItems.length,
				storageUsed: storageEstimate.usage,
				storageQuota: storageEstimate.quota,
				storagePercent: storageEstimate.percentUsed,
				usingFallback: false,
			};
		} catch ( error ) {
			console.error( '[StaticSiteCache] Error getting stats:', error );
			return {
				totalCached: 0,
				sessionCached: 0,
				storageUsed: null,
				storageQuota: null,
				storagePercent: null,
				usingFallback: false,
			};
		}
	}

	/**
	 * Clear all cache for current session
	 *
	 * @return {Promise<number>} Number of items deleted
	 */
	async clearSession() {
		if ( ! this.isAvailable ) {
			const size = this.memoryCache.size;
			this.memoryCache.clear();
			return size;
		}

		try {
			// Get all items for this session
			const items = await this.store.getByIndex(
				'sessionId',
				this.sessionId
			);

			// Delete each item
			let deletedCount = 0;
			for ( const item of items ) {
				const success = await this.store.delete( item.url );
				if ( success ) {
					deletedCount++;
				}
			}

			return deletedCount;
		} catch ( error ) {
			console.error( '[StaticSiteCache] Error clearing session:', error );
			return 0;
		}
	}

	/**
	 * Clear all cache (all sessions)
	 *
	 * @return {Promise<boolean>} True if successful
	 */
	async clearAll() {
		if ( ! this.isAvailable ) {
			this.memoryCache.clear();
			return true;
		}

		try {
			return await this.store.clear();
		} catch ( error ) {
			console.error( '[StaticSiteCache] Error clearing all:', error );
			return false;
		}
	}

	/**
	 * Clean up old cached items (older than MAX_CACHE_AGE_MS)
	 *
	 * @return {Promise<number>} Number of items deleted
	 */
	async cleanup() {
		if ( ! this.isAvailable ) {
			// For memory cache, just clear everything
			const size = this.memoryCache.size;
			this.memoryCache.clear();
			return size;
		}

		try {
			return await this.store.deleteOlderThan( MAX_CACHE_AGE_MS );
		} catch ( error ) {
			console.error( '[StaticSiteCache] Error during cleanup:', error );
			return 0;
		}
	}

	/**
	 * Batch get multiple URLs
	 *
	 * @param {Array<string>} urls - Array of URLs to retrieve
	 * @return {Promise<Map<string, Object>>} Map of URL to cached data
	 */
	async batchGet( urls ) {
		const results = new Map();

		// Process in parallel for better performance
		await Promise.all(
			urls.map( async ( url ) => {
				const cached = await this.get( url );
				if ( cached ) {
					results.set( url, cached );
				}
			} )
		);

		return results;
	}

	/**
	 * Batch set multiple URLs
	 *
	 * @param {Array<Object>} items - Array of {url, processedHtml, assetUrls}
	 * @return {Promise<number>} Number of items successfully cached
	 */
	async batchSet( items ) {
		let successCount = 0;

		// Process in parallel for better performance
		await Promise.all(
			items.map( async ( item ) => {
				const success = await this.set(
					item.url,
					item.processedHtml,
					item.assetUrls
				);
				if ( success ) {
					successCount++;
				}
			} )
		);

		return successCount;
	}

	/**
	 * Get cache health information
	 *
	 * @return {Promise<Object>} Health information
	 */
	async getHealth() {
		const stats = await this.getStats();

		return {
			isHealthy: this.isAvailable,
			usingFallback: stats.usingFallback,
			cacheSize: stats.sessionCached,
			storageWarning:
				stats.storagePercent !== null && stats.storagePercent > 80,
			recommendations: this.getRecommendations( stats ),
		};
	}

	/**
	 * Get recommendations based on cache state
	 *
	 * @param {Object} stats - Cache statistics
	 * @return {Array<string>} Array of recommendation messages
	 */
	getRecommendations( stats ) {
		const recommendations = [];

		if ( stats.usingFallback ) {
			recommendations.push(
				'IndexedDB is not available. Using in-memory fallback which has a 500 URL limit.'
			);
		}

		if ( stats.storagePercent !== null && stats.storagePercent > 80 ) {
			recommendations.push(
				`Browser storage is ${ Math.round(
					stats.storagePercent
				) }% full. Consider clearing old caches.`
			);
		}

		if ( stats.storagePercent !== null && stats.storagePercent > 95 ) {
			recommendations.push(
				'Browser storage is nearly full. Cache operations may fail.'
			);
		}

		if ( stats.totalCached > stats.sessionCached * 2 ) {
			recommendations.push(
				'Old cache data detected. Run cleanup() to free up space.'
			);
		}

		return recommendations;
	}
}

export default StaticSiteCache;
