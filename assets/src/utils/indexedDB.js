/**
 * IndexedDB Wrapper - Abstract storage interface for browser persistent storage
 *
 * Uses the `idb` library (by Jake Archibald) as a foundation, providing a
 * simple, promise-based API for storing data in IndexedDB.
 *
 * Works in all modern browsers including WordPress Playground WASM environment.
 *
 * Features:
 * - Simple key-value storage interface
 * - Automatic database initialization
 * - Promise-based async API
 * - Error handling and quota management
 * - Support for multiple stores and indexes
 * - Automatic cleanup of expired data
 * - Built on battle-tested `idb` library (9.8M weekly downloads)
 */

/* global indexedDB, IDBKeyRange */

import { openDB } from 'idb';

/**
 * IndexedDB database instance cache
 * Stores opened database connections to avoid repeated initialization
 */
const dbInstances = new Map();

/**
 * Default database configuration
 */
const DEFAULT_CONFIG = {
	dbName: 'aether-site-exporter',
	version: 1,
	stores: {
		cache: {
			keyPath: 'key',
			indexes: [
				{ name: 'timestamp', keyPath: 'timestamp', unique: false },
				{ name: 'type', keyPath: 'type', unique: false },
			],
		},
	},
};

/**
 * Open IndexedDB database with configuration using idb library
 *
 * @param {Object} config         - Database configuration
 * @param {string} config.dbName  - Database name
 * @param {number} config.version - Database version
 * @param {Object} config.stores  - Object stores configuration
 * @return {Promise<Object>} Database instance
 */
async function openDatabase( config = DEFAULT_CONFIG ) {
	const cacheKey = `${ config.dbName }_v${ config.version }`;

	// Return cached instance if available
	if ( dbInstances.has( cacheKey ) ) {
		return dbInstances.get( cacheKey );
	}

	try {
		const db = await openDB( config.dbName, config.version, {
			upgrade( database ) {
				// Create object stores based on configuration
				Object.entries( config.stores ).forEach(
					( [ storeName, storeConfig ] ) => {
						// Delete existing store if it exists (for upgrades)
						if ( database.objectStoreNames.contains( storeName ) ) {
							database.deleteObjectStore( storeName );
						}

						// Create new store
						const store = database.createObjectStore( storeName, {
							keyPath: storeConfig.keyPath,
							autoIncrement: storeConfig.autoIncrement || false,
						} );

						// Create indexes
						if ( storeConfig.indexes ) {
							storeConfig.indexes.forEach( ( index ) => {
								store.createIndex( index.name, index.keyPath, {
									unique: index.unique || false,
								} );
							} );
						}
					}
				);
			},
		} );

		dbInstances.set( cacheKey, db );
		return db;
	} catch ( error ) {
		throw new Error(
			`Failed to open IndexedDB: ${ error.message || 'Unknown error' }`
		);
	}
}

/**
 * IndexedDB Store - Abstract interface for a single object store
 *
 * Provides a simple key-value API on top of idb library
 */
export class IndexedDBStore {
	/**
	 * Constructor
	 *
	 * @param {string} storeName - Name of the object store
	 * @param {Object} config    - Database configuration (optional)
	 */
	constructor( storeName, config = DEFAULT_CONFIG ) {
		this.storeName = storeName;
		this.config = config;
		this.db = null;
		// Get the keyPath for this store from config
		this.keyPath =
			config.stores?.[ storeName ]?.keyPath ||
			DEFAULT_CONFIG.stores.cache.keyPath;
	}

	/**
	 * Ensure database is initialized
	 *
	 * @return {Promise<Object>} Database instance
	 */
	async ensureDatabase() {
		if ( ! this.db ) {
			this.db = await openDatabase( this.config );
		}
		return this.db;
	}

	/**
	 * Get a value by key
	 *
	 * @param {string|number} key - The key to retrieve
	 * @return {Promise<any|null>} The stored value or null if not found
	 */
	async get( key ) {
		try {
			const db = await this.ensureDatabase();
			const result = await db.get( this.storeName, key );
			return result || null;
		} catch ( error ) {
			console.error( `[IndexedDB] Error getting key "${ key }":`, error );
			return null;
		}
	}

	/**
	 * Get all values from the store
	 *
	 * @param {number} limit - Maximum number of items to return (optional)
	 * @return {Promise<Array>} Array of all stored values
	 */
	async getAll( limit = undefined ) {
		try {
			const db = await this.ensureDatabase();
			const result = await db.getAll( this.storeName, undefined, limit );
			return result || [];
		} catch ( error ) {
			console.error( '[IndexedDB] Error getting all values:', error );
			return [];
		}
	}

	/**
	 * Get all keys from the store
	 *
	 * @return {Promise<Array>} Array of all keys
	 */
	async getAllKeys() {
		try {
			const db = await this.ensureDatabase();
			const result = await db.getAllKeys( this.storeName );
			return result || [];
		} catch ( error ) {
			console.error( '[IndexedDB] Error getting all keys:', error );
			return [];
		}
	}

	/**
	 * Set a value by key
	 *
	 * @param {string|number} key      - The key to set
	 * @param {any}           value    - The value to store
	 * @param {Object}        metadata - Additional metadata (optional)
	 * @return {Promise<boolean>} True if successful, false otherwise
	 */
	async set( key, value, metadata = {} ) {
		try {
			const db = await this.ensureDatabase();

			// For object values, spread properties; for primitives, use value property
			const valueData =
				typeof value === 'object' && value !== null
					? { ...value }
					: { value };

			const data = {
				[ this.keyPath ]: key,
				...valueData,
				timestamp: Date.now(),
				...metadata,
			};

			await db.put( this.storeName, data );
			return true;
		} catch ( error ) {
			// Check for quota exceeded error
			if (
				error.name === 'QuotaExceededError' ||
				error.message?.includes( 'quota' )
			) {
				console.warn(
					'[IndexedDB] Storage quota exceeded. Consider cleaning up old data.'
				);
			}
			console.error( `[IndexedDB] Error setting key "${ key }":`, error );
			return false;
		}
	}

	/**
	 * Delete a value by key
	 *
	 * @param {string|number} key - The key to delete
	 * @return {Promise<boolean>} True if successful, false otherwise
	 */
	async delete( key ) {
		try {
			const db = await this.ensureDatabase();
			await db.delete( this.storeName, key );
			return true;
		} catch ( error ) {
			console.error(
				`[IndexedDB] Error deleting key "${ key }":`,
				error
			);
			return false;
		}
	}

	/**
	 * Clear all data from the store
	 *
	 * @return {Promise<boolean>} True if successful, false otherwise
	 */
	async clear() {
		try {
			const db = await this.ensureDatabase();
			await db.clear( this.storeName );
			return true;
		} catch ( error ) {
			console.error( '[IndexedDB] Error clearing store:', error );
			return false;
		}
	}

	/**
	 * Count number of items in the store
	 *
	 * @return {Promise<number>} Number of items
	 */
	async count() {
		try {
			const db = await this.ensureDatabase();
			const result = await db.count( this.storeName );
			return result || 0;
		} catch ( error ) {
			console.error( '[IndexedDB] Error counting items:', error );
			return 0;
		}
	}

	/**
	 * Get values by index
	 *
	 * @param {string} indexName  - Name of the index
	 * @param {any}    indexValue - Value to search for in the index
	 * @return {Promise<Array>} Array of matching values
	 */
	async getByIndex( indexName, indexValue ) {
		try {
			const db = await this.ensureDatabase();
			const result = await db.getAllFromIndex(
				this.storeName,
				indexName,
				indexValue
			);
			return result || [];
		} catch ( error ) {
			console.error(
				`[IndexedDB] Error getting by index "${ indexName }":`,
				error
			);
			return [];
		}
	}

	/**
	 * Delete items older than specified age
	 *
	 * Uses the timestamp index to efficiently find and delete old items.
	 *
	 * @param {number} maxAgeMs - Maximum age in milliseconds
	 * @return {Promise<number>} Number of items deleted
	 */
	async deleteOlderThan( maxAgeMs ) {
		try {
			const db = await this.ensureDatabase();
			const cutoffTime = Date.now() - maxAgeMs;

			// Use transaction for atomic delete operation
			const tx = db.transaction( this.storeName, 'readwrite' );
			const store = tx.objectStore( this.storeName );
			const index = store.index( 'timestamp' );

			let deletedCount = 0;

			// Get cursor for items with timestamp <= cutoffTime
			let cursor = await index.openCursor(
				IDBKeyRange.upperBound( cutoffTime )
			);

			while ( cursor ) {
				await cursor.delete();
				deletedCount++;
				cursor = await cursor.continue();
			}

			await tx.done;
			return deletedCount;
		} catch ( error ) {
			console.error( '[IndexedDB] Error deleting old items:', error );
			return 0;
		}
	}

	/**
	 * Get storage estimate (quota and usage)
	 *
	 * @return {Promise<Object>} Storage estimate with quota and usage
	 */
	async getStorageEstimate() {
		if ( navigator.storage && navigator.storage.estimate ) {
			try {
				const estimate = await navigator.storage.estimate();
				return {
					quota: estimate.quota,
					usage: estimate.usage,
					percentUsed:
						estimate.quota > 0
							? ( estimate.usage / estimate.quota ) * 100
							: 0,
				};
			} catch ( error ) {
				console.error(
					'[IndexedDB] Error getting storage estimate:',
					error
				);
			}
		}
		return { quota: null, usage: null, percentUsed: null };
	}
}

/**
 * Check if IndexedDB is available
 *
 * @return {boolean} True if IndexedDB is supported
 */
export function isIndexedDBAvailable() {
	try {
		return (
			typeof indexedDB !== 'undefined' &&
			indexedDB !== null &&
			typeof openDB === 'function'
		);
	} catch ( error ) {
		return false;
	}
}

/**
 * Delete entire database
 *
 * @param {string} dbName - Database name to delete
 * @return {Promise<boolean>} True if successful
 */
export async function deleteDatabase( dbName ) {
	try {
		// Remove from cache
		const cacheKeys = Array.from( dbInstances.keys() ).filter( ( key ) =>
			key.startsWith( dbName )
		);
		cacheKeys.forEach( ( key ) => dbInstances.delete( key ) );

		// Delete database
		await new Promise( ( resolve, reject ) => {
			const request = indexedDB.deleteDatabase( dbName );
			request.onsuccess = () => resolve( true );
			request.onerror = () =>
				reject(
					new Error(
						`Failed to delete database: ${
							request.error?.message || 'Unknown error'
						}`
					)
				);
		} );

		return true;
	} catch ( error ) {
		console.error( '[IndexedDB] Error deleting database:', error );
		return false;
	}
}

export default IndexedDBStore;
