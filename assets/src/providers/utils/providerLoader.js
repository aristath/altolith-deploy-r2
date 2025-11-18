/**
 * Provider Registry Loader
 *
 * Dynamically loads providers on demand to reduce initial bundle size.
 * Loads providers via script tags for separate bundles.
 *
 * Features:
 * - Dynamic script loading with retries
 * - Loading state tracking
 * - Error handling and reporting
 * - Concurrent load support
 * - PHP-enqueued script detection
 *
 * @package
 */

import ProviderRegistry from '../registry/ProviderRegistry';
import { debugError, debugWarn } from '../../utils/debug';

/**
 * Track loading states for providers.
 * Prevents duplicate loads and provides loading status.
 */
const loadingStates = new Map();

/**
 * Loading state constants.
 *
 * @constant
 * @type {Object}
 * @property {string} IDLE    - Provider not loaded yet
 * @property {string} LOADING - Provider currently loading
 * @property {string} LOADED  - Provider loaded successfully
 * @property {string} ERROR   - Provider failed to load
 */
export const LOAD_STATE = {
	IDLE: 'idle',
	LOADING: 'loading',
	LOADED: 'loaded',
	ERROR: 'error',
};

/**
 * Get loading state for a provider.
 *
 * @param {string} providerId - Provider ID
 * @return {string} Loading state (idle, loading, loaded, error)
 */
function getLoadingState( providerId ) {
	return loadingStates.get( providerId ) || LOAD_STATE.IDLE;
}

/**
 * Set loading state for a provider.
 *
 * @param {string} providerId - Provider ID
 * @param {string} state      - Loading state
 * @param {Error}  [error]    - Error object if state is ERROR
 */
function setLoadingState( providerId, state, error = null ) {
	loadingStates.set( providerId, state );

	// Emit custom event for tracking
	const event = new CustomEvent( 'aether:provider-load-state', {
		detail: { providerId, state, error },
	} );
	document.dispatchEvent( event );
}

/**
 * Check if provider is currently loading.
 *
 * @param {string} providerId - Provider ID
 * @return {boolean} Whether provider is loading
 */
export function isProviderLoading( providerId ) {
	return getLoadingState( providerId ) === LOAD_STATE.LOADING;
}

/**
 * Check if provider is loaded.
 *
 * @param {string} providerId - Provider ID
 * @return {boolean} Whether provider is loaded
 */
export function isProviderLoaded( providerId ) {
	return (
		getLoadingState( providerId ) === LOAD_STATE.LOADED ||
		ProviderRegistry.has( providerId )
	);
}

/**
 * Get all loading states.
 *
 * @return {Map<string, string>} Map of provider IDs to loading states
 */
export function getAllLoadingStates() {
	return new Map( loadingStates );
}

/**
 * Get the provider script URL.
 *
 * @param {string} providerId - Provider ID
 * @return {string|null} Script URL or null if not found
 */
function getProviderScriptUrl( providerId ) {
	// First, try to find script tag by data-provider-id attribute (for PHP-enqueued scripts)
	const existingScript = document.querySelector(
		`script[data-provider-id="${ providerId }"]`
	);
	if ( existingScript && existingScript.src ) {
		return existingScript.src;
	}

	// Second, try to find script tag by src pattern
	const scriptName = `provider-${ providerId }.js`;
	const scripts = document.querySelectorAll( 'script[src]' );
	for ( const script of scripts ) {
		if ( script.src && script.src.includes( scriptName ) ) {
			return script.src;
		}
	}

	// Fallback: construct URL from known script base
	const baseUrl = window.aether?.providerScriptsBaseUrl || '';
	return baseUrl ? `${ baseUrl }provider-${ providerId }.js` : null;
}

/**
 * Load a provider script dynamically.
 *
 * @param {string} providerId      - Provider ID to load
 * @param {number} [attempt=1]     - Current attempt number (for retries)
 * @param {number} [maxAttempts=3] - Maximum retry attempts
 * @return {Promise<void>} Resolves when provider is loaded and registered
 * @throws {Error} If loading fails after max attempts
 */
function loadProviderScript( providerId, attempt = 1, maxAttempts = 3 ) {
	return new Promise( ( resolve, reject ) => {
		// Check if already loaded
		if ( ProviderRegistry.has( providerId ) ) {
			setLoadingState( providerId, LOAD_STATE.LOADED );
			resolve();
			return;
		}

		// Check if currently loading (another call initiated load)
		if ( getLoadingState( providerId ) === LOAD_STATE.LOADING ) {
			// Wait for existing load to complete
			const checkInterval = setInterval( () => {
				const state = getLoadingState( providerId );
				if (
					state === LOAD_STATE.LOADED &&
					ProviderRegistry.has( providerId )
				) {
					clearInterval( checkInterval );
					resolve();
				} else if ( state === LOAD_STATE.ERROR ) {
					clearInterval( checkInterval );
					reject(
						new Error(
							`Provider ${ providerId } failed to load (another load attempt failed)`
						)
					);
				}
			}, 100 );

			// Timeout after 10 seconds
			setTimeout( () => {
				clearInterval( checkInterval );
				if ( ! ProviderRegistry.has( providerId ) ) {
					reject(
						new Error(
							`Timeout waiting for provider ${ providerId } to load`
						)
					);
				}
			}, 10000 );

			return;
		}

		// Mark as loading
		setLoadingState( providerId, LOAD_STATE.LOADING );

		// Check if script is already being loaded or already in DOM
		const scriptId = `aether-provider-${ providerId }`;
		const existingScript = document.getElementById( scriptId );

		// Also check for PHP-enqueued script with data-provider-id attribute
		const phpEnqueuedScript = document.querySelector(
			`script[data-provider-id="${ providerId }"]`
		);

		if ( existingScript || phpEnqueuedScript ) {
			// Script already in DOM (either being loaded or PHP-enqueued), wait for it to load
			// Check if script has already loaded
			// For scripts in DOM, check if they've executed by polling for provider registration
			// This is more reliable than checking readyState which may not be available
			let checkCount = 0;
			const maxChecks = 100; // 10 seconds total (100 * 100ms)

			const checkInterval = setInterval( () => {
				checkCount++;
				// Force auto-discovery to ensure registry is up to date
				// Pass true to force re-discovery of newly loaded providers
				ProviderRegistry.autoDiscover( true );

				if ( ProviderRegistry.has( providerId ) ) {
					clearInterval( checkInterval );
					setLoadingState( providerId, LOAD_STATE.LOADED );
					resolve();
					return;
				}

				// If we've checked many times and provider still not registered, give up
				if ( checkCount >= maxChecks ) {
					clearInterval( checkInterval );
					// Final check with forced auto-discovery
					ProviderRegistry.autoDiscover( true );
					if ( ProviderRegistry.has( providerId ) ) {
						setLoadingState( providerId, LOAD_STATE.LOADED );
						resolve();
					} else {
						const error = new Error(
							`Provider ${ providerId } failed to register after script was found in DOM`
						);
						setLoadingState( providerId, LOAD_STATE.ERROR, error );
						reject( error );
					}
				}
			}, 100 ); // Check every 100ms

			return; // Don't create new script element
		}

		// Get script URL
		const scriptUrl = getProviderScriptUrl( providerId );
		if ( ! scriptUrl ) {
			// Provider script not found - this is OK, it may not be enqueued
			// (e.g., provider not configured, or providers are bundled elsewhere)
			// Just mark as idle and resolve silently
			setLoadingState( providerId, LOAD_STATE.IDLE );
			resolve();
			return;
		}

		// Create script element
		const script = document.createElement( 'script' );
		script.id = scriptId;
		script.src = scriptUrl;
		script.async = true;

		script.onload = () => {
			// Wait a bit for the provider to register
			let checkCount = 0;
			const maxChecks = 100; // 5 seconds total (100 * 50ms)

			const checkInterval = setInterval( () => {
				checkCount++;
				// Force auto-discovery to ensure registry is up to date
				// Pass true to force re-discovery of newly loaded providers
				ProviderRegistry.autoDiscover( true );

				if ( ProviderRegistry.has( providerId ) ) {
					clearInterval( checkInterval );
					setLoadingState( providerId, LOAD_STATE.LOADED );
					resolve();
					return;
				}

				// Timeout after max checks
				if ( checkCount >= maxChecks ) {
					clearInterval( checkInterval );
					// Final check with forced auto-discovery
					ProviderRegistry.autoDiscover( true );
					if ( ProviderRegistry.has( providerId ) ) {
						setLoadingState( providerId, LOAD_STATE.LOADED );
						resolve();
					} else {
						const error = new Error(
							`Provider ${ providerId } registered but not found in registry`
						);
						setLoadingState( providerId, LOAD_STATE.ERROR, error );
						reject( error );
					}
				}
			}, 50 );
		};

		script.onerror = () => {
			const error = new Error(
				`Failed to load provider script: ${ providerId } (attempt ${ attempt }/${ maxAttempts })`
			);

			// Retry if not at max attempts
			if ( attempt < maxAttempts ) {
				debugWarn(
					`Retrying provider load: ${ providerId } (attempt ${
						attempt + 1
					}/${ maxAttempts })`
				);

				// Remove failed script
				script.remove();

				// Reset loading state before retry
				setLoadingState( providerId, LOAD_STATE.IDLE );

				// Retry with exponential backoff
				const retryDelay = Math.pow( 2, attempt ) * 1000; // 2s, 4s, 8s
				setTimeout( () => {
					loadProviderScript( providerId, attempt + 1, maxAttempts )
						.then( resolve )
						.catch( reject );
				}, retryDelay );
			} else {
				// Max attempts reached
				setLoadingState( providerId, LOAD_STATE.ERROR, error );
				reject( error );
			}
		};

		document.head.appendChild( script );
	} );
}

/**
 * Load a provider dynamically.
 *
 * Main entry point for loading a single provider. Handles state management,
 * error handling, and ensures provider is registered before resolving.
 *
 * @param {string}  providerId                  - Provider ID to load
 * @param {Object}  [options]                   - Load options
 * @param {number}  [options.maxAttempts=3]     - Maximum retry attempts
 * @param {boolean} [options.throwOnError=true] - Whether to throw on error
 * @return {Promise<boolean>} True if loaded successfully, false if failed (when throwOnError=false)
 * @throws {Error} If loading fails (when throwOnError=true)
 *
 * @example
 * // Load with defaults (throws on error)
 * await loadProvider('local-filesystem');
 *
 * // Load without throwing
 * const success = await loadProvider('local-filesystem', { throwOnError: false });
 * if (!success) {
 *     debugError('Failed to load provider');
 * }
 *
 * // Load with custom retry attempts
 * await loadProvider('local-filesystem', { maxAttempts: 5 });
 */
export async function loadProvider( providerId, options = {} ) {
	const { maxAttempts = 3, throwOnError = true } = options;

	// Check if already loaded
	if ( ProviderRegistry.has( providerId ) ) {
		setLoadingState( providerId, LOAD_STATE.LOADED );
		return true;
	}

	try {
		// Load provider script
		await loadProviderScript( providerId, 1, maxAttempts );

		// Verify provider was registered
		if ( ! ProviderRegistry.has( providerId ) ) {
			throw new Error(
				`Provider ${ providerId } script loaded but provider not registered`
			);
		}

		// Mark as loaded
		setLoadingState( providerId, LOAD_STATE.LOADED );
		return true;
	} catch ( error ) {
		debugError( `Failed to load provider ${ providerId }:`, error );

		if ( throwOnError ) {
			throw error;
		}

		return false;
	}
}

/**
 * Load multiple providers concurrently.
 *
 * Loads multiple providers in parallel with individual error handling.
 * Returns results for all loads (success or failure).
 *
 * @param    {string[]}               providerIds                  - Array of provider IDs to load
 * @param    {Object}                 [options]                    - Load options (passed to loadProvider)
 * @param    {boolean}                [options.throwOnError=false] - Whether to throw if any provider fails
 * @return {Promise<LoadResults>} Results for each provider load
 *
 * @typedef {Object} LoadResults
 * @property {string[]}               loaded                       - Successfully loaded provider IDs
 * @property {string[]}               failed                       - Failed provider IDs
 * @property {Object.<string, Error>} errors                       - Errors keyed by provider ID
 *
 * @example
 * const results = await loadProviders(['local-filesystem']);
 * debug(`Loaded: ${results.loaded.length}, Failed: ${results.failed.length}`);
 *
 * if (results.failed.length > 0) {
 *     results.failed.forEach(id => {
 *         debugError(`Failed to load ${id}:`, results.errors[id]);
 *     });
 * }
 */
export async function loadProviders( providerIds, options = {} ) {
	const { throwOnError = false, ...loadOptions } = options;

	const results = {
		loaded: [],
		failed: [],
		errors: {},
	};

	// Load all providers concurrently
	const loadPromises = providerIds.map( async ( providerId ) => {
		try {
			const success = await loadProvider( providerId, {
				...loadOptions,
				throwOnError: false, // Handle errors individually
			} );

			if ( success ) {
				results.loaded.push( providerId );
			} else {
				results.failed.push( providerId );
				results.errors[ providerId ] = new Error(
					'Load failed (no specific error)'
				);
			}
		} catch ( error ) {
			results.failed.push( providerId );
			results.errors[ providerId ] = error;
		}
	} );

	await Promise.all( loadPromises );

	// Throw if any failed and throwOnError is true
	if ( throwOnError && results.failed.length > 0 ) {
		const errorMessage = `Failed to load ${
			results.failed.length
		} provider(s): ${ results.failed.join( ', ' ) }`;
		const error = new Error( errorMessage );
		error.details = results;
		throw error;
	}

	return results;
}

/**
 * Load all available providers.
 *
 * Loads all providers (for admin settings where all are needed).
 * Continues loading even if some providers fail.
 *
 * Provider IDs can be extended by plugins using the 'aether.provider_ids' filter.
 *
 * @param {Object}  [options]                    - Load options
 * @param {boolean} [options.throwOnError=false] - Whether to throw if any provider fails
 * @return {Promise<LoadResults>} Results for each provider load
 *
 * @example
 * const results = await loadAllProviders();
 * debug(`Loaded ${results.loaded.length} providers`);
 *
 * @example
 * // Add custom provider via filter
 * import { addFilter } from '@wordpress/hooks';
 *
 * addFilter('aether.provider_ids', 'my-plugin', (providerIds) => {
 *     return [...providerIds, 'my-custom-provider'];
 * });
 */
export async function loadAllProviders( options = {} ) {
	// Default provider IDs
	let allProviderIds = [ 'local-filesystem' ];

	// Allow plugins to extend provider IDs via filter
	// Use dynamic import to avoid circular dependencies and reduce bundle size
	try {
		const { applyFilters } = await import( '@wordpress/hooks' );
		allProviderIds = applyFilters( 'aether.provider_ids', allProviderIds );
	} catch ( error ) {
		debugWarn(
			'Failed to load @wordpress/hooks for provider filtering:',
			error
		);
	}

	return loadProviders( allProviderIds, options );
}
