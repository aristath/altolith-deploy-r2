/**
 * Asset Discovery Hook
 *
 * Replaces PHP-based AssetDiscoveryService with browser-based implementation.
 * Detects WordPress.org plugins/themes by checking wordpress.org URLs.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import { debugWarn } from './debug';
import apiFetch from './api';
import { getWpOrgCache } from './wporgCache';

/**
 * Normalize plugin slug to directory name only.
 * WordPress stores plugins as 'akismet/akismet.php' but WordPress.org expects just 'akismet'.
 *
 * @param {string} slug - Plugin slug (may include file path)
 * @return {string} Normalized slug (directory name only)
 */
export function normalizePluginSlug( slug ) {
	// If slug contains a slash, extract just the directory name (first part)
	// Example: 'akismet/akismet.php' -> 'akismet'
	if ( slug.includes( '/' ) ) {
		return slug.split( '/' )[ 0 ];
	}
	return slug;
}

/**
 * Check if a plugin or theme exists on WordPress.org
 *
 * Uses filterable method (default: PHP server-side) to check WordPress.org.
 * Can be switched to CORS proxy or direct API calls via WordPress filters.
 *
 * @param {string} slug   - Plugin or theme slug (will be normalized for plugins)
 * @param {string} type   - 'plugin' or 'theme'
 * @param {Object} config - Configuration object with wporgCheckMethod and corsProxyUrl
 * @return {Promise<boolean>} True if asset exists on WordPress.org
 */
export async function isFromWordPressOrg( slug, type, config = {} ) {
	// Normalize plugin slugs (remove file path if present)
	// Example: 'akismet/akismet.php' -> 'akismet'
	const normalizedSlug =
		type === 'plugin' ? normalizePluginSlug( slug ) : slug;

	// Check persistent cache first (IndexedDB + memory)
	const cache = getWpOrgCache();
	const cached = await cache.get( normalizedSlug, type );
	if ( cached !== null ) {
		return cached;
	}

	// Try PHP method first, then fallback to CORS proxy
	let result = await checkWithMethod( normalizedSlug, type, 'php', config );

	// If PHP method returned null (unable to check), try CORS proxy fallback
	if ( result === null ) {
		debugWarn(
			`PHP WordPress.org check returned null for ${ type } "${ slug }", trying CORS proxy fallback`
		);
		result = await checkWithMethod(
			normalizedSlug,
			type,
			'cors-proxy',
			config
		);
	}

	// If still null after fallback, treat as false
	if ( result === null ) {
		debugWarn(
			`All WordPress.org check methods failed for ${ type } "${ slug }", treating as custom asset`
		);
		result = false;
	}

	// Cache the result (only if we got a definitive answer)
	if ( result !== null ) {
		await cache.set( normalizedSlug, type, result );
	}

	return result;
}

/**
 * Check WordPress.org using specific method
 *
 * @param {string} slug   - Normalized plugin/theme slug
 * @param {string} type   - 'plugin' or 'theme'
 * @param {string} method - 'php', 'cors-proxy', or 'direct'
 * @param {Object} config - Configuration object
 * @return {Promise<boolean|null>} True if exists, false if doesn't exist, null if unable to check
 */
async function checkWithMethod( slug, type, method, config = {} ) {
	try {
		let checkUrl;

		switch ( method ) {
			case 'cors-proxy':
				// Use external CORS proxy (e.g., cfp.s12y.org or custom worker)
				checkUrl =
					config.corsProxyUrl || 'https://cfp.s12y.org/check-wporg';
				checkUrl += `?slug=${ encodeURIComponent(
					slug
				) }&type=${ encodeURIComponent( type ) }`;
				break;

			case 'direct':
				// Direct WordPress.org API calls (will fail in browsers due to CORS)
				if ( type === 'theme' ) {
					checkUrl = `https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=${ encodeURIComponent(
						slug
					) }`;
				} else {
					checkUrl = `https://api.wordpress.org/plugins/info/1.0/${ encodeURIComponent(
						slug
					) }.json`;
				}
				break;

			case 'php':
			default:
				// PHP server-side method (default, no CORS issues)
				// apiFetch expects path without /wp-json prefix
				checkUrl = `/aether/site-exporter/check-wporg?slug=${ encodeURIComponent(
					slug
				) }&type=${ encodeURIComponent( type ) }`;
				break;
		}

		// For PHP method, use apiFetch (includes WordPress auth)
		// For other methods, use plain fetch
		let data;
		if ( method === 'php' ) {
			// Use apiFetch for internal WordPress REST API calls
			// This includes nonce and authentication automatically
			data = await apiFetch( { path: checkUrl } );
		} else {
			// Use plain fetch for external URLs (cors-proxy, direct)
			const response = await fetch( checkUrl );

			if ( ! response.ok ) {
				throw new Error(
					`WordPress.org check returned ${ response.status }`
				);
			}

			data = await response.json();
		}

		// Handle different response formats
		let exists;
		if ( method === 'direct' ) {
			// Direct WordPress.org API: check for 'error' field
			exists = ! data.error && ( data.slug || data.name );
		} else {
			// PHP or CORS proxy: standardized response with 'success' and 'exists' fields
			if ( ! data.success ) {
				throw new Error( data.error || 'Unknown error' );
			}
			exists = data.exists;
		}

		// Return the result (could be true, false, or null)
		// null means "unable to check" and should trigger fallback
		return exists;
	} catch ( error ) {
		// Network/API error - return null to indicate unable to check
		debugWarn(
			`Failed to check WordPress.org for ${ type } "${ slug }" using ${ method } method:`,
			error
		);
		return null;
	}
}

/**
 * Get all installed plugins and themes with metadata from REST API
 *
 * @return {Promise<Object>} Object with plugins and themes arrays
 */
async function getInstalledAssets() {
	try {
		const response = await apiFetch( {
			path: '/aether/site-exporter/assets',
			method: 'GET',
		} );

		if ( ! response.success ) {
			throw new Error( response.error || 'Failed to fetch assets' );
		}

		return {
			plugins: response.plugins || [],
			themes: response.themes || [],
		};
	} catch ( error ) {
		debugWarn( 'Failed to fetch installed assets:', error );
		return {
			plugins: [],
			themes: [],
		};
	}
}

/**
 * Asset Discovery Hook
 *
 * Provides methods to discover and categorize installed plugins/themes.
 *
 * @return {Object} Hook methods and state
 */
export default function useAssetDiscovery() {
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	/**
	 * Discover all custom assets (not from WordPress.org)
	 *
	 * @return {Promise<Array<Object>>} Array of custom assets
	 */
	const discoverCustomAssets = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			// Fetch config to get wporgCheckMethod
			const configResponse = await apiFetch( {
				path: '/aether/site-exporter/config',
				method: 'GET',
			} );

			const config = configResponse || {};

			const { plugins, themes } = await getInstalledAssets();

			// Only include active plugins and themes (like getBlueprintAssets does)
			// This ensures the message shows only what will actually be included in the bundle
			const activePlugins = plugins.filter(
				( plugin ) => plugin.is_active
			);

			// Get active theme (themes array should only have one active theme)
			const activeTheme = themes.find( ( theme ) => theme.is_active );
			const activeThemes = activeTheme ? [ activeTheme ] : [];

			// Check each asset against WordPress.org
			// Method is configurable via filters (default: PHP server-side)
			const items = [
				...activePlugins.map( ( p ) => ( {
					...p,
					assetType: 'plugin',
				} ) ),
				...activeThemes.map( ( t ) => ( {
					...t,
					assetType: 'theme',
				} ) ),
			];

			// Check all assets in parallel
			const allAssets = await Promise.all(
				items.map( async ( item ) => {
					const fromWpOrg = await isFromWordPressOrg(
						item.slug,
						item.assetType,
						config
					);
					return {
						...item,
						from_wporg: fromWpOrg,
					};
				} )
			);

			// Filter to only custom assets (not from WordPress.org)
			const customAssets = allAssets
				.filter( ( asset ) => ! asset.from_wporg )
				.map( ( asset ) => ( {
					type: asset.assetType,
					slug: asset.slug,
					name: asset.name,
					version: asset.version,
				} ) );

			setLoading( false );
			return customAssets;
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [] );

	/**
	 * Get WordPress.org assets for blueprint generation
	 *
	 * Returns only active plugins/themes from WordPress.org.
	 * Custom assets will be included in wp-content.zip.
	 *
	 * @return {Promise<Object>} Object with plugins and themes arrays
	 */
	const getBlueprintAssets = useCallback( async () => {
		setLoading( true );
		setError( null );

		try {
			// Fetch config to get wporgCheckMethod
			const configResponse = await apiFetch( {
				path: '/aether/site-exporter/config',
				method: 'GET',
			} );

			const config = configResponse || {};

			const { plugins, themes } = await getInstalledAssets();

			// Only check active plugins
			const activePlugins = plugins.filter(
				( plugin ) => plugin.is_active
			);

			// Get active theme and parent themes
			const activeTheme = themes.find( ( theme ) => theme.is_active );
			const activeThemes = activeTheme ? [ activeTheme ] : [];

			// Check each asset against WordPress.org
			// Method is configurable via filters (default: PHP server-side)
			const items = [
				...activePlugins.map( ( p ) => ( {
					...p,
					assetType: 'plugin',
				} ) ),
				...activeThemes.map( ( t ) => ( {
					...t,
					assetType: 'theme',
				} ) ),
			];

			// Check all assets in parallel
			const allAssets = await Promise.all(
				items.map( async ( item ) => {
					const fromWpOrg = await isFromWordPressOrg(
						item.slug,
						item.assetType,
						config
					);
					return {
						...item,
						from_wporg: fromWpOrg,
					};
				} )
			);

			// Filter to only WordPress.org assets
			const wporgPlugins = allAssets
				.filter(
					( asset ) =>
						asset.assetType === 'plugin' && asset.from_wporg
				)
				.filter(
					( plugin ) =>
						// Skip plugins that are built into Playground or already included
						! [ 'aether', 'sqlite-database-integration' ].includes(
							normalizePluginSlug( plugin.slug )
						)
				)
				.map( ( plugin ) => normalizePluginSlug( plugin.slug ) );

			const wporgThemes = allAssets
				.filter(
					( asset ) => asset.assetType === 'theme' && asset.from_wporg
				)
				.map( ( theme ) => normalizePluginSlug( theme.slug ) );

			setLoading( false );
			return {
				plugins: wporgPlugins,
				themes: wporgThemes,
				siteName: window.wp?.siteName || document.title,
			};
		} catch ( err ) {
			setError( err.message );
			setLoading( false );
			throw err;
		}
	}, [] );

	return {
		discoverCustomAssets,
		getBlueprintAssets,
		loading,
		error,
	};
}
