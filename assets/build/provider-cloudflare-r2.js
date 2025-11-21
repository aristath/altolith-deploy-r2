/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 231:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ConfigStorage: () => (/* binding */ ConfigStorage)
});

// UNUSED EXPORTS: default

// EXTERNAL MODULE: external ["wp","apiFetch"]
var external_wp_apiFetch_ = __webpack_require__(455);
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_);
;// ../aether-site-exporter/assets/src/utils/getRestUrl.js
/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from the meta tag or returns a default.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
 * @package
 */

/**
 * Get REST API URL from meta tag or default.
 *
 * @return {string} REST API base URL.
 */
function getRestUrl() {
  const metaTag = document.querySelector('meta[name="aether-rest-url"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '/wp-json/aether/site-exporter/';
  }
  return '/wp-json/aether/site-exporter/';
}
;// ../aether-site-exporter/assets/src/utils/api.js
/**
 * API Fetch Utility
 *
 * Enhanced wrapper around @wordpress/api-fetch with:
 * - Request deduplication (prevents concurrent identical requests)
 * - Response caching with TTL (GET requests only)
 * - Nonce handling from meta tags
 * - Auth header utilities for external APIs
 *
 * @package
 */




/**
 * Create authorization headers for external API calls.
 *
 * Utility for building consistent Authorization headers.
 *
 * @param {string} token API token or key.
 * @param {string} type  Auth type (default: 'Bearer').
 * @return {Object} Headers object with Authorization and Content-Type.
 */
function createAuthHeaders(token, type = 'Bearer') {
  return {
    Authorization: `${type} ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get REST API nonce from meta tag or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  const metaTag = document.querySelector('meta[name="aether-rest-nonce"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }
  return '';
}

/**
 * Request deduplication middleware
 *
 * Prevents concurrent identical requests by returning the same Promise
 * for duplicate in-flight requests.
 *
 * Uses request key (method + path + data) to identify duplicates.
 */
const pendingRequests = new Map();
function createRequestKey(options) {
  const method = options.method || 'GET';
  const path = options.path || '';
  const data = options.data ? JSON.stringify(options.data) : '';
  return `${method}:${path}:${data}`;
}
const requestDeduplicationMiddleware = (options, next) => {
  const requestKey = createRequestKey(options);

  // Check if this request is already in flight
  if (pendingRequests.has(requestKey)) {
    // Return the existing Promise
    return pendingRequests.get(requestKey);
  }

  // Make the request
  const promise = next(options);

  // Store the Promise
  pendingRequests.set(requestKey, promise);

  // Clean up when request completes (success or error)
  // Use finally() to guarantee cleanup regardless of outcome
  promise.finally(() => {
    pendingRequests.delete(requestKey);
  });
  return promise;
};

/**
 * Response caching middleware
 *
 * Caches GET request responses with TTL to reduce redundant API calls.
 *
 * Cache format: Map<requestKey, {response, timestamp}>
 * TTL: Configurable per endpoint (default: 5 minutes)
 */
const responseCache = new Map();

// Cache configuration with endpoint-specific TTLs
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000,
  // 5 minutes default
  endpointTTLs: {
    '/assets': 10 * 60 * 1000,
    // 10 minutes - asset lists change infrequently
    '/settings': 1 * 60 * 1000,
    // 1 minute - settings may change
    '/config': 30 * 60 * 1000,
    // 30 minutes - static configuration
    '/check-wporg': 60 * 60 * 1000 // 60 minutes - WordPress.org data rarely changes
  },
  // Set to true to bypass cache (useful for development/testing)
  bypassCache: false
};

/**
 * Get cache TTL for a specific request path.
 *
 * @param {string} path Request path to check.
 * @return {number} TTL in milliseconds.
 */
function getCacheTTL(path) {
  if (CACHE_CONFIG.bypassCache) {
    return 0;
  }

  // Check if path matches any endpoint-specific TTL
  for (const [endpoint, ttl] of Object.entries(CACHE_CONFIG.endpointTTLs)) {
    if (path && path.includes(endpoint)) {
      return ttl;
    }
  }
  return CACHE_CONFIG.defaultTTL;
}
function isCacheValid(cacheEntry, path) {
  if (!cacheEntry) {
    return false;
  }
  const ttl = getCacheTTL(path);
  if (ttl === 0) {
    // Cache bypass enabled
    return false;
  }
  const age = Date.now() - cacheEntry.timestamp;
  return age < ttl;
}
const responseCachingMiddleware = (options, next) => {
  const method = options.method || 'GET';

  // Only cache GET requests
  if (method !== 'GET') {
    return next(options);
  }
  const requestKey = createRequestKey(options);
  const cached = responseCache.get(requestKey);

  // Return cached response if valid (pass path for TTL calculation)
  if (isCacheValid(cached, options.path)) {
    return Promise.resolve(cached.response);
  }

  // Make the request
  const promise = next(options);

  // Cache successful responses
  promise.then(response => {
    responseCache.set(requestKey, {
      response,
      timestamp: Date.now()
    });
    return response;
  }).catch(error => {
    // Don't cache errors
    throw error;
  });
  return promise;
};

/**
 * Invalidate cache for a specific path or all cached responses
 *
 * @param {string|null} path Optional path to invalidate (invalidates all if not provided)
 */
function invalidateCache(path = null) {
  if (path) {
    // Invalidate all cache entries matching this path
    for (const [key] of responseCache.entries()) {
      if (key.includes(path)) {
        responseCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    responseCache.clear();
  }
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
function setAPINonce(nonce) {
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL, nonce, and middleware.
 * Automatically fetches from meta tags if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from meta if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from meta if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || getRestUrl();
  const token = nonce || getNonce();
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }

  // Add custom middleware (order matters: caching before deduplication)
  external_wp_apiFetch_default().use(responseCachingMiddleware);
  external_wp_apiFetch_default().use(requestDeduplicationMiddleware);
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const api = ((external_wp_apiFetch_default()));
// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// ../aether-site-exporter/node_modules/idb/build/index.js
const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const transactionDoneMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    // This mapping exists in reverseTransformCache but doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(this.request);
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function build_openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */
function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event));
    }
    return wrap(request).then(() => undefined);
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap = {};
const advanceResults = new WeakMap();
const ittrProxiedCursorToOriginalProxy = new WeakMap();
const cursorIteratorTraps = {
    get(target, prop) {
        if (!advanceMethodProps.includes(prop))
            return target[prop];
        let cachedFunc = methodMap[prop];
        if (!cachedFunc) {
            cachedFunc = methodMap[prop] = function (...args) {
                advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
            };
        }
        return cachedFunc;
    },
};
async function* iterate(...args) {
    // tslint:disable-next-line:no-this-assignment
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
        cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
        return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    // Map this double-proxy back to the original, so other cursor methods work.
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
        yield proxiedCursor;
        // If one of the advancing methods was not called, call continue().
        cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
        advanceResults.delete(proxiedCursor);
    }
}
function isIteratorProp(target, prop) {
    return ((prop === Symbol.asyncIterator &&
        instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        (prop === 'iterate' && instanceOfAny(target, [IDBIndex, IDBObjectStore])));
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
        if (isIteratorProp(target, prop))
            return iterate;
        return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
        return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    },
}));



;// ../aether-site-exporter/assets/src/utils/indexedDB.js
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
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'type',
        keyPath: 'type',
        unique: false
      }]
    }
  }
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
async function openDatabase(config = DEFAULT_CONFIG) {
  const cacheKey = `${config.dbName}_v${config.version}`;

  // Return cached instance if available
  if (dbInstances.has(cacheKey)) {
    return dbInstances.get(cacheKey);
  }
  try {
    const db = await build_openDB(config.dbName, config.version, {
      upgrade(database) {
        // Create object stores based on configuration
        Object.entries(config.stores).forEach(([storeName, storeConfig]) => {
          // Delete existing store if it exists (for upgrades)
          if (database.objectStoreNames.contains(storeName)) {
            database.deleteObjectStore(storeName);
          }

          // Create new store
          const store = database.createObjectStore(storeName, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement || false
          });

          // Create indexes
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique || false
              });
            });
          }
        });
      }
    });
    dbInstances.set(cacheKey, db);
    return db;
  } catch (error) {
    throw new Error(`Failed to open IndexedDB: ${error.message || 'Unknown error'}`);
  }
}

/**
 * IndexedDB Store - Abstract interface for a single object store
 *
 * Provides a simple key-value API on top of idb library
 */
class IndexedDBStore {
  /**
   * Constructor
   *
   * @param {string} storeName - Name of the object store
   * @param {Object} config    - Database configuration (optional)
   */
  constructor(storeName, config = DEFAULT_CONFIG) {
    this.storeName = storeName;
    this.config = config;
    this.db = null;
    // Get the keyPath for this store from config
    this.keyPath = config.stores?.[storeName]?.keyPath || DEFAULT_CONFIG.stores.cache.keyPath;
  }

  /**
   * Ensure database is initialized
   *
   * @return {Promise<Object>} Database instance
   */
  async ensureDatabase() {
    if (!this.db) {
      this.db = await openDatabase(this.config);
    }
    return this.db;
  }

  /**
   * Get a value by key
   *
   * @param {string|number} key - The key to retrieve
   * @return {Promise<any|null>} The stored value or null if not found
   */
  async get(key) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.get(this.storeName, key);
      return result || null;
    } catch (error) {
      console.error(`[IndexedDB] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Get all values from the store
   *
   * @param {number} limit - Maximum number of items to return (optional)
   * @return {Promise<Array>} Array of all stored values
   */
  async getAll(limit = undefined) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAll(this.storeName, undefined, limit);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all values:', error);
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
      const result = await db.getAllKeys(this.storeName);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all keys:', error);
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
  async set(key, value, metadata = {}) {
    try {
      const db = await this.ensureDatabase();

      // For object values, spread properties; for primitives, use value property
      const valueData = typeof value === 'object' && value !== null ? {
        ...value
      } : {
        value
      };
      const data = {
        [this.keyPath]: key,
        ...valueData,
        timestamp: Date.now(),
        ...metadata
      };
      await db.put(this.storeName, data);
      return true;
    } catch (error) {
      // Check for quota exceeded error
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        console.warn('[IndexedDB] Storage quota exceeded. Consider cleaning up old data.');
      }
      console.error(`[IndexedDB] Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Delete a value by key
   *
   * @param {string|number} key - The key to delete
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async delete(key) {
    try {
      const db = await this.ensureDatabase();
      await db.delete(this.storeName, key);
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Error deleting key "${key}":`, error);
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
      await db.clear(this.storeName);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Error clearing store:', error);
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
      const result = await db.count(this.storeName);
      return result || 0;
    } catch (error) {
      console.error('[IndexedDB] Error counting items:', error);
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
  async getByIndex(indexName, indexValue) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAllFromIndex(this.storeName, indexName, indexValue);
      return result || [];
    } catch (error) {
      console.error(`[IndexedDB] Error getting by index "${indexName}":`, error);
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
  async deleteOlderThan(maxAgeMs) {
    try {
      const db = await this.ensureDatabase();
      const cutoffTime = Date.now() - maxAgeMs;

      // Use transaction for atomic delete operation
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('timestamp');
      let deletedCount = 0;

      // Get cursor for items with timestamp <= cutoffTime
      let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      while (cursor) {
        await cursor.delete();
        deletedCount++;
        cursor = await cursor.continue();
      }
      await tx.done;
      return deletedCount;
    } catch (error) {
      console.error('[IndexedDB] Error deleting old items:', error);
      return 0;
    }
  }

  /**
   * Get storage estimate (quota and usage)
   *
   * @return {Promise<Object>} Storage estimate with quota and usage
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          percentUsed: estimate.quota > 0 ? estimate.usage / estimate.quota * 100 : 0
        };
      } catch (error) {
        console.error('[IndexedDB] Error getting storage estimate:', error);
      }
    }
    return {
      quota: null,
      usage: null,
      percentUsed: null
    };
  }
}

/**
 * Check if IndexedDB is available
 *
 * @return {boolean} True if IndexedDB is supported
 */
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null && typeof openDB === 'function';
  } catch (error) {
    return false;
  }
}

/**
 * Delete entire database
 *
 * @param {string} dbName - Database name to delete
 * @return {Promise<boolean>} True if successful
 */
async function deleteDatabase(dbName) {
  try {
    // Remove from cache
    const cacheKeys = Array.from(dbInstances.keys()).filter(key => key.startsWith(dbName));
    cacheKeys.forEach(key => dbInstances.delete(key));

    // Delete database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message || 'Unknown error'}`));
    });
    return true;
  } catch (error) {
    console.error('[IndexedDB] Error deleting database:', error);
    return false;
  }
}
/* harmony default export */ const utils_indexedDB = (IndexedDBStore);
;// ../aether-site-exporter/assets/src/providers/utils/configStorage.js
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
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'providerId',
        keyPath: 'providerId',
        unique: false
      }]
    }
  }
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
  if (!sharedStore) {
    sharedStore = new utils_indexedDB('configs', PROVIDER_CONFIG_DB);
  }
  return sharedStore;
}

/**
 * Configuration storage class.
 *
 * Provides IndexedDB caching on top of REST API persistence.
 */
class ConfigStorage {
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
  constructor(providerId) {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ConfigStorage requires a valid provider ID');
    }
    this.providerId = providerId;
    this.cacheKey = `provider:${providerId}`;
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
    if (cached !== null) {
      return cached;
    }

    // Load from REST API
    try {
      const response = await api({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'GET'
      });
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
      config = (0,external_wp_hooks_.applyFilters)('aether.storage.config.load', config, this.providerId);

      // Cache the result
      this.saveToCache(config);

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
      (0,external_wp_hooks_.doAction)('aether.storage.config.loaded', config, this.providerId);
      return config;
    } catch (error) {
      // If provider not configured, return empty object
      if (error.code === 'restProviderNotConfigured' || error.status === 404) {
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
  async save(config) {
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
    config = (0,external_wp_hooks_.applyFilters)('aether.storage.config.before_save', config, this.providerId);
    try {
      await api({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'POST',
        data: {
          config
        }
      });

      // Update cache
      this.saveToCache(config);

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
      (0,external_wp_hooks_.doAction)('aether.storage.config.saved', config, this.providerId);
      return true;
    } catch (error) {
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
    (0,external_wp_hooks_.doAction)('aether.storage.config.before_delete', this.providerId);
    try {
      await api({
        path: `/aether/site-exporter/providers/${this.providerId}/config`,
        method: 'DELETE'
      });

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
      (0,external_wp_hooks_.doAction)('aether.storage.config.deleted', this.providerId);
      return true;
    } catch (error) {
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
      const cached = await this.store.get(this.cacheKey);
      if (!cached) {
        return null;
      }

      // Check if cache is stale
      const now = Date.now();
      if (now - cached.timestamp > CACHE_DURATION) {
        await this.clearCache();
        return null;
      }
      return cached.config;
    } catch (error) {
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
  async saveToCache(config) {
    try {
      await this.store.set(this.cacheKey, {
        config
      }, {
        providerId: this.providerId
      });
    } catch (error) {
      // Failed to save to cache - log but don't throw
      console.error(`[ConfigStorage] Failed to cache config for ${this.providerId}:`, error);
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
      await this.store.delete(this.cacheKey);
    } catch (error) {
      // Failed to clear cache - log but don't throw
      console.error(`[ConfigStorage] Failed to clear cache for ${this.providerId}:`, error);
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
  static async invalidateCache(providerId) {
    const storage = new ConfigStorage(providerId);
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
    } catch (error) {
      // Failed to clear all caches - log but don't throw
      console.error('[ConfigStorage] Failed to clear all caches:', error);
    }
  }
}
/* harmony default export */ const configStorage = ((/* unused pure expression or super */ null && (ConfigStorage)));

/***/ }),

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// ./assets/src/utils/debug.js
/**
 * Debug Utility
 *
 * Centralized logging utility for development debugging.
 * Can be enabled/disabled via window.aetherDebug flag.
 *
 * @package
 */

/**
 * Check if debug mode is enabled.
 *
 * @return {boolean} True if debug mode is enabled.
 */
function isDebugEnabled() {
  return typeof window !== 'undefined' && window.aetherDebug === true;
}

/**
 * Log a message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debug(...args) {
  if (isDebugEnabled() && window.console && window.console.log) {
    window.console.log('[Aether]', ...args);
  }
}

/**
 * Log an error to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugError(...args) {
  if (isDebugEnabled() && window.console && window.console.error) {
    window.console.error('[Aether Error]', ...args);
  }
}

/**
 * Log a warning to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugWarn(...args) {
  if (isDebugEnabled() && window.console && window.console.warn) {
    window.console.warn('[Aether Warning]', ...args);
  }
}

/**
 * Log an info message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugInfo(...args) {
  if (isDebugEnabled() && window.console && window.console.info) {
    window.console.info('[Aether Info]', ...args);
  }
}

/**
 * Log a table to console (only in debug mode).
 *
 * @param {*} data Data to display as table.
 */
function debugTable(data) {
  if (isDebugEnabled() && window.console && window.console.table) {
    window.console.table(data);
  }
}

/**
 * Start a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
function debugTime(label) {
  if (isDebugEnabled() && window.console && window.console.time) {
    window.console.time(`[Aether] ${label}`);
  }
}

/**
 * End a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
function debugTimeEnd(label) {
  if (isDebugEnabled() && window.console && window.console.timeEnd) {
    window.console.timeEnd(`[Aether] ${label}`);
  }
}

/**
 * Group console messages (only in debug mode).
 *
 * @param {string} label Group label.
 */
function debugGroup(label) {
  if (isDebugEnabled() && window.console && window.console.group) {
    window.console.group(`[Aether] ${label}`);
  }
}

/**
 * End console message group (only in debug mode).
 */
function debugGroupEnd() {
  if (isDebugEnabled() && window.console && window.console.groupEnd) {
    window.console.groupEnd();
  }
}

/**
 * Enable debug mode.
 *
 * Usage: aetherDebug.enable() in browser console.
 */
function enableDebug() {
  if (typeof window !== 'undefined') {
    window.aetherDebug = true;
    debug('Debug mode enabled');
  }
}

/**
 * Disable debug mode.
 *
 * Usage: aetherDebug.disable() in browser console.
 */
function disableDebug() {
  if (typeof window !== 'undefined') {
    window.aetherDebug = false;
  }
}

// Export as single object for easier importing
const debugUtil = {
  debug,
  error: debugError,
  warn: debugWarn,
  info: debugInfo,
  table: debugTable,
  time: debugTime,
  timeEnd: debugTimeEnd,
  group: debugGroup,
  groupEnd: debugGroupEnd,
  enable: enableDebug,
  disable: disableDebug,
  isEnabled: isDebugEnabled
};

// Make available globally for easy browser console access
if (typeof window !== 'undefined') {
  window.aetherDebug = window.aetherDebug || false;
  window.aetherDebugUtil = debugUtil;
}
/* harmony default export */ const utils_debug = ((/* unused pure expression or super */ null && (debugUtil)));
;// ./assets/src/utils/errorParser.js
/**
 * Error Response Parser Utility
 *
 * Centralized error response parsing for API calls.
 * Handles multiple error response formats (generic, plain text).
 *
 * @package
 */

/**
 * Parse error response from various API formats.
 *
 * Handles:
 * - API format with array of errors: { errors: [{ message: "..." }] }
 * - Generic format: { error: "..." }
 * - Message format: { message: "..." }
 * - Plain text responses
 *
 * @param {string} responseText   Raw response text (may be JSON or plain text).
 * @param {string} defaultMessage Default message if parsing fails.
 * @return {string} Parsed error message.
 */
function parseErrorResponse(responseText, defaultMessage) {
  if (!responseText) {
    return defaultMessage;
  }
  try {
    const data = JSON.parse(responseText);

    // Handle API format with errors array: { errors: [{ message: "..." }] }
    if (data.errors && Array.isArray(data.errors)) {
      if (data.errors.length > 0 && data.errors[0].message) {
        return data.errors[0].message;
      }
    }

    // Handle generic error format: { error: "..." }
    if (data.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }

    // Handle message format: { message: "..." }
    if (data.message) {
      return data.message;
    }

    // If JSON parsed but no recognized format, return default
    return defaultMessage;
  } catch (e) {
    // Not valid JSON, treat as plain text
    return responseText || defaultMessage;
  }
}

/**
 * Parse error response with HTTP status context.
 *
 * Includes HTTP status code in error message if available.
 *
 * @param {string} responseText Raw response text.
 * @param {number} statusCode   HTTP status code.
 * @param {string} operation    Operation name (e.g., "Worker deployment").
 * @return {string} Formatted error message with context.
 */
function parseErrorResponseWithStatus(responseText, statusCode, operation) {
  const errorMessage = parseErrorResponse(responseText, `${operation} failed`);

  // Add status code context if available and not already in message
  if (statusCode && !errorMessage.includes(statusCode.toString())) {
    return `${errorMessage} (HTTP ${statusCode})`;
  }
  return errorMessage;
}
;// ./assets/src/utils/standardResponse.js
/**
 * Standard Response Format Utility
 *
 * Provides standardized response object format for all API operations.
 * Eliminates inconsistent response structures across the codebase.
 *
 * Standard format:
 * {
 *   success: boolean,
 *   data?: any,           // Success data
 *   error?: string,       // Single error message
 *   errors?: string[]     // Multiple errors (optional)
 * }
 *
 * @package
 */

/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
function createSuccessResponse(data = null, message = null) {
  const response = {
    success: true,
    data
  };

  // Add message to data if provided
  if (message && typeof data === 'object' && data !== null) {
    response.data = {
      ...data,
      message
    };
  } else if (message) {
    response.data = {
      message
    };
  }
  return response;
}

/**
 * Create an error response.
 *
 * @param {string|Error} error  Error message or Error object.
 * @param {Array}        errors Optional array of multiple errors.
 * @return {Object} Standardized error response.
 */
function createErrorResponse(error, errors = null) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
  const response = {
    success: false,
    error: errorMessage
  };
  if (errors && Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }
  return response;
}

/**
 * Normalize a response to standard format.
 *
 * Takes various response formats and converts to standard format.
 * Handles legacy formats for migration.
 *
 * @param {Object} response Response to normalize.
 * @return {Object} Normalized response in standard format.
 */
function normalizeResponse(response) {
  // Already in standard format
  if (response && typeof response.success === 'boolean' && (response.data !== undefined || response.error !== undefined)) {
    return response;
  }

  // Legacy format with error field
  if (response && response.error) {
    return createErrorResponse(response.error, response.errors);
  }

  // Legacy format with success=true but no data field
  if (response && response.success === true) {
    // Extract data from non-standard fields
    const {
      success,
      error,
      errors,
      ...data
    } = response;
    return createSuccessResponse(data);
  }

  // Legacy format with success=false
  if (response && response.success === false) {
    return createErrorResponse(response.message || response.error || 'Operation failed', response.errors);
  }

  // Fallback for unknown format
  return response;
}

/**
 * Check if response indicates success.
 *
 * @param {Object} response Response object.
 * @return {boolean} True if successful.
 */
function isSuccessResponse(response) {
  return response?.success === true;
}

/**
 * Check if response indicates error.
 *
 * @param {Object} response Response object.
 * @return {boolean} True if error.
 */
function isErrorResponse(response) {
  return response?.success === false;
}

/**
 * Get data from response.
 *
 * @param {Object} response Response object.
 * @param {*}      fallback Fallback value if no data.
 * @return {*} Response data or fallback.
 */
function getResponseData(response, fallback = null) {
  if (isSuccessResponse(response)) {
    // Return data even if it's null (null is valid data)
    return 'data' in response ? response.data : fallback;
  }
  return fallback;
}

/**
 * Get error from response.
 *
 * @param {Object} response     Response object.
 * @param {string} defaultError Default error message.
 * @return {string} Error message.
 */
function getResponseError(response, defaultError = 'Unknown error') {
  if (isErrorResponse(response)) {
    return response.error || defaultError;
  }
  return defaultError;
}

/**
 * Get all errors from response.
 *
 * @param {Object} response Response object.
 * @return {Array<string>} Array of error messages.
 */
function getResponseErrors(response) {
  if (isErrorResponse(response)) {
    const errors = [];
    if (response.error) {
      errors.push(response.error);
    }
    if (response.errors && Array.isArray(response.errors)) {
      errors.push(...response.errors);
    }
    return errors;
  }
  return [];
}
;// ./assets/src/utils/workerEndpointClient.js
/**
 * Worker Endpoint Client
 *
 * Client for Worker endpoint operations (upload, delete, copy, list, etc.).
 * All operations go through the Worker endpoint for WordPress Playground compatibility.
 *
 * @package
 */




// Timeout for very long operations (5 minutes)
const TIMEOUT_VERY_LONG = 300000;

/**
 * Multipart upload threshold (20MB).
 * Files larger than this will use multipart upload.
 */
const MULTIPART_THRESHOLD_BYTES = 20 * 1024 * 1024;

/**
 * Multipart chunk size (5MB).
 * Chunk size for multipart uploads (above S3's 5MB minimum).
 */
const MULTIPART_CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * Upload a file to storage via Worker endpoint.
 *
 * @param {string}    workerEndpoint Worker endpoint URL.
 * @param {string}    key            Object key/path in storage.
 * @param {File|Blob} file           File to upload.
 * @param {Object}    options        Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result with success and optional url/error.
 */
async function uploadFile(workerEndpoint, key, file, options = {}) {
  const fileSize = file.size;
  debug('uploadFile called:', {
    key,
    fileSize,
    useMultipart: fileSize > MULTIPART_THRESHOLD_BYTES,
    hasOnProgress: !!options.onProgress
  });

  // Use multipart upload for large files.
  if (fileSize > MULTIPART_THRESHOLD_BYTES) {
    return uploadMultipart(workerEndpoint, key, file, options);
  }

  // Single-file upload with progress tracking using XMLHttpRequest.
  return uploadSingleWithProgress(workerEndpoint, key, file, options);
}

/**
 * Upload a single file with progress tracking using XMLHttpRequest.
 *
 * @param {string}    workerEndpoint Worker endpoint URL.
 * @param {string}    key            Object key/path in storage.
 * @param {File|Blob} file           File to upload.
 * @param {Object}    options        Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result.
 */
async function uploadSingleWithProgress(workerEndpoint, key, file, options = {}) {
  const contentType = options.contentType || file.type || 'application/octet-stream';
  const cacheControl = options.cacheControl || '';
  const onProgress = options.onProgress || null;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Set timeout for large file uploads (60 seconds)
    xhr.timeout = TIMEOUT_VERY_LONG;

    // Track upload progress.
    if (onProgress) {
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const percent = Math.round(event.loaded / event.total * 100);
          debug('[Aether] uploadSingleWithProgress progress:', {
            loaded: event.loaded,
            total: event.total,
            percent
          });
          onProgress(event.loaded, event.total, percent);
        }
      });
    }

    // Handle timeout.
    xhr.addEventListener('timeout', () => {
      reject(new Error(`Upload timed out after ${TIMEOUT_VERY_LONG}ms`));
    });

    // Handle completion.
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(createSuccessResponse());
        return;
      }
      let errorMessage = `Upload failed: ${xhr.status}`;
      errorMessage = parseErrorResponse(xhr.responseText, errorMessage);
      resolve(createErrorResponse(errorMessage));
    });

    // Handle errors.
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: network error'));
    });

    // Handle abort.
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    // Open and send request.
    xhr.open('POST', workerEndpoint);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('X-R2-Key', key);
    xhr.setRequestHeader('X-R2-Content-Type', contentType);
    if (cacheControl) {
      xhr.setRequestHeader('X-R2-Cache-Control', cacheControl);
    }
    xhr.send(file);
  });
}

/**
 * Upload a large file using multipart upload via Worker endpoint.
 *
 * @param {string}    workerEndpoint Worker endpoint URL.
 * @param {string}    key            Object key/path in storage.
 * @param {File|Blob} file           File to upload.
 * @param {Object}    options        Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result.
 */
async function uploadMultipart(workerEndpoint, key, file, options = {}) {
  const fileSize = file.size;
  const contentType = options.contentType || file.type || 'application/octet-stream';
  const cacheControl = options.cacheControl || '';

  // Step 1: Initiate multipart upload.
  const uploadId = await initiateMultipartUpload(workerEndpoint, key, contentType, cacheControl);
  if (!uploadId) {
    return createErrorResponse('Failed to initiate multipart upload');
  }

  // Step 2: Upload parts sequentially.
  const parts = [];
  const numParts = Math.ceil(fileSize / MULTIPART_CHUNK_SIZE); // Calculate after early return
  const onProgress = options.onProgress || null; // Assign just before use
  for (let partNumber = 1; partNumber <= numParts; partNumber++) {
    const start = (partNumber - 1) * MULTIPART_CHUNK_SIZE;
    const end = Math.min(start + MULTIPART_CHUNK_SIZE, fileSize);
    const chunk = file.slice(start, end);
    const chunkBuffer = await chunk.arrayBuffer();
    const etag = await uploadPart(workerEndpoint, key, uploadId, partNumber, chunkBuffer);
    if (!etag) {
      // Abort on error.
      await abortMultipartUpload(workerEndpoint, key, uploadId);
      return createErrorResponse(`Failed to upload part ${partNumber}`);
    }
    parts.push({
      partNumber,
      etag
    });

    // Report progress for this part.
    if (onProgress) {
      const uploadedBytes = partNumber * MULTIPART_CHUNK_SIZE;
      const progressBytes = Math.min(uploadedBytes, fileSize);
      const percent = Math.round(progressBytes / fileSize * 100);
      debug('uploadMultipart progress:', {
        partNumber,
        numParts,
        uploadedBytes,
        progressBytes,
        fileSize,
        percent
      });
      onProgress(progressBytes, fileSize, null);
    }
  }

  // Step 3: Complete multipart upload.
  const completeResult = await completeMultipartUpload(workerEndpoint, key, uploadId, parts);
  if (!completeResult) {
    await abortMultipartUpload(workerEndpoint, key, uploadId);
    return createErrorResponse('Failed to complete multipart upload');
  }
  return createSuccessResponse();
}

/**
 * Initiate a multipart upload via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @param {string} contentType    MIME type.
 * @param {string} cacheControl   Cache control header.
 * @return {Promise<string|null>} Upload ID or null on failure.
 */
async function initiateMultipartUpload(workerEndpoint, key, contentType, cacheControl) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'initiate-multipart'
    },
    body: JSON.stringify({
      key,
      contentType,
      cacheControl
    })
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.uploadId || null;
}

/**
 * Upload a single part via Worker endpoint.
 *
 * @param {string}      workerEndpoint Worker endpoint URL.
 * @param {string}      key            Object key/path.
 * @param {string}      uploadId       Upload ID.
 * @param {number}      partNumber     Part number (1-based).
 * @param {ArrayBuffer} chunk          Data chunk.
 * @return {Promise<string|null>} ETag or null on failure.
 */
async function uploadPart(workerEndpoint, key, uploadId, partNumber, chunk) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-R2-Key': key,
      'X-R2-Upload-Id': uploadId,
      'X-R2-Part-Number': String(partNumber)
    },
    body: chunk
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.etag || null;
}

/**
 * Complete a multipart upload via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @param {string} uploadId       Upload ID.
 * @param {Array}  parts          Array of {partNumber, etag} objects.
 * @return {Promise<boolean>} True on success.
 */
async function completeMultipartUpload(workerEndpoint, key, uploadId, parts) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'complete-multipart'
    },
    body: JSON.stringify({
      key,
      uploadId,
      parts
    })
  });
  return response.ok;
}

/**
 * Abort a multipart upload via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @param {string} uploadId       Upload ID.
 * @return {Promise<boolean>} True on success.
 */
async function abortMultipartUpload(workerEndpoint, key, uploadId) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'abort-multipart'
    },
    body: JSON.stringify({
      key,
      uploadId
    })
  });
  return response.ok;
}

/**
 * Delete a file from storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @return {Promise<Object>} Delete result with success and optional error.
 */
async function deleteFile(workerEndpoint, key) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'delete'
    },
    body: JSON.stringify({
      key
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    const errorMessage = parseErrorResponse(errorText, `Delete failed: ${response.status}`);
    return createErrorResponse(errorMessage);
  }
  return createSuccessResponse();
}

/**
 * Copy a file within storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} sourceKey      Source object key.
 * @param {string} destKey        Destination object key.
 * @return {Promise<Object>} Copy result with success and optional error.
 */
async function copyFile(workerEndpoint, sourceKey, destKey) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'copy'
    },
    body: JSON.stringify({
      sourceKey,
      destKey
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    const errorMessage = parseErrorResponse(errorText, `Copy failed: ${response.status}`);
    return createErrorResponse(errorMessage);
  }
  return createSuccessResponse();
}

/**
 * List objects in storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} prefix         Optional prefix to filter objects.
 * @param {number} limit          Maximum number of objects to return.
 * @return {Promise<Object>} List result with success, objects array, and optional error.
 */
async function listObjects(workerEndpoint, prefix = '', limit = 1000) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'list'
    },
    body: JSON.stringify({
      prefix,
      limit
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    const errorMessage = parseErrorResponse(errorText, `List failed: ${response.status}`);
    return createErrorResponse(errorMessage);
  }
  const data = await response.json();
  return createSuccessResponse({
    objects: data.objects || []
  });
}

/**
 * Batch copy multiple objects in storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {Array}  operations     Array of {source, dest} objects.
 * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
 */
async function batchCopy(workerEndpoint, operations) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'batch-copy'
    },
    body: JSON.stringify({
      operations
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    const errorMessage = parseErrorResponse(errorText, `Batch copy failed: ${response.status}`);
    return createErrorResponse(errorMessage);
  }
  const data = await response.json();
  return createSuccessResponse({
    copied: data.copied || 0,
    errors: data.errors || 0,
    results: data.results || []
  });
}

/**
 * Batch delete multiple objects from storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {Array}  keys           Array of object keys to delete.
 * @return {Promise<Object>} Result with success and optional error.
 */
async function batchDelete(workerEndpoint, keys) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'batch-delete'
    },
    body: JSON.stringify({
      keys
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    const errorMessage = parseErrorResponse(errorText, `Batch delete failed: ${response.status}`);
    return createErrorResponse(errorMessage);
  }
  return createSuccessResponse();
}

/**
 * Download a file from storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @return {Promise<Blob|null>} File blob or null on failure.
 */
async function downloadFile(workerEndpoint, key) {
  const response = await fetch(workerEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-R2-Action': 'download'
    },
    body: JSON.stringify({
      key
    })
  });
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(`Download failed: ${response.status} - ${errorText}`);
  }
  return response.blob();
}

/**
 * Get public URL for an object.
 * This constructs the URL based on worker endpoint and key.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} bucketName     Bucket name.
 * @param {string} key            Object key/path.
 * @return {string} Public URL.
 */
function getObjectUrl(workerEndpoint, bucketName, key) {
  const baseUrl = workerEndpoint.replace(/\/$/, '');
  return `${baseUrl}/${bucketName}/${key}`;
}
;// ./assets/src/providers/services/storageService.js
/**
 * Storage Service (React)
 *
 * React implementation of storage service for Cloudflare R2.
 * Replaces R2StorageService.php logic.
 * All operations go through Worker endpoint.
 *
 * @package
 */



/**
 * Storage Service class.
 */
class StorageService {
  /**
   * Constructor.
   *
   * @param {string} workerEndpoint Worker endpoint URL.
   * @param {string} bucketName     Bucket name.
   * @param {Object} config         Optional configuration.
   */
  constructor(workerEndpoint, bucketName, config = {}) {
    this.workerEndpoint = workerEndpoint;
    this.bucketName = bucketName;
    this.config = config;
  }

  /**
   * Upload a file to storage.
   *
   * @param {string}    key      Object key/path in storage.
   * @param {File|Blob} file     File to upload.
   * @param {Object}    metadata Optional metadata (contentType, cacheControl, onProgress).
   * @return {Promise<Object>} Result array with 'success' and optional 'url', 'error'.
   */
  async upload(key, file, metadata = {}) {
    if (!(file instanceof File || file instanceof Blob)) {
      return {
        success: false,
        error: 'File must be a File or Blob object'
      };
    }
    const options = {
      contentType: metadata.contentType || file.type,
      cacheControl: metadata.cacheControl || '',
      onProgress: metadata.onProgress || null
    };
    const result = await uploadFile(this.workerEndpoint, key, file, options);
    if (!result.success) {
      return result;
    }

    // Build public URL.
    const url = this.getUrl(key);
    return {
      success: true,
      url
    };
  }

  /**
   * Delete a file from storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async delete(key) {
    return deleteFile(this.workerEndpoint, key);
  }

  /**
   * Copy an object from source to destination within storage.
   *
   * @param {string} sourceKey Source object key.
   * @param {string} destKey   Destination object key.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async copy(sourceKey, destKey) {
    return copyFile(this.workerEndpoint, sourceKey, destKey);
  }

  /**
   * Check if a file exists in storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<boolean>} True if exists, false otherwise.
   */
  async exists(key) {
    // List objects with prefix matching the exact key.
    const result = await listObjects(this.workerEndpoint, key, 1);
    if (!result.success) {
      return false;
    }
    const objects = result.objects || [];
    return objects.some(obj => obj.key === key);
  }

  /**
   * List objects in storage.
   *
   * @param {string} prefix Optional prefix to filter objects.
   * @param {number} limit  Maximum number of objects to return.
   * @return {Promise<Object>} Result array with 'success', 'objects' array, and optional 'error'.
   */
  async listObjects(prefix = '', limit = 1000) {
    return listObjects(this.workerEndpoint, prefix, limit);
  }

  /**
   * Get public URL for an object.
   *
   * @param {string} key Object key/path.
   * @return {string} Public URL.
   */
  getUrl(key) {
    // Use public_url if available (e.g., custom domain)
    if (this.config.public_url) {
      const baseUrl = this.config.public_url.replace(/\/$/, '');
      return `${baseUrl}/${key}`;
    }
    // Fallback to worker endpoint URL
    return getObjectUrl(this.workerEndpoint, this.bucketName, key);
  }

  /**
   * Batch copy multiple objects in storage.
   *
   * @param {Array} operations Array of {source, dest} objects.
   * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
   */
  async batchCopy(operations) {
    return batchCopy(this.workerEndpoint, operations);
  }

  /**
   * Batch delete multiple objects from storage.
   *
   * @param {Array} keys Array of object keys to delete.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async batchDelete(keys) {
    return batchDelete(this.workerEndpoint, keys);
  }

  /**
   * Download manifest file from storage.
   *
   * @param {string} siteKey Site key for manifest path.
   * @return {Promise<Blob|null>} Manifest blob or null if not found.
   */
  async downloadManifest(siteKey) {
    const manifestKey = `${siteKey}/file-manifest.json`;
    try {
      const blob = await downloadFile(this.workerEndpoint, manifestKey);
      return blob;
    } catch (error) {
      // Return null if file doesn't exist (404) or other error.
      return null;
    }
  }

  /**
   * Upload manifest file to storage.
   *
   * @param {string} siteKey Site key for manifest path.
   * @param {Blob}   blob    Manifest blob to upload.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async uploadManifest(siteKey, blob) {
    const manifestKey = `${siteKey}/file-manifest.json`;
    const result = await this.upload(manifestKey, blob, {
      contentType: 'application/json'
    });
    return result;
  }

  /**
   * Test connection to storage service.
   *
   * @return {Promise<Object>} Result array with 'success' and optional 'message', 'error'.
   */
  async testConnection() {
    // Try to list objects (max 1) to verify connection.
    const result = await this.listObjects('', 1);
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to list objects'
      };
    }
    return {
      success: true,
      message: 'Successfully connected to Cloudflare R2.'
    };
  }
}
;// ../aether-site-exporter/assets/src/constants/deploymentTypes.js
/**
 * Deployment type constants and labels
 *
 * @package
 */



/**
 * Deployment type identifiers
 */
const DEPLOYMENT_TYPES = {
  STATIC_SITE: 'static_site',
  BLUEPRINT_BUNDLE: 'blueprint_bundle',
  EDGE_FUNCTIONS: 'edge_functions'
};

/**
 * Human-readable labels for deployment types
 */
const DEPLOYMENT_TYPE_LABELS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Static Site', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Blueprint Bundle', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Edge Functions', 'aether-site-exporter')
};

/**
 * Descriptions for deployment types
 */
const DEPLOYMENT_TYPE_DESCRIPTIONS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Deploy static HTML/CSS/JS files for web hosting', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Deploy WordPress Playground blueprint bundle (ZIP file)', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Deploy serverless functions to edge computing platforms', 'aether-site-exporter')
};
;// ../aether-site-exporter/assets/src/providers/utils/configFieldBuilder.js
/**
 * Config Field Builder
 *
 * Provides a fluent interface for defining configuration fields.
 * JavaScript equivalent of includes/Providers/ConfigFieldBuilder.php
 *
 * Example usage:
 * ```javascript
 * const field = ConfigFieldBuilder.text('api_key')
 *     .label('API Key')
 *     .description('Your API key from the provider')
 *     .required()
 *     .placeholder('Enter your API key')
 *     .pattern('[A-Za-z0-9]+')
 *     .build();
 * ```
 *
 * @package
 */




/**
 * ConfigFieldBuilder class
 *
 * Provides a fluent interface for building field configurations.
 */
class ConfigFieldBuilder {
  /**
   * Field configuration object
   *
   * @type {Object}
   */
  field = {};

  /**
   * Private constructor to enforce factory methods
   *
   * @param {string} name Field name/key.
   * @param {string} type Field type.
   */
  constructor(name, type) {
    this.field = {
      name,
      type
    };
  }

  /**
   * Create a text field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static text(name) {
    return new ConfigFieldBuilder(name, 'text');
  }

  /**
   * Create a password field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static password(name) {
    return new ConfigFieldBuilder(name, 'password');
  }

  /**
   * Create a select field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static select(name) {
    return new ConfigFieldBuilder(name, 'select');
  }

  /**
   * Create a textarea field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static textarea(name) {
    return new ConfigFieldBuilder(name, 'textarea');
  }

  /**
   * Create a checkbox field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static checkbox(name) {
    return new ConfigFieldBuilder(name, 'checkbox');
  }

  /**
   * Create a number field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static number(name) {
    return new ConfigFieldBuilder(name, 'number');
  }

  /**
   * Create an email field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static email(name) {
    return new ConfigFieldBuilder(name, 'email');
  }

  /**
   * Create a URL field
   *
   * @param {string} name Field name/key.
   * @return {ConfigFieldBuilder} Builder instance
   */
  static url(name) {
    return new ConfigFieldBuilder(name, 'url');
  }

  /**
   * Set the field label
   *
   * @param {string} label Field label for display.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  label(label) {
    this.field.label = label;
    return this;
  }

  /**
   * Set the field description
   *
   * @param {string} description Help text for the field.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  description(description) {
    this.field.description = description;
    return this;
  }

  /**
   * Mark field as required
   *
   * @param {boolean} required Whether field is required.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  required(required = true) {
    this.field.required = required;
    return this;
  }

  /**
   * Set validation pattern (regex)
   *
   * @param {string} pattern Regular expression pattern.
   * @param {string} message Optional error message for pattern mismatch.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  pattern(pattern, message = '') {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.pattern = pattern;
    if (message) {
      this.field.validation.message = message;
    }
    return this;
  }

  /**
   * Set placeholder text
   *
   * @param {string} placeholder Placeholder text.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  placeholder(placeholder) {
    this.field.placeholder = placeholder;
    return this;
  }

  /**
   * Set default value
   *
   * @param {*} value Default value.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  default(value) {
    this.field.default = value;
    return this;
  }

  /**
   * Set options for select field
   *
   * @param {Array<{value: string, label: string}>} options Array of option objects.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  options(options) {
    this.field.options = options;
    return this;
  }

  /**
   * Set minimum value/length
   *
   * @param {number} min Minimum value for number fields or minimum length for text.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  min(min) {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.minLength = min;
    this.field.min = min; // Also set for HTML input
    return this;
  }

  /**
   * Set maximum value/length
   *
   * @param {number} max Maximum value for number fields or maximum length for text.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  max(max) {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.maxLength = max;
    this.field.max = max; // Also set for HTML input
    return this;
  }

  /**
   * Set step for number fields
   *
   * @param {number} step Step value for number inputs.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  step(step) {
    this.field.step = step;
    return this;
  }

  /**
   * Set rows for textarea
   *
   * @param {number} rows Number of visible text rows.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  rows(rows) {
    this.field.rows = rows;
    return this;
  }

  /**
   * Mark field as sensitive (for passwords, API keys, etc.)
   *
   * Note: Actual encryption happens server-side via REST API
   *
   * @param {boolean} sensitive Whether field contains sensitive data.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  sensitive(sensitive = true) {
    this.field.sensitive = sensitive;
    return this;
  }

  /**
   * Set custom validation callback
   *
   * @param {Function} callback Validation callback that receives value and returns string (error) or null (valid).
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  validate(callback) {
    if (!this.field.validation) {
      this.field.validation = {};
    }
    this.field.validation.callback = callback;
    return this;
  }

  /**
   * Set custom sanitization callback
   *
   * @param {Function} callback Sanitization callback that receives and returns value.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  sanitize(callback) {
    this.field.sanitize = callback;
    return this;
  }

  /**
   * Add conditional visibility
   *
   * @param {string} dependsOn Field name this field depends on.
   * @param {*}      value     Value the dependent field must have.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  showIf(dependsOn, value) {
    this.field.showIf = {
      field: dependsOn,
      value
    };
    return this;
  }

  /**
   * Set field group (for grouping related fields)
   *
   * @param {string} group Group identifier.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  group(group) {
    this.field.group = group;
    return this;
  }

  /**
   * Add CSS class to field
   *
   * @param {string} className CSS class name.
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  cssClass(className) {
    this.field.class = className;
    return this;
  }

  /**
   * Set field width (for layout)
   *
   * @param {string} width Width value (e.g., '50%', '200px', 'half').
   * @return {ConfigFieldBuilder} This instance for chaining
   */
  width(width) {
    this.field.width = width;
    return this;
  }

  /**
   * Build and return the field configuration object
   *
   * @return {Object} The complete field configuration
   */
  build() {
    // Set default label if not provided
    if (!this.field.label) {
      this.field.label = this.field.name.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    // Set 'id' as an alias for 'name'
    if (!this.field.id) {
      this.field.id = this.field.name;
    }
    return {
      ...this.field
    };
  }

  /**
   * Create multiple fields at once
   *
   * @param {Array<ConfigFieldBuilder>} builders Array of ConfigFieldBuilder instances.
   * @return {Array<Object>} Array of built field configurations
   */
  static buildAll(builders) {
    return builders.map(builder => builder.build());
  }
}

/**
 * Build deployment types checkbox field for a provider.
 *
 * Creates a checkbox-group field showing only the deployment types
 * that the provider supports. Returns null if provider supports no types.
 *
 * @param {Object} provider Provider instance with getSupportedDeploymentTypes() method.
 * @return {Object|null} Field configuration object or null if no supported types
 */
function buildDeploymentTypesField(provider) {
  const supportedTypes = provider.getSupportedDeploymentTypes();
  if (!supportedTypes || supportedTypes.length === 0) {
    return null; // No deployment types = no field
  }
  return {
    id: 'deployment_types',
    type: 'checkbox-group',
    label: (0,external_wp_i18n_namespaceObject.__)('Deployment Types', 'aether-site-exporter'),
    help: (0,external_wp_i18n_namespaceObject.__)('Select which types of deployments to use this provider for', 'aether-site-exporter'),
    required: false,
    options: supportedTypes.map(type => ({
      value: type,
      label: DEPLOYMENT_TYPE_LABELS[type] || type,
      description: DEPLOYMENT_TYPE_DESCRIPTIONS[type] || ''
    })),
    defaultValue: supportedTypes // All supported types enabled by default
  };
}
/* harmony default export */ const configFieldBuilder = ((/* unused pure expression or super */ null && (ConfigFieldBuilder)));
;// ../aether-site-exporter/assets/src/providers/utils/configValidation.js
/**
 * Configuration Validation Utilities
 *
 * Pure functions for validating provider configurations.
 *
 * @package
 */



/**
 * Validate a configuration value against a field definition.
 *
 * @param {*}      value  Value to validate.
 * @param {Object} field  Field definition.
 * @param {Object} config Full config object (for cross-field validation).
 * @return {Promise<string|null>} Error message or null if valid.
 */
async function validateFieldValue(value, field, config) {
  // Check required fields
  if (field.required && !value) {
    return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Field label */
    (0,external_wp_i18n_namespaceObject.__)('%s is required.', 'aether-site-exporter'), field.label);
  }

  // Skip validation if field is empty and not required
  if (!value) {
    return null;
  }

  // Type validation
  if (field.validation) {
    const validation = field.validation;

    // Pattern validation
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        if (validation.message) {
          return validation.message;
        }
        return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Field label */
        (0,external_wp_i18n_namespaceObject.__)('%s format is invalid.', 'aether-site-exporter'), field.label);
      }
    }

    // Min length validation
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Field label, 2: Minimum length */
      (0,external_wp_i18n_namespaceObject.__)('%1$s must be at least %2$d characters.', 'aether-site-exporter'), field.label, validation.minLength);
    }

    // Max length validation
    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: 1: Field label, 2: Maximum length */
      (0,external_wp_i18n_namespaceObject.__)('%1$s must be no more than %2$d characters.', 'aether-site-exporter'), field.label, validation.maxLength);
    }

    // Custom validator callback
    if (validation.callback && typeof validation.callback === 'function') {
      const result = await validation.callback(value, config);
      if (typeof result === 'string') {
        return result;
      }
    }
  }
  return null;
}

/**
 * Validate all fields in a configuration.
 *
 * @param {Object}        config Configuration to validate.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {Promise<Object>} Object of field ID to error message.
 */
async function validateAllFields(config, fields) {
  const errors = {};
  for (const field of fields) {
    const fieldId = field.id;
    const value = config[fieldId];
    const error = await validateFieldValue(value, field, config);
    if (error) {
      errors[fieldId] = error;
    }
  }
  return errors;
}

/**
 * Check if a configuration has all required fields filled.
 *
 * @param {Object}        config Configuration to check.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {boolean} True if all required fields are present.
 */
function hasRequiredFields(config, fields) {
  for (const field of fields) {
    if (field.required && !config[field.id]) {
      return false;
    }
  }
  return true;
}
;// ../aether-site-exporter/assets/src/providers/utils/configSanitization.js
/**
 * Configuration Sanitization Utilities
 *
 * Pure functions for sanitizing provider configurations.
 *
 * @package
 */

/**
 * Sanitize a single field value based on its type.
 *
 * @param {*}      value Value to sanitize.
 * @param {Object} field Field definition with type info.
 * @return {*} Sanitized value.
 */
function sanitizeFieldValue(value, field) {
  const type = field.type || 'text';
  switch (type) {
    case 'password':
    case 'text':
    case 'textarea':
      return String(value).trim();
    case 'email':
      return String(value).trim().toLowerCase();
    case 'url':
      // Remove trailing slash
      return String(value).trim().replace(/\/$/, '');
    case 'checkbox':
      return Boolean(value);
    case 'number':
      return Number(value) || 0;
    case 'select':
      // Return value as-is, validation happens separately
      return value;
    case 'checkbox-group':
      // Ensure value is an array
      return Array.isArray(value) ? value : [];
    default:
      return String(value).trim();
  }
}

/**
 * Validate a select field value against allowed options.
 *
 * @param {*}             value   Value to validate.
 * @param {Array<Object>} options Field options array.
 * @return {boolean} True if value is in allowed options.
 */
function isValidSelectValue(value, options) {
  const allowedValues = (options || []).map(opt => opt.value);
  return allowedValues.includes(value);
}

/**
 * Filter checkbox-group values against allowed options.
 *
 * @param {Array}         values  Array of values to filter.
 * @param {Array<Object>} options Field options array.
 * @return {Array} Filtered array containing only valid values.
 */
function filterCheckboxGroupValues(values, options) {
  if (!Array.isArray(values)) {
    return [];
  }
  const allowedValues = (options || []).map(opt => opt.value);
  if (allowedValues.length === 0) {
    return values;
  }
  return values.filter(v => allowedValues.includes(v));
}

/**
 * Sanitize all fields in a configuration.
 *
 * @param {Object}        config Configuration to sanitize.
 * @param {Array<Object>} fields Array of field definitions.
 * @return {Object} Sanitized configuration.
 */
function sanitizeAllFields(config, fields) {
  const sanitized = {};
  for (const field of fields) {
    const fieldId = field.id;
    if (!(fieldId in config)) {
      continue;
    }
    const value = config[fieldId];
    const type = field.type || 'text';

    // Handle select type with option validation
    if (type === 'select') {
      if (isValidSelectValue(value, field.options)) {
        sanitized[fieldId] = value;
      }
      continue;
    }

    // Handle checkbox-group with option filtering
    if (type === 'checkbox-group') {
      sanitized[fieldId] = filterCheckboxGroupValues(value, field.options);
      continue;
    }

    // Standard sanitization
    sanitized[fieldId] = sanitizeFieldValue(value, field);
  }
  return sanitized;
}
;// ../aether-site-exporter/assets/src/providers/base/AbstractProvider.js
/**
 * Abstract Provider Base Class
 *
 * Provides common functionality for all providers.
 * JavaScript equivalent of includes/Providers/AbstractProvider.php
 *
 * @package
 */







/**
 * Abstract base class for providers.
 *
 * Provides default implementations and helper methods.
 */
class AbstractProvider {
  /**
   * Provider configuration.
   *
   * @type {Object}
   */
  config = {};

  /**
   * Registered provider ID (overrides getId() if set).
   *
   * @type {string|null}
   */
  registeredId = null;

  /**
   * Config storage instance.
   *
   * @type {Object|null}
   */
  configStorage = null;

  /**
   * Constructor.
   *
   * @param {Object}      config       Provider configuration.
   * @param {string|null} registeredId Optional registered provider ID.
   */
  constructor(config = {}, registeredId = null) {
    this.config = config;
    this.registeredId = registeredId;
    this.initialize();
  }

  /**
   * Initialize the provider.
   *
   * Called during construction. Subclasses can override to perform setup.
   */
  initialize() {
    // Default: no initialization needed.
    // Subclasses can override to set up services, etc.
  }

  /**
   * Get the unique provider identifier.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider ID
   */
  getId() {
    throw new Error('AbstractProvider.getId() must be implemented by subclass');
  }

  /**
   * Get the human-readable provider name.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider name
   */
  getName() {
    throw new Error('AbstractProvider.getName() must be implemented by subclass');
  }

  /**
   * Get the provider type.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider type
   */
  getType() {
    throw new Error('AbstractProvider.getType() must be implemented by subclass');
  }

  /**
   * Get the provider description.
   *
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {string} Provider description
   */
  getDescription() {
    throw new Error('AbstractProvider.getDescription() must be implemented by subclass');
  }

  /**
   * Get the provider icon.
   *
   * Can be a dashicons class, emoji, SVG path, or URL.
   *
   * @abstract
   * @return {string} Provider icon
   */
  getIcon() {
    return '📦'; // Default generic icon
  }

  /**
   * Get the deployment types this provider supports.
   *
   * Must be overridden by subclasses to declare what deployment types
   * they can handle (e.g., static sites, blueprint bundles, edge functions).
   *
   * @abstract
   * @return {Array<string>} Array of DEPLOYMENT_TYPES constants
   */
  getSupportedDeploymentTypes() {
    return []; // Default: support nothing (must override)
  }

  /**
   * Get supported deployment types with filter applied.
   *
   * Allows external modification of supported deployment types via hooks.
   *
   * @return {Array<string>} Filtered array of deployment types
   */
  getDeploymentTypesWithFilter() {
    const supported = this.getSupportedDeploymentTypes();

    /**
     * Filter supported deployment types for a provider.
     *
     * Allows modification of what deployment types a provider supports.
     *
     * @param {Array<string>} supported  Array of deployment type constants.
     * @param {string}        providerId Provider ID.
     * @param {Object}        provider   Provider instance.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.supported_deployment_types', 'my-plugin',
     *     (supported, providerId, provider) => {
     *         if (providerId === 'my-provider') {
     *             supported.push('custom_type');
     *         }
     *         return supported;
     *     }
     * );
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.supported_deployment_types', supported, this.getId(), this);
  }

  /**
   * Check if provider supports a specific deployment type.
   *
   * @param {string} type Deployment type constant to check.
   * @return {boolean} True if supported, false otherwise
   */
  supportsDeploymentType(type) {
    return this.getDeploymentTypesWithFilter().includes(type);
  }

  /**
   * Get enabled deployment types from provider configuration.
   *
   * Returns the deployment types the user has chosen to use this provider for.
   * If not set in config, defaults to all supported deployment types.
   *
   * @return {Array<string>} Array of enabled deployment types
   */
  getEnabledDeploymentTypes() {
    const config = this.config || {};
    // If deployment_types is set in config, use it
    if (config.deployment_types && Array.isArray(config.deployment_types) && config.deployment_types.length > 0) {
      return config.deployment_types;
    }
    // Otherwise, default to all supported deployment types
    return this.getSupportedDeploymentTypes();
  }

  /**
   * Check if a deployment type is enabled in provider settings.
   *
   * @param {string} type Deployment type constant to check.
   * @return {boolean} True if enabled, false otherwise
   */
  isDeploymentTypeEnabled(type) {
    return this.getEnabledDeploymentTypes().includes(type);
  }

  /**
   * Get the provider configuration.
   *
   * Returns the current configuration array for this provider.
   *
   * @return {Promise<Object>} Configuration object
   */
  async getConfig() {
    if (Object.keys(this.config).length === 0) {
      this.config = await this.loadConfig();
    }

    /**
     * Filter provider configuration after loading.
     *
     * Allows modification of configuration before returning to caller.
     *
     * @param {Object} config     Provider configuration.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.get', 'my-plugin', (config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         config.customField = 'modified value';
     *     }
     *     return config;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config.get', this.config, this.getId());
  }

  /**
   * Save the provider configuration.
   *
   * @param {Object} config Configuration object to save.
   * @return {Promise<boolean>} True if saved successfully
   */
  async saveConfig(config) {
    /**
     * Filter provider configuration before validation.
     *
     * Allows modification of config before validation and saving.
     *
     * @param {Object} config     Configuration to save.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.before_save', 'my-plugin', (config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         config.auto_generated_field = Date.now();
     *     }
     *     return config;
     * });
     */
    config = (0,external_wp_hooks_.applyFilters)('aether.provider.config.before_save', config, this.getId());

    // Validate configuration
    const errors = await this.validateConfig(config);
    if (Object.keys(errors).length > 0) {
      throw new Error((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: JSON string of validation errors */
      (0,external_wp_i18n_namespaceObject.__)('Configuration validation failed: %s', 'aether-site-exporter'), JSON.stringify(errors)));
    }

    // Sanitize configuration
    const sanitized = await this.sanitizeConfig(config);

    // Save via config storage
    const storage = await this.getConfigStorage();
    const result = await storage.save(sanitized);
    if (result) {
      this.config = sanitized;

      /**
       * Action fired after provider configuration is saved successfully.
       *
       * @param {Object} config     Saved configuration.
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.provider.config.saved', 'my-plugin', (config, providerId) => {
       *     console.log(`Provider ${providerId} configuration saved`);
       * });
       */
      (0,external_wp_hooks_.doAction)('aether.provider.config.saved', sanitized, this.getId());
    }
    return result;
  }

  /**
   * Delete the provider configuration.
   *
   * @return {Promise<boolean>} True if deleted successfully
   */
  async deleteConfig() {
    /**
     * Action fired before provider configuration is deleted.
     *
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.provider.config.before_delete', 'my-plugin', (providerId) => {
     *     console.log(`Deleting configuration for ${providerId}`);
     * });
     */
    (0,external_wp_hooks_.doAction)('aether.provider.config.before_delete', this.getId());
    const storage = await this.getConfigStorage();
    const result = await storage.delete();
    if (result) {
      this.config = {};

      /**
       * Action fired after provider configuration is deleted.
       *
       * @param {string} providerId Provider ID.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.provider.config.deleted', 'my-plugin', (providerId) => {
       *     console.log(`Configuration deleted for ${providerId}`);
       * });
       */
      (0,external_wp_hooks_.doAction)('aether.provider.config.deleted', this.getId());
    }
    return result;
  }

  /**
   * Check if the provider is properly configured.
   *
   * @return {Promise<boolean>} True if configured
   */
  async isConfigured() {
    const config = await this.getConfig();
    if (Object.keys(config).length === 0) {
      return false;
    }
    return hasRequiredFields(config, this.getConfigFields());
  }

  /**
   * Validate the provider configuration.
   *
   * @param {Object} config Configuration object to validate.
   * @return {Promise<Object>} Validation errors object (empty if valid)
   */
  async validateConfig(config) {
    const errors = await validateAllFields(config, this.getConfigFields());

    /**
     * Filter validation errors before returning.
     *
     * Allows adding or removing validation errors.
     *
     * @param {Object} errors     Validation errors object.
     * @param {Object} config     Configuration being validated.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.validate', 'my-plugin', (errors, config, providerId) => {
     *     if (providerId === 'my-provider' && config.field1 === config.field2) {
     *         errors.field2 = 'Field 2 must be different from Field 1';
     *     }
     *     return errors;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config.validate', errors, config, this.getId());
  }

  /**
   * Sanitize the provider configuration.
   *
   * @param {Object} config Configuration object to sanitize.
   * @return {Promise<Object>} Sanitized configuration
   */
  async sanitizeConfig(config) {
    const sanitized = sanitizeAllFields(config, this.getConfigFields());

    /**
     * Filter sanitized configuration before returning.
     *
     * Allows custom sanitization logic for specific fields.
     *
     * @param {Object} sanitized  Sanitized configuration.
     * @param {Object} config     Original configuration.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config.sanitize', 'my-plugin', (sanitized, config, providerId) => {
     *     if (providerId === 'my-provider' && sanitized.url) {
     *         // Ensure URL always ends with slash
     *         sanitized.url = sanitized.url.replace(/\/?$/, '/');
     *     }
     *     return sanitized;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config.sanitize', sanitized, config, this.getId());
  }

  /**
   * Get configuration fields for this provider.
   *
   * Automatically includes deployment types field, then adds provider-specific fields.
   * Subclasses should override getProviderSpecificConfigFields() instead of this method.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getConfigFields() {
    const fields = [];

    // Add deployment types field automatically
    const deploymentTypesField = buildDeploymentTypesField(this);
    if (deploymentTypesField) {
      fields.push(deploymentTypesField);
    }

    // Add provider-specific fields
    const providerFields = this.getProviderSpecificConfigFields?.() || [];
    fields.push(...providerFields);

    /**
     * Filter provider configuration fields.
     *
     * Allows modification of the fields array for a provider.
     *
     * @param {Array<Object>} fields     Array of field definitions.
     * @param {string}        providerId Provider ID.
     * @param {Object}        provider   Provider instance.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.config_fields', 'my-plugin',
     *     (fields, providerId, provider) => {
     *         if (providerId === 'my-provider') {
     *             fields.push({
     *                 id: 'custom_field',
     *                 type: 'text',
     *                 label: 'Custom Field'
     *             });
     *         }
     *         return fields;
     *     }
     * );
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.config_fields', fields, this.getId(), this);
  }

  /**
   * Get provider-specific configuration fields.
   *
   * Override this method in subclasses to define fields specific to your provider.
   * Do not override getConfigFields() directly.
   *
   * @abstract
   * @return {Array<Object>} Array of field definitions
   */
  getProviderSpecificConfigFields() {
    return [];
  }

  /**
   * Deploy edge worker/function.
   *
   * Default implementation for non-edge providers.
   * Edge-capable providers should override this.
   *
   * @return {Promise<Object>} Deployment result
   */
  async deploy() {
    return {
      success: true,
      message: 'No deployment needed for this provider.'
    };
  }

  /**
   * Get provider status.
   *
   * @return {Promise<Object>} Status object
   */
  async getStatus() {
    const configured = await this.isConfigured();
    return {
      configured,
      healthy: configured // Default: healthy if configured
    };
  }

  /**
   * Get settings URL for this provider.
   *
   * @return {string} Settings URL
   */
  getSettingsUrl() {
    return `admin.php?page=aether#/settings/provider/${this.getId()}`;
  }

  /**
   * Get documentation URL for this provider.
   *
   * @return {string} Documentation URL
   */
  getDocumentationUrl() {
    return `https://docs.aether.dev/providers/${this.getId()}`;
  }

  /**
   * Get provider metadata.
   *
   * Returns all provider information for UI rendering.
   *
   * @return {Object} Metadata object
   */
  getMetadata() {
    const metadata = {
      id: this.getId(),
      name: this.getName(),
      type: this.getType(),
      description: this.getDescription(),
      icon: this.getIcon(),
      supportedDeploymentTypes: this.getDeploymentTypesWithFilter(),
      configFields: this.getConfigFields(),
      settingsUrl: this.getSettingsUrl(),
      documentationUrl: this.getDocumentationUrl()
    };

    /**
     * Filter provider metadata before returning.
     *
     * Allows modification of provider metadata for UI rendering.
     *
     * @param {Object} metadata   Provider metadata.
     * @param {string} providerId Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.metadata', 'my-plugin', (metadata, providerId) => {
     *     if (providerId === 'my-provider') {
     *         metadata.customField = 'custom value';
     *     }
     *     return metadata;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.metadata', metadata, this.getId());
  }

  /**
   * Get deployment URL for this provider.
   *
   * Default implementation checks common field names.
   *
   * @return {Promise<string>} Deployment URL or empty string
   */
  async getDeploymentUrl() {
    const config = await this.getConfig();
    let deploymentUrl = '';

    // Check pages_url first (for providers with hosted pages)
    if (config.pages_url) {
      deploymentUrl = config.pages_url;
    }
    // Check worker_endpoint (R2, Spaces)
    else if (config.worker_endpoint) {
      deploymentUrl = config.worker_endpoint;
    }
    // Fallback to public_url (R2 custom domain)
    else if (config.public_url) {
      deploymentUrl = config.public_url;
    }

    /**
     * Filter deployment URL for a provider.
     *
     * Allows customization of the deployment URL.
     *
     * @param {string} deploymentUrl Deployment URL.
     * @param {Object} config        Provider configuration.
     * @param {string} providerId    Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.provider.deployment_url', 'my-plugin', (url, config, providerId) => {
     *     if (providerId === 'my-provider') {
     *         return config.custom_url || url;
     *     }
     *     return url;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.provider.deployment_url', deploymentUrl, config, this.getId());
  }

  /**
   * Get the upload strategy for this provider.
   *
   * Determines how files should be uploaded to this provider.
   * Providers should override this method to specify their upload strategy.
   *
   * @return {string} Upload strategy: 'storage', 'direct', or 'api'
   *
   * Strategies:
   * - 'storage': Uses object storage upload (R2, S3, Spaces)
   * - 'direct': Direct file operation (local filesystem)
   * - 'api': Uses provider-specific API for uploads
   */
  getUploadStrategy() {
    // Default: assume storage-based upload
    // Providers should override this method
    return 'storage';
  }

  /**
   * Upload a file to the provider.
   *
   * Abstract method that providers must implement to upload files.
   * For local providers, this might be a file copy operation.
   * For remote providers, this would be an actual upload to the remote host.
   *
   * @abstract
   * @param {string} sourcePath      Local file path to upload.
   * @param {string} destinationPath Destination path/key where file should be stored.
   * @param {Object} options         Optional upload options.
   * @return {Promise<Object>} Upload result with success status and URL.
   */
  async uploadFile(sourcePath, destinationPath, options = {}) {
    // Options parameter kept for API consistency, but not used in abstract implementation
    // eslint-disable-next-line no-unused-vars
    const _unused = options;
    throw new Error('AbstractProvider.uploadFile() must be implemented by subclass');
  }

  /**
   * Load configuration from storage.
   *
   * @protected
   * @return {Promise<Object>} Configuration object
   */
  async loadConfig() {
    const storage = await this.getConfigStorage();
    return storage.load();
  }

  /**
   * Get config storage instance.
   *
   * Lazy-loads the ConfigStorage class.
   *
   * @protected
   * @return {Promise<Object>} Config storage instance
   */
  async getConfigStorage() {
    if (!this.configStorage) {
      // Lazy load to avoid circular dependencies
      const {
        ConfigStorage
      } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 231));
      this.configStorage = new ConfigStorage(this.getId());
    }
    return this.configStorage;
  }

  /**
   * Get a configuration value.
   *
   * @protected
   * @param {string} key          Configuration key.
   * @param {*}      defaultValue Default value if key doesn't exist.
   * @return {Promise<*>} Configuration value
   */
  async getConfigValue(key, defaultValue = null) {
    const config = await this.getConfig();
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  /**
   * Check if a configuration value is set and not empty.
   *
   * @protected
   * @param {string} key Configuration key.
   * @return {Promise<boolean>} True if set and not empty
   */
  async hasConfigValue(key) {
    const config = await this.getConfig();
    return Boolean(config[key]);
  }

  /**
   * Get specific config fields by IDs.
   *
   * Helper method to filter config fields by their IDs.
   * Preserves order of fieldIds array.
   *
   * @protected
   * @param {Array<string>} fieldIds Array of field IDs to retrieve.
   * @return {Array<Object>} Filtered field definitions
   */
  getFieldsById(fieldIds) {
    const allFields = this.getConfigFields();
    const indexedFields = {};

    // Index fields by ID for quick lookup
    allFields.forEach(field => {
      const fieldKey = field.id || field.name || '';
      if (fieldKey) {
        indexedFields[fieldKey] = field;
      }
    });

    // Build result in the order specified by fieldIds
    return fieldIds.filter(id => indexedFields[id]).map(id => indexedFields[id]);
  }

  /**
   * Render custom settings UI.
   *
   * Optional method that providers can override to render custom settings UI.
   * If not overridden, the default ProviderSettings component will be used.
   *
   * @param {HTMLElement} container Container element to render into.
   * @param {Function}    onSave    Callback to call after successful save.
   * @return {void|null} Returns null to indicate no custom rendering (default behavior).
   */
  // eslint-disable-next-line no-unused-vars
  renderSettings(container, onSave) {
    // Default: return null to indicate no custom rendering
    // ProviderSettings component will be used instead
    return null;
  }

  /**
   * Check if provider has custom settings rendering.
   *
   * @return {boolean} True if provider implements custom renderSettings
   */
  hasCustomSettings() {
    // Check if renderSettings was overridden by subclass
    return this.renderSettings !== AbstractProvider.prototype.renderSettings;
  }
}
/* harmony default export */ const base_AbstractProvider = ((/* unused pure expression or super */ null && (AbstractProvider)));
;// ./assets/src/providers/aws/AbstractAWSProvider.js
/**
 * Abstract AWS Provider Base Class
 *
 * Base class for all AWS S3-compatible storage providers (Cloudflare R2, AWS S3, DigitalOcean Spaces, etc.).
 * Provides common S3-compatible storage operations and functionality.
 *
 * @package
 */



// Import from base plugin



/**
 * AbstractAWSProvider class
 *
 * Abstract base class for AWS S3-compatible storage providers.
 * Subclasses must implement provider-specific methods.
 */
class AbstractAWSProvider extends AbstractProvider {
  /**
   * Get supported deployment types.
   *
   * AWS S3-compatible providers support blueprint bundles and static sites.
   *
   * @return {Array<string>} Supported deployment types
   */
  getSupportedDeploymentTypes() {
    return [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE, DEPLOYMENT_TYPES.STATIC_SITE];
  }

  /**
   * Storage service instance.
   *
   * @type {StorageService|null}
   */
  storageService = null;

  /**
   * Get the provider type.
   *
   * @return {string} Provider type
   */
  getType() {
    return 'cloud-storage';
  }

  /**
   * Get provider-specific configuration fields.
   *
   * Settings are now handled by PHP via BaseProvider.getSettings().
   * This method returns an empty array since JavaScript no longer defines fields.
   *
   * @return {Array<Object>} Empty array (settings handled by PHP)
   */
  getProviderSpecificConfigFields() {
    // Settings are handled by PHP, not JavaScript
    return [];
  }

  /**
   * Get storage service instance (lazy-loaded).
   *
   * Uses provider-specific endpoint and configuration.
   *
   * @protected
   * @return {Promise<StorageService|null>} Storage service instance
   */
  async getStorageService() {
    if (this.storageService) {
      return this.storageService;
    }
    const endpoint = await this.getStorageEndpoint();
    const config = await this.getStorageServiceConfig();
    if (!endpoint || !config.bucket_name) {
      return null;
    }
    this.storageService = new StorageService(endpoint, config.bucket_name, config);
    return this.storageService;
  }

  /**
   * Get the storage endpoint URL.
   *
   * Must be implemented by subclasses to return provider-specific endpoint.
   * Can be Worker endpoint (for browser-based access) or direct API endpoint.
   *
   * @abstract
   * @return {Promise<string>} Storage endpoint URL
   */
  async getStorageEndpoint() {
    throw new Error('AbstractAWSProvider.getStorageEndpoint() must be implemented by subclass');
  }

  /**
   * Get storage service configuration.
   *
   * Must be implemented by subclasses to return provider-specific config.
   *
   * @abstract
   * @return {Promise<Object>} Storage service configuration object
   */
  async getStorageServiceConfig() {
    throw new Error('AbstractAWSProvider.getStorageServiceConfig() must be implemented by subclass');
  }

  /**
   * Test connection to storage provider.
   *
   * Must be implemented by subclasses to test provider-specific connection.
   *
   * @abstract
   * @return {Promise<Object>} Connection test result
   */
  async testConnection() {
    throw new Error('AbstractAWSProvider.testConnection() must be implemented by subclass');
  }

  /**
   * Get public URL for an object.
   *
   * Must be implemented by subclasses to construct provider-specific public URL.
   *
   * @abstract
   * @param {string} key Object key/path.
   * @return {string} Public URL
   */
  getPublicUrl(key) {
    // Abstract method - key parameter required for interface consistency
    // eslint-disable-next-line no-unused-vars
    void key;
    throw new Error('AbstractAWSProvider.getPublicUrl() must be implemented by subclass');
  }
}
/* harmony default export */ const aws_AbstractAWSProvider = ((/* unused pure expression or super */ null && (AbstractAWSProvider)));
// EXTERNAL MODULE: external ["wp","apiFetch"]
var external_wp_apiFetch_ = __webpack_require__(455);
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_);
;// ./assets/src/utils/getRestUrl.js
/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from the meta tag or returns a default.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
 * @package
 */

/**
 * Get REST API URL from meta tag or default.
 *
 * @return {string} REST API base URL.
 */
function getRestUrl() {
  const metaTag = document.querySelector('meta[name="aether-rest-url"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '/wp-json/aether/site-exporter/';
  }
  return '/wp-json/aether/site-exporter/';
}
;// ./assets/src/utils/api.js
/**
 * API Fetch Utility
 *
 * Enhanced wrapper around @wordpress/api-fetch with:
 * - Request deduplication (prevents concurrent identical requests)
 * - Response caching with TTL (GET requests only)
 * - Nonce handling from meta tags
 * - Auth header utilities for external APIs
 *
 * @package
 */




/**
 * Create authorization headers for external API calls.
 *
 * Utility for building consistent Authorization headers.
 *
 * @param {string} token API token or key.
 * @param {string} type  Auth type (default: 'Bearer').
 * @return {Object} Headers object with Authorization and Content-Type.
 */
function createAuthHeaders(token, type = 'Bearer') {
  return {
    Authorization: `${type} ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get REST API nonce from meta tag or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  const metaTag = document.querySelector('meta[name="aether-rest-nonce"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }
  return '';
}

/**
 * Request deduplication middleware
 *
 * Prevents concurrent identical requests by returning the same Promise
 * for duplicate in-flight requests.
 *
 * Uses request key (method + path + data) to identify duplicates.
 */
const pendingRequests = new Map();
function createRequestKey(options) {
  const method = options.method || 'GET';
  const path = options.path || '';
  const data = options.data ? JSON.stringify(options.data) : '';
  return `${method}:${path}:${data}`;
}
const requestDeduplicationMiddleware = (options, next) => {
  const requestKey = createRequestKey(options);

  // Check if this request is already in flight
  if (pendingRequests.has(requestKey)) {
    // Return the existing Promise
    return pendingRequests.get(requestKey);
  }

  // Make the request
  const promise = next(options);

  // Store the Promise
  pendingRequests.set(requestKey, promise);

  // Clean up when request completes (success or error)
  // Use finally() to guarantee cleanup regardless of outcome
  promise.finally(() => {
    pendingRequests.delete(requestKey);
  });
  return promise;
};

/**
 * Response caching middleware
 *
 * Caches GET request responses with TTL to reduce redundant API calls.
 *
 * Cache format: Map<requestKey, {response, timestamp}>
 * TTL: Configurable per endpoint (default: 5 minutes)
 */
const responseCache = new Map();

// Cache configuration with endpoint-specific TTLs
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000,
  // 5 minutes default
  endpointTTLs: {
    '/assets': 10 * 60 * 1000,
    // 10 minutes - asset lists change infrequently
    '/settings': 1 * 60 * 1000,
    // 1 minute - settings may change
    '/config': 30 * 60 * 1000,
    // 30 minutes - static configuration
    '/check-wporg': 60 * 60 * 1000 // 60 minutes - WordPress.org data rarely changes
  },
  // Set to true to bypass cache (useful for development/testing)
  bypassCache: false
};

/**
 * Get cache TTL for a specific request path.
 *
 * @param {string} path Request path to check.
 * @return {number} TTL in milliseconds.
 */
function getCacheTTL(path) {
  if (CACHE_CONFIG.bypassCache) {
    return 0;
  }

  // Check if path matches any endpoint-specific TTL
  for (const [endpoint, ttl] of Object.entries(CACHE_CONFIG.endpointTTLs)) {
    if (path && path.includes(endpoint)) {
      return ttl;
    }
  }
  return CACHE_CONFIG.defaultTTL;
}
function isCacheValid(cacheEntry, path) {
  if (!cacheEntry) {
    return false;
  }
  const ttl = getCacheTTL(path);
  if (ttl === 0) {
    // Cache bypass enabled
    return false;
  }
  const age = Date.now() - cacheEntry.timestamp;
  return age < ttl;
}
const responseCachingMiddleware = (options, next) => {
  const method = options.method || 'GET';

  // Only cache GET requests
  if (method !== 'GET') {
    return next(options);
  }
  const requestKey = createRequestKey(options);
  const cached = responseCache.get(requestKey);

  // Return cached response if valid (pass path for TTL calculation)
  if (isCacheValid(cached, options.path)) {
    return Promise.resolve(cached.response);
  }

  // Make the request
  const promise = next(options);

  // Cache successful responses
  promise.then(response => {
    responseCache.set(requestKey, {
      response,
      timestamp: Date.now()
    });
    return response;
  }).catch(error => {
    // Don't cache errors
    throw error;
  });
  return promise;
};

/**
 * Invalidate cache for a specific path or all cached responses
 *
 * @param {string|null} path Optional path to invalidate (invalidates all if not provided)
 */
function invalidateCache(path = null) {
  if (path) {
    // Invalidate all cache entries matching this path
    for (const [key] of responseCache.entries()) {
      if (key.includes(path)) {
        responseCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    responseCache.clear();
  }
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
function setAPINonce(nonce) {
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL, nonce, and middleware.
 * Automatically fetches from meta tags if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from meta if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from meta if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || getRestUrl();
  const token = nonce || getNonce();
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }

  // Add custom middleware (order matters: caching before deduplication)
  external_wp_apiFetch_default().use(responseCachingMiddleware);
  external_wp_apiFetch_default().use(requestDeduplicationMiddleware);
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const api = ((external_wp_apiFetch_default()));
;// ./node_modules/is-network-error/index.js
const objectToString = Object.prototype.toString;

const isError = value => objectToString.call(value) === '[object Error]';

const errorMessages = new Set([
	'network error', // Chrome
	'Failed to fetch', // Chrome
	'NetworkError when attempting to fetch resource.', // Firefox
	'The Internet connection appears to be offline.', // Safari 16
	'Network request failed', // `cross-fetch`
	'fetch failed', // Undici (Node.js)
	'terminated', // Undici (Node.js)
	' A network error occurred.', // Bun (WebKit)
	'Network connection lost', // Cloudflare Workers (fetch)
]);

function isNetworkError(error) {
	const isValid = error
		&& isError(error)
		&& error.name === 'TypeError'
		&& typeof error.message === 'string';

	if (!isValid) {
		return false;
	}

	const {message, stack} = error;

	// Safari 17+ has generic message but no stack for network errors
	if (message === 'Load failed') {
		return stack === undefined
			// Sentry adds its own stack trace to the fetch error, so also check for that
			|| '__sentry_captured__' in error;
	}

	// Deno network errors start with specific text
	if (message.startsWith('error sending request for url')) {
		return true;
	}

	// Standard network error messages
	return errorMessages.has(message);
}

;// ./node_modules/p-retry/index.js


function validateRetries(retries) {
	if (typeof retries === 'number') {
		if (retries < 0) {
			throw new TypeError('Expected `retries` to be a non-negative number.');
		}

		if (Number.isNaN(retries)) {
			throw new TypeError('Expected `retries` to be a valid number or Infinity, got NaN.');
		}
	} else if (retries !== undefined) {
		throw new TypeError('Expected `retries` to be a number or Infinity.');
	}
}

function validateNumberOption(name, value, {min = 0, allowInfinity = false} = {}) {
	if (value === undefined) {
		return;
	}

	if (typeof value !== 'number' || Number.isNaN(value)) {
		throw new TypeError(`Expected \`${name}\` to be a number${allowInfinity ? ' or Infinity' : ''}.`);
	}

	if (!allowInfinity && !Number.isFinite(value)) {
		throw new TypeError(`Expected \`${name}\` to be a finite number.`);
	}

	if (value < min) {
		throw new TypeError(`Expected \`${name}\` to be \u2265 ${min}.`);
	}
}

class AbortError extends Error {
	constructor(message) {
		super();

		if (message instanceof Error) {
			this.originalError = message;
			({message} = message);
		} else {
			this.originalError = new Error(message);
			this.originalError.stack = this.stack;
		}

		this.name = 'AbortError';
		this.message = message;
	}
}

function calculateDelay(retriesConsumed, options) {
	const attempt = Math.max(1, retriesConsumed + 1);
	const random = options.randomize ? (Math.random() + 1) : 1;

	let timeout = Math.round(random * options.minTimeout * (options.factor ** (attempt - 1)));
	timeout = Math.min(timeout, options.maxTimeout);

	return timeout;
}

function calculateRemainingTime(start, max) {
	if (!Number.isFinite(max)) {
		return max;
	}

	return max - (performance.now() - start);
}

async function onAttemptFailure({error, attemptNumber, retriesConsumed, startTime, options}) {
	const normalizedError = error instanceof Error
		? error
		: new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`);

	if (normalizedError instanceof AbortError) {
		throw normalizedError.originalError;
	}

	const retriesLeft = Number.isFinite(options.retries)
		? Math.max(0, options.retries - retriesConsumed)
		: options.retries;

	const maxRetryTime = options.maxRetryTime ?? Number.POSITIVE_INFINITY;

	const context = Object.freeze({
		error: normalizedError,
		attemptNumber,
		retriesLeft,
		retriesConsumed,
	});

	await options.onFailedAttempt(context);

	if (calculateRemainingTime(startTime, maxRetryTime) <= 0) {
		throw normalizedError;
	}

	const consumeRetry = await options.shouldConsumeRetry(context);

	const remainingTime = calculateRemainingTime(startTime, maxRetryTime);

	if (remainingTime <= 0 || retriesLeft <= 0) {
		throw normalizedError;
	}

	if (normalizedError instanceof TypeError && !isNetworkError(normalizedError)) {
		if (consumeRetry) {
			throw normalizedError;
		}

		options.signal?.throwIfAborted();
		return false;
	}

	if (!await options.shouldRetry(context)) {
		throw normalizedError;
	}

	if (!consumeRetry) {
		options.signal?.throwIfAborted();
		return false;
	}

	const delayTime = calculateDelay(retriesConsumed, options);
	const finalDelay = Math.min(delayTime, remainingTime);

	if (finalDelay > 0) {
		await new Promise((resolve, reject) => {
			const onAbort = () => {
				clearTimeout(timeoutToken);
				options.signal?.removeEventListener('abort', onAbort);
				reject(options.signal.reason);
			};

			const timeoutToken = setTimeout(() => {
				options.signal?.removeEventListener('abort', onAbort);
				resolve();
			}, finalDelay);

			if (options.unref) {
				timeoutToken.unref?.();
			}

			options.signal?.addEventListener('abort', onAbort, {once: true});
		});
	}

	options.signal?.throwIfAborted();

	return true;
}

async function pRetry(input, options = {}) {
	options = {...options};

	validateRetries(options.retries);

	if (Object.hasOwn(options, 'forever')) {
		throw new Error('The `forever` option is no longer supported. For many use-cases, you can set `retries: Infinity` instead.');
	}

	options.retries ??= 10;
	options.factor ??= 2;
	options.minTimeout ??= 1000;
	options.maxTimeout ??= Number.POSITIVE_INFINITY;
	options.maxRetryTime ??= Number.POSITIVE_INFINITY;
	options.randomize ??= false;
	options.onFailedAttempt ??= () => {};
	options.shouldRetry ??= () => true;
	options.shouldConsumeRetry ??= () => true;

	// Validate numeric options and normalize edge cases
	validateNumberOption('factor', options.factor, {min: 0, allowInfinity: false});
	validateNumberOption('minTimeout', options.minTimeout, {min: 0, allowInfinity: false});
	validateNumberOption('maxTimeout', options.maxTimeout, {min: 0, allowInfinity: true});
	validateNumberOption('maxRetryTime', options.maxRetryTime, {min: 0, allowInfinity: true});

	// Treat non-positive factor as 1 to avoid zero backoff or negative behavior
	if (!(options.factor > 0)) {
		options.factor = 1;
	}

	options.signal?.throwIfAborted();

	let attemptNumber = 0;
	let retriesConsumed = 0;
	const startTime = performance.now();

	while (Number.isFinite(options.retries) ? retriesConsumed <= options.retries : true) {
		attemptNumber++;

		try {
			options.signal?.throwIfAborted();

			const result = await input(attemptNumber);

			options.signal?.throwIfAborted();

			return result;
		} catch (error) {
			if (await onAttemptFailure({
				error,
				attemptNumber,
				retriesConsumed,
				startTime,
				options,
			})) {
				retriesConsumed++;
			}
		}
	}

	// Should not reach here, but in case it does, throw an error
	throw new Error('Retry attempts exhausted without throwing an error.');
}

function makeRetriable(function_, options) {
	return function (...arguments_) {
		return pRetry(() => function_.apply(this, arguments_), options);
	};
}

;// ./assets/src/constants/timing.js
/**
 * Timing Constants
 *
 * Centralized timing values for polling intervals, timeouts, and delays
 *
 * @package
 */

/**
 * Polling Intervals
 *
 * Standard polling intervals for various operations.
 * All values in milliseconds.
 */

/**
 * Default polling interval for job status checks
 * @constant {number} milliseconds
 */
const POLLING_INTERVAL = 500;

/**
 * Retry Configuration
 *
 * Configuration for retry logic
 */

/**
 * Maximum number of retry attempts
 * @constant {number}
 */
const MAX_RETRIES = 3;

/**
 * Initial retry delay (exponential backoff starts from this)
 * @constant {number} milliseconds
 */
const RETRY_INITIAL_DELAY = 1000;

/**
 * Maximum retry delay (exponential backoff caps at this)
 * @constant {number} milliseconds
 */
const RETRY_MAX_DELAY = 30000;
;// ./assets/src/providers/services/edgeService.js
/**
 * Edge Service (React)
 *
 * React implementation of edge service for Cloudflare Workers.
 * Replaces R2EdgeService.php logic.
 * Handles worker deployment and management via Cloudflare API.
 *
 * Deployment strategy:
 * - R2 workers: Uses PHP endpoint (avoids browser PUT request limitations in Playground)
 * - Other worker types: Makes direct browser-based Cloudflare API calls
 *
 * @package
 */








/**
 * Edge Service class.
 */
class EdgeService {
  /**
   * Constructor.
   *
   * @param {string} accountId  Cloudflare account ID.
   * @param {string} apiToken   Cloudflare API token.
   * @param {Object} config     Optional configuration.
   * @param {string} providerId Provider ID for REST API endpoints (default: 'cloudflare').
   */
  constructor(accountId, apiToken, config = {}, providerId = 'cloudflare') {
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.config = config;
    this.providerId = providerId;
    this.cloudflareApiBase = 'https://api.cloudflare.com/client/v4';
  }

  /**
   * Make a request to Cloudflare API.
   *
   * @param {string} endpoint API endpoint (e.g., '/accounts/ID/workers/scripts').
   * @param {Object} options  Fetch options (method, headers, body, etc.).
   * @return {Promise<Object>} API response.
   */
  async cloudflareApiRequest(endpoint, options = {}) {
    const url = `${this.cloudflareApiBase}${endpoint}`;
    const authHeaders = createAuthHeaders(this.apiToken);
    const headers = {
      ...authHeaders,
      ...(options.headers || {})
    };
    try {
      // Use pRetry to wrap fetch with retry logic for network errors only.
      // We don't retry on HTTP errors because they contain useful error info.
      const response = await pRetry(async () => {
        return await fetch(url, {
          ...options,
          headers
        });
      }, {
        retries: MAX_RETRIES,
        minTimeout: RETRY_INITIAL_DELAY,
        maxTimeout: RETRY_MAX_DELAY,
        onFailedAttempt: error => {
          // Only network errors will trigger retry.
          debugWarn(`Cloudflare API request failed (${endpoint}), retrying... (attempt ${error.attemptNumber})`, error.message);
        },
        // Only retry on network errors, not HTTP errors.
        shouldRetry: error => {
          return error.name === 'TypeError' && error.message.includes('fetch');
        }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const responseText = JSON.stringify(data);
        const error = parseErrorResponse(responseText, 'Cloudflare API request failed');
        debugError(`Cloudflare API error (${endpoint}):`, error);
        return createErrorResponse(error, data.errors || []);
      }
      return createSuccessResponse({
        result: data.result
      });
    } catch (error) {
      debugError(`Cloudflare API request failed (${endpoint}):`, error);
      return createErrorResponse(error.message || 'Network request failed');
    }
  }

  /**
   * Deploy edge worker.
   *
   * Deployment method depends on worker type:
   * - R2 workers: Uses PHP endpoint (server-side PUT request, no CORS issues)
   * - Other worker types: Uses direct browser-based Cloudflare API calls
   *
   * @param {string}  workerType Worker type (e.g., 'r2').
   * @param {string}  script     Worker script content.
   * @param {Object}  bindings   Worker bindings (R2 buckets, etc.).
   * @param {boolean} dryRun     Whether to perform dry run.
   * @return {Promise<Object>} Result array with 'success' and optional 'workerName', 'workerUrl', 'error'.
   */
  async deploy(workerType, script, bindings = {}, dryRun = false) {
    if (dryRun) {
      const workerName = this.generateWorkerName(workerType);
      return createSuccessResponse({
        workerName: workerName + '-dry-run',
        workerUrl: this.getWorkerUrlFromName(workerName + '-dry-run')
      }, 'Dry run successful');
    }

    // Generate worker name.
    const workerName = this.generateWorkerName(workerType);

    // For R2 workers, use PHP endpoint (avoids browser PUT request limitations in Playground)
    if (workerType === 'r2') {
      try {
        const response = await api({
          path: '/aether/v1/providers/cloudflare-r2/deploy-worker',
          method: 'POST',
          data: {
            worker_name: workerName,
            script,
            bindings
          }
        });
        if (!response.success) {
          return createErrorResponse(response.error || 'Worker deployment failed');
        }
        return createSuccessResponse({
          workerName: response.worker_name,
          workerUrl: response.worker_url
        });
      } catch (error) {
        return createErrorResponse(error.message || 'Worker deployment failed');
      }
    }

    // For other worker types, use direct Cloudflare API call (browser-based).
    try {
      // Build multipart/form-data body for Cloudflare Workers API.
      const formData = new FormData();

      // Add worker script.
      const scriptBlob = new Blob([script], {
        type: 'application/javascript+module'
      });
      formData.append('worker.js', scriptBlob, 'worker.js');

      // Add metadata with bindings.
      const metadata = {
        main_module: 'worker.js',
        bindings: []
      };

      // Convert bindings object to Cloudflare API format.
      for (const [name, binding] of Object.entries(bindings)) {
        if (binding.type === 'r2_bucket') {
          metadata.bindings.push({
            type: 'r2_bucket',
            name,
            bucket_name: binding.bucket_name
          });
        }
      }
      formData.append('metadata', new Blob([JSON.stringify(metadata)], {
        type: 'application/json'
      }), 'metadata.json');

      // Deploy to Cloudflare API.
      const endpoint = `/accounts/${this.accountId}/workers/scripts/${workerName}`;
      const response = await this.cloudflareApiRequest(endpoint, {
        method: 'PUT',
        body: formData
      });
      if (!response.success) {
        return createErrorResponse(response.error || 'Worker deployment failed');
      }

      // Get the worker URL.
      const workerUrl = this.getWorkerUrlFromName(workerName);

      // Try to enable workers.dev subdomain.
      await this.enableWorkersDevSubdomain(workerName);
      return createSuccessResponse({
        workerName,
        workerUrl
      });
    } catch (error) {
      return createErrorResponse(error.message || 'Worker deployment failed');
    }
  }

  /**
   * Enable workers.dev subdomain for a worker.
   *
   * @param {string} workerName Worker name.
   * @return {Promise<Object>} Result object.
   */
  async enableWorkersDevSubdomain(workerName) {
    try {
      // First, get the subdomain name.
      const subdomainEndpoint = `/accounts/${this.accountId}/workers/subdomain`;
      const subdomainResponse = await this.cloudflareApiRequest(subdomainEndpoint, {
        method: 'GET'
      });
      if (!subdomainResponse.success) {
        debugWarn('Failed to get workers.dev subdomain:', subdomainResponse.error);
        return createErrorResponse(subdomainResponse.error);
      }
      const subdomain = subdomainResponse.data?.result?.subdomain;
      if (!subdomain) {
        debugWarn('No workers.dev subdomain configured');
        return createErrorResponse('No subdomain configured');
      }

      // Enable the subdomain for this worker.
      const enableEndpoint = `/accounts/${this.accountId}/workers/scripts/${workerName}/subdomain`;
      const enableResponse = await this.cloudflareApiRequest(enableEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true
        })
      });
      if (!enableResponse.success) {
        debugWarn('Failed to enable workers.dev subdomain:', enableResponse.error);
        return createErrorResponse(enableResponse.error);
      }
      return createSuccessResponse();
    } catch (error) {
      debugWarn('Error enabling workers.dev subdomain:', error);
      return createErrorResponse(error.message);
    }
  }

  /**
   * Test worker deployment status.
   *
   * @param {string} workerType Worker type.
   * @param {string} workerUrl  Worker URL (optional).
   * @return {Promise<Object>} Result array with 'success', 'deployed' and optional 'workerUrl', 'error'.
   */
  async testDeployment(workerType, workerUrl = '') {
    if (!workerUrl) {
      return createSuccessResponse({
        deployed: false
      }, 'Worker not deployed');
    }

    // Test API token permissions via direct Cloudflare API call.
    try {
      const listResponse = await this.listWorkers();
      if (!listResponse.success) {
        return createErrorResponse(listResponse.error || 'Failed to verify API token permissions');
      }
    } catch (error) {
      return createErrorResponse(error.message || 'Token permission test failed');
    }

    // Try to fetch worker info via direct Cloudflare API call.
    const workerName = this.extractWorkerNameFromUrl(workerUrl);
    if (workerName) {
      try {
        const workerInfo = await this.getWorker(workerName);
        if (workerInfo.success) {
          return createSuccessResponse({
            deployed: true,
            workerUrl
          }, 'Worker is deployed and accessible');
        }
      } catch (error) {
        // Worker might not exist yet, continue
      }
    }
    return createSuccessResponse({
      deployed: true,
      workerUrl
    }, 'Worker URL provided but verification failed');
  }

  /**
   * List all deployed workers.
   *
   * @return {Promise<Object>} Result with workers array.
   */
  async listWorkers() {
    const endpoint = `/accounts/${this.accountId}/workers/scripts`;
    const response = await this.cloudflareApiRequest(endpoint, {
      method: 'GET'
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Failed to list workers');
    }
    return createSuccessResponse({
      workers: response.data?.result || []
    });
  }

  /**
   * Get information about a specific worker.
   *
   * @param {string} workerName Worker name.
   * @return {Promise<Object>} Result with worker info.
   */
  async getWorker(workerName) {
    const endpoint = `/accounts/${this.accountId}/workers/scripts/${workerName}`;
    const response = await this.cloudflareApiRequest(endpoint, {
      method: 'GET'
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Failed to get worker info');
    }
    return createSuccessResponse({
      worker: response.data?.result
    });
  }

  /**
   * Get zone ID for a hostname (for custom domain attachment).
   *
   * @param {string} hostname Hostname to lookup.
   * @return {Promise<Object>} Result with zone ID.
   */
  async getZoneIdForHostname(hostname) {
    // List zones and find matching one.
    const endpoint = `/zones?name=${encodeURIComponent(hostname)}`;
    const response = await this.cloudflareApiRequest(endpoint, {
      method: 'GET'
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Failed to get zone ID');
    }
    const zones = response.data?.result || [];
    if (zones.length === 0) {
      return createErrorResponse(`No zone found for hostname: ${hostname}`);
    }
    return createSuccessResponse({
      zoneId: zones[0].id,
      zoneName: zones[0].name
    });
  }

  /**
   * Attach worker to a custom domain.
   *
   * @param {string} workerName Worker name.
   * @param {string} hostname   The hostname to attach (e.g., "example.com").
   * @param {string} zoneId     Cloudflare zone ID.
   * @return {Promise<Object>} Result with success status.
   */
  async attachWorkerToCustomDomain(workerName, hostname, zoneId) {
    // Clean hostname (remove protocol and path).
    const cleanHostname = hostname.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const endpoint = `/accounts/${this.accountId}/workers/domains`;
    const response = await this.cloudflareApiRequest(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        environment: 'production',
        hostname: cleanHostname,
        service: workerName,
        zone_id: zoneId,
        override_existing_dns_record: true
      })
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Failed to attach worker to custom domain');
    }
    return createSuccessResponse(null, `Worker attached to ${cleanHostname}`);
  }

  /**
   * Test connection to Cloudflare Workers and R2.
   *
   * @param {string} workerEndpoint Optional worker endpoint to test.
   * @return {Promise<Object>} Result with connection status.
   */
  async testConnection(workerEndpoint = '') {
    const results = {
      success: true,
      workersApi: false,
      r2Access: false,
      errors: []
    };

    // Test Cloudflare Workers API access.
    try {
      const workersResponse = await this.listWorkers();
      if (workersResponse.success) {
        results.workersApi = true;
      } else {
        results.errors.push(`Workers API: ${workersResponse.error}`);
        results.success = false;
      }
    } catch (error) {
      results.errors.push(`Workers API: ${error.message}`);
      results.success = false;
    }

    // Test R2 access if workerEndpoint is provided.
    if (workerEndpoint) {
      try {
        // Create a test URL to check R2 worker access.
        const testSiteKey = 'connection-test-' + Date.now();
        const testUrl = `${workerEndpoint.replace(/\/+$/, '')}/${testSiteKey}/test.html`;
        const response = await fetch(testUrl, {
          method: 'GET'
        });

        // We expect 404 for non-existent file, but that proves R2 worker is accessible.
        if (response.status === 404 || response.ok) {
          results.r2Access = true;
        } else {
          results.errors.push(`R2 Worker: HTTP ${response.status}`);
          results.success = false;
        }
      } catch (error) {
        results.errors.push(`R2 Worker: ${error.message}`);
        results.success = false;
      }
    }
    return results;
  }

  /**
   * Get deployed worker endpoint URL.
   *
   * @return {string} Worker URL, empty string if not deployed.
   */
  getWorkerUrl() {
    // Get worker endpoint from config (set after deployment).
    return this.config.worker_endpoint || '';
  }

  /**
   * Check if worker is deployed.
   *
   * @param {string} workerType Worker type.
   * @return {boolean} True if deployed, false otherwise.
   */
  isDeployed(workerType) {
    const url = this.getWorkerUrl(workerType);
    return !!url;
  }

  /**
   * Get worker script content.
   * Fetches worker script from REST endpoint.
   *
   * @param {string} providerId Optional provider ID (defaults to this.providerId).
   * @param {string} workerType Worker type (e.g., 'r2', 'git', 'media').
   * @return {Promise<string>} Worker script content.
   */
  async getWorkerScript(providerId = null, workerType = '') {
    // Support both calling conventions:
    // - getWorkerScript(workerType) - uses instance providerId
    // - getWorkerScript(providerId, workerType) - uses provided providerId
    if (!workerType && providerId) {
      // First param is workerType, second is undefined
      workerType = providerId;
      providerId = null;
    }
    if (!workerType) {
      debugWarn('Worker type is required to fetch script');
      return '';
    }

    // Use provided providerId or fall back to instance providerId
    const targetProviderId = providerId || this.providerId;
    try {
      const response = await api({
        path: `/aether/v1/providers/${targetProviderId}/edge/worker-script/${workerType}`,
        method: 'GET'
      });

      // The REST endpoint returns the script as plain text (Content-Type: text/javascript)
      if (typeof response === 'string') {
        return response;
      }
      debugWarn('Failed to fetch worker script: unexpected response format');
      return '';
    } catch (error) {
      debugError('Error fetching worker script:', error);
      return '';
    }
  }

  /**
   * Get worker bindings configuration.
   *
   * @param {string} workerType Worker type.
   * @param {Object} config     Provider configuration.
   * @return {Object} Worker bindings.
   */
  getWorkerBindings(workerType, config) {
    if (workerType === 'r2') {
      const bucketName = config.bucket_name || '';
      if (!bucketName) {
        return {};
      }
      return {
        R2_BUCKET: {
          type: 'r2_bucket',
          bucket_name: bucketName // Cloudflare API expects snake_case
        }
      };
    }
    return {};
  }

  /**
   * Generate unique worker name.
   *
   * @param {string} workerType Worker type.
   * @return {string} Generated worker name.
   */
  generateWorkerName(workerType) {
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `aether-${workerType}-${randomSuffix}`;
  }

  /**
   * Get worker URL from worker name.
   *
   * @param {string} workerName Worker name.
   * @return {string} Worker URL.
   */
  getWorkerUrlFromName(workerName) {
    return `https://${workerName}.workers.dev`;
  }

  /**
   * Extract worker name from URL.
   *
   * @param {string} workerUrl Worker URL.
   * @return {string|null} Worker name or null.
   */
  extractWorkerNameFromUrl(workerUrl) {
    const match = workerUrl.match(/https?:\/\/([^.]+)\.workers\.dev/);
    return match ? match[1] : null;
  }
}
;// ./assets/src/providers/cloudflare-r2/CloudflareR2Provider.js
/**
 * Cloudflare R2 Provider
 *
 * JavaScript implementation of the Cloudflare R2 provider.
 * Provides object storage and edge worker deployment capabilities.
 *
 * @package
 */







/**
 * CloudflareR2Provider class
 *
 * Provides Cloudflare R2 object storage with zero egress fees.
 * Extends AbstractAWSProvider to inherit S3-compatible storage functionality.
 */
class CloudflareR2Provider extends AbstractAWSProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'cloudflare-r2';

  /**
   * Get supported deployment types.
   *
   * Cloudflare R2 supports static sites and blueprint bundles through S3-compatible storage.
   * Inherits from AbstractAWSProvider but can be overridden here if needed.
   *
   * @return {Array<string>} Supported deployment types
   */
  getSupportedDeploymentTypes() {
    return [DEPLOYMENT_TYPES.STATIC_SITE, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
  }

  /**
   * Whether this provider requires a worker to be deployed.
   *
   * @type {boolean}
   */
  requiresWorker = true;

  /**
   * Worker type for deployment.
   *
   * @type {string}
   */
  workerType = 'r2';

  /**
   * Edge service instance.
   *
   * @type {EdgeService|null}
   */
  edgeService = null;

  /**
   * Storage service instance.
   *
   * @type {Object|null}
   */
  storageService = null;

  /**
   * Get the unique provider identifier.
   *
   * @return {string} Provider ID
   */
  getId() {
    return this.registeredId || CloudflareR2Provider.ID;
  }

  /**
   * Get the human-readable provider name.
   *
   * @return {string} Provider name
   */
  getName() {
    return (0,external_wp_i18n_namespaceObject.__)('Cloudflare R2', 'aether');
  }

  /**
   * Get the provider type.
   *
   * @return {string} Provider type
   */
  getType() {
    return 'cloud-storage';
  }

  /**
   * Get the provider description.
   *
   * @return {string} Provider description
   */
  getDescription() {
    return (0,external_wp_i18n_namespaceObject.__)('Cloudflare R2 object storage with zero egress fees. Includes edge worker deployment for WordPress Playground compatibility.', 'aether');
  }

  /**
   * Get the provider icon.
   *
   * @return {string} Provider icon
   */
  getIcon() {
    return '☁️';
  }

  /**
   * Get provider-specific configuration fields.
   *
   * Settings are now handled by PHP via BaseProvider.getSettings().
   * This method returns an empty array since JavaScript no longer defines fields.
   *
   * @return {Array<Object>} Empty array (settings handled by PHP)
   */
  getProviderSpecificConfigFields() {
    // Settings are handled by PHP, not JavaScript
    return [];
  }

  /**
   * Get provider status.
   *
   * @return {Promise<Object>} Status object
   */
  async getStatus() {
    const status = await super.getStatus();

    // Add deployment status for edge capability
    const config = await this.getConfig();
    status.deployed = Boolean(config.worker_endpoint);
    return status;
  }

  /**
   * Get edge service instance (lazy-loaded).
   *
   * Gets Cloudflare account ID and API token from the edge provider (cloudflare),
   * not from R2 provider's own config, since those credentials are managed by the edge provider.
   *
   * @protected
   * @return {Promise<EdgeService|null>} Edge service instance
   */
  async getEdgeService() {
    if (this.edgeService) {
      return this.edgeService;
    }

    // Get R2 provider config for storage settings
    const config = await this.getConfig();

    // Get edge provider (cloudflare) credentials from settings
    const settingsResponse = await api({
      path: '/aether/site-exporter/settings'
    });
    const settings = settingsResponse.settings || {};
    const edgeProvider = settings.providers?.cloudflare || {};

    // Use account_id and api_token from edge provider, not from R2 config
    const accountId = edgeProvider.account_id || '';
    const apiToken = edgeProvider.api_token || '';
    if (!accountId || !apiToken) {
      return null;
    }
    this.edgeService = new EdgeService(accountId, apiToken, config);
    return this.edgeService;
  }

  /**
   * Get the storage endpoint URL.
   *
   * Returns the Worker endpoint for R2 (browser-based access).
   *
   * @return {Promise<string>} Storage endpoint URL
   */
  async getStorageEndpoint() {
    const config = await this.getConfig();
    return config.worker_endpoint || '';
  }

  /**
   * Get storage service configuration.
   *
   * Returns config with workerEndpoint, bucketName, and R2-specific settings.
   *
   * @return {Promise<Object>} Storage service configuration object
   */
  async getStorageServiceConfig() {
    const config = await this.getConfig();
    return {
      worker_endpoint: config.worker_endpoint || '',
      bucket_name: config.bucket_name || '',
      custom_domain: config.custom_domain || '',
      public_access: config.public_access || false,
      ...config
    };
  }

  /**
   * Test connection to R2 storage.
   *
   * Tests connection via Worker endpoint.
   *
   * @return {Promise<Object>} Connection test result
   */
  async testConnection() {
    const storage = await this.getStorageService();
    if (!storage) {
      return {
        success: false,
        error: (0,external_wp_i18n_namespaceObject.__)('Storage service not available. Please configure worker_endpoint and bucket_name.', 'aether')
      };
    }
    return await storage.testConnection();
  }

  /**
   * Upload a file to R2 storage.
   *
   * @param {string} filePath Source file path (URL or local path).
   * @param {string} fileName Destination file name/key in storage.
   * @param {Object} context  Optional upload context.
   * @return {Promise<Object>} Upload result with success status and URL.
   */
  async uploadFile(filePath, fileName, context = {}) {
    try {
      const storage = await this.getStorageService();
      if (!storage) {
        return {
          success: false,
          error: (0,external_wp_i18n_namespaceObject.__)('Storage service not available. Please configure worker_endpoint and bucket_name.', 'aether')
        };
      }

      // Fetch the file from the filePath (could be a URL or local path)
      let file;
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Fetch from URL
        const response = await fetch(filePath);
        if (!response.ok) {
          return {
            success: false,
            error: (0,external_wp_i18n_namespaceObject.__)('Failed to fetch file from URL', 'aether')
          };
        }
        const blob = await response.blob();
        file = new File([blob], fileName, {
          type: blob.type
        });
      } else {
        // For local paths, we need to fetch via REST API
        // This is a simplified implementation - may need adjustment based on actual file handling
        return {
          success: false,
          error: (0,external_wp_i18n_namespaceObject.__)('Local file upload not yet implemented for R2', 'aether')
        };
      }

      // Upload to storage
      const result = await storage.upload(fileName, file, {
        contentType: file.type,
        onProgress: context.onProgress || null
      });
      if (!result.success) {
        return result;
      }

      // Get public URL
      const publicUrl = this.getPublicUrl(fileName);
      return {
        success: true,
        url: publicUrl || result.url || '',
        path: fileName,
        message: (0,external_wp_i18n_namespaceObject.__)('File uploaded successfully', 'aether')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_namespaceObject.__)('File upload failed', 'aether')
      };
    }
  }

  /**
   * Get public URL for an object.
   *
   * Constructs R2 public URL using custom domain or default R2 domain.
   *
   * @param {string} key Object key/path.
   * @return {string} Public URL
   */
  getPublicUrl(key) {
    const config = this.config;
    if (config.custom_domain) {
      return `${config.custom_domain}/${key}`;
    }

    // Default R2 public URL format (if publicAccess is enabled)
    // Note: This is a placeholder - actual URL construction may vary
    if (config.public_url) {
      return `${config.public_url}/${key}`;
    }

    // Fallback: use worker endpoint for serving files
    if (config.worker_endpoint) {
      return `${config.worker_endpoint}/${key}`;
    }
    return '';
  }
}
/* harmony default export */ const cloudflare_r2_CloudflareR2Provider = ((/* unused pure expression or super */ null && (CloudflareR2Provider)));
;// external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/providers/cloudflare-r2/modal-hooks.js
/**
 * Cloudflare R2 Provider Modal Hooks
 *
 * Adds custom content to the Cloudflare R2 provider configuration modal.
 * Specifically adds a "Deploy Worker" button for R2 storage worker.
 *
 * @package
 */







/**
 * Deploy Worker button component for Cloudflare R2.
 *
 * @param {Object}   props            Component props.
 * @param {string}   props.providerId Provider ID.
 * @param {Object}   props.config     Current provider configuration (form values).
 * @param {Function} props.onChange   Optional function to update form field values.
 * @return {JSX.Element} Deploy Worker button.
 */

function DeployWorkerButton({
  providerId,
  config,
  onChange
}) {
  const [deploying, setDeploying] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const [success, setSuccess] = (0,external_wp_element_namespaceObject.useState)(false);
  const [workerUrl, setWorkerUrl] = (0,external_wp_element_namespaceObject.useState)(null);

  // R2 worker type
  const workerType = 'r2';
  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    setSuccess(false);
    setWorkerUrl(null);
    try {
      // Validate R2 credentials
      if (!config?.access_key_id || !config?.secret_access_key || !config?.bucket_name) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('Access Key ID, Secret Access Key, and Bucket Name are required', 'aether-site-exporter-providers'));
      }

      // Get edge provider (Cloudflare Workers) credentials from settings
      const settingsResponse = await api({
        path: '/aether/site-exporter/settings'
      });
      const settings = settingsResponse.settings || {};
      const edgeProvider = settings.providers?.cloudflare || {};
      if (!edgeProvider.account_id || !edgeProvider.api_token) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('Cloudflare Workers provider must be configured first. Please configure the Cloudflare Workers (edge) provider with Account ID and API Token.', 'aether-site-exporter-providers'));
      }

      // Note: Worker script will be loaded directly from file system by the server
      // to avoid any corruption during REST API transfer

      const restUrl = window.wpApiSettings?.root || '/wp-json';

      // Get nonce for authentication
      const nonce = document.querySelector('meta[name="aether-rest-nonce"]')?.getAttribute('content') || window.wpApiSettings?.nonce || '';

      // Prepare worker bindings for R2
      // Generate worker name (format: aether-r2-{random})
      const randomId = Math.random().toString(36).substring(2, 10);
      const workerName = `aether-r2-${randomId}`;

      // Prepare bindings - R2 bucket binding
      // Format: { bindingName: { type: 'r2_bucket', bucket_name: '...' } }
      const bindings = {};
      if (config.bucket_name) {
        bindings.R2_BUCKET = {
          type: 'r2_bucket',
          bucket_name: config.bucket_name
        };
      }

      // Deploy worker using server-side REST API endpoint (avoids CORS issues)
      const deployEndpoint = `${restUrl}/aether/site-exporter/providers/cloudflare/deploy-worker`;
      const deployResponse = await fetch(deployEndpoint, {
        method: 'POST',
        headers: {
          'X-WP-Nonce': nonce,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          worker_type: workerType,
          worker_name: workerName,
          // script: script, // Let the server load it directly from file system
          bindings,
          account_id: edgeProvider.account_id,
          api_token: edgeProvider.api_token
        })
      });
      if (!deployResponse.ok) {
        const errorData = await deployResponse.json().catch(() => ({
          message: `HTTP ${deployResponse.status}: ${deployResponse.statusText}`
        }));
        throw new Error(errorData.message || errorData.error || (0,external_wp_i18n_namespaceObject.__)('Failed to deploy worker', 'aether-site-exporter-providers'));
      }
      const result = await deployResponse.json();
      if (!result.success) {
        throw new Error(result.message || result.error || (0,external_wp_i18n_namespaceObject.__)('Failed to deploy worker', 'aether-site-exporter-providers'));
      }

      // Save worker endpoint to R2 provider config and update form field
      if (result.worker_url) {
        // Update the form field value immediately (if onChange is available)
        if (onChange && typeof onChange === 'function') {
          onChange('worker_endpoint', result.worker_url);
        }

        // Save to provider config using the provider config endpoint
        // This ensures it's properly saved and will be reflected in the form
        try {
          await api({
            path: `/aether/site-exporter/providers/${providerId}/config`,
            method: 'PUT',
            data: {
              worker_endpoint: result.worker_url
            }
          });
        } catch (saveError) {
          // Error saving worker endpoint - the value is already in the form
          // so deployment is still successful. The user can manually save if needed.
          // eslint-disable-next-line no-console
          console.error('Failed to save worker endpoint:', saveError);
        }
      }
      setSuccess(true);
      setWorkerUrl(result.worker_url || null);

      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 10000);
    } catch (err) {
      setError(err.message || (0,external_wp_i18n_namespaceObject.__)('Failed to deploy worker', 'aether-site-exporter-providers'));
    } finally {
      setDeploying(false);
    }
  };
  const containerStyle = {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #ddd'
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
      variant: "secondary",
      onClick: handleDeploy,
      isBusy: deploying,
      disabled: deploying || !config?.access_key_id || !config?.secret_access_key || !config?.bucket_name,
      children: deploying ? (0,external_wp_i18n_namespaceObject.__)('Deploying…', 'aether-site-exporter-providers') : (0,external_wp_i18n_namespaceObject.__)('Deploy Worker', 'aether-site-exporter-providers')
    }), error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
      status: "error",
      isDismissible: false,
      style: {
        marginTop: '0.5rem'
      },
      children: error
    }), success && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.Notice, {
      status: "success",
      isDismissible: false,
      style: {
        marginTop: '0.5rem'
      },
      children: [(0,external_wp_i18n_namespaceObject.__)('Worker deployed successfully!', 'aether-site-exporter-providers'), workerUrl && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        style: {
          marginTop: '0.5rem'
        },
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: (0,external_wp_i18n_namespaceObject.__)('Worker URL:', 'aether-site-exporter-providers')
        }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
          href: workerUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          children: workerUrl
        })]
      })]
    })]
  });
}

// Store React roots and container elements for cleanup
const reactRoots = new Map();
const rootContainers = new Map();

/**
 * Initialize modal hooks for Cloudflare R2 provider.
 */
function initCloudflareR2ModalHooks() {
  // Hook into the after_fields action to add Deploy Worker button
  (0,external_wp_hooks_.addAction)('aether.provider.form.after_fields', 'aether-site-exporter-providers/cloudflare-r2/deploy-button', context => {
    // Only add button for Cloudflare R2 provider
    if (context.providerId !== 'cloudflare-r2') {
      return;
    }

    // Find the container element
    const container = document.querySelector(`.aether-provider-form__after-fields[data-provider-id="${context.providerId}"]`);
    if (!container) {
      return;
    }

    // Clean up previous render if it exists
    const existingRoot = reactRoots.get(context.providerId);
    const existingContainer = rootContainers.get(context.providerId);
    if (existingRoot) {
      // Unmount previous React component
      try {
        existingRoot.unmount();
      } catch (e) {
        // If unmount fails, just remove the element
        if (existingContainer && existingContainer.parentNode) {
          existingContainer.parentNode.removeChild(existingContainer);
        }
      }
      reactRoots.delete(context.providerId);
      rootContainers.delete(context.providerId);
    }

    // Create a new root element for this render
    const rootElement = document.createElement('div');
    container.appendChild(rootElement);

    // Create React 18 root and render
    const root = (0,external_wp_element_namespaceObject.createRoot)(rootElement);
    reactRoots.set(context.providerId, root);
    rootContainers.set(context.providerId, rootElement);
    root.render(/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(DeployWorkerButton, {
      providerId: context.providerId,
      config: context.values,
      onChange: context.onChange
    }));
  });
}
;// ./assets/src/providers/cloudflare-r2/index.js
/**
 * Cloudflare R2 Provider Registration
 *
 * Registers the Cloudflare R2 provider handlers via WordPress hooks.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */





// Create provider instance for hook registration
const provider = new CloudflareR2Provider();

/**
 * Handle unified file upload for a provider instance.
 *
 * @param {Object} fileContext Unified file context from aether.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload(fileContext) {
  const {
    fileType,
    providerId,
    filePath,
    fileContent,
    contentType,
    storageKey
  } = fileContext;

  // Only handle requests for cloudflare-r2 providers
  if (!providerId || !providerId.startsWith('cloudflare-r2')) {
    return;
  }
  try {
    const storage = await provider.getStorageService();
    if (!storage) {
      throw new Error('Storage service not available. Please configure worker_endpoint and bucket_name.');
    }

    // Handle blueprint bundle upload
    if (fileType === 'blueprint-bundle') {
      if (!filePath) {
        throw new Error('Blueprint bundle file path is required');
      }
      if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
        throw new Error('Blueprint bundle must be provided as a URL for R2 uploads');
      }
      const response = await fetch(filePath, {
        method: 'GET',
        credentials: 'omit'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch blueprint bundle: HTTP ${response.status}`);
      }
      const bundleKey = storageKey || 'blueprint-bundle/bundle.zip';
      const result = await storage.upload(bundleKey, await response.blob(), {
        contentType: 'application/zip'
      });
      if (!result.success) {
        throw new Error(result.error || 'Blueprint bundle upload failed');
      }
      fileContext.result = {
        success: true,
        url: result.url
      };
      return;
    }

    // Handle static file uploads (HTML and assets)
    let fileBlob = null;
    if (fileContent) {
      if (typeof fileContent === 'string') {
        fileBlob = new Blob([fileContent], {
          type: contentType || 'text/html'
        });
      } else if (fileContent instanceof Blob) {
        fileBlob = fileContent;
      }
    } else if (filePath?.startsWith('http://') || filePath?.startsWith('https://')) {
      const response = await fetch(filePath, {
        method: 'GET',
        credentials: 'omit'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath}: HTTP ${response.status}`);
      }
      fileBlob = await response.blob();
    }
    if (!fileBlob) {
      throw new Error('File content or valid URL is required');
    }

    // Determine storage key from filePath if not provided
    let finalStorageKey = storageKey;
    if (!finalStorageKey && filePath) {
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        try {
          const urlObj = new URL(filePath);
          finalStorageKey = urlObj.pathname;
        } catch {
          finalStorageKey = filePath;
        }
      } else {
        finalStorageKey = filePath;
      }
    }

    // Normalize storage key
    finalStorageKey = finalStorageKey?.replace(/^\/+/, '') || 'index.html';

    // Add index.html for directory paths
    if (finalStorageKey.endsWith('/')) {
      finalStorageKey = finalStorageKey.replace(/\/+$/, '') + '/index.html';
    } else if (!/\.[a-zA-Z0-9]+$/.test(finalStorageKey)) {
      // No file extension - assume HTML directory
      finalStorageKey = finalStorageKey + '/index.html';
    }
    const uploadResult = await storage.upload(finalStorageKey, fileBlob, {
      contentType: contentType || 'text/html'
    });
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }
    fileContext.result = {
      success: true,
      url: uploadResult.url
    };
  } catch (error) {
    fileContext.result = {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Register unified file upload action hook.
 */
(0,external_wp_hooks_.addAction)('aether.file.upload', 'aether/cloudflare-r2', fileContext => {
  if (!fileContext._uploadPromises) {
    fileContext._uploadPromises = [];
  }
  fileContext._uploadPromises.push(handleUnifiedFileUpload(fileContext));
}, 10);

/**
 * Register test connection handler hook.
 */
(0,external_wp_hooks_.addFilter)('aether.provider.test', 'aether/cloudflare-r2', (handler, providerId, config) => {
  if (!providerId?.startsWith('cloudflare-r2')) {
    return handler;
  }
  return async testConfig => provider.testConnection(testConfig || config);
}, 10);

/**
 * Register upload strategy filter.
 */
(0,external_wp_hooks_.addFilter)('aether.provider.upload_strategy', 'aether/cloudflare-r2', (strategy, providerId) => {
  if (providerId?.startsWith('cloudflare-r2')) {
    return 'worker';
  }
  return strategy;
}, 10);

// Initialize modal hooks
initCloudflareR2ModalHooks();
/******/ })()
;