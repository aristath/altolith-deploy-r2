/* eslint-disable no-console */
/**
 * Archive Progress Cache - Persistent cache for archive creation progress
 *
 * Stores archive creation progress state in IndexedDB for persistence across
 * page refreshes. Progress is managed entirely in the frontend (React state + IndexedDB).
 *
 * Features:
 * - Persistent storage across browser sessions
 * - 1-hour cache expiration (archive progress is temporary)
 * - Progress ID-based tracking
 * - Stores zip path, phase status, and overall progress
 * - Works in WordPress Playground WASM environment
 *
 * @package
 */

import IndexedDBStore from './indexedDB';

/**
 * Cache configuration
 */
const ARCHIVE_PROGRESS_CONFIG = {
	dbName: 'aether-archive-progress',
	version: 1,
	stores: {
		progress: {
			keyPath: 'progressId',
			indexes: [
				{ name: 'timestamp', keyPath: 'timestamp', unique: false },
			],
		},
	},
};

/**
 * Cache expiration time (1 hour)
 * Archive progress is temporary and should be cleaned up after completion
 */
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Archive Progress Cache Manager
 *
 * Provides persistent caching of archive creation progress
 */
export class ArchiveProgressCache {
	/**
	 * Constructor
	 */
	constructor() {
		this.store = new IndexedDBStore( 'progress', ARCHIVE_PROGRESS_CONFIG );
		this.cleanupPromise = null; // Track cleanup to avoid concurrent runs
	}

	/**
	 * Get cached progress for a progress ID
	 *
	 * @param {string} progressId - Progress ID
	 * @return {Promise<Object|null>} Cached progress or null if not found/expired
	 */
	async get( progressId ) {
		try {
			const cached = await this.store.get( progressId );

			if ( ! cached ) {
				return null;
			}

			// Check if cache entry is expired
			const age = Date.now() - cached.timestamp;
			if ( age > CACHE_EXPIRATION_MS ) {
				await this.store.delete( progressId );
				return null;
			}

			return cached.progress || null;
		} catch ( error ) {
			console.error(
				`[ArchiveProgressCache] Error getting progress for ${ progressId }:`,
				error
			);
			return null;
		}
	}

	/**
	 * Set cached progress
	 *
	 * @param {string} progressId - Progress ID
	 * @param {Object} progress   - Progress state object
	 * @return {Promise<boolean>} True if successfully cached
	 */
	async set( progressId, progress ) {
		try {
			await this.store.set(
				progressId,
				{ progress },
				{
					timestamp: Date.now(),
				}
			);
			return true;
		} catch ( error ) {
			console.error(
				`[ArchiveProgressCache] Error setting progress for ${ progressId }:`,
				error
			);
			return false;
		}
	}

	/**
	 * Update cached progress (merges with existing)
	 *
	 * Deep merges nested objects like 'phases' to preserve all phase data.
	 *
	 * @param {string} progressId - Progress ID
	 * @param {Object} updates    - Progress updates to merge
	 * @return {Promise<boolean>} True if successfully updated
	 */
	async update( progressId, updates ) {
		try {
			const existing = await this.get( progressId );
			const merged = existing
				? this.deepMerge( existing, updates )
				: updates;

			return this.set( progressId, merged );
		} catch ( error ) {
			console.error(
				`[ArchiveProgressCache] Error updating progress for ${ progressId }:`,
				error
			);
			return false;
		}
	}

	/**
	 * Deep merge two objects
	 *
	 * @param {Object} target - Target object to merge into
	 * @param {Object} source - Source object to merge from
	 * @return {Object} Merged object
	 */
	deepMerge( target, source ) {
		const result = { ...target };

		for ( const key in source ) {
			if (
				source[ key ] &&
				typeof source[ key ] === 'object' &&
				! Array.isArray( source[ key ] ) &&
				target[ key ] &&
				typeof target[ key ] === 'object' &&
				! Array.isArray( target[ key ] )
			) {
				// Deep merge nested objects (like 'phases')
				result[ key ] = this.deepMerge( target[ key ], source[ key ] );
			} else {
				// Replace primitives, arrays, or non-object values
				result[ key ] = source[ key ];
			}
		}

		return result;
	}

	/**
	 * Clear cached progress
	 *
	 * @param {string} progressId - Progress ID
	 * @return {Promise<boolean>} True if successfully cleared
	 */
	async clear( progressId ) {
		try {
			await this.store.delete( progressId );
			return true;
		} catch ( error ) {
			console.error(
				`[ArchiveProgressCache] Error clearing progress for ${ progressId }:`,
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
						`[ArchiveProgressCache] Cleaned up ${ deleted } expired entries`
					);
				}

				return deleted;
			} catch ( error ) {
				console.error(
					'[ArchiveProgressCache] Error during cleanup:',
					error
				);
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
	async clearAll() {
		return this.store.clear();
	}
}

// Create singleton instance
let cacheInstance = null;

/**
 * Get archive progress cache instance (singleton)
 *
 * @return {ArchiveProgressCache} Cache instance
 */
export function getArchiveProgressCache() {
	if ( ! cacheInstance ) {
		cacheInstance = new ArchiveProgressCache();

		// Run cleanup on first initialization
		cacheInstance.cleanup().catch( ( error ) => {
			console.error(
				'[ArchiveProgressCache] Initial cleanup failed:',
				error
			);
		} );
	}

	return cacheInstance;
}

export default getArchiveProgressCache;
