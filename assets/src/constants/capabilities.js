/**
 * Provider Capability Constants
 *
 * Centralized capability names for provider features
 *
 * @package
 */

/**
 * Provider Capabilities
 *
 * Standard capability identifiers that providers can support.
 * Use these constants to check what features a provider supports.
 */

/**
 * Storage capability - provider can store files
 * @constant {string}
 */
export const CAP_STORAGE = 'storage';

/**
 * Static site hosting capability - provider can host static sites
 * @constant {string}
 */
export const CAP_STATIC_SITE = 'static-site';

/**
 * CDN capability - provider offers CDN distribution
 * @constant {string}
 */
export const CAP_CDN = 'cdn';

/**
 * Analytics capability - provider offers analytics/metrics
 * @constant {string}
 */
export const CAP_ANALYTICS = 'analytics';

/**
 * Custom domain capability - provider supports custom domains
 * @constant {string}
 */
export const CAP_CUSTOM_DOMAIN = 'custom-domain';

/**
 * SSL/TLS capability - provider supports HTTPS
 * @constant {string}
 */
export const CAP_SSL = 'ssl';

/**
 * Caching capability - provider offers caching features
 * @constant {string}
 */
export const CAP_CACHE = 'cache';

/**
 * Image optimization capability - provider can optimize images
 * @constant {string}
 */
export const CAP_IMAGE_OPTIMIZATION = 'image-optimization';

/**
 * Video streaming capability - provider supports video streaming
 * @constant {string}
 */
export const CAP_VIDEO_STREAMING = 'video-streaming';

/**
 * Capability Groups
 *
 * Predefined sets of capabilities for common provider types.
 */

/**
 * Core capabilities required for basic functionality
 * @constant {string[]}
 */
export const CORE_CAPABILITIES = [ CAP_STORAGE ];

/**
 * Capabilities for a full-featured static site host
 * @constant {string[]}
 */
export const STATIC_SITE_CAPABILITIES = [
	CAP_STORAGE,
	CAP_STATIC_SITE,
	CAP_CDN,
	CAP_CUSTOM_DOMAIN,
	CAP_SSL,
];

/**
 * Capability Labels
 *
 * Human-readable labels for each capability.
 */
export const CAPABILITY_LABELS = {
	[ CAP_STORAGE ]: 'Storage',
	[ CAP_STATIC_SITE ]: 'Static Site Hosting',
	[ CAP_CDN ]: 'CDN',
	[ CAP_ANALYTICS ]: 'Analytics',
	[ CAP_CUSTOM_DOMAIN ]: 'Custom Domain',
	[ CAP_SSL ]: 'SSL/TLS',
	[ CAP_CACHE ]: 'Caching',
	[ CAP_IMAGE_OPTIMIZATION ]: 'Image Optimization',
	[ CAP_VIDEO_STREAMING ]: 'Video Streaming',
};

/**
 * Capability Descriptions
 *
 * Detailed descriptions for each capability.
 */
export const CAPABILITY_DESCRIPTIONS = {
	[ CAP_STORAGE ]: 'Store and retrieve files (blueprints, archives, assets)',
	[ CAP_STATIC_SITE ]:
		'Host static HTML/CSS/JS sites with global distribution',
	[ CAP_CDN ]: 'Content delivery network for fast global access',
	[ CAP_ANALYTICS ]: 'Track usage, visitors, and performance metrics',
	[ CAP_CUSTOM_DOMAIN ]: 'Use your own domain name',
	[ CAP_SSL ]: 'Secure connections with HTTPS/TLS',
	[ CAP_CACHE ]: 'Cache content for improved performance',
	[ CAP_IMAGE_OPTIMIZATION ]: 'Automatic image resizing and optimization',
	[ CAP_VIDEO_STREAMING ]: 'Adaptive video streaming with HLS/DASH',
};

/**
 * Capability Requirements
 *
 * Defines which capabilities are required for specific features.
 */

/**
 * Required capabilities for export workflow
 * @constant {string[]}
 */
export const PUBLISH_REQUIRED_CAPABILITIES = [ CAP_STORAGE ];

/**
 * Required capabilities for static site generation
 * @constant {string[]}
 */
export const STATIC_SITE_REQUIRED_CAPABILITIES = [
	CAP_STORAGE,
	CAP_STATIC_SITE,
];

/**
 * Helper Functions
 */

/**
 * Get capability label
 *
 * @param {string} capability - Capability constant
 * @return {string} Human-readable label
 */
export function getCapabilityLabel( capability ) {
	return CAPABILITY_LABELS[ capability ] || capability;
}

/**
 * Get capability description
 *
 * @param {string} capability - Capability constant
 * @return {string} Detailed description
 */
export function getCapabilityDescription( capability ) {
	return CAPABILITY_DESCRIPTIONS[ capability ] || '';
}

/**
 * Check if capabilities meet requirements
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @param {string[]} requiredCapabilities - Capabilities that are required
 * @return {boolean} True if all required capabilities are supported
 */
export function hasRequiredCapabilities(
	providerCapabilities,
	requiredCapabilities
) {
	return requiredCapabilities.every( ( cap ) =>
		providerCapabilities.includes( cap )
	);
}

/**
 * Check if provider can handle export workflow
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @return {boolean} True if provider can handle export
 */
export function canPublish( providerCapabilities ) {
	return hasRequiredCapabilities(
		providerCapabilities,
		PUBLISH_REQUIRED_CAPABILITIES
	);
}

/**
 * Check if provider can host static sites
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @return {boolean} True if provider can host static sites
 */
export function canHostStaticSite( providerCapabilities ) {
	return hasRequiredCapabilities(
		providerCapabilities,
		STATIC_SITE_REQUIRED_CAPABILITIES
	);
}

/**
 * Get missing capabilities
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @param {string[]} requiredCapabilities - Capabilities that are required
 * @return {string[]} Array of missing capability identifiers
 */
export function getMissingCapabilities(
	providerCapabilities,
	requiredCapabilities
) {
	return requiredCapabilities.filter(
		( cap ) => ! providerCapabilities.includes( cap )
	);
}
