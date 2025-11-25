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

;// external ["wp","hooks"]
const external_wp_hooks_namespaceObject = window["wp"]["hooks"];
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// ./assets/src/providers/cloudflare-r2-static-site/CloudflareR2StaticSiteProvider.js
/**
 * Cloudflare R2 Static Site Provider
 *
 * Static metadata class for the Cloudflare R2 static site provider.
 * All logic is handled via hooks in index.js.
 *
 * @package
 */



/**
 * CloudflareR2StaticSiteProvider class
 *
 * Provides Cloudflare R2 object storage for static site exports.
 * This is a static metadata class - all operational logic is in index.js.
 */
class CloudflareR2StaticSiteProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'cloudflare-r2-static-site';

  /**
   * Provider name.
   *
   * @type {string}
   */
  static NAME = (0,external_wp_i18n_namespaceObject.__)('Cloudflare R2', 'aether-site-exporter-providers');

  /**
   * Provider type.
   *
   * @type {string}
   */
  static TYPE = 'cloud-storage';

  /**
   * Provider description.
   *
   * @type {string}
   */
  static DESCRIPTION = (0,external_wp_i18n_namespaceObject.__)('Cloudflare R2 object storage for static site exports with zero egress fees.', 'aether-site-exporter-providers');

  /**
   * Provider icon.
   *
   * @type {string}
   */
  static ICON = '☁️';

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
    id: 'account_id',
    label: (0,external_wp_i18n_namespaceObject.__)('Cloudflare Account ID', 'aether-site-exporter-providers'),
    type: 'text',
    required: true,
    sensitive: true,
    validation: {
      pattern: '^[a-f0-9]{32}$',
      message: (0,external_wp_i18n_namespaceObject.__)('Account ID must be a 32-character hexadecimal string', 'aether-site-exporter-providers')
    }
  }, {
    id: 'api_token',
    label: (0,external_wp_i18n_namespaceObject.__)('Cloudflare API Token', 'aether-site-exporter-providers'),
    type: 'password',
    required: true,
    sensitive: true,
    validation: {
      minLength: 20,
      message: (0,external_wp_i18n_namespaceObject.__)('API Token must be at least 20 characters', 'aether-site-exporter-providers')
    }
  }, {
    id: 'access_key_id',
    label: (0,external_wp_i18n_namespaceObject.__)('R2 Access Key ID', 'aether-site-exporter-providers'),
    type: 'text',
    required: true,
    sensitive: true,
    validation: {
      minLength: 16,
      maxLength: 128,
      message: (0,external_wp_i18n_namespaceObject.__)('Access Key ID must be between 16 and 128 characters', 'aether-site-exporter-providers')
    }
  }, {
    id: 'secret_access_key',
    label: (0,external_wp_i18n_namespaceObject.__)('R2 Secret Access Key', 'aether-site-exporter-providers'),
    type: 'text',
    required: true,
    sensitive: true,
    validation: {
      minLength: 32,
      maxLength: 128,
      message: (0,external_wp_i18n_namespaceObject.__)('Secret Access Key must be between 32 and 128 characters', 'aether-site-exporter-providers')
    }
  }, {
    id: 'bucket_name',
    label: (0,external_wp_i18n_namespaceObject.__)('Bucket Name', 'aether-site-exporter-providers'),
    type: 'text',
    required: true,
    sensitive: false,
    validation: {
      pattern: '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$',
      minLength: 3,
      maxLength: 63,
      message: (0,external_wp_i18n_namespaceObject.__)('Bucket name must be 3-63 characters, start and end with alphanumeric, and contain only lowercase letters, numbers, and hyphens', 'aether-site-exporter-providers')
    }
  }, {
    id: 'worker_endpoint',
    label: (0,external_wp_i18n_namespaceObject.__)('Worker Endpoint URL', 'aether-site-exporter-providers'),
    type: 'url',
    required: false,
    sensitive: false,
    help: (0,external_wp_i18n_namespaceObject.__)('URL of the deployed Cloudflare Worker. Use the Deploy Worker button below to create one.', 'aether-site-exporter-providers')
  }, {
    id: 'custom_domain',
    label: (0,external_wp_i18n_namespaceObject.__)('Custom Domain (Optional)', 'aether-site-exporter-providers'),
    type: 'url',
    required: false,
    sensitive: false,
    isAdvanced: true
  }];
}
/* harmony default export */ const cloudflare_r2_static_site_CloudflareR2StaticSiteProvider = ((/* unused pure expression or super */ null && (CloudflareR2StaticSiteProvider)));
;// external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
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
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/providers/cloudflare-r2-static-site/modal-hooks.js
/**
 * Cloudflare R2 Static Site Provider Modal Hooks
 *
 * Adds custom content to the Cloudflare R2 static site provider configuration modal.
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
  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    setSuccess(false);
    setWorkerUrl(null);
    try {
      // Validate required credentials from this provider's config
      if (!config?.account_id || !config?.api_token) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('Cloudflare Account ID and API Token are required', 'aether-site-exporter-providers'));
      }
      if (!config?.access_key_id || !config?.secret_access_key || !config?.bucket_name) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('R2 Access Key ID, Secret Access Key, and Bucket Name are required', 'aether-site-exporter-providers'));
      }
      const restUrl = window.wpApiSettings?.root || '/wp-json';

      // Get nonce for authentication
      const nonce = document.querySelector('meta[name="aether-rest-nonce"]')?.getAttribute('content') || window.wpApiSettings?.nonce || '';

      // Generate worker name (format: aether-r2-{random})
      const randomId = Math.random().toString(36).substring(2, 10);
      const workerName = `aether-r2-${randomId}`;

      // Prepare bindings - R2 bucket binding
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
          worker_type: 'r2',
          worker_name: workerName,
          bindings,
          account_id: config.account_id,
          api_token: config.api_token
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

      // Save worker endpoint to provider config and update form field
      if (result.worker_url) {
        // Update the form field value immediately (if onChange is available)
        if (onChange && typeof onChange === 'function') {
          onChange('worker_endpoint', result.worker_url);
        }

        // Save to provider config using the provider config endpoint
        try {
          await api({
            path: `/aether/site-exporter/providers/${providerId}/config`,
            method: 'PUT',
            data: {
              worker_endpoint: result.worker_url
            }
          });
        } catch {
          // Error saving worker endpoint - the value is already in the form
          // so deployment is still successful. The user can manually save if needed.
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
      disabled: deploying || !config?.account_id || !config?.api_token || !config?.access_key_id || !config?.secret_access_key || !config?.bucket_name,
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
 *
 * Uses the field-level hook `aether.admin.provider.field.after` to inject
 * the Deploy Worker button after the `worker_endpoint` field.
 *
 * @param {string} providerIdPrefix Provider ID prefix to match (e.g., 'cloudflare-r2-static-site').
 */
function initCloudflareR2ModalHooks(providerIdPrefix) {
  // Hook into the field-level after action to add Deploy Worker button
  // after the worker_endpoint field
  (0,external_wp_hooks_namespaceObject.addAction)('aether.admin.provider.field.after', `aether/${providerIdPrefix}/deploy-button`, context => {
    // Only add button after worker_endpoint field for matching provider
    if (context.fieldId !== 'worker_endpoint' || !context.providerId?.startsWith(providerIdPrefix)) {
      return;
    }

    // Store context values for the render callback
    const {
      formValues,
      onFormChange,
      providerId
    } = context;

    // Use requestAnimationFrame to ensure the field is in the DOM
    requestAnimationFrame(() => {
      // Find the worker_endpoint field container
      // The field is wrapped in a div with class aether-provider-field
      const fieldElements = document.querySelectorAll('.aether-provider-field');
      let workerEndpointField = null;
      fieldElements.forEach(el => {
        // Check if this field has a label or input with worker_endpoint
        const input = el.querySelector('input[id*="worker_endpoint"], input[name*="worker_endpoint"]');
        const label = el.querySelector('label');
        if (input || label && label.textContent?.toLowerCase().includes('worker')) {
          workerEndpointField = el;
        }
      });
      if (!workerEndpointField) {
        return;
      }

      // Check if we already have a button container
      const existingContainer = workerEndpointField.querySelector('.aether-deploy-worker-container');
      if (existingContainer) {
        return;
      }

      // Clean up previous render for this provider if it exists
      const existingRoot = reactRoots.get(providerId);
      const existingRootContainer = rootContainers.get(providerId);
      if (existingRoot) {
        try {
          existingRoot.unmount();
        } catch {
          if (existingRootContainer && existingRootContainer.parentNode) {
            existingRootContainer.parentNode.removeChild(existingRootContainer);
          }
        }
        reactRoots.delete(providerId);
        rootContainers.delete(providerId);
      }

      // Create a new container element for the Deploy Worker button
      const rootElement = document.createElement('div');
      rootElement.className = 'aether-deploy-worker-container';
      workerEndpointField.appendChild(rootElement);

      // Create React 18 root and render
      const root = (0,external_wp_element_namespaceObject.createRoot)(rootElement);
      reactRoots.set(providerId, root);
      rootContainers.set(providerId, rootElement);

      // Pass formValues and onFormChange from the hook context
      root.render(/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(DeployWorkerButton, {
        providerId: providerId,
        config: formValues || {},
        onChange: onFormChange
      }));
    });
  });
}
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
  const fileSize = file.size; // Use multipart upload for large files.
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
;// ./assets/src/providers/cloudflare-r2-static-site/index.js
/**
 * Cloudflare R2 Static Site Provider Registration
 *
 * Registers the Cloudflare R2 static site provider handlers via WordPress hooks.
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
registry_ProviderRegistry.register(CloudflareR2StaticSiteProvider.ID, CloudflareR2StaticSiteProvider);

// Also trigger the hook for any listeners
(0,external_wp_hooks_namespaceObject.doAction)('aether.providers.register', CloudflareR2StaticSiteProvider);

// Track processed files per provider to avoid duplicate processing
const processedFiles = new Map();

/**
 * Get storage service for a provider instance.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<StorageService|null>} Storage service or null if not configured.
 */
async function getStorageService(providerId) {
  const config = await loadProviderConfig(providerId);
  if (!config?.worker_endpoint || !config?.bucket_name) {
    return null;
  }
  return new StorageService(config.worker_endpoint, config.bucket_name, {
    public_url: config.custom_domain || null
  });
}

/**
 * Handle unified file upload for static site provider.
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

  // Only handle requests for cloudflare-r2-static-site providers
  if (!providerId || !providerId.startsWith('cloudflare-r2-static-site')) {
    return;
  }

  // Only handle static files, not blueprint bundles
  if (fileType === 'blueprint-bundle') {
    return;
  }

  // Create a unique key for this file+provider combination
  const fileKey = `${providerId}:${storageKey}`;

  // Check if file is already processed or in progress
  const existingEntry = processedFiles.get(fileKey);
  if (existingEntry === true) {
    return;
  }
  if (existingEntry instanceof Promise) {
    try {
      await existingEntry;
    } catch {
      if (processedFiles.get(fileKey) === existingEntry) {
        processedFiles.delete(fileKey);
      }
    }
    if (processedFiles.get(fileKey) === true) {
      return;
    }
  }
  const processingPromise = (async () => {
    try {
      const storage = await getStorageService(providerId);
      if (!storage) {
        throw new Error('Storage service not available. Please configure worker_endpoint and bucket_name.');
      }

      // Get file content as Blob
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
      throw error;
    }
    processedFiles.set(fileKey, true);
  })().catch(error => {
    if (processedFiles.get(fileKey) === processingPromise) {
      processedFiles.delete(fileKey);
    }
    throw error;
  });
  processedFiles.set(fileKey, processingPromise);
  await processingPromise;
}

/**
 * Register unified file upload action hook.
 */
(0,external_wp_hooks_namespaceObject.addAction)('aether.file.upload', 'aether/cloudflare-r2-static-site', fileContext => {
  if (!fileContext._uploadPromises) {
    fileContext._uploadPromises = [];
  }
  fileContext._uploadPromises.push(handleUnifiedFileUpload(fileContext));
}, 10);

/**
 * Register test connection handler hook.
 */
(0,external_wp_hooks_namespaceObject.addFilter)('aether.provider.test', 'aether/cloudflare-r2-static-site', (handler, providerId) => {
  if (!providerId?.startsWith('cloudflare-r2-static-site')) {
    return handler;
  }
  return async () => {
    const storage = await getStorageService(providerId);
    if (!storage) {
      return {
        success: false,
        error: 'Storage service not configured. Please set worker_endpoint and bucket_name.'
      };
    }
    return storage.testConnection();
  };
}, 10);

/**
 * Register upload strategy filter.
 */
(0,external_wp_hooks_namespaceObject.addFilter)('aether.provider.upload_strategy', 'aether/cloudflare-r2-static-site', (strategy, providerId) => {
  if (providerId?.startsWith('cloudflare-r2-static-site')) {
    return 'worker';
  }
  return strategy;
}, 10);

// Initialize modal hooks
initCloudflareR2ModalHooks('cloudflare-r2-static-site');
/******/ })()
;