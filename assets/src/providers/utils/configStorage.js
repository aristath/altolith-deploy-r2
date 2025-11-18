/**
 * Provider Configuration Storage
 *
 * Handles provider configuration persistence with IndexedDB caching
 * and REST API backend storage.
 *
 * Upgraded from localStorage to IndexedDB for:
 * - Better storage capacity (no 5-10MB localStorage limit)
 * - Persistent caching across sessions
 * - Works reliably in WordPress Playground WASM environment
 *
 * @package
 */

import apiFetch from '../../utils/api';
import { applyFilters, doAction } from '@wordpress/hooks';
import IndexedDBStore from '../../utils/indexedDB';

/**
 * Cache duration in milliseconds (5 minutes).
 */
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * IndexedDB configuration for provider configs
 */
const PROVIDER_CONFIG_DB = {
	dbName: 'aether-provider-configs',
	version: 1,
	stores: {
		configs: {
			keyPath: 'cacheKey',
			indexes: [
				{ name: 'timestamp', keyPath: 'timestamp', unique: false },
				{ name: 'providerId', keyPath: 'providerId', unique: false },
			],
		},
	},
};

/**
 * Shared IndexedDB store instance for all provider configs
 * @type {IndexedDBStore|null}
 */
let sharedStore = null;

/**
 * Get or create the shared IndexedDB store
 *
 * @return {IndexedDBStore} Shared store instance
 */
function getSharedStore() {
	if ( ! sharedStore ) {
		sharedStore = new IndexedDBStore( 'configs', PROVIDER_CONFIG_DB );
	}
	return sharedStore;
}

/**
 * Configuration storage class.
 *
 * Provides IndexedDB caching on top of REST API persistence.
 */
export class ConfigStorage {
	/**
	 * Provider ID.
	 *
	 * @type {string}
	 */
	providerId;

	/**
	 * Cache key for IndexedDB.
	 *
	 * @type {string}
	 */
	cacheKey;

	/**
	 * IndexedDB store instance.
	 *
	 * @type {IndexedDBStore}
	 */
	store;

	/**
	 * Constructor.
	 *
	 * @param {string} providerId Provider ID.
	 */
	constructor( providerId ) {
		if ( ! providerId || typeof providerId !== 'string' ) {
			throw new Error( 'ConfigStorage requires a valid provider ID' );
		}
		this.providerId = providerId;
		this.cacheKey = `provider:${ providerId }`;
		this.store = getSharedStore();
	}

	/**
	 * Load configuration from cache or REST API.
	 *
	 * Checks IndexedDB cache first, falls back to REST API if cache is stale or missing.
	 *
	 * @return {Promise<Object>} Configuration object
	 */
	async load() {
		// Try to load from cache first
		const cached = await this.getFromCache();
		if ( cached !== null ) {
			return cached;
		}

		// Load from REST API
		try {
			const response = await apiFetch( {
				path: `/aether/site-exporter/providers/${ this.providerId }/config`,
				method: 'GET',
			} );

			let config = response.config || {};

			/**
			 * Filter provider configuration after loading from storage.
			 *
			 * Allows modification of config loaded from REST API.
			 *
			 * @param {Object} config     Loaded configuration.
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addFilter } from '@wordpress/hooks';
			 *
			 * addFilter('aether.storage.config.load', 'my-plugin', (config, providerId) => {
			 *     if (providerId === 'my-provider') {
			 *         config.autoLoaded = Date.now();
			 *     }
			 *     return config;
			 * });
			 */
			config = applyFilters(
				'aether.storage.config.load',
				config,
				this.providerId
			);

			// Cache the result
			this.saveToCache( config );

			/**
			 * Action fired after configuration is loaded from storage.
			 *
			 * @param {Object} config     Loaded configuration.
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.storage.config.loaded', 'my-plugin', (config, providerId) => {
			 *     console.log(`Configuration loaded for ${providerId}`);
			 * });
			 */
			doAction( 'aether.storage.config.loaded', config, this.providerId );

			return config;
		} catch ( error ) {
			// If provider not configured, return empty object
			if (
				error.code === 'restProviderNotConfigured' ||
				error.status === 404
			) {
				return {};
			}

			// Re-throw other errors
			throw error;
		}
	}

	/**
	 * Save configuration to REST API and update cache.
	 *
	 * @param {Object} config Configuration object to save.
	 * @return {Promise<boolean>} True if saved successfully
	 */
	async save( config ) {
		/**
		 * Filter configuration before saving to storage.
		 *
		 * Allows modification of config before REST API call.
		 *
		 * @param {Object} config     Configuration to save.
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('aether.storage.config.before_save', 'my-plugin', (config, providerId) => {
		 *     if (providerId === 'my-provider') {
		 *         config.lastSaved = Date.now();
		 *     }
		 *     return config;
		 * });
		 */
		config = applyFilters(
			'aether.storage.config.before_save',
			config,
			this.providerId
		);

		try {
			await apiFetch( {
				path: `/aether/site-exporter/providers/${ this.providerId }/config`,
				method: 'POST',
				data: { config },
			} );

			// Update cache
			this.saveToCache( config );

			/**
			 * Action fired after configuration is saved to storage.
			 *
			 * @param {Object} config     Saved configuration.
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.storage.config.saved', 'my-plugin', (config, providerId) => {
			 *     console.log(`Configuration saved for ${providerId}`);
			 * });
			 */
			doAction( 'aether.storage.config.saved', config, this.providerId );

			return true;
		} catch ( error ) {
			throw error;
		}
	}

	/**
	 * Delete configuration from REST API and clear cache.
	 *
	 * @return {Promise<boolean>} True if deleted successfully
	 */
	async delete() {
		/**
		 * Action fired before configuration is deleted from storage.
		 *
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addAction } from '@wordpress/hooks';
		 *
		 * addAction('aether.storage.config.before_delete', 'my-plugin', (providerId) => {
		 *     console.log(`Deleting configuration for ${providerId}`);
		 * });
		 */
		doAction( 'aether.storage.config.before_delete', this.providerId );

		try {
			await apiFetch( {
				path: `/aether/site-exporter/providers/${ this.providerId }/config`,
				method: 'DELETE',
			} );

			// Clear cache
			this.clearCache();

			/**
			 * Action fired after configuration is deleted from storage.
			 *
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.storage.config.deleted', 'my-plugin', (providerId) => {
			 *     console.log(`Configuration deleted for ${providerId}`);
			 * });
			 */
			doAction( 'aether.storage.config.deleted', this.providerId );

			return true;
		} catch ( error ) {
			throw error;
		}
	}

	/**
	 * Get configuration from IndexedDB cache.
	 *
	 * Returns null if cache is missing or stale.
	 *
	 * @private
	 * @return {Promise<Object|null>} Cached configuration or null
	 */
	async getFromCache() {
		try {
			const cached = await this.store.get( this.cacheKey );
			if ( ! cached ) {
				return null;
			}

			// Check if cache is stale
			const now = Date.now();
			if ( now - cached.timestamp > CACHE_DURATION ) {
				await this.clearCache();
				return null;
			}

			return cached.config;
		} catch ( error ) {
			await this.clearCache();
			return null;
		}
	}

	/**
	 * Save configuration to IndexedDB cache.
	 *
	 * @private
	 * @param {Object} config Configuration object.
	 * @return {Promise<void>}
	 */
	async saveToCache( config ) {
		try {
			await this.store.set(
				this.cacheKey,
				{ config },
				{
					providerId: this.providerId,
				}
			);
		} catch ( error ) {
			// Failed to save to cache - log but don't throw
			console.error(
				`[ConfigStorage] Failed to cache config for ${ this.providerId }:`,
				error
			);
		}
	}

	/**
	 * Clear configuration from IndexedDB cache.
	 *
	 * @private
	 * @return {Promise<void>}
	 */
	async clearCache() {
		try {
			await this.store.delete( this.cacheKey );
		} catch ( error ) {
			// Failed to clear cache - log but don't throw
			console.error(
				`[ConfigStorage] Failed to clear cache for ${ this.providerId }:`,
				error
			);
		}
	}

	/**
	 * Invalidate cache for a specific provider.
	 *
	 * Forces the next load() to fetch from REST API.
	 *
	 * @param {string} providerId Provider ID.
	 * @return {Promise<void>}
	 */
	static async invalidateCache( providerId ) {
		const storage = new ConfigStorage( providerId );
		await storage.clearCache();
	}

	/**
	 * Clear all provider configuration caches.
	 *
	 * Useful when logging out or switching users.
	 *
	 * @return {Promise<void>}
	 */
	static async clearAllCaches() {
		try {
			const store = getSharedStore();
			await store.clear();
		} catch ( error ) {
			// Failed to clear all caches - log but don't throw
			console.error(
				'[ConfigStorage] Failed to clear all caches:',
				error
			);
		}
	}
}

export default ConfigStorage;
