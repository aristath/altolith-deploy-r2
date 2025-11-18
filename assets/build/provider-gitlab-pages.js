/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 573:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   e: () => (/* binding */ getRestUrl)
/* harmony export */ });
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

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ }),

/***/ 634:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ZB: () => (/* binding */ createAuthHeaders),
  Ay: () => (/* binding */ api)
});

// UNUSED EXPORTS: configureAPI, invalidateCache, setAPINonce

;// external ["wp","apiFetch"]
const external_wp_apiFetch_namespaceObject = window["wp"]["apiFetch"];
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_namespaceObject);
// EXTERNAL MODULE: ./assets/src/utils/getRestUrl.js
var getRestUrl = __webpack_require__(573);
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
  const url = restUrl || (0,getRestUrl/* getRestUrl */.e)();
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

/***/ }),

/***/ 966:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ConfigStorage: () => (/* binding */ ConfigStorage)
});

// UNUSED EXPORTS: default

// EXTERNAL MODULE: ./assets/src/utils/api.js + 1 modules
var api = __webpack_require__(634);
// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// ./node_modules/idb/build/index.js
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



;// ./assets/src/utils/indexedDB.js
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
;// ./assets/src/providers/utils/configStorage.js
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
      const response = await (0,api/* default */.Ay)({
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
      await (0,api/* default */.Ay)({
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
      await (0,api/* default */.Ay)({
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
;// external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// ./assets/src/utils/styles.js
/**
 * Shared style utilities and constants
 *
 * Centralized styles for inline styling across components.
 *
 * @package
 */

const colors = {
  primary: '#2271b1',
  primaryHover: '#135e96',
  primaryDark: '#0a4168',
  text: '#1d2327',
  textMuted: '#646970',
  textSecondary: '#50575e',
  white: '#fff',
  background: '#f6f7f7',
  backgroundLighter: '#f0f0f1',
  backgroundError: '#fcf0f1',
  borderLight: '#c3c4c7',
  borderLighter: '#e0e0e0',
  error: '#d63638',
  success: '#00a32a',
  warning: '#dba617',
  info: '#2271b1'
};
const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem'
};
const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px'
};
const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem'
};
const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};
const commonStyles = {
  section: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04)',
    marginBottom: spacing.lg,
    padding: 0
  },
  sectionHeader: {
    borderBottom: `1px solid ${colors.borderLight}`,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    background: colors.background
  },
  card: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.sm,
    padding: spacing.lg
  }
};
const statusBadgeStyles = {
  base: {
    display: 'inline-block',
    paddingTop: '3px',
    paddingBottom: '3px',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  success: {
    background: '#d5f0dd',
    color: '#00833e'
  },
  error: {
    background: '#fcf0f1',
    color: '#c22c2e'
  },
  warning: {
    background: '#fcf0c7',
    color: '#826200'
  },
  info: {
    background: '#d7edff',
    color: '#135e96'
  }
};
const noticeStyles = {
  base: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
    borderLeft: '4px solid',
    background: colors.white
  },
  success: {
    borderLeftColor: colors.success,
    background: '#d5f0dd'
  },
  error: {
    borderLeftColor: colors.error,
    background: colors.backgroundError
  },
  warning: {
    borderLeftColor: colors.warning,
    background: '#fcf0c7'
  },
  info: {
    borderLeftColor: colors.info,
    background: '#d7edff'
  }
};

/**
 * Create flexbox style object
 *
 * @param {string} direction Flex direction ('row' or 'column')
 * @param {string} gap       Gap spacing
 * @return {Object} Style object
 */
const createFlexStyle = (direction = 'row', gap = spacing.md) => ({
  display: 'flex',
  flexDirection: direction,
  gap
});

/**
 * Create grid style object
 *
 * @param {string} minColumnWidth Minimum column width
 * @param {string} gap            Gap spacing
 * @return {Object} Style object
 */
const createGridStyle = (minColumnWidth = '16rem', gap = spacing.md) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`,
  gap
});

/**
 * Common utility styles
 */
const utilityStyles = {
  noMargin: {
    margin: 0
  },
  noMarginTop: {
    marginTop: 0
  },
  noMarginBottom: {
    marginBottom: 0
  }
};
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/components/SecretField.js
/**
 * Secret Field Component
 *
 * Replaces the aether-secret web component with a React component.
 *
 * @package
 */






function SecretField({
  value = '',
  onChange,
  label,
  help,
  placeholder,
  ...props
}) {
  const [isVisible, setIsVisible] = (0,external_wp_element_namespaceObject.useState)(false);
  const containerStyle = {
    position: 'relative'
  };
  const toggleStyle = {
    marginTop: spacing.sm
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-secret-field",
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      className: "aether-secret-field__input",
      label: label,
      help: help,
      value: value,
      onChange: onChange,
      type: isVisible ? 'text' : 'password',
      placeholder: placeholder,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      ...props
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
      className: "aether-secret-field__toggle",
      variant: "secondary",
      onClick: () => setIsVisible(!isVisible),
      style: toggleStyle,
      children: isVisible ? (0,external_wp_i18n_namespaceObject.__)('Hide', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Show', 'aether-site-exporter')
    })]
  });
}
// EXTERNAL MODULE: ./assets/src/utils/api.js + 1 modules
var api = __webpack_require__(634);
;// ./assets/src/hooks/useConnectionTest.js
/**
 * Connection Test Hooks
 *
 * Provides direct API calls for testing provider connections from React.
 *
 * @package
 */





/**
 * Hook for testing provider connection (generic).
 *
 * @param {string} providerId Provider ID.
 * @param {Object} config     Provider configuration.
 * @return {Object} Test methods and state.
 */
function useConnectionTest(providerId, config) {
  const [testing, setTesting] = (0,external_wp_element_namespaceObject.useState)(false);
  const [result, setResult] = (0,external_wp_element_namespaceObject.useState)(null);
  const test = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setTesting(true);
    setResult(null);
    try {
      // Use REST API endpoint to test connection
      const response = await (0,api/* default */.Ay)({
        path: `/aether/site-exporter/providers/${providerId}/test`,
        method: 'POST',
        data: {
          config
        }
      });
      if (!response.success) {
        throw new Error(response.message || response.error || (0,external_wp_i18n_namespaceObject.__)('Connection test failed', 'aether-site-exporter'));
      }
      setResult({
        success: true,
        message: response.message || (0,external_wp_i18n_namespaceObject.__)('Connection test successful', 'aether-site-exporter')
      });
    } catch (err) {
      setResult({
        success: false,
        message: err.message || (0,external_wp_i18n_namespaceObject.__)('Connection test failed', 'aether-site-exporter')
      });
    } finally {
      setTesting(false);
    }
  }, [providerId, config]);
  return {
    test,
    testing,
    result
  };
}
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
    const authHeaders = (0,api/* createAuthHeaders */.ZB)(this.apiToken);
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
        const response = await (0,api/* default */.Ay)({
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
      const response = await (0,api/* default */.Ay)({
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
;// ./assets/src/utils/credentialManager.js
/**
 * Credential Manager
 *
 * Fetches encrypted credentials from REST endpoint and manages them in memory.
 * Credentials are decrypted server-side before being sent to the client.
 *
 * @package
 */



/**
 * In-memory credential cache.
 * Key: providerId, Value: { credentials, timestamp }
 *
 * @type {Map<string, {credentials: Object, timestamp: number}>}
 */
const credentialCache = new Map();

/**
 * Cache expiration time (5 minutes).
 */
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Fetch credentials for a provider.
 *
 * @param {string} providerId Provider ID (e.g., 'local-filesystem').
 * @return {Promise<Object>} Credentials object.
 */
async function getCredentials(providerId) {
  // Check cache first.
  const cached = credentialCache.get(providerId);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    // Use <= to include the exact expiry time (off-by-one fix)
    // Cache is valid for the full CACHE_EXPIRY_MS duration
    // Expires only when age > CACHE_EXPIRY_MS
    if (age <= CACHE_EXPIRY_MS) {
      return cached.credentials;
    }
    // Cache expired, remove it.
    credentialCache.delete(providerId);
  }

  // Fetch from REST endpoint (using /config endpoint).
  const response = await (0,api/* default */.Ay)({
    path: `/aether/site-exporter/providers/${providerId}/config`,
    method: 'GET'
  });
  if (!response || !response.success) {
    throw new Error(response?.error || 'Failed to fetch credentials');
  }
  const credentials = response.config || {};

  // Cache credentials.
  credentialCache.set(providerId, {
    credentials,
    timestamp: Date.now()
  });
  return credentials;
}

/**
 * Clear cached credentials for a provider.
 *
 * @param {string} providerId Provider ID.
 */
function clearCredentials(providerId) {
  credentialCache.delete(providerId);
}

/**
 * Clear all cached credentials.
 */
function clearAllCredentials() {
  credentialCache.clear();
}
;// ./assets/src/providers/hooks/useEdgeService.js
/**
 * Edge Service Hook
 *
 * React hook for edge worker operations (deploy, test, get status).
 * Uses EdgeService class that calls Cloudflare API directly.
 *
 * @package
 */






/**
 * Hook for edge service operations.
 *
 * @param {string} providerId Provider ID (e.g., 'cloudflare-r2').
 * @return {Object} Edge service methods.
 */
function useEdgeService(providerId) {
  /**
   * Get edge service instance.
   *
   * @return {Promise<EdgeService>} Edge service instance.
   */
  const getEdgeService = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    // Fetch edge provider credentials from settings.
    const response = await (0,api/* default */.Ay)({
      path: '/aether/v1/settings',
      method: 'GET'
    });
    const settings = response?.settings || {};
    const providerTypes = settings.provider_types || {};
    const edgeProviderId = providerTypes.edge || 'cloudflare';

    // Get edge provider config from providers array
    const edgeProvider = settings.providers?.[edgeProviderId] || {};
    const accountId = edgeProvider.account_id || '';
    const apiToken = edgeProvider.api_token || '';
    if (!accountId || !apiToken) {
      throw new Error('Edge provider credentials are required for worker deployment');
    }

    // Get storage provider config for worker bindings.
    const storageCredentials = await getCredentials(providerId);
    return new EdgeService(accountId, apiToken, {
      ...storageCredentials,
      worker_endpoint: storageCredentials.worker_endpoint || ''
    }, edgeProviderId);
  }, [providerId]);

  /**
   * Deploy edge worker.
   *
   * @param {string}  workerType Worker type (e.g., 'r2').
   * @param {string}  script     Worker script content.
   * @param {Object}  bindings   Worker bindings (R2 buckets, etc.).
   * @param {boolean} dryRun     Whether to perform dry run.
   * @return {Promise<Object>} Deployment result.
   */
  const deploy = (0,external_wp_element_namespaceObject.useCallback)(async (workerType, script, bindings = {}, dryRun = false) => {
    const service = await getEdgeService();
    return service.deploy(workerType, script, bindings, dryRun);
  }, [getEdgeService]);

  /**
   * Test worker deployment status.
   *
   * @param {string} workerType Worker type.
   * @param {string} workerUrl  Worker URL (optional).
   * @return {Promise<Object>} Test result.
   */
  const testDeployment = (0,external_wp_element_namespaceObject.useCallback)(async (workerType, workerUrl = '') => {
    const service = await getEdgeService();
    return service.testDeployment(workerType, workerUrl);
  }, [getEdgeService]);

  /**
   * Get deployed worker endpoint URL.
   *
   * @param {string} workerType Worker type.
   * @return {Promise<string>} Worker URL, empty string if not deployed.
   */
  const getWorkerUrl = (0,external_wp_element_namespaceObject.useCallback)(async workerType => {
    const service = await getEdgeService();
    return service.getWorkerUrl(workerType);
  }, [getEdgeService]);

  /**
   * Check if worker is deployed.
   *
   * @param {string} workerType Worker type.
   * @return {Promise<boolean>} True if deployed, false otherwise.
   */
  const isDeployed = (0,external_wp_element_namespaceObject.useCallback)(async workerType => {
    const service = await getEdgeService();
    return service.isDeployed(workerType);
  }, [getEdgeService]);

  /**
   * Get worker script content from REST endpoint.
   *
   * @param {string} scriptProviderId Provider ID.
   * @param {string} workerType       Worker type.
   * @return {Promise<string>} Worker script content.
   */
  const getWorkerScript = (0,external_wp_element_namespaceObject.useCallback)(async (scriptProviderId, workerType) => {
    const response = await (0,api/* default */.Ay)({
      path: `/aether/v1/providers/${scriptProviderId}/edge/worker-script/${workerType}`,
      method: 'GET'
    });
    if (typeof response === 'string') {
      return response;
    }
    throw new Error('Failed to fetch worker script');
  }, []);

  /**
   * Get worker bindings configuration.
   *
   * @param {string} workerType Worker type.
   * @param {Object} config     Provider configuration.
   * @return {Promise<Object>} Worker bindings.
   */
  const getWorkerBindings = (0,external_wp_element_namespaceObject.useCallback)(async (workerType, config = {}) => {
    const service = await getEdgeService();
    return service.getWorkerBindings(workerType, config);
  }, [getEdgeService]);
  return {
    deploy,
    testDeployment,
    getWorkerUrl,
    isDeployed,
    getWorkerScript,
    getWorkerBindings
  };
}
;// ./assets/src/hooks/useWorkerDeploy.js
/**
 * Worker Deploy Hook
 *
 * Handles worker deployment to Cloudflare Workers.
 * Updated to use useEdgeService hook.
 *
 * @package
 */






/**
 * Hook for deploying workers.
 *
 * @param {string} workerType Worker type (r2, git, media, spaces).
 * @param {string} providerId Provider ID (e.g., 'cloudflare-r2').
 * @return {Object} Deployment methods and state.
 */
function useWorkerDeploy(workerType, providerId = 'cloudflare-r2') {
  const [deploying, setDeploying] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const [result, setResult] = (0,external_wp_element_namespaceObject.useState)(null);
  const edgeService = useEdgeService(providerId);
  const deploy = (0,external_wp_element_namespaceObject.useCallback)(async (dryRun = false) => {
    setDeploying(true);
    setError(null);
    setResult(null);
    try {
      // Get edge provider ID from settings.
      const settingsResponse = await (0,api/* default */.Ay)({
        path: '/aether/v1/settings'
      });
      const settings = settingsResponse.settings || {};
      const providerTypes = settings.provider_types || {};
      const edgeProviderId = providerTypes.edge || 'cloudflare';

      // Get worker script from REST API.
      const script = await edgeService.getWorkerScript(edgeProviderId, workerType);

      // Get worker bindings.
      const storageConfigResponse = await (0,api/* default */.Ay)({
        path: `/aether/v1/providers/${providerId}/config`
      });
      const config = storageConfigResponse.config || {};
      const bindings = await edgeService.getWorkerBindings(workerType, config);

      // Deploy worker.
      const deployResult = await edgeService.deploy(workerType, script, bindings, dryRun);
      if (!deployResult.success) {
        throw new Error(deployResult.error || (0,external_wp_i18n_namespaceObject.__)('Worker deployment failed', 'aether'));
      }

      // Save deployment info to WordPress settings.
      const deploymentInfo = {
        worker_type: workerType,
        workerName: deployResult.workerName,
        workerUrl: deployResult.workerUrl,
        deployed_at: Date.now()
      };

      // Get current deployments.
      const deployments = settings.worker_deployments || {};
      deployments[workerType] = deploymentInfo;
      await (0,api/* default */.Ay)({
        path: '/aether/v1/settings',
        method: 'POST',
        data: {
          key: 'worker_deployments',
          value: deployments
        }
      });

      // Also update provider config with worker endpoint.
      if (deployResult.workerUrl) {
        // Get current providers settings.
        const providersResponse = await (0,api/* default */.Ay)({
          path: '/aether/v1/settings',
          method: 'GET'
        });
        const providers = providersResponse.settings?.providers || {};

        // Use full providerId (e.g., 'cloudflare-r2') not truncated version
        if (!providers[providerId]) {
          providers[providerId] = {};
        }
        providers[providerId].worker_endpoint = deployResult.workerUrl;

        // Update providers settings.
        await (0,api/* default */.Ay)({
          path: '/aether/v1/settings',
          method: 'POST',
          data: {
            key: 'providers',
            value: providers
          }
        });
      }
      setResult(deploymentInfo);
      setDeploying(false);
      return {
        success: true,
        ...deploymentInfo
      };
    } catch (err) {
      const errorMessage = err.message || (0,external_wp_i18n_namespaceObject.__)('Worker deployment failed', 'aether');
      setError(errorMessage);
      setDeploying(false);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [workerType, providerId, edgeService]);
  return {
    deploy,
    deploying,
    error,
    result
  };
}
;// ./assets/src/components/ProviderActions.js
/**
 * Provider Actions Component
 *
 * Test connection and deploy worker buttons for providers.
 *
 * @package
 */









function ProviderActions({
  providerId,
  requiresWorker,
  workerType = 'r2',
  onWorkerDeployed,
  currentConfig = null
}) {
  const [config, setConfig] = (0,external_wp_element_namespaceObject.useState)({});
  const [loadingConfig, setLoadingConfig] = (0,external_wp_element_namespaceObject.useState)(true);

  // Load provider config for connection testing.
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const loadConfig = async () => {
      try {
        const response = await (0,api/* default */.Ay)({
          path: '/aether/v1/settings'
        });
        if (response?.success && response?.settings?.providers?.[providerId]) {
          setConfig(response.settings.providers[providerId]);
        }
      } catch (err) {
        // Silently fail - config will remain empty
      } finally {
        setLoadingConfig(false);
      }
    };
    if (providerId) {
      loadConfig();
    }
  }, [providerId]);

  // Use currentConfig if provided (from form), otherwise use saved config
  const testConfig = currentConfig && Object.keys(currentConfig).length > 0 ? currentConfig : config;
  const {
    test,
    testing,
    result: testResult
  } = useConnectionTest(providerId, testConfig);
  const {
    deploy,
    deploying,
    error: deployError,
    result: deployResult
  } = useWorkerDeploy(workerType);
  const handleTestConnection = async () => {
    await test();
  };
  const handleDeployWorker = async () => {
    const result = await deploy(false);
    if (result.success && result.workerUrl) {
      setConfig(prevConfig => ({
        ...prevConfig,
        workerEndpoint: result.workerUrl
      }));
      if (onWorkerDeployed) {
        onWorkerDeployed(result.workerUrl);
      }
    }
  };
  const containerStyle = {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTop: `1px solid ${colors.borderLight}`
  };
  const buttonsStyle = {
    ...createFlexStyle('row', spacing.md),
    marginTop: spacing.md
  };
  if (loadingConfig && !currentConfig) {
    return null;
  }
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-provider-actions",
    style: containerStyle,
    children: [testResult && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
      className: `aether-provider-actions__notice aether-provider-actions__notice--${testResult.success ? 'success' : 'error'}`,
      status: testResult.success ? 'success' : 'error',
      isDismissible: false,
      onRemove: () => {},
      children: testResult.message
    }), deployResult && deployResult.success && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.Notice, {
      className: "aether-provider-actions__notice aether-provider-actions__notice--success",
      status: "success",
      isDismissible: false,
      onRemove: () => {},
      children: [(0,external_wp_i18n_namespaceObject.__)('Worker deployed successfully!', 'aether'), deployResult.workerUrl && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-actions__worker-url",
        style: {
          marginTop: spacing.sm
        },
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          className: "aether-provider-actions__worker-url-label",
          children: (0,external_wp_i18n_namespaceObject.__)('Worker URL:', 'aether')
        }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
          className: "aether-provider-actions__worker-url-link",
          href: deployResult.workerUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          children: deployResult.workerUrl
        })]
      })]
    }), deployError && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
      className: "aether-provider-actions__notice aether-provider-actions__notice--error",
      status: "error",
      isDismissible: false,
      onRemove: () => {},
      children: deployError
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-actions__buttons",
      style: buttonsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-actions__test-button",
        variant: "secondary",
        onClick: handleTestConnection,
        isBusy: testing,
        disabled: testing || deploying,
        children: testing ? (0,external_wp_i18n_namespaceObject.__)('Testing…', 'aether') : (0,external_wp_i18n_namespaceObject.__)('Test Connection', 'aether')
      }), requiresWorker && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-actions__deploy-button",
        variant: "secondary",
        onClick: handleDeployWorker,
        isBusy: deploying,
        disabled: testing || deploying,
        children: deploying ? (0,external_wp_i18n_namespaceObject.__)('Deploying…', 'aether') : (0,external_wp_i18n_namespaceObject.__)('Deploy Worker', 'aether')
      })]
    })]
  });
}
;// ./assets/src/utils/settingsHelpers.js
/**
 * Settings Helper Utilities
 *
 * Utilities for working with settings API (no dot notation).
 *
 * @package
 */

/**
 * Get provider settings from full settings object.
 *
 * Providers are stored in settings.providers[providerId].
 *
 * @param {Object} settings   Full settings object from API.
 * @param {string} providerId Provider ID.
 * @return {Object} Provider settings object.
 */
function getProviderSettings(settings, providerId) {
  // All providers are stored in settings.providers[providerId]
  return settings?.providers?.[providerId] || {};
}

/**
 * Update provider settings in full settings object.
 *
 * Providers are saved to settings.providers[providerId].
 *
 * @param {Object} allSettings      Full settings object.
 * @param {string} providerId       Provider ID.
 * @param {Object} providerSettings Provider settings to update.
 * @return {Object} Updated full settings object with saveKey and saveValue.
 */
function updateProviderSettings(allSettings, providerId, providerSettings) {
  // All providers: save to settings.providers[providerId]
  return {
    ...allSettings,
    providers: {
      ...(allSettings.providers || {}),
      [providerId]: providerSettings
    },
    _saveKey: 'providers',
    _saveValue: {
      ...(allSettings.providers || {}),
      [providerId]: providerSettings
    }
  };
}
;// ./assets/src/utils/constants.js
/**
 * Application Constants
 *
 * Centralized constants to avoid magic numbers and strings throughout the codebase.
 *
 * @package
 */

/**
 * Success message display duration (milliseconds).
 */
const SUCCESS_MESSAGE_DURATION_MS = 3000;

/**
 * Short delay for async operations (milliseconds).
 * Used to allow state updates to propagate before continuing.
 */
const SHORT_DELAY_MS = 100;

/**
 * Maximum progress percentage.
 */
const MAX_PROGRESS = 100;
;// ./assets/src/hooks/useSuccessTimeout.js
/**
 * Success Timeout Hook
 *
 * Manages success message timeout with automatic cleanup.
 * Prevents memory leaks and ensures proper cleanup on unmount.
 *
 * @package
 */




/**
 * Hook for managing success message timeout.
 *
 * @return {Object} { showSuccess, clearSuccess }
 */
function useSuccessTimeout() {
  const timeoutRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Cleanup timeout on unmount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  const showSuccess = (0,external_wp_element_namespaceObject.useCallback)(callback => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (callback) {
        callback();
      }
      timeoutRef.current = null;
    }, SUCCESS_MESSAGE_DURATION_MS);
  }, []);
  const clearSuccess = (0,external_wp_element_namespaceObject.useCallback)(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  return {
    showSuccess,
    clearSuccess
  };
}
;// ./assets/src/hooks/useProviderSettingsForm.js
/**
 * Provider Settings Form Hook
 *
 * Shared hook for provider settings form logic.
 * Extracts common patterns from provider Settings components to reduce duplication.
 *
 * @package
 */







/**
 * Hook for provider settings form management.
 *
 * @param {string} providerId Provider ID.
 * @return {Object} Form state and handlers.
 */
function useProviderSettingsForm(providerId) {
  const [settings, setSettings] = (0,external_wp_element_namespaceObject.useState)({});
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(true);
  const [saving, setSaving] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const [success, setSuccess] = (0,external_wp_element_namespaceObject.useState)(false);
  const {
    showSuccess,
    clearSuccess
  } = useSuccessTimeout();

  // Load existing settings
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await (0,api/* default */.Ay)({
          path: '/aether/site-exporter/settings'
        });
        if (response?.success && response?.settings) {
          const providerSettings = getProviderSettings(response.settings, providerId);
          setSettings(prev => ({
            ...prev,
            ...providerSettings
          }));
        }
      } catch (err) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    if (providerId) {
      loadSettings();
    }
  }, [providerId]);
  const handleChange = (0,external_wp_element_namespaceObject.useCallback)((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setError(null);
    clearSuccess();
    setSuccess(false);
  }, [clearSuccess]);
  const handleSubmit = (0,external_wp_element_namespaceObject.useCallback)(async e => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const allSettingsResponse = await (0,api/* default */.Ay)({
        path: '/aether/site-exporter/settings'
      });
      if (!allSettingsResponse?.success) {
        throw new Error('Failed to fetch settings');
      }
      const allSettings = allSettingsResponse.settings || {};
      const updatedSettings = updateProviderSettings(allSettings, providerId, settings);

      // Use the save key and value from updateProviderSettings
      // All providers are now saved to settings.providers[providerId]
      const saveKey = updatedSettings._saveKey || 'providers';
      const saveValue = updatedSettings._saveValue || updatedSettings.providers;
      await (0,api/* default */.Ay)({
        path: '/aether/site-exporter/settings',
        method: 'POST',
        data: {
          key: saveKey,
          value: saveValue
        }
      });
      setSuccess(true);
      showSuccess(() => setSuccess(false));
      (0,external_wp_hooks_.doAction)('aether.admin.provider.settings.saved', providerId);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [providerId, settings, showSuccess]);
  return {
    settings,
    loading,
    saving,
    error,
    success,
    handleChange,
    handleSubmit
  };
}
;// ./assets/src/providers/gitlab-pages/Settings.js
/**
 * GitLab Pages Provider Settings Component
 *
 * @package
 */








function GitLabPagesSettings({
  providerId
}) {
  const {
    settings,
    loading,
    saving,
    error,
    success,
    handleChange,
    handleSubmit
  } = useProviderSettingsForm(providerId);
  const formStyle = {
    ...createFlexStyle('column', spacing.md)
  };
  const noticeErrorStyle = {
    ...noticeStyles.error,
    padding: spacing.md,
    marginBottom: spacing.md
  };
  const noticeSuccessStyle = {
    ...noticeStyles.success,
    padding: spacing.md,
    marginBottom: spacing.md
  };
  const noticeParagraphStyle = {
    margin: 0
  };
  const actionsStyle = {
    ...createFlexStyle('row', spacing.sm),
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.borderLight}`
  };
  if (loading) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
      className: "aether-provider-settings-form aether-provider-settings-form--loading",
      children: (0,external_wp_i18n_namespaceObject.__)('Loading settings…', 'aether')
    });
  }
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("form", {
    className: "aether-provider-settings-form",
    onSubmit: handleSubmit,
    style: formStyle,
    children: [error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings-form__notice aether-provider-settings-form__notice--error",
      style: noticeErrorStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-settings-form__notice-text",
        style: noticeParagraphStyle,
        children: error
      })
    }), success && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings-form__notice aether-provider-settings-form__notice--success",
      style: noticeSuccessStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-settings-form__notice-text",
        style: noticeParagraphStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Settings saved successfully!', 'aether')
      })
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(SecretField, {
      label: (0,external_wp_i18n_namespaceObject.__)('Personal Access Token', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('GitLab Personal Access Token with api and write_repository permissions', 'aether'),
      value: settings.personal_access_token || '',
      onChange: value => handleChange('personal_access_token', value),
      placeholder: (0,external_wp_i18n_namespaceObject.__)('Enter personal access token', 'aether')
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('Project ID', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('GitLab project ID (numeric)', 'aether'),
      value: settings.project_id || '',
      onChange: value => handleChange('project_id', value),
      required: true,
      pattern: "^\\d+$",
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('Namespace (Optional)', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('GitLab namespace (username or group) for Pages URL generation', 'aether'),
      value: settings.namespace || '',
      onChange: value => handleChange('namespace', value),
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('Project Path (Optional)', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('Project path for Pages URL generation', 'aether'),
      value: settings.project_path || '',
      onChange: value => handleChange('project_path', value),
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('Branch', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('Git branch name (default: main)', 'aether'),
      value: settings.branch || 'main',
      onChange: value => handleChange('branch', value),
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('Git Worker URL (Optional)', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('CORS proxy worker for browser-based Git operations (for WordPress Playground)', 'aether'),
      value: settings.git_worker_url || '',
      onChange: value => handleChange('git_worker_url', value),
      type: "url",
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('Enable GitLab Pages', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('Enable static site hosting via GitLab Pages', 'aether'),
      checked: settings.pages_enabled || false,
      onChange: value => handleChange('pages_enabled', value),
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('GitLab Pages URL (Optional)', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('Auto-detected if left empty', 'aether'),
      value: settings.pages_url || '',
      onChange: value => handleChange('pages_url', value),
      type: "url",
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: (0,external_wp_i18n_namespaceObject.__)('Custom Domain (Optional)', 'aether'),
      help: (0,external_wp_i18n_namespaceObject.__)('Custom domain for GitLab Pages (e.g., https://www.example.com)', 'aether'),
      value: settings.custom_domain || '',
      onChange: value => handleChange('custom_domain', value),
      type: "url",
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderActions, {
      providerId: providerId,
      requiresWorker: false
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings-form__actions",
      style: actionsStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-settings-form__submit-button",
        type: "submit",
        variant: "primary",
        isBusy: saving,
        disabled: saving,
        children: saving ? (0,external_wp_i18n_namespaceObject.__)('Saving…', 'aether') : (0,external_wp_i18n_namespaceObject.__)('Save Settings', 'aether')
      })
    })]
  });
}
;// ./assets/src/providers/base/AbstractProvider.js
/**
 * Abstract Provider Base Class
 *
 * Provides common functionality for all providers.
 * JavaScript equivalent of includes/Providers/AbstractProvider.php
 *
 * @package
 */



/**
 * Provider capability constants
 */
const CAP_STORAGE = 'storage';
const CAP_EDGE = 'edge';
const CAP_MEDIA = 'media';
const CAP_STATIC_SITE = 'staticSite';

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
   * Provider capabilities.
   *
   * @type {Array<string>}
   */
  capabilities = [];

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
   * Get the capabilities this provider supports.
   *
   * @return {Array<string>} Array of capability constants
   */
  getCapabilities() {
    return this.capabilities;
  }

  /**
   * Check if this provider supports a specific capability.
   *
   * @param {string} capability Capability constant to check.
   * @return {boolean} True if supported, false otherwise
   */
  supportsCapability(capability) {
    return this.getCapabilities().includes(capability);
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
      throw new Error('Configuration validation failed: ' + JSON.stringify(errors));
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

    // Check that all required fields are present
    const fields = this.getConfigFields();
    for (const field of fields) {
      if (field.required && !config[field.id]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate the provider configuration.
   *
   * @param {Object} config Configuration object to validate.
   * @return {Promise<Object>} Validation errors object (empty if valid)
   */
  async validateConfig(config) {
    const errors = {};
    const fields = this.getConfigFields();
    for (const field of fields) {
      const fieldId = field.id;
      const value = config[fieldId];

      // Check required fields
      if (field.required && !value) {
        errors[fieldId] = `${field.label} is required.`;
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value) {
        continue;
      }

      // Type validation
      if (field.validation) {
        const validation = field.validation;

        // Pattern validation
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            errors[fieldId] = validation.message || `${field.label} format is invalid.`;
          }
        }

        // Min length validation
        if (validation.minLength !== undefined && value.length < validation.minLength) {
          errors[fieldId] = `${field.label} must be at least ${validation.minLength} characters.`;
        }

        // Max length validation
        if (validation.maxLength !== undefined && value.length > validation.maxLength) {
          errors[fieldId] = `${field.label} must be no more than ${validation.maxLength} characters.`;
        }

        // Custom validator callback
        if (validation.callback && typeof validation.callback === 'function') {
          const result = await validation.callback(value, config);
          if (typeof result === 'string') {
            errors[fieldId] = result;
          }
        }
      }
    }

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
    const sanitized = {};
    const fields = this.getConfigFields();
    for (const field of fields) {
      const fieldId = field.id;
      if (!(fieldId in config)) {
        continue;
      }
      let value = config[fieldId];
      const type = field.type || 'text';

      // Sanitize based on type
      switch (type) {
        case 'password':
        case 'text':
        case 'textarea':
          value = String(value).trim();
          break;
        case 'email':
          value = String(value).trim().toLowerCase();
          break;
        case 'url':
          value = String(value).trim();
          // Remove trailing slash
          value = value.replace(/\/$/, '');
          break;
        case 'checkbox':
          value = Boolean(value);
          break;
        case 'number':
          value = Number(value) || 0;
          break;
        case 'select':
          // Ensure value is in allowed options
          const options = (field.options || []).map(opt => opt.value);
          if (options.includes(value)) {
            sanitized[fieldId] = value;
          }
          continue;
        default:
          value = String(value).trim();
          break;
      }
      sanitized[fieldId] = value;

      // Note: Encryption of sensitive fields handled server-side via REST API
    }

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
   * Must be overridden by subclasses.
   *
   * @abstract
   * @return {Array<Object>} Array of field definitions
   */
  getConfigFields() {
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
      capabilities: this.getCapabilities(),
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
   * @return {string} Upload strategy: 'git', 'storage', 'direct', or 'api'
   *
   * Strategies:
   * - 'git': Uses Git-based upload
   * - 'storage': Uses object storage upload (R2, S3, Spaces)
   * - 'direct': Direct HTTP upload to provider API
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
      } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 966));
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
;// ./assets/src/providers/utils/configFieldBuilder.js
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
/* harmony default export */ const configFieldBuilder = ((/* unused pure expression or super */ null && (ConfigFieldBuilder)));
// EXTERNAL MODULE: ./assets/src/utils/getRestUrl.js
var getRestUrl = __webpack_require__(573);
;// ./assets/src/providers/git/AbstractGitProvider.js
/**
 * Abstract Git Provider Base Class
 *
 * Base class for all Git-based providers (GitHub, GitLab, Bitbucket, etc.).
 * Provides common Git operations and functionality shared by all Git providers.
 *
 * @package
 */






/**
 * AbstractGitProvider class
 *
 * Abstract base class for Git-based storage providers.
 * Subclasses must implement provider-specific methods.
 */
class AbstractGitProvider extends AbstractProvider {
  /**
   * Provider capabilities.
   *
   * @type {Array<string>}
   */
  capabilities = [CAP_STORAGE];

  /**
   * Whether this provider is experimental.
   *
   * Git-based providers are currently experimental.
   *
   * @type {boolean}
   */
  experimental = true;

  /**
   * Get the human-readable provider name.
   *
   * Appends "(Experimental)" suffix if provider is experimental.
   *
   * @return {string} Provider name with experimental suffix if applicable
   */
  getName() {
    const baseName = this.getBaseName();
    if (this.experimental) {
      return (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: Provider name */
      (0,external_wp_i18n_namespaceObject.__)('%s (Experimental)', 'aether'), baseName);
    }
    return baseName;
  }

  /**
   * Get the base provider name without experimental suffix.
   *
   * Must be implemented by subclasses.
   *
   * @abstract
   * @return {string} Base provider name
   */
  getBaseName() {
    throw new Error('AbstractGitProvider.getBaseName() must be implemented by subclass');
  }

  /**
   * Get the provider type.
   *
   * @return {string} Provider type
   */
  getType() {
    return 'git-hosting';
  }

  /**
   * Get configuration fields for this provider.
   *
   * Defines common Git fields shared by all Git providers.
   * Subclasses should override and call super.getConfigFields() to add provider-specific fields.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getConfigFields() {
    return ConfigFieldBuilder.buildAll([ConfigFieldBuilder.password('personal_access_token').label((0,external_wp_i18n_namespaceObject.__)('Personal Access Token', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('Personal access token with repository write permissions', 'aether')).required().sensitive().min(20).max(255), ConfigFieldBuilder.text('branch').label((0,external_wp_i18n_namespaceObject.__)('Branch', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('Git branch name (default: main)', 'aether')).default('main'), ConfigFieldBuilder.url('git_worker_url').label((0,external_wp_i18n_namespaceObject.__)('Git Worker URL (Optional)', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('CORS proxy worker for browser-based Git operations (for WordPress Playground)', 'aether'))]);
  }

  /**
   * Normalize Git URL to ensure it ends with .git
   *
   * @param {string} url Git repository URL.
   * @return {string} Normalized Git URL
   */
  normalizeGitUrl(url) {
    if (!url) {
      return '';
    }
    return url.endsWith('.git') ? url : url + '.git';
  }

  /**
   * Get Git CORS proxy URL from settings.
   *
   * @return {Promise<string|null>} Proxy URL or null if not available
   */
  async getGitProxyUrl() {
    const config = await this.getConfig();
    if (config.git_worker_url) {
      return config.git_worker_url;
    }

    // Try to get worker endpoint from storage provider settings
    try {
      const restUrl = (0,getRestUrl/* getRestUrl */.e)();
      const nonceMeta = document.querySelector('meta[name="aether-rest-nonce"]');
      const nonce = nonceMeta ? nonceMeta.getAttribute('content') : '';
      const settingsResponse = await fetch(`${restUrl}settings`, {
        headers: {
          'X-WP-Nonce': nonce
        }
      });
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        const workerEndpoint = settings?.providers?.[settings?.provider_types?.storage]?.worker_endpoint;
        if (workerEndpoint) {
          return workerEndpoint;
        }
      }
    } catch (error) {
      // Worker endpoint not available, return null
    }
    return null;
  }

  /**
   * Get Git authentication object for isomorphic-git.
   *
   * @return {Promise<Object>} Auth object with username and password
   */
  async getGitAuth() {
    const config = await this.getConfig();
    return {
      username: config.personal_access_token || '',
      password: ''
    };
  }

  /**
   * Get the Git repository URL.
   *
   * Must be implemented by subclasses to construct provider-specific Git URL.
   *
   * @abstract
   * @return {Promise<string>} Full Git repository URL
   */
  async getGitRepositoryUrl() {
    throw new Error('AbstractGitProvider.getGitRepositoryUrl() must be implemented by subclass');
  }

  /**
   * Get the API base URL for this provider.
   *
   * Must be implemented by subclasses to return provider-specific API base URL.
   *
   * @abstract
   * @return {string} API base URL
   */
  getApiBaseUrl() {
    throw new Error('AbstractGitProvider.getApiBaseUrl() must be implemented by subclass');
  }

  /**
   * Test connection to provider API.
   *
   * Must be implemented by subclasses to test provider-specific API connection.
   *
   * @abstract
   * @return {Promise<Object>} Connection test result
   */
  async testConnection() {
    throw new Error('AbstractGitProvider.testConnection() must be implemented by subclass');
  }

  /**
   * Get Git configuration for browser-side uploads.
   *
   * Returns configuration object compatible with useGitUpload hook.
   *
   * @return {Promise<Object>} Git configuration object
   */
  async getGitConfig() {
    const config = await this.getConfig();
    const gitUrl = await this.getGitRepositoryUrl();
    return {
      config: {
        gitUrl: this.normalizeGitUrl(gitUrl),
        branch: config.branch || 'main',
        personalAccessToken: config.personal_access_token || ''
      }
    };
  }

  /**
   * Get the upload strategy for Git-based providers.
   *
   * All Git providers use 'git' upload strategy.
   *
   * @return {string} Upload strategy: 'git'
   */
  getUploadStrategy() {
    return 'git';
  }
}

/* harmony default export */ const git_AbstractGitProvider = ((/* unused pure expression or super */ null && (AbstractGitProvider)));
;// ./assets/src/providers/gitlab/GitLabProvider.js
/**
 * GitLab Provider
 *
 * JavaScript implementation of the GitLab provider.
 * Provides Git-based storage using GitLab repositories.
 *
 * @package
 */






/**
 * GitLabProvider class
 *
 * Provides Git-based file storage using GitLab repositories.
 * Uses GitLab API and isomorphic-git for browser-based deployment.
 */
class GitLabProvider extends AbstractGitProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'gitlab';

  /**
   * Provider capabilities.
   *
   * @type {Array<string>}
   */
  capabilities = [CAP_STORAGE];

  /**
   * Get the unique provider identifier.
   *
   * @return {string} Provider ID
   */
  getId() {
    return this.registeredId || GitLabProvider.ID;
  }

  /**
   * Get the base provider name without experimental suffix.
   *
   * @return {string} Base provider name
   */
  getBaseName() {
    return (0,external_wp_i18n_namespaceObject.__)('GitLab', 'aether');
  }

  /**
   * Get the human-readable provider name.
   *
   * @return {string} Provider name
   */
  getName() {
    return super.getName();
  }

  /**
   * Get the provider description.
   *
   * @return {string} Provider description
   */
  getDescription() {
    return (0,external_wp_i18n_namespaceObject.__)('Git-based file storage using GitLab repositories. Uses GitLab API and isomorphic-git for browser-based deployment.', 'aether');
  }

  /**
   * Get the provider icon.
   *
   * @return {string} Provider icon
   */
  getIcon() {
    return '🦊';
  }

  /**
   * Get configuration fields for this provider.
   *
   * Includes common Git fields from AbstractGitProvider plus GitLab-specific fields.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getConfigFields() {
    // Get base Git fields from AbstractGitProvider (already built)
    const baseFields = super.getConfigFields();

    // Add GitLab-specific fields
    const gitlabFields = ConfigFieldBuilder.buildAll([ConfigFieldBuilder.text('project_id').label((0,external_wp_i18n_namespaceObject.__)('Project ID', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('GitLab project ID (numeric)', 'aether')).required().pattern('^\\d+$', (0,external_wp_i18n_namespaceObject.__)('Project ID must be numeric', 'aether')), ConfigFieldBuilder.text('namespace').label((0,external_wp_i18n_namespaceObject.__)('Namespace (Optional)', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('GitLab namespace (username or group) for repository URL', 'aether')), ConfigFieldBuilder.text('project_path').label((0,external_wp_i18n_namespaceObject.__)('Project Path (Optional)', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('Project path for repository URL', 'aether'))]);

    // Combine base fields and GitLab-specific fields
    return [...baseFields, ...gitlabFields];
  }

  /**
   * Get the API base URL for GitLab.
   *
   * @return {string} API base URL
   */
  getApiBaseUrl() {
    return 'https://gitlab.com/api/v4';
  }

  /**
   * Get the Git repository URL.
   *
   * Constructs GitLab repository URL from namespace and projectPath, or uses projectId.
   *
   * @return {Promise<string>} Full Git repository URL
   */
  async getGitRepositoryUrl() {
    const config = await this.getConfig();

    // If namespace and project_path are provided, use them
    if (config.namespace && config.project_path) {
      return `https://gitlab.com/${config.namespace}/${config.project_path}.git`;
    }

    // If only project_id is provided, fetch project info from GitLab API
    if (config.project_id) {
      // If we have namespace, try to use it with project_id
      if (config.namespace) {
        // Try to fetch project info to get the full path
        try {
          const apiUrl = this.getApiBaseUrl();
          const projectInfo = await fetch(`${apiUrl}/projects/${config.project_id}`, {
            headers: {
              Authorization: `Bearer ${config.personal_access_token}`
            }
          });
          if (projectInfo.ok) {
            const project = await projectInfo.json();
            if (project.path_with_namespace) {
              return `https://gitlab.com/${project.path_with_namespace}.git`;
            }
          }
        } catch (error) {
          debugWarn('Failed to fetch project info from GitLab API:', error);
        }

        // Fallback: use namespace with project_id (may not work for all cases)
        return `https://gitlab.com/${config.namespace}/${config.project_id}.git`;
      }

      // If no namespace, fetch project info to get full path
      if (config.personal_access_token) {
        try {
          const apiUrl = this.getApiBaseUrl();
          const projectInfo = await fetch(`${apiUrl}/projects/${config.project_id}`, {
            headers: {
              Authorization: `Bearer ${config.personal_access_token}`
            }
          });
          if (projectInfo.ok) {
            const project = await projectInfo.json();
            if (project.path_with_namespace) {
              return `https://gitlab.com/${project.path_with_namespace}.git`;
            }
            if (project.web_url) {
              // Extract namespace and path from web_url
              const urlMatch = project.web_url.match(/https?:\/\/[^\/]+\/(.+)/);
              if (urlMatch) {
                return `https://gitlab.com/${urlMatch[1]}.git`;
              }
            }
          }
        } catch (error) {
          debugWarn('Failed to fetch project info from GitLab API:', error);
        }
      }

      // Last fallback: return URL with project_id (may not work for all GitLab instances)
      return `https://gitlab.com/projects/${config.project_id}.git`;
    }
    throw new Error((0,external_wp_i18n_namespaceObject.__)('GitLab repository URL cannot be constructed. Please provide namespace and project_path, or project_id with personal_access_token.', 'aether'));
  }

  /**
   * Test connection to GitLab API.
   *
   * @return {Promise<Object>} Connection test result
   */
  async testConnection() {
    const config = await this.getConfig();
    if (!config.personal_access_token) {
      return {
        success: false,
        error: (0,external_wp_i18n_namespaceObject.__)('Personal access token is required', 'aether')
      };
    }
    try {
      const apiUrl = this.getApiBaseUrl();
      const response = await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `Bearer ${config.personal_access_token}`
        }
      });
      if (!response.ok) {
        return {
          success: false,
          error: (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %d: HTTP status code */
          (0,external_wp_i18n_namespaceObject.__)('GitLab API returned status %d', 'aether'), response.status)
        };
      }
      const userData = await response.json();

      // If project_id is provided, verify project access
      if (config.project_id) {
        const projectResponse = await fetch(`${apiUrl}/projects/${config.project_id}`, {
          headers: {
            Authorization: `Bearer ${config.personal_access_token}`
          }
        });
        if (!projectResponse.ok) {
          return {
            success: false,
            error: (0,external_wp_i18n_namespaceObject.__)('Cannot access GitLab project. Please verify project ID and token permissions.', 'aether')
          };
        }
      }
      return {
        success: true,
        message: (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: GitLab username */
        (0,external_wp_i18n_namespaceObject.__)('Successfully connected to GitLab as %s', 'aether'), userData.username || userData.name)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || (0,external_wp_i18n_namespaceObject.__)('Failed to connect to GitLab API', 'aether')
      };
    }
  }
}
/* harmony default export */ const gitlab_GitLabProvider = ((/* unused pure expression or super */ null && (GitLabProvider)));
;// ./assets/src/providers/gitlab-pages/GitLabPagesProvider.js
/**
 * GitLab Pages Provider
 *
 * JavaScript implementation of the GitLab Pages provider.
 * Provides GitLab Pages static site hosting.
 * Extends GitLabProvider to inherit Git-based storage functionality.
 *
 * @package
 */






/**
 * GitLabPagesProvider class
 *
 * Provides GitLab Pages static site hosting.
 * Extends GitLabProvider to inherit Git-based storage functionality.
 * Uses GitLab API and isomorphic-git for browser-based deployment.
 */
class GitLabPagesProvider extends GitLabProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'gitlab-pages';

  /**
   * Provider capabilities.
   *
   * GitLab Pages is a static site provider, not a storage provider.
   * While it inherits Git storage functionality from GitLabProvider,
   * it should only appear in the static site providers dropdown.
   *
   * @type {Array<string>}
   */
  capabilities = [CAP_STATIC_SITE];

  /**
   * Get the unique provider identifier.
   *
   * @return {string} Provider ID
   */
  getId() {
    return this.registeredId || GitLabPagesProvider.ID;
  }

  /**
   * Get the base provider name without experimental suffix.
   *
   * @return {string} Base provider name
   */
  getBaseName() {
    return (0,external_wp_i18n_namespaceObject.__)('GitLab Pages', 'aether');
  }

  /**
   * Get the human-readable provider name.
   *
   * @return {string} Provider name
   */
  getName() {
    return super.getName();
  }

  /**
   * Get the provider type.
   *
   * @return {string} Provider type
   */
  getType() {
    return 'git-hosting';
  }

  /**
   * Get the provider description.
   *
   * @return {string} Provider description
   */
  getDescription() {
    return (0,external_wp_i18n_namespaceObject.__)('GitLab Pages static site hosting with automatic CI/CD pipelines. Uses GitLab API and isomorphic-git for browser-based deployment.', 'aether');
  }

  /**
   * Get the provider icon.
   *
   * @return {string} Provider icon
   */
  getIcon() {
    return '🦊';
  }

  /**
   * Get configuration fields for this provider.
   *
   * Includes all fields from GitLabProvider plus Pages-specific fields.
   *
   * @return {Array<Object>} Array of field definitions
   */
  getConfigFields() {
    // Get base fields from GitLabProvider (already built)
    const baseFields = super.getConfigFields();

    // Add Pages-specific fields
    const pagesFields = ConfigFieldBuilder.buildAll([ConfigFieldBuilder.checkbox('pages_enabled').label((0,external_wp_i18n_namespaceObject.__)('Enable GitLab Pages', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('Enable static site hosting via GitLab Pages', 'aether')).default(true), ConfigFieldBuilder.url('pages_url').label((0,external_wp_i18n_namespaceObject.__)('GitLab Pages URL (Optional)', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('Auto-detected if namespace provided (e.g., https://namespace.gitlab.io/project)', 'aether')), ConfigFieldBuilder.url('custom_domain').label((0,external_wp_i18n_namespaceObject.__)('Custom Domain (Optional)', 'aether')).description((0,external_wp_i18n_namespaceObject.__)('Custom domain for GitLab Pages (e.g., https://www.example.com)', 'aether'))]);

    // Combine base fields and Pages-specific fields
    return [...baseFields, ...pagesFields];
  }

  /**
   * Deploy to GitLab Pages.
   *
   * @return {Promise<Object>} Deployment result
   */
  async deploy() {
    const configured = await this.isConfigured();
    if (!configured) {
      return {
        success: false,
        message: (0,external_wp_i18n_namespaceObject.__)('Cannot deploy: provider is not configured.', 'aether')
      };
    }
    return {
      success: true,
      message: (0,external_wp_i18n_namespaceObject.__)('GitLab Pages deployment is automatic when files are pushed to the repository.', 'aether')
    };
  }

  /**
   * Get provider status.
   *
   * @return {Promise<Object>} Status object
   */
  async getStatus() {
    const status = await super.getStatus();
    const config = await this.getConfig();
    status.pages_enabled = Boolean(config.pages_enabled);
    status.hasCustomDomain = Boolean(config.custom_domain);
    status.supportsBrowserGit = Boolean(config.git_worker_url);
    return status;
  }
}
/* harmony default export */ const gitlab_pages_GitLabPagesProvider = ((/* unused pure expression or super */ null && (GitLabPagesProvider)));
;// ./assets/src/providers/gitlab-pages/index.js
/**
 * GitLab Pages Provider Registration
 *
 * Registers the GitLab Pages provider class and settings component via WordPress hooks.
 *
 * @package
 */






// Register the provider class with the registry

(0,external_wp_hooks_.addAction)('aether.providers.register', 'gitlab-pages/register', registry => {
  registry.register(GitLabPagesProvider.ID, GitLabPagesProvider);
});

// Register the settings component via action hook
(0,external_wp_hooks_.addAction)('aether.admin.provider.settings', 'gitlab-pages/settings', (providerId, container) => {
  if (providerId === 'gitlab-pages' && container) {
    (0,external_wp_element_namespaceObject.render)(/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(GitLabPagesSettings, {
      providerId: providerId
    }), container);
  }
});
/******/ })()
;