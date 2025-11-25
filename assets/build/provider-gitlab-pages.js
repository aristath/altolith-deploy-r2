/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
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

;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// external ["wp","hooks"]
const external_wp_hooks_namespaceObject = window["wp"]["hooks"];
;// ./assets/src/providers/gitlab-pages/GitLabPagesProvider.js
/**
 * GitLab Pages Provider
 *
 * Static metadata class for the GitLab Pages provider.
 * All logic is handled via hooks in index.js.
 *
 * @package
 */



/**
 * GitLabPagesProvider class
 *
 * Provides GitLab Pages static site hosting.
 * This is a static metadata class - all operational logic is in index.js.
 */
class GitLabPagesProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'gitlab-pages';

  /**
   * Provider name.
   *
   * @type {string}
   */
  static NAME = (0,external_wp_i18n_namespaceObject.__)('GitLab Pages (Experimental)', 'aether-site-exporter-providers');

  /**
   * Provider type.
   *
   * @type {string}
   */
  static TYPE = 'git-hosting';

  /**
   * Provider description.
   *
   * @type {string}
   */
  static DESCRIPTION = (0,external_wp_i18n_namespaceObject.__)('GitLab Pages static site hosting with automatic CI/CD pipelines. Uses GitLab API for browser-based deployment.', 'aether-site-exporter-providers');

  /**
   * Provider icon.
   *
   * @type {string}
   */
  static ICON = '🦊';

  /**
   * Deployment type this provider supports.
   *
   * @type {string}
   */
  static DEPLOYMENT_TYPE = 'static_site';

  /**
   * Configuration fields.
   *
   * @type {Array<Object>}
   */
  static CONFIG_FIELDS = [{
    id: 'personal_access_token',
    label: (0,external_wp_i18n_namespaceObject.__)('Personal Access Token', 'aether-site-exporter-providers'),
    type: 'text',
    required: true,
    sensitive: true,
    help: (0,external_wp_i18n_namespaceObject.__)('GitLab Personal Access Token with api and write_repository scopes', 'aether-site-exporter-providers')
  }, {
    id: 'project_id',
    label: (0,external_wp_i18n_namespaceObject.__)('Project ID', 'aether-site-exporter-providers'),
    type: 'text',
    required: true,
    sensitive: false,
    validation: {
      pattern: '^\\d+$',
      message: (0,external_wp_i18n_namespaceObject.__)('Project ID must be a numeric value', 'aether-site-exporter-providers')
    }
  }, {
    id: 'namespace',
    label: (0,external_wp_i18n_namespaceObject.__)('Namespace', 'aether-site-exporter-providers'),
    type: 'text',
    required: false,
    sensitive: false,
    help: (0,external_wp_i18n_namespaceObject.__)('GitLab namespace (username or group) for the repository', 'aether-site-exporter-providers')
  }, {
    id: 'project_path',
    label: (0,external_wp_i18n_namespaceObject.__)('Project Path', 'aether-site-exporter-providers'),
    type: 'text',
    required: false,
    sensitive: false,
    help: (0,external_wp_i18n_namespaceObject.__)('Repository name/path within the namespace', 'aether-site-exporter-providers')
  }, {
    id: 'branch',
    label: (0,external_wp_i18n_namespaceObject.__)('Branch', 'aether-site-exporter-providers'),
    type: 'text',
    required: false,
    sensitive: false,
    default: 'main',
    help: (0,external_wp_i18n_namespaceObject.__)('Git branch to push to', 'aether-site-exporter-providers')
  }, {
    id: 'pages_url',
    label: (0,external_wp_i18n_namespaceObject.__)('Pages URL', 'aether-site-exporter-providers'),
    type: 'url',
    required: false,
    sensitive: false,
    help: (0,external_wp_i18n_namespaceObject.__)('Custom GitLab Pages URL', 'aether-site-exporter-providers')
  }, {
    id: 'custom_domain',
    label: (0,external_wp_i18n_namespaceObject.__)('Custom Domain', 'aether-site-exporter-providers'),
    type: 'url',
    required: false,
    sensitive: false,
    isAdvanced: true
  }];
}
/* harmony default export */ const gitlab_pages_GitLabPagesProvider = ((/* unused pure expression or super */ null && (GitLabPagesProvider)));
;// ../aether-site-exporter/assets/src/providers/registry/ProviderRegistry.js
/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * aether.providers.register hooks. This replaces the PHP ProviderRegistry.
 *
 */



/**
 * Internal registry storage.
 *
 * @type {Map<string, Function>}
 */
const providers = new Map();

/**
 * Provider Registry
 *
 * Singleton registry for managing all JavaScript provider classes.
 */
class ProviderRegistry {
  /**
   * Register a provider class.
   *
   * @param {string}   providerId    Provider ID
   * @param {Function} ProviderClass Provider class (must have static ID, NAME, etc.)
   * @return {void}
   */
  register(providerId, ProviderClass) {
    if (!providerId || typeof providerId !== 'string') {
      throw new Error('ProviderRegistry.register() requires a valid provider ID string');
    }
    if (!ProviderClass || typeof ProviderClass !== 'function') {
      throw new Error('ProviderRegistry.register() requires a provider class');
    }

    // Validate provider has required static properties
    if (!ProviderClass.ID) {
      throw new Error(`Provider ${providerId} must have static ID property`);
    }
    if (!ProviderClass.NAME) {
      throw new Error(`Provider ${providerId} must have static NAME property`);
    }
    providers.set(providerId, ProviderClass);

    /**
     * Action fired after a provider is registered.
     *
     * @param {string}   providerId    Provider ID
     * @param {Function} ProviderClass Provider class
     */
    (0,external_wp_hooks_namespaceObject.doAction)('aether.providers.registered', providerId, ProviderClass);
  }

  /**
   * Get a provider class by ID.
   *
   * @param {string} providerId Provider ID
   * @return {Function|null} Provider class or null if not found
   */
  get(providerId) {
    return providers.get(providerId) || null;
  }

  /**
   * Get all registered provider classes.
   *
   * @return {Array<Function>} Array of provider classes
   */
  getAll() {
    return Array.from(providers.values());
  }

  /**
   * Get all provider IDs.
   *
   * @return {Array<string>} Array of provider IDs
   */
  getAllIds() {
    return Array.from(providers.keys());
  }

  /**
   * Get providers that support a specific deployment type.
   *
   * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
   * @return {Array<Function>} Array of provider classes that support the deployment type
   */
  getByDeploymentType(deploymentType) {
    return this.getAll().filter(ProviderClass => {
      return ProviderClass.DEPLOYMENT_TYPE === deploymentType;
    });
  }

  /**
   * Get default provider.
   *
   * Returns the first provider that supports static_site deployment,
   * or the first registered provider if none found.
   *
   * @return {Function|null} Default provider class or null if none registered
   */
  getDefault() {
    const staticSiteProviders = this.getByDeploymentType('static_site');
    if (staticSiteProviders.length > 0) {
      return staticSiteProviders[0];
    }
    const allProviders = this.getAll();
    return allProviders.length > 0 ? allProviders[0] : null;
  }

  /**
   * Get provider for a specific deployment type.
   *
   * Returns the first provider that supports the deployment type.
   *
   * @param {string} deploymentType Deployment type
   * @return {Function|null} Provider class or null if not found
   */
  getForDeploymentType(deploymentType) {
    const matchingProviders = this.getByDeploymentType(deploymentType);
    return matchingProviders.length > 0 ? matchingProviders[0] : null;
  }

  /**
   * Check if a provider is registered.
   *
   * @param {string} providerId Provider ID
   * @return {boolean} True if registered
   */
  has(providerId) {
    return providers.has(providerId);
  }

  /**
   * Get count of registered providers.
   *
   * @return {number} Number of registered providers
   */
  count() {
    return providers.size;
  }

  /**
   * Parse instance ID into provider type and UUID.
   *
   * Instance IDs have format: {provider_type}:{uuid}
   * Example: "local-filesystem:a3f2c1b0-4e5d-6789-abcd-ef1234567890"
   *
   * @param {string} instanceId Instance ID to parse
   * @return {{provider_type: string, uuid: string}|null} Parsed components or null if invalid format
   */
  parseInstanceId(instanceId) {
    if (!instanceId || typeof instanceId !== 'string') {
      return null;
    }
    const parts = instanceId.split(':', 2);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return null;
    }
    return {
      provider_type: parts[0],
      uuid: parts[1]
    };
  }

  /**
   * Get provider class for an instance ID.
   *
   * Extracts the provider type from the instance ID and returns the corresponding provider class.
   *
   * @param {string} instanceId Instance ID (format: {provider_type}:{uuid})
   * @return {Function|null} Provider class or null if not found
   */
  getProviderForInstance(instanceId) {
    const parsed = this.parseInstanceId(instanceId);
    if (!parsed) {
      return null;
    }
    return this.get(parsed.provider_type);
  }

  /**
   * Create a new instance ID for a provider type.
   *
   * Generates a UUID v4 and combines it with the provider type.
   *
   * @param {string} providerType Provider type (e.g., 'local-filesystem')
   * @return {string} Instance ID (format: {provider_type}:{uuid})
   */
  createInstanceId(providerType) {
    // Generate UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
    return `${providerType}:${uuid}`;
  }

  /**
   * Clear all registered providers.
   *
   * Useful for testing or resetting state.
   *
   * @return {void}
   */
  clear() {
    providers.clear();
  }
}

// Create singleton instance
const registry = new ProviderRegistry();

/**
 * Hook into aether.providers.register to auto-register providers.
 *
 * When providers call doAction('aether.providers.register', ProviderClass),
 * this will automatically register them.
 */
(0,external_wp_hooks_namespaceObject.addAction)('aether.providers.register', 'aether/provider-registry', ProviderClass => {
  if (!ProviderClass || typeof ProviderClass !== 'function') {
    return;
  }

  // Get provider ID from static property
  const providerId = ProviderClass.ID;
  if (!providerId) {
    return; // Invalid provider - must have static ID
  }

  // Register the provider class
  registry.register(providerId, ProviderClass);
});

// Make registry globally available so all bundles share the same instance
// This is necessary because webpack creates separate module instances for each bundle
let exportedRegistry = registry;
if (typeof window !== 'undefined') {
  window.aether = window.aether || {};
  // Only create global registry if it doesn't exist (first bundle to load)
  if (!window.aether.ProviderRegistry) {
    window.aether.ProviderRegistry = registry;
  } else {
    // If registry already exists, use the global one and sync providers
    const globalRegistry = window.aether.ProviderRegistry;
    // Copy any providers from this instance to the global one
    const localProviders = Array.from(providers.values());
    localProviders.forEach(ProviderClass => {
      const providerId = ProviderClass.ID;
      if (!globalRegistry.get(providerId)) {
        globalRegistry.register(providerId, ProviderClass);
      }
    });
    // Use the global registry instead
    exportedRegistry = globalRegistry;
  }
}
/* harmony default export */ const registry_ProviderRegistry = (exportedRegistry);
;// external ["wp","apiFetch"]
const external_wp_apiFetch_namespaceObject = window["wp"]["apiFetch"];
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_namespaceObject);
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
 * Get REST API nonce from window.aetherData.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.nonce) {
    return window.aetherData.nonce;
  }
  return '';
}

/**
 * Get REST API URL from window.aetherData.
 *
 * @return {string} REST API base URL.
 */
function getRestUrl() {
  if (typeof window !== 'undefined' && window.aetherData && window.aetherData.restUrl) {
    return window.aetherData.restUrl;
  }
  return '/wp-json/';
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
;// ./assets/src/providers/gitlab-pages/index.js
/**
 * GitLab Pages Provider Registration
 *
 * Registers the GitLab Pages provider handlers via WordPress hooks.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * @package
 */







/**
 * Load provider configuration from REST API.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<Object>} Provider configuration or empty object.
 */
async function loadProviderConfig(providerId) {
  try {
    const response = await api({
      path: `/aether/site-exporter/providers/${providerId}/config`,
      method: 'GET'
    });
    return response.config || {};
  } catch (error) {
    if (error.code === 'restProviderNotConfigured' || error.status === 404) {
      return {};
    }
    throw error;
  }
}

// Register provider class in JavaScript registry
registry_ProviderRegistry.register(GitLabPagesProvider.ID, GitLabPagesProvider);

// Also trigger the hook for any listeners
(0,external_wp_hooks_namespaceObject.doAction)('aether.providers.register', GitLabPagesProvider);

/**
 * GitLab API base URL.
 */
const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

/**
 * Test connection to GitLab API.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<Object>} Connection test result.
 */
async function testConnection(providerId) {
  const config = await loadProviderConfig(providerId);
  if (!config.personal_access_token) {
    return {
      success: false,
      error: (0,external_wp_i18n_namespaceObject.__)('Personal access token is required', 'aether-site-exporter-providers')
    };
  }
  try {
    const response = await fetch(`${GITLAB_API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${config.personal_access_token}`
      }
    });
    if (!response.ok) {
      return {
        success: false,
        error: (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %d: HTTP status code */
        (0,external_wp_i18n_namespaceObject.__)('GitLab API returned status %d', 'aether-site-exporter-providers'), response.status)
      };
    }
    const userData = await response.json();

    // Verify project access (required for GitLab Pages)
    if (config.project_id) {
      const projectResponse = await fetch(`${GITLAB_API_BASE}/projects/${config.project_id}`, {
        headers: {
          Authorization: `Bearer ${config.personal_access_token}`
        }
      });
      if (!projectResponse.ok) {
        return {
          success: false,
          error: (0,external_wp_i18n_namespaceObject.__)('Cannot access GitLab project. Please verify project ID and token permissions.', 'aether-site-exporter-providers')
        };
      }
    }
    return {
      success: true,
      message: (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: GitLab username */
      (0,external_wp_i18n_namespaceObject.__)('Successfully connected to GitLab as %s', 'aether-site-exporter-providers'), userData.username || userData.name)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || (0,external_wp_i18n_namespaceObject.__)('Failed to connect to GitLab API', 'aether-site-exporter-providers')
    };
  }
}

/**
 * Register test connection handler hook.
 */
(0,external_wp_hooks_namespaceObject.addFilter)('aether.provider.test', 'aether/gitlab-pages', (handler, providerId) => {
  // Handle 'gitlab-pages' or 'gitlab-pages:uuid' format
  if (!providerId?.startsWith('gitlab-pages')) {
    return handler;
  }
  return async () => testConnection(providerId);
}, 10);

/**
 * Register upload strategy filter.
 */
(0,external_wp_hooks_namespaceObject.addFilter)('aether.provider.upload_strategy', 'aether/gitlab-pages', (strategy, providerId) => {
  if (providerId?.startsWith('gitlab-pages')) {
    return 'git';
  }
  return strategy;
}, 10);
/******/ })()
;