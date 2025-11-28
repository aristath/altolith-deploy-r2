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
;// ./assets/src/providers/cloudflare-r2-blueprint-bundle/CloudflareR2BlueprintBundleProvider.js
/**
 * Cloudflare R2 Blueprint Bundle Provider
 *
 * Static metadata class for the Cloudflare R2 blueprint bundle provider.
 * All logic is handled via hooks in index.js.
 *
 * @package
 */



/**
 * CloudflareR2BlueprintBundleProvider class
 *
 * Provides Cloudflare R2 object storage for blueprint bundle exports.
 * This is a static metadata class - all operational logic is in index.js.
 */
class CloudflareR2BlueprintBundleProvider {
  /**
   * Provider ID constant.
   *
   * @type {string}
   */
  static ID = 'cloudflare-r2-blueprint-bundle';

  /**
   * Provider family for config copying compatibility.
   *
   * @type {string}
   */
  static FAMILY = 'cloudflare-r2';

  /**
   * Provider name.
   *
   * @type {string}
   */
  static NAME = (0,external_wp_i18n_namespaceObject.__)('Cloudflare R2', 'altolith-deploy-r2');

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
  static DESCRIPTION = (0,external_wp_i18n_namespaceObject.__)('Cloudflare R2 object storage for WordPress Playground blueprint bundles with zero egress fees.', 'altolith-deploy-r2');

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
  static DEPLOYMENT_TYPE = 'blueprint_bundle';

  /**
   * Configuration fields.
   *
   * @type {Array<Object>}
   */
  static CONFIG_FIELDS = [{
    id: 'credential_profile',
    label: (0,external_wp_i18n_namespaceObject.__)('Cloudflare Credentials', 'altolith-deploy-r2'),
    type: 'profile',
    profile_category: 'credentials',
    profile_type: 'cloudflare',
    required: true,
    help: (0,external_wp_i18n_namespaceObject.__)('Select or create a Cloudflare credentials profile with your Account ID and API Token.', 'altolith-deploy-r2')
  }, {
    id: 'bucket_name',
    label: (0,external_wp_i18n_namespaceObject.__)('Bucket Name', 'altolith-deploy-r2'),
    type: 'text',
    required: true,
    sensitive: false,
    validation: {
      pattern: '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$',
      minLength: 3,
      maxLength: 63,
      message: (0,external_wp_i18n_namespaceObject.__)('Bucket name must be 3-63 characters, start and end with alphanumeric, and contain only lowercase letters, numbers, and hyphens', 'altolith-deploy-r2')
    }
  }, {
    id: 'path',
    label: (0,external_wp_i18n_namespaceObject.__)('Path Prefix', 'altolith-deploy-r2'),
    type: 'text',
    required: false,
    sensitive: false,
    placeholder: 'my-site/',
    help: (0,external_wp_i18n_namespaceObject.__)('Optional path prefix for all uploaded files (e.g., "my-site/" will upload files as "my-site/bundle.zip")', 'altolith-deploy-r2'),
    validation: {
      pattern: '^[a-zA-Z0-9._/-]*$',
      message: (0,external_wp_i18n_namespaceObject.__)('Path can only contain letters, numbers, dots, underscores, hyphens, and forward slashes', 'altolith-deploy-r2')
    }
  }, {
    id: 'worker_endpoint',
    label: (0,external_wp_i18n_namespaceObject.__)('Worker Endpoint URL', 'altolith-deploy-r2'),
    type: 'url',
    required: false,
    sensitive: false,
    help: (0,external_wp_i18n_namespaceObject.__)('URL of the deployed Cloudflare Worker. Use the Deploy Worker button below to create one.', 'altolith-deploy-r2')
  }, {
    id: 'access_key_id',
    label: (0,external_wp_i18n_namespaceObject.__)('R2 Access Key ID', 'altolith-deploy-r2'),
    type: 'text',
    required: false,
    sensitive: true,
    help: (0,external_wp_i18n_namespaceObject.__)('Only required for S3-compatible API access, not for Worker-based uploads.', 'altolith-deploy-r2'),
    validation: {
      minLength: 16,
      maxLength: 128,
      message: (0,external_wp_i18n_namespaceObject.__)('Access Key ID must be between 16 and 128 characters', 'altolith-deploy-r2')
    }
  }, {
    id: 'secret_access_key',
    label: (0,external_wp_i18n_namespaceObject.__)('R2 Secret Access Key', 'altolith-deploy-r2'),
    type: 'text',
    required: false,
    sensitive: true,
    help: (0,external_wp_i18n_namespaceObject.__)('Only required for S3-compatible API access, not for Worker-based uploads.', 'altolith-deploy-r2'),
    validation: {
      minLength: 32,
      maxLength: 128,
      message: (0,external_wp_i18n_namespaceObject.__)('Secret Access Key must be between 32 and 128 characters', 'altolith-deploy-r2')
    }
  }, {
    id: 'bundle_path',
    label: (0,external_wp_i18n_namespaceObject.__)('Bundle Path', 'altolith-deploy-r2'),
    type: 'text',
    required: false,
    sensitive: false,
    placeholder: 'blueprint-bundle/bundle.zip',
    help: (0,external_wp_i18n_namespaceObject.__)('Path within the bucket for the blueprint bundle ZIP file', 'altolith-deploy-r2')
  }, {
    id: 'public_url',
    label: (0,external_wp_i18n_namespaceObject.__)('Custom Domain (Optional)', 'altolith-deploy-r2'),
    type: 'url',
    required: false,
    sensitive: false,
    isAdvanced: true
  }];
}
/* harmony default export */ const cloudflare_r2_blueprint_bundle_CloudflareR2BlueprintBundleProvider = ((/* unused pure expression or super */ null && (CloudflareR2BlueprintBundleProvider)));
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
 * Get REST API nonce from window.altolithData.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  if (typeof window !== 'undefined' && window.altolithData && window.altolithData.nonce) {
    return window.altolithData.nonce;
  }
  return '';
}

/**
 * Get REST API URL from window.altolithData.
 *
 * @return {string} REST API base URL.
 */
function getRestUrl() {
  if (typeof window !== 'undefined' && window.altolithData && window.altolithData.restUrl) {
    return window.altolithData.restUrl;
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
;// ./assets/src/providers/cloudflare-r2-shared/documentation.js
/**
 * Cloudflare R2 Documentation Content
 *
 * Contains all help text, documentation, and instructions
 * for the R2 provider configuration modal.
 *
 * @package
 */



/**
 * Required API token permissions for R2 provider.
 */
const REQUIRED_PERMISSIONS = {
  title: (0,external_wp_i18n_namespaceObject.__)('Required API Token Permissions', 'altolith-deploy-r2'),
  sections: [{
    title: (0,external_wp_i18n_namespaceObject.__)('R2 Storage', 'altolith-deploy-r2'),
    items: [{
      permission: 'R2: Edit',
      description: (0,external_wp_i18n_namespaceObject.__)('Read and write files to R2 bucket', 'altolith-deploy-r2')
    }]
  }, {
    title: (0,external_wp_i18n_namespaceObject.__)('Workers (for deployment)', 'altolith-deploy-r2'),
    items: [{
      permission: 'Workers Scripts: Edit',
      description: (0,external_wp_i18n_namespaceObject.__)('Deploy and update Workers', 'altolith-deploy-r2')
    }, {
      permission: 'Workers Routes: Edit',
      description: (0,external_wp_i18n_namespaceObject.__)('Attach custom domains to Workers', 'altolith-deploy-r2')
    }]
  }, {
    title: (0,external_wp_i18n_namespaceObject.__)('DNS (for custom domains)', 'altolith-deploy-r2'),
    items: [{
      permission: 'Zone: Read',
      description: (0,external_wp_i18n_namespaceObject.__)('Look up zone IDs for custom domains', 'altolith-deploy-r2')
    }]
  }],
  createTokenUrl: 'https://dash.cloudflare.com/profile/api-tokens'
};

/**
 * Manual worker deployment instructions.
 */
const MANUAL_WORKER_DEPLOYMENT = {
  title: (0,external_wp_i18n_namespaceObject.__)('Manual Worker Deployment', 'altolith-deploy-r2'),
  steps: [(0,external_wp_i18n_namespaceObject.__)('Go to Cloudflare Dashboard > Workers & Pages', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Click "Create" and select "Create Worker"', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Name your worker (e.g., "my-r2-static-site")', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Go to Settings > Variables > R2 Bucket Bindings', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Add binding: Variable name "R2_BUCKET", select your bucket', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Deploy the worker and copy the URL', 'altolith-deploy-r2')],
  workersUrl: 'https://dash.cloudflare.com/?to=/:account/workers-and-pages'
};

/**
 * Manual domain attachment instructions.
 */
const MANUAL_DOMAIN_ATTACHMENT = {
  title: (0,external_wp_i18n_namespaceObject.__)('Manual Domain Attachment', 'altolith-deploy-r2'),
  steps: [(0,external_wp_i18n_namespaceObject.__)('Go to Cloudflare Dashboard > Workers & Pages', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Select your worker', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Go to Settings > Triggers > Custom Domains', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Click "Add Custom Domain"', 'altolith-deploy-r2'), (0,external_wp_i18n_namespaceObject.__)('Enter your domain and confirm', 'altolith-deploy-r2')],
  note: (0,external_wp_i18n_namespaceObject.__)('Ensure the domain is on the same Cloudflare account and proxied through Cloudflare (orange cloud).', 'altolith-deploy-r2'),
  docsUrl: 'https://developers.cloudflare.com/workers/configuration/routing/custom-domains/'
};

/**
 * Links to Cloudflare documentation.
 */
const CLOUDFLARE_DOCS = {
  createApiToken: 'https://developers.cloudflare.com/fundamentals/api/get-started/create-token/',
  r2Overview: 'https://developers.cloudflare.com/r2/',
  workersCustomDomains: 'https://developers.cloudflare.com/workers/configuration/routing/custom-domains/',
  workersBindings: 'https://developers.cloudflare.com/workers/runtime-apis/bindings/'
};
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/providers/cloudflare-r2-shared/R2SetupGuide.js
/**
 * R2 Setup Guide Component
 *
 * Displays important setup information at the top of the provider modal.
 * Collapsible to avoid overwhelming users who already know the setup.
 *
 * @package
 */






/**
 * Collapsible setup guide showing required API permissions.
 *
 * @return {JSX.Element} Setup guide component.
 */

function R2SetupGuide() {
  const [isExpanded, setIsExpanded] = (0,external_wp_element_namespaceObject.useState)(false);
  const containerStyle = {
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f0f6fc',
    borderLeft: '4px solid #2271b1',
    borderRadius: '2px'
  };
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 0
  };
  const toggleButtonStyle = {
    padding: 0,
    height: 'auto',
    minHeight: 'auto'
  };
  const contentStyle = {
    marginTop: '0.75rem',
    fontSize: '13px',
    lineHeight: '1.6'
  };
  const listStyle = {
    margin: '0.5rem 0 0.75rem',
    paddingLeft: '1.5rem'
  };
  const listItemStyle = {
    marginBottom: '0.25rem'
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: `altolith-r2-setup-guide${isExpanded ? ' altolith-r2-setup-guide--expanded' : ''}`,
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "altolith-r2-setup-guide__header",
      style: headerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
        className: "altolith-r2-setup-guide__title",
        children: (0,external_wp_i18n_namespaceObject.__)('Before you begin', 'altolith-deploy-r2')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "altolith-r2-setup-guide__toggle",
        variant: "link",
        onClick: () => setIsExpanded(!isExpanded),
        style: toggleButtonStyle,
        "aria-expanded": isExpanded,
        children: isExpanded ? (0,external_wp_i18n_namespaceObject.__)('Hide details', 'altolith-deploy-r2') : (0,external_wp_i18n_namespaceObject.__)('Show details', 'altolith-deploy-r2')
      })]
    }), !isExpanded && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("p", {
      className: "altolith-r2-setup-guide__summary",
      style: {
        margin: '0.5rem 0 0',
        fontSize: '13px'
      },
      children: [(0,external_wp_i18n_namespaceObject.__)('You need a Cloudflare API token with R2, Workers, and Zone permissions.', 'altolith-deploy-r2'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ExternalLink, {
        className: "altolith-r2-setup-guide__link",
        href: REQUIRED_PERMISSIONS.createTokenUrl,
        children: (0,external_wp_i18n_namespaceObject.__)('Create API Token', 'altolith-deploy-r2')
      })]
    }), isExpanded && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "altolith-r2-setup-guide__content",
      style: contentStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "altolith-r2-setup-guide__intro",
        style: {
          margin: '0 0 0.5rem'
        },
        children: (0,external_wp_i18n_namespaceObject.__)('Create a Cloudflare API token with these permissions:', 'altolith-deploy-r2')
      }), REQUIRED_PERMISSIONS.sections.map((section, sectionIndex) => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-r2-setup-guide__section",
        style: {
          marginBottom: '0.5rem'
        },
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          className: "altolith-r2-setup-guide__section-title",
          style: {
            fontSize: '12px',
            color: '#50575e'
          },
          children: section.title
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("ul", {
          className: "altolith-r2-setup-guide__list",
          style: listStyle,
          children: section.items.map((item, itemIndex) => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "altolith-r2-setup-guide__list-item",
            style: listItemStyle,
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("code", {
              className: "altolith-r2-setup-guide__permission",
              children: item.permission
            }), ' - ', item.description]
          }, itemIndex))
        })]
      }, sectionIndex)), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "altolith-r2-setup-guide__footer",
        style: {
          margin: 0
        },
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ExternalLink, {
          className: "altolith-r2-setup-guide__link",
          href: REQUIRED_PERMISSIONS.createTokenUrl,
          children: (0,external_wp_i18n_namespaceObject.__)('Create API Token in Cloudflare Dashboard', 'altolith-deploy-r2')
        })
      })]
    })]
  });
}
;// ./assets/src/providers/cloudflare-r2-shared/APITokenHelpSection.js
/**
 * API Token Help Section Component
 *
 * Collapsible help section displayed after the API token field.
 * Contains step-by-step instructions for creating a token.
 *
 * @package
 */






/**
 * Collapsible section with API token creation instructions.
 *
 * @return {JSX.Element} Help section component.
 */

function APITokenHelpSection() {
  const [isExpanded, setIsExpanded] = (0,external_wp_element_namespaceObject.useState)(false);
  const containerStyle = {
    marginTop: '0.5rem'
  };
  const toggleButtonStyle = {
    padding: 0,
    height: 'auto',
    minHeight: 'auto',
    fontSize: '12px'
  };
  const contentStyle = {
    marginTop: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#f6f7f7',
    borderRadius: '4px',
    fontSize: '12px',
    lineHeight: '1.6'
  };
  const listStyle = {
    margin: '0.5rem 0',
    paddingLeft: '1.25rem'
  };
  const listItemStyle = {
    marginBottom: '0.35rem'
  };
  const nestedListStyle = {
    marginTop: '0.25rem',
    marginBottom: '0.25rem',
    paddingLeft: '1.25rem',
    listStyleType: 'disc'
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: `altolith-api-token-help${isExpanded ? ' altolith-api-token-help--expanded' : ''}`,
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
      className: "altolith-api-token-help__toggle",
      variant: "link",
      onClick: () => setIsExpanded(!isExpanded),
      style: toggleButtonStyle,
      "aria-expanded": isExpanded,
      children: isExpanded ? (0,external_wp_i18n_namespaceObject.__)('Hide token creation steps', 'altolith-deploy-r2') : (0,external_wp_i18n_namespaceObject.__)('How to create an API token', 'altolith-deploy-r2')
    }), isExpanded && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "altolith-api-token-help__content",
      style: contentStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ol", {
        className: "altolith-api-token-help__steps",
        style: listStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
          className: "altolith-api-token-help__step-item",
          style: listItemStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Go to Cloudflare Dashboard > My Profile > API Tokens', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
          className: "altolith-api-token-help__step-item",
          style: listItemStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Click "Create Token"', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
          className: "altolith-api-token-help__step-item",
          style: listItemStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Select "Create Custom Token"', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
          className: "altolith-api-token-help__step-item",
          style: listItemStyle,
          children: [(0,external_wp_i18n_namespaceObject.__)('Add these permissions:', 'altolith-deploy-r2'), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ul", {
            className: "altolith-api-token-help__permissions",
            style: nestedListStyle,
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
              className: "altolith-api-token-help__permission-item",
              children: "Account > Workers Scripts > Edit"
            }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
              className: "altolith-api-token-help__permission-item",
              children: "Account > Workers Routes > Edit"
            }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
              className: "altolith-api-token-help__permission-item",
              children: "Zone > Zone > Read (select your zones)"
            })]
          })]
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
          className: "altolith-api-token-help__step-item",
          style: listItemStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Create the token and copy it here', 'altolith-deploy-r2')
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ExternalLink, {
        className: "altolith-api-token-help__link",
        href: CLOUDFLARE_DOCS.createApiToken,
        children: (0,external_wp_i18n_namespaceObject.__)('View Cloudflare Documentation', 'altolith-deploy-r2')
      })]
    })]
  });
}
;// ./assets/src/providers/cloudflare-r2-shared/DeploymentErrorHelp.js
/**
 * Deployment Error Help Component
 *
 * Shows expandable "How to fix" instructions when worker
 * deployment or domain attachment fails.
 *
 * @package
 */






/**
 * Expandable help section for deployment errors.
 *
 * @param {Object} props           Component props.
 * @param {string} props.errorType Type of error: 'worker_deployment' or 'domain_attachment'.
 * @param {string} props.hostname  Optional hostname for domain attachment errors.
 * @return {JSX.Element|null} Help section or null if invalid error type.
 */

function DeploymentErrorHelp({
  errorType,
  hostname
}) {
  const [isExpanded, setIsExpanded] = (0,external_wp_element_namespaceObject.useState)(false);
  const containerStyle = {
    marginTop: '0.5rem'
  };
  const toggleButtonStyle = {
    padding: 0,
    height: 'auto',
    minHeight: 'auto',
    fontSize: '12px',
    color: '#2271b1'
  };
  const contentStyle = {
    marginTop: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#fff8e5',
    borderRadius: '4px',
    fontSize: '12px',
    lineHeight: '1.6'
  };
  const listStyle = {
    margin: '0.5rem 0',
    paddingLeft: '1.25rem'
  };
  const listItemStyle = {
    marginBottom: '0.35rem'
  };
  const noteStyle = {
    marginTop: '0.5rem',
    fontStyle: 'italic',
    color: '#50575e'
  };
  if (errorType === 'worker_deployment') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: `altolith-deployment-error-help altolith-deployment-error-help--worker${isExpanded ? ' altolith-deployment-error-help--expanded' : ''}`,
      style: containerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "altolith-deployment-error-help__toggle",
        variant: "link",
        onClick: () => setIsExpanded(!isExpanded),
        style: toggleButtonStyle,
        "aria-expanded": isExpanded,
        children: isExpanded ? (0,external_wp_i18n_namespaceObject.__)('Hide manual instructions', 'altolith-deploy-r2') : (0,external_wp_i18n_namespaceObject.__)('How to deploy manually', 'altolith-deploy-r2')
      }), isExpanded && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-deployment-error-help__content",
        style: contentStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "altolith-deployment-error-help__text",
          style: {
            margin: '0 0 0.5rem'
          },
          children: (0,external_wp_i18n_namespaceObject.__)('If automatic deployment fails, you can deploy the worker manually:', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("ol", {
          className: "altolith-deployment-error-help__steps",
          style: listStyle,
          children: MANUAL_WORKER_DEPLOYMENT.steps.map((step, index) => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-deployment-error-help__step-item",
            style: listItemStyle,
            children: step
          }, index))
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ExternalLink, {
          className: "altolith-deployment-error-help__link",
          href: MANUAL_WORKER_DEPLOYMENT.workersUrl,
          children: (0,external_wp_i18n_namespaceObject.__)('Open Workers & Pages', 'altolith-deploy-r2')
        }), ' | ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ExternalLink, {
          className: "altolith-deployment-error-help__link",
          href: CLOUDFLARE_DOCS.workersBindings,
          children: (0,external_wp_i18n_namespaceObject.__)('View Bindings Documentation', 'altolith-deploy-r2')
        })]
      })]
    });
  }
  if (errorType === 'domain_attachment') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: `altolith-deployment-error-help altolith-deployment-error-help--domain${isExpanded ? ' altolith-deployment-error-help--expanded' : ''}`,
      style: containerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "altolith-deployment-error-help__toggle",
        variant: "link",
        onClick: () => setIsExpanded(!isExpanded),
        style: toggleButtonStyle,
        "aria-expanded": isExpanded,
        children: isExpanded ? (0,external_wp_i18n_namespaceObject.__)('Hide manual instructions', 'altolith-deploy-r2') : (0,external_wp_i18n_namespaceObject.__)('How to attach domain manually', 'altolith-deploy-r2')
      }), isExpanded && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-deployment-error-help__content",
        style: contentStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "altolith-deployment-error-help__text",
          style: {
            margin: '0 0 0.5rem'
          },
          children: (0,external_wp_i18n_namespaceObject.__)('If custom domain attachment fails, configure it manually:', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("ol", {
          className: "altolith-deployment-error-help__steps",
          style: listStyle,
          children: MANUAL_DOMAIN_ATTACHMENT.steps.map((step, index) => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-deployment-error-help__step-item",
            style: listItemStyle,
            children: index === 4 && hostname ? `${step}: ${hostname}` : step
          }, index))
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "altolith-deployment-error-help__note",
          style: noteStyle,
          children: MANUAL_DOMAIN_ATTACHMENT.note
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ExternalLink, {
          className: "altolith-deployment-error-help__link",
          href: MANUAL_DOMAIN_ATTACHMENT.docsUrl,
          children: (0,external_wp_i18n_namespaceObject.__)('View Custom Domains Documentation', 'altolith-deploy-r2')
        })]
      })]
    });
  }
  return null;
}
;// ./assets/src/providers/cloudflare-r2-shared/ManualWorkerSetupModal.js
/**
 * Manual Worker Setup Modal Component
 *
 * Shows detailed instructions for manually creating a Cloudflare Worker
 * for R2 storage, including the worker code to paste.
 *
 * @package
 */






/**
 * Manual Worker Setup Modal component.
 *
 * @param {Object}   props            Component props.
 * @param {boolean}  props.isOpen     Whether modal is open.
 * @param {Function} props.onClose    Function to close the modal.
 * @param {string}   props.bucketName Optional bucket name to show in instructions.
 * @return {JSX.Element|null}         Modal component or null if not open.
 */

function ManualWorkerSetupModal({
  isOpen,
  onClose,
  bucketName
}) {
  const [copied, setCopied] = (0,external_wp_element_namespaceObject.useState)(false);
  const [workerCode, setWorkerCode] = (0,external_wp_element_namespaceObject.useState)('');
  const [isLoading, setIsLoading] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);

  // Fetch worker code when modal opens
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!isOpen || workerCode) {
      return;
    }
    const fetchWorkerCode = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get plugin URL from global variable set by PHP
        const pluginUrl = window.altolithSepPluginUrl || '';
        if (!pluginUrl) {
          throw new Error('Plugin URL not available');
        }
        const response = await fetch(pluginUrl + 'assets/workers/CloudflareR2Worker.js');
        if (!response.ok) {
          throw new Error(`Failed to fetch worker code: ${response.status}`);
        }
        const code = await response.text();
        setWorkerCode(code);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkerCode();
  }, [isOpen, workerCode]);
  if (!isOpen) {
    return null;
  }
  const handleCopyCode = async () => {
    if (!workerCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(workerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = workerCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };
  const modalStyle = {
    maxWidth: '800px',
    width: '90vw'
  };
  const sectionStyle = {
    marginBottom: '1.5rem'
  };
  const headingStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    marginTop: 0
  };
  const listStyle = {
    margin: '0.5rem 0',
    paddingLeft: '1.5rem'
  };
  const listItemStyle = {
    marginBottom: '0.5rem',
    lineHeight: '1.6'
  };
  const codeBlockStyle = {
    position: 'relative',
    marginTop: '0.5rem'
  };
  const copyButtonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '0.5rem'
  };
  const noteStyle = {
    backgroundColor: '#f0f6fc',
    padding: '0.75rem 1rem',
    borderLeft: '4px solid #2271b1',
    borderRadius: '2px',
    marginTop: '1rem',
    fontSize: '0.875rem'
  };
  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '0.5rem'
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Modal, {
    title: (0,external_wp_i18n_namespaceObject.__)('Manual Worker Setup Instructions', 'altolith-deploy-r2'),
    onRequestClose: onClose,
    style: modalStyle,
    className: "altolith-manual-worker-modal",
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "altolith-manual-worker-modal__content",
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-manual-worker-modal__section",
        style: sectionStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h3", {
          className: "altolith-manual-worker-modal__heading",
          style: headingStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Step 1: Create a Worker', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ol", {
          className: "altolith-manual-worker-modal__steps",
          style: listStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: [(0,external_wp_i18n_namespaceObject.__)('Go to', 'altolith-deploy-r2'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
              className: "altolith-manual-worker-modal__link",
              href: "https://dash.cloudflare.com/?to=/:account/workers-and-pages",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "Cloudflare Dashboard > Workers & Pages"
            })]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Click "Create" and select "Create Worker"', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Name your worker (e.g., "altolith-r2-mysite")', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Click "Deploy" to create the worker with default code', 'altolith-deploy-r2')
          })]
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-manual-worker-modal__section",
        style: sectionStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h3", {
          className: "altolith-manual-worker-modal__heading",
          style: headingStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Step 2: Add R2 Bucket Binding', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ol", {
          className: "altolith-manual-worker-modal__steps",
          style: listStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('In your worker, go to Settings > Variables', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Scroll down to "R2 Bucket Bindings"', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Click "Add binding"', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              children: (0,external_wp_i18n_namespaceObject.__)('Variable name:', 'altolith-deploy-r2')
            }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("code", {
              className: "altolith-manual-worker-modal__code",
              children: "R2_BUCKET"
            }), ' ', (0,external_wp_i18n_namespaceObject.__)('(must be exactly this name)', 'altolith-deploy-r2')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
              children: (0,external_wp_i18n_namespaceObject.__)('R2 bucket:', 'altolith-deploy-r2')
            }), ' ', bucketName ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
              children: [(0,external_wp_i18n_namespaceObject.__)('Select', 'altolith-deploy-r2'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("code", {
                className: "altolith-manual-worker-modal__code",
                children: bucketName
              })]
            }) : (0,external_wp_i18n_namespaceObject.__)('Select your R2 bucket', 'altolith-deploy-r2')]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Click "Save" to save the binding', 'altolith-deploy-r2')
          })]
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-manual-worker-modal__section",
        style: sectionStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h3", {
          className: "altolith-manual-worker-modal__heading",
          style: headingStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Step 3: Replace Worker Code', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ol", {
          className: "altolith-manual-worker-modal__steps",
          style: listStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Go to your worker\'s "Code" tab', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Delete all existing code', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Paste the code below:', 'altolith-deploy-r2')
          })]
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "altolith-manual-worker-modal__code-block",
          style: codeBlockStyle,
          children: [isLoading && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
            className: "altolith-manual-worker-modal__loading",
            style: loadingStyle,
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {}), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
              className: "altolith-manual-worker-modal__loading-text",
              children: (0,external_wp_i18n_namespaceObject.__)('Loading worker code…', 'altolith-deploy-r2')
            })]
          }), error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
            className: "altolith-manual-worker-modal__error",
            status: "error",
            isDismissible: false,
            children: error
          }), !isLoading && !error && workerCode && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
              className: "altolith-manual-worker-modal__copy-button-container",
              style: copyButtonContainerStyle,
              children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
                className: "altolith-manual-worker-modal__copy-button",
                variant: "secondary",
                onClick: handleCopyCode,
                disabled: copied,
                children: copied ? (0,external_wp_i18n_namespaceObject.__)('Copied!', 'altolith-deploy-r2') : (0,external_wp_i18n_namespaceObject.__)('Copy Code', 'altolith-deploy-r2')
              })
            }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextareaControl, {
              className: "altolith-manual-worker-modal__code-textarea",
              value: workerCode,
              readOnly: true,
              rows: 15,
              style: {
                fontFamily: 'monospace',
                fontSize: '12px',
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4'
              }
            })]
          })]
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-manual-worker-modal__section",
        style: sectionStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h3", {
          className: "altolith-manual-worker-modal__heading",
          style: headingStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Step 4: Deploy and Copy URL', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("ol", {
          className: "altolith-manual-worker-modal__steps",
          style: listStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Click "Save and Deploy" to deploy your worker', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Copy the worker URL (e.g., https://altolith-r2-mysite.your-subdomain.workers.dev)', 'altolith-deploy-r2')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("li", {
            className: "altolith-manual-worker-modal__step-item",
            style: listItemStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Paste it in the "Worker Endpoint URL" field in this form', 'altolith-deploy-r2')
          })]
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.Notice, {
        className: "altolith-manual-worker-modal__important-notice",
        status: "info",
        isDismissible: false,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: (0,external_wp_i18n_namespaceObject.__)('Important:', 'altolith-deploy-r2')
        }), ' ', (0,external_wp_i18n_namespaceObject.__)('The R2 bucket binding variable name MUST be exactly "R2_BUCKET" (case-sensitive). The worker will not work without this binding.', 'altolith-deploy-r2')]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "altolith-manual-worker-modal__help-note",
        style: noteStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: (0,external_wp_i18n_namespaceObject.__)('Need more help?', 'altolith-deploy-r2')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("br", {}), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
          className: "altolith-manual-worker-modal__link",
          href: CLOUDFLARE_DOCS.workersBindings,
          target: "_blank",
          rel: "noopener noreferrer",
          children: (0,external_wp_i18n_namespaceObject.__)('R2 Bucket Bindings Documentation', 'altolith-deploy-r2')
        }), ' | ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
          className: "altolith-manual-worker-modal__link",
          href: CLOUDFLARE_DOCS.r2Overview,
          target: "_blank",
          rel: "noopener noreferrer",
          children: (0,external_wp_i18n_namespaceObject.__)('R2 Overview', 'altolith-deploy-r2')
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "altolith-manual-worker-modal__actions",
        style: {
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'flex-end'
        },
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
          className: "altolith-manual-worker-modal__close-button",
          variant: "primary",
          onClick: onClose,
          children: (0,external_wp_i18n_namespaceObject.__)('Close', 'altolith-deploy-r2')
        })
      })]
    })
  });
}
;// ./assets/src/providers/cloudflare-r2-shared/index.js
/**
 * Cloudflare R2 Shared Components
 *
 * Exports all shared documentation components for R2 providers.
 *
 * @package
 */






;// ../altolith-deploy/assets/src/profiles/ProfileRegistry.js
/**
 * Profile Registry
 *
 * Manages profile instances - the actual saved profiles that contain
 * user data (e.g., specific Cloudflare account credentials).
 *
 * Profile instances are stored in the database via REST API and cached
 * locally for quick access. This registry handles CRUD operations and
 * tracks which provider instances reference each profile.
 */




/**
 * Local cache of profile instances.
 *
 * @type {Map<string, Object>}
 */
const profiles = new Map();

/**
 * Flag indicating if profiles have been loaded from server.
 *
 * @type {boolean}
 */
let loaded = false;

/**
 * Promise for ongoing load operation (prevents duplicate fetches).
 *
 * @type {Promise|null}
 */
let loadPromise = null;

/**
 * Profile Registry
 *
 * Singleton registry for managing profile instances.
 * Handles CRUD operations via REST API and local caching.
 */
class ProfileRegistry {
  /**
   * Load all profiles from the server.
   *
   * @param {boolean} forceRefresh Force reload even if already loaded
   * @return {Promise<Array<Object>>} Array of profile objects
   */
  async loadAll(forceRefresh = false) {
    // Return cached data if already loaded and not forcing refresh
    if (loaded && !forceRefresh) {
      return this.getAll();
    }

    // Return existing promise if load is in progress
    if (loadPromise) {
      return loadPromise;
    }

    // Start new load operation
    loadPromise = this._fetchProfiles();
    try {
      const result = await loadPromise;
      return result;
    } finally {
      loadPromise = null;
    }
  }

  /**
   * Internal method to fetch profiles from server.
   *
   * @return {Promise<Array<Object>>} Array of profile objects
   */
  async _fetchProfiles() {
    try {
      const response = await external_wp_apiFetch_default()({
        path: '/altolith/deploy/profiles',
        method: 'GET'
      });

      // Clear existing cache
      profiles.clear();

      // Populate cache with fetched profiles
      if (response.profiles && Array.isArray(response.profiles)) {
        response.profiles.forEach(profile => {
          profiles.set(profile.id, profile);
        });
      }
      loaded = true;

      /**
       * Action fired after profiles are loaded from server.
       *
       * @param {Array<Object>} profiles Array of profile objects
       */
      (0,external_wp_hooks_namespaceObject.doAction)('altolith.profiles.loaded', this.getAll());
      return this.getAll();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load profiles:', error);
      throw error;
    }
  }

  /**
   * Get a profile by ID.
   *
   * @param {string} profileId Profile ID (UUID)
   * @return {Object|null} Profile object or null if not found
   */
  get(profileId) {
    return profiles.get(profileId) || null;
  }

  /**
   * Get all cached profiles.
   *
   * @return {Array<Object>} Array of profile objects
   */
  getAll() {
    return Array.from(profiles.values());
  }

  /**
   * Get profiles by category.
   *
   * @param {string} category Category ID (e.g., 'credentials', 'edge')
   * @return {Array<Object>} Array of profile objects in the category
   */
  getByCategory(category) {
    return this.getAll().filter(profile => profile.category === category);
  }

  /**
   * Get profiles by type (within a category).
   *
   * @param {string} category Category ID (e.g., 'credentials')
   * @param {string} typeId   Type ID (e.g., 'cloudflare')
   * @return {Array<Object>} Array of profile objects of the specified type
   */
  getByType(category, typeId) {
    return this.getAll().filter(profile => profile.category === category && profile.type === typeId);
  }

  /**
   * Create a new profile.
   *
   * @param {Object} profileData Profile data (name, category, type, fields)
   * @return {Promise<Object>} Created profile object
   */
  async create(profileData) {
    try {
      const response = await external_wp_apiFetch_default()({
        path: '/altolith/deploy/profiles',
        method: 'POST',
        data: profileData
      });
      if (response.profile) {
        profiles.set(response.profile.id, response.profile);

        /**
         * Action fired after a profile is created.
         *
         * @param {Object} profile The created profile
         */
        (0,external_wp_hooks_namespaceObject.doAction)('altolith.profiles.created', response.profile);
        return response.profile;
      }
      throw new Error(response.message || 'Failed to create profile');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create profile:', error);
      throw error;
    }
  }

  /**
   * Update an existing profile.
   *
   * @param {string} profileId   Profile ID (UUID)
   * @param {Object} profileData Updated profile data
   * @return {Promise<Object>} Updated profile object
   */
  async update(profileId, profileData) {
    try {
      const response = await external_wp_apiFetch_default()({
        path: `/altolith/deploy/profiles/${profileId}`,
        method: 'PUT',
        data: profileData
      });
      if (response.profile) {
        profiles.set(profileId, response.profile);

        /**
         * Action fired after a profile is updated.
         *
         * @param {Object} profile The updated profile
         */
        (0,external_wp_hooks_namespaceObject.doAction)('altolith.profiles.updated', response.profile);
        return response.profile;
      }
      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Delete a profile.
   *
   * Will fail if the profile is referenced by provider instances.
   *
   * @param {string} profileId Profile ID (UUID)
   * @return {Promise<boolean>} True if deleted successfully
   */
  async delete(profileId) {
    try {
      const response = await external_wp_apiFetch_default()({
        path: `/altolith/deploy/profiles/${profileId}`,
        method: 'DELETE'
      });
      if (response.success) {
        const deletedProfile = profiles.get(profileId);
        profiles.delete(profileId);

        /**
         * Action fired after a profile is deleted.
         *
         * @param {string} profileId The deleted profile ID
         * @param {Object} profile   The deleted profile object
         */
        (0,external_wp_hooks_namespaceObject.doAction)('altolith.profiles.deleted', profileId, deletedProfile);
        return true;
      }
      throw new Error(response.message || 'Failed to delete profile');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete profile:', error);
      throw error;
    }
  }

  /**
   * Get provider instances that reference a profile.
   *
   * @param {string} profileId Profile ID (UUID)
   * @return {Promise<Array<Object>>} Array of referencing instance objects
   */
  async getReferences(profileId) {
    try {
      const response = await external_wp_apiFetch_default()({
        path: `/altolith/deploy/profiles/${profileId}/references`,
        method: 'GET'
      });
      return response.references || [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get profile references:', error);
      throw error;
    }
  }

  /**
   * Test profile credentials.
   *
   * Calls the profile type's test endpoint to validate credentials.
   *
   * @param {string} profileId Profile ID (UUID)
   * @return {Promise<Object>} Test result with success status and message
   */
  async test(profileId) {
    try {
      const response = await external_wp_apiFetch_default()({
        path: `/altolith/deploy/profiles/${profileId}/test`,
        method: 'POST'
      });
      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to test profile:', error);
      throw error;
    }
  }

  /**
   * Check if profiles have been loaded.
   *
   * @return {boolean} True if profiles have been loaded from server
   */
  isLoaded() {
    return loaded;
  }

  /**
   * Get count of cached profiles.
   *
   * @return {number} Number of cached profiles
   */
  count() {
    return profiles.size;
  }

  /**
   * Clear the local cache.
   *
   * Does not delete profiles from server, just clears local cache.
   * Useful for testing or forcing a fresh load.
   *
   * @return {void}
   */
  clearCache() {
    profiles.clear();
    loaded = false;
    loadPromise = null;
  }

  /**
   * Register a profile in the local cache.
   *
   * Used internally after create/update operations.
   * Not typically called directly - use create() or update() instead.
   *
   * @param {Object} profile Profile object
   * @return {void}
   */
  _cacheProfile(profile) {
    if (profile && profile.id) {
      profiles.set(profile.id, profile);
    }
  }
}

// Create singleton instance
const registry = new ProfileRegistry();

// Make registry globally available so all bundles share the same instance
let exportedRegistry = registry;
if (typeof window !== 'undefined') {
  window.altolith = window.altolith || {};
  // Only create global registry if it doesn't exist (first bundle to load)
  if (!window.altolith.ProfileRegistry) {
    window.altolith.ProfileRegistry = registry;
  } else {
    // Use the global registry instead
    exportedRegistry = window.altolith.ProfileRegistry;
  }
}
/* harmony default export */ const profiles_ProfileRegistry = (exportedRegistry);
;// ./assets/src/providers/cloudflare-r2-blueprint-bundle/modal-hooks.js
/**
 * Cloudflare R2 Blueprint Bundle Provider Modal Hooks
 *
 * Adds custom content to the Cloudflare R2 blueprint bundle provider configuration modal.
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
  const [showManualSetup, setShowManualSetup] = (0,external_wp_element_namespaceObject.useState)(false);
  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    setSuccess(false);
    setWorkerUrl(null);
    try {
      // Validate required fields
      if (!config?.credential_profile || !config?.bucket_name) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('Credential profile and Bucket Name are required to deploy the worker', 'altolith-deploy-r2'));
      }

      // Resolve credentials from the selected profile
      const profile = profiles_ProfileRegistry.get(config.credential_profile);
      if (!profile || !profile.fields) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('Could not load credential profile. Please select a valid profile.', 'altolith-deploy-r2'));
      }
      const {
        account_id: accountId,
        api_token: apiToken
      } = profile.fields;
      if (!accountId || !apiToken) {
        throw new Error((0,external_wp_i18n_namespaceObject.__)('Credential profile is missing Account ID or API Token', 'altolith-deploy-r2'));
      }
      const restUrl = (window.altolithData?.restUrl || window.wpApiSettings?.root || '/wp-json').replace(/\/$/, '');

      // Get nonce for authentication from window.altolithData (set by base plugin)
      const nonce = window.altolithData?.nonce || window.wpApiSettings?.nonce || '';

      // Generate worker name (format: altolith-r2-{random})
      const randomId = Math.random().toString(36).substring(2, 10);
      const workerName = `altolith-r2-${randomId}`;

      // Prepare bindings - R2 bucket binding
      const bindings = {};
      if (config.bucket_name) {
        bindings.R2_BUCKET = {
          type: 'r2_bucket',
          bucket_name: config.bucket_name
        };
      }

      // Deploy worker using server-side REST API endpoint (avoids CORS issues)
      const deployEndpoint = `${restUrl}/altolith/deploy/providers/cloudflare/deploy-worker`;
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
          account_id: accountId,
          api_token: apiToken
        })
      });
      if (!deployResponse.ok) {
        const errorData = await deployResponse.json().catch(() => ({
          message: `HTTP ${deployResponse.status}: ${deployResponse.statusText}`
        }));
        throw new Error(errorData.message || errorData.error || (0,external_wp_i18n_namespaceObject.__)('Failed to deploy worker', 'altolith-deploy-r2'));
      }
      const result = await deployResponse.json();
      if (!result.success) {
        throw new Error(result.message || result.error || (0,external_wp_i18n_namespaceObject.__)('Failed to deploy worker', 'altolith-deploy-r2'));
      }

      // Save worker endpoint to provider config and update form field
      if (result.worker_url) {
        // Update the form field value immediately (if onChange is available)
        if (onChange && typeof onChange === 'function') {
          onChange('worker_endpoint', result.worker_url);
        }

        // Save to provider config using the provider config endpoint
        try {
          // First fetch existing config to merge with
          const existingConfigResponse = await api({
            path: `/altolith/deploy/providers/${providerId}/config`,
            method: 'GET'
          });
          const existingConfig = existingConfigResponse?.config || {};

          // Merge worker_endpoint into existing config
          await api({
            path: `/altolith/deploy/providers/${providerId}/config`,
            method: 'POST',
            data: {
              config: {
                ...existingConfig,
                worker_endpoint: result.worker_url
              }
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
      setError(err.message || (0,external_wp_i18n_namespaceObject.__)('Failed to deploy worker', 'altolith-deploy-r2'));
    } finally {
      setDeploying(false);
    }
  };
  const containerStyle = {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #ddd'
  };
  const buttonContainerStyle = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      style: buttonContainerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        variant: "secondary",
        onClick: handleDeploy,
        isBusy: deploying,
        disabled: deploying || !config?.credential_profile || !config?.bucket_name,
        children: deploying ? (0,external_wp_i18n_namespaceObject.__)('Deploying…', 'altolith-deploy-r2') : (0,external_wp_i18n_namespaceObject.__)('Deploy Worker', 'altolith-deploy-r2')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        variant: "tertiary",
        onClick: () => setShowManualSetup(true),
        children: (0,external_wp_i18n_namespaceObject.__)('Manual Setup', 'altolith-deploy-r2')
      })]
    }), error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
        status: "error",
        isDismissible: false,
        style: {
          marginTop: '0.5rem'
        },
        children: error
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(DeploymentErrorHelp, {
        errorType: "worker_deployment"
      })]
    }), success && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.Notice, {
      status: "success",
      isDismissible: false,
      style: {
        marginTop: '0.5rem'
      },
      children: [(0,external_wp_i18n_namespaceObject.__)('Worker deployed successfully!', 'altolith-deploy-r2'), workerUrl && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        style: {
          marginTop: '0.5rem'
        },
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: (0,external_wp_i18n_namespaceObject.__)('Worker URL:', 'altolith-deploy-r2')
        }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
          href: workerUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          children: workerUrl
        })]
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ManualWorkerSetupModal, {
      isOpen: showManualSetup,
      onClose: () => setShowManualSetup(false),
      bucketName: config?.bucket_name
    })]
  });
}

/**
 * Initialize modal hooks for Cloudflare R2 provider.
 *
 * Uses filters to inject documentation and help content into the provider modal:
 * - Modal header: Setup guide with API permissions
 * - After api_token field: Token creation help
 * - After worker_endpoint field: Deploy Worker button
 *
 * @param {string} providerIdPrefix Provider ID prefix to match (e.g., 'cloudflare-r2-blueprint-bundle').
 */
function initCloudflareR2ModalHooks(providerIdPrefix) {
  // Add setup guide at the top of the modal
  (0,external_wp_hooks_namespaceObject.addFilter)('altolith.admin.provider.modal.header', `altolith/${providerIdPrefix}/setup-guide`, (content, context) => {
    // Only show for matching provider
    if (!context.providerId?.startsWith(providerIdPrefix)) {
      return content;
    }
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(R2SetupGuide, {});
  });

  // Add API token help section after api_token field
  (0,external_wp_hooks_namespaceObject.addFilter)('altolith.admin.provider.field.after', `altolith/${providerIdPrefix}/api-token-help`, (content, context) => {
    // Only add after api_token field for matching provider
    if (context.fieldId !== 'api_token' || !context.providerId?.startsWith(providerIdPrefix)) {
      return content;
    }
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
      children: [content, /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(APITokenHelpSection, {})]
    });
  }, 5 // Priority 5 to run before other field.after filters
  );

  // Hook into the field-level after filter to add Deploy Worker button
  // after the worker_endpoint field
  (0,external_wp_hooks_namespaceObject.addFilter)('altolith.admin.provider.field.after', `altolith/${providerIdPrefix}/deploy-button`, (content, context) => {
    // Only add button after worker_endpoint field for matching provider
    if (context.fieldId !== 'worker_endpoint' || !context.providerId?.startsWith(providerIdPrefix)) {
      return content;
    }

    // Return the DeployWorkerButton component
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
      children: [content, /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(DeployWorkerButton, {
        providerId: context.providerId,
        config: context.formValues || {},
        onChange: context.onFormChange
      })]
    });
  }, 10 // Priority 10 (default)
  );
}
;// ../altolith-deploy/assets/src/providers/registry/ProviderRegistry.js
/**
 * Provider Registry
 *
 * JavaScript-based provider registry that collects providers from
 * altolith.providers.register hooks. This replaces the PHP ProviderRegistry.
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
    (0,external_wp_hooks_namespaceObject.doAction)('altolith.providers.registered', providerId, ProviderClass);
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
const ProviderRegistry_registry = new ProviderRegistry();

/**
 * Hook into altolith.providers.register to auto-register providers.
 *
 * When providers call doAction('altolith.providers.register', ProviderClass),
 * this will automatically register them.
 */
(0,external_wp_hooks_namespaceObject.addAction)('altolith.providers.register', 'altolith/provider-registry', ProviderClass => {
  if (!ProviderClass || typeof ProviderClass !== 'function') {
    return;
  }

  // Get provider ID from static property
  const providerId = ProviderClass.ID;
  if (!providerId) {
    return; // Invalid provider - must have static ID
  }

  // Register the provider class
  ProviderRegistry_registry.register(providerId, ProviderClass);
});

// Make registry globally available so all bundles share the same instance
// This is necessary because webpack creates separate module instances for each bundle
let ProviderRegistry_exportedRegistry = ProviderRegistry_registry;
if (typeof window !== 'undefined') {
  window.altolith = window.altolith || {};
  // Only create global registry if it doesn't exist (first bundle to load)
  if (!window.altolith.ProviderRegistry) {
    window.altolith.ProviderRegistry = ProviderRegistry_registry;
  } else {
    // If registry already exists, use the global one and sync providers
    const globalRegistry = window.altolith.ProviderRegistry;
    // Copy any providers from this instance to the global one
    const localProviders = Array.from(providers.values());
    localProviders.forEach(ProviderClass => {
      const providerId = ProviderClass.ID;
      if (!globalRegistry.get(providerId)) {
        globalRegistry.register(providerId, ProviderClass);
      }
    });
    // Use the global registry instead
    ProviderRegistry_exportedRegistry = globalRegistry;
  }
}
/* harmony default export */ const registry_ProviderRegistry = (ProviderRegistry_exportedRegistry);
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
    xhr.setRequestHeader('X-R2-Key', encodeURIComponent(key));
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
      'X-R2-Key': encodeURIComponent(key),
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
    this.providerId = config.provider_id || '';
    this.pathPrefix = config.path || '';
  }

  /**
   * Get the full storage key with path prefix applied.
   *
   * @param {string} key Original key.
   * @return {string} Key with path prefix prepended.
   */
  getFullKey(key) {
    if (!this.pathPrefix) {
      return key;
    }
    // Normalize: ensure prefix ends with / and key doesn't start with /
    const prefix = this.pathPrefix.replace(/\/$/, '') + '/';
    const normalizedKey = key.replace(/^\//, '');
    return prefix + normalizedKey;
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
    const fullKey = this.getFullKey(key);
    const options = {
      contentType: metadata.contentType || file.type,
      cacheControl: metadata.cacheControl || '',
      onProgress: metadata.onProgress || null
    };
    const result = await uploadFile(this.workerEndpoint, fullKey, file, options);
    if (!result.success) {
      return result;
    }

    // Build public URL using original key for URL generation.
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
    const fullKey = this.getFullKey(key);
    return deleteFile(this.workerEndpoint, fullKey);
  }

  /**
   * Copy an object from source to destination within storage.
   *
   * @param {string} sourceKey Source object key.
   * @param {string} destKey   Destination object key.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async copy(sourceKey, destKey) {
    const fullSourceKey = this.getFullKey(sourceKey);
    const fullDestKey = this.getFullKey(destKey);
    return copyFile(this.workerEndpoint, fullSourceKey, fullDestKey);
  }

  /**
   * Check if a file exists in storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<boolean>} True if exists, false otherwise.
   */
  async exists(key) {
    const fullKey = this.getFullKey(key);
    // List objects with prefix matching the exact key.
    const result = await listObjects(this.workerEndpoint, fullKey, 1);
    if (!result.success) {
      return false;
    }
    const objects = result.objects || [];
    return objects.some(obj => obj.key === fullKey);
  }

  /**
   * List objects in storage.
   *
   * @param {string} prefix Optional prefix to filter objects.
   * @param {number} limit  Maximum number of objects to return.
   * @return {Promise<Object>} Result array with 'success', 'objects' array, and optional 'error'.
   */
  async listObjects(prefix = '', limit = 1000) {
    const fullPrefix = this.getFullKey(prefix);
    return listObjects(this.workerEndpoint, fullPrefix, limit);
  }

  /**
   * Get public URL for an object.
   *
   * @param {string} key Object key/path.
   * @return {string} Public URL.
   */
  getUrl(key) {
    const fullKey = this.getFullKey(key);
    // Use public_url if available (e.g., custom domain)
    if (this.config.public_url) {
      const baseUrl = this.config.public_url.replace(/\/$/, '');
      return `${baseUrl}/${fullKey}`;
    }
    // Fallback to worker endpoint URL
    return getObjectUrl(this.workerEndpoint, this.bucketName, fullKey);
  }

  /**
   * Batch copy multiple objects in storage.
   *
   * @param {Array} operations Array of {source, dest} objects.
   * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
   */
  async batchCopy(operations) {
    const prefixedOperations = operations.map(op => ({
      source: this.getFullKey(op.source),
      dest: this.getFullKey(op.dest)
    }));
    return batchCopy(this.workerEndpoint, prefixedOperations);
  }

  /**
   * Batch delete multiple objects from storage.
   *
   * @param {Array} keys Array of object keys to delete.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async batchDelete(keys) {
    const prefixedKeys = keys.map(key => this.getFullKey(key));
    return batchDelete(this.workerEndpoint, prefixedKeys);
  }

  /**
   * Download manifest file from storage.
   *
   * Uses providerId from config to build manifest path, matching base plugin's interface.
   *
   * @return {Promise<Blob|null>} Manifest blob or null if not found.
   */
  async downloadManifest() {
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
    const fullKey = this.getFullKey(manifestKey);
    try {
      const blob = await downloadFile(this.workerEndpoint, fullKey);
      return blob;
    } catch (error) {
      // Return null if file doesn't exist (404) or other error.
      return null;
    }
  }

  /**
   * Upload manifest file to storage.
   *
   * Uses providerId from config to build manifest path, matching base plugin's interface.
   *
   * @param {Blob} blob Manifest blob to upload.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async uploadManifest(blob) {
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
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
    // Use listObjectsFromWorker directly without path prefix for connection test
    const result = await listObjects(this.workerEndpoint, '', 1);
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
;// ./assets/src/providers/cloudflare-r2-blueprint-bundle/index.js
/**
 * Cloudflare R2 Blueprint Bundle Provider Registration
 *
 * Registers the Cloudflare R2 blueprint bundle provider handlers via WordPress hooks.
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
      path: `/altolith/deploy/providers/${providerId}/config`,
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
registry_ProviderRegistry.register(CloudflareR2BlueprintBundleProvider.ID, CloudflareR2BlueprintBundleProvider);

// Also trigger the hook for any listeners
(0,external_wp_hooks_namespaceObject.doAction)('altolith.providers.register', CloudflareR2BlueprintBundleProvider);

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
    public_url: config.public_url || null,
    provider_id: providerId,
    path: config.path || ''
  });
}

/**
 * Handle unified file upload for blueprint bundle provider.
 *
 * @param {Object} fileContext Unified file context from altolith.file.upload action.
 * @return {Promise<void>}
 */
async function handleUnifiedFileUpload(fileContext) {
  const {
    fileType,
    providerId,
    filePath,
    storageKey
  } = fileContext;

  // Only handle requests for cloudflare-r2-blueprint-bundle providers
  if (!providerId || !providerId.startsWith('cloudflare-r2-blueprint-bundle')) {
    return;
  }

  // Only handle blueprint bundle uploads
  if (fileType !== 'blueprint-bundle') {
    return;
  }

  // Create a unique key for this file+provider combination
  const fileKey = `${providerId}:${storageKey || filePath}`;

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

      // Get bundle path from config or use default
      const config = await loadProviderConfig(providerId);
      const bundleKey = storageKey || config?.bundle_path || 'blueprint-bundle/bundle.zip';
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
(0,external_wp_hooks_namespaceObject.addAction)('altolith.file.upload', 'altolith/cloudflare-r2-blueprint-bundle', fileContext => {
  if (!fileContext._uploadPromises) {
    fileContext._uploadPromises = [];
  }
  fileContext._uploadPromises.push(handleUnifiedFileUpload(fileContext));
}, 10);

/**
 * Register test connection handler hook.
 */
(0,external_wp_hooks_namespaceObject.addFilter)('altolith.provider.test', 'altolith/cloudflare-r2-blueprint-bundle', (handler, providerId) => {
  if (!providerId?.startsWith('cloudflare-r2-blueprint-bundle')) {
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
(0,external_wp_hooks_namespaceObject.addFilter)('altolith.provider.upload_strategy', 'altolith/cloudflare-r2-blueprint-bundle', (strategy, providerId) => {
  if (providerId?.startsWith('cloudflare-r2-blueprint-bundle')) {
    return 'worker';
  }
  return strategy;
}, 10);

// Initialize modal hooks
initCloudflareR2ModalHooks('cloudflare-r2-blueprint-bundle');
/******/ })()
;