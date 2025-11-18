/**
 * Credential Manager
 *
 * Fetches encrypted credentials from REST endpoint and manages them in memory.
 * Credentials are decrypted server-side before being sent to the client.
 *
 * @package
 */

import apiFetch from './api';

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
export async function getCredentials( providerId ) {
	// Check cache first.
	const cached = credentialCache.get( providerId );
	if ( cached ) {
		const age = Date.now() - cached.timestamp;
		// Use <= to include the exact expiry time (off-by-one fix)
		// Cache is valid for the full CACHE_EXPIRY_MS duration
		// Expires only when age > CACHE_EXPIRY_MS
		if ( age <= CACHE_EXPIRY_MS ) {
			return cached.credentials;
		}
		// Cache expired, remove it.
		credentialCache.delete( providerId );
	}

	// Fetch from REST endpoint (using /config endpoint).
	const response = await apiFetch( {
		path: `/aether/site-exporter/providers/${ providerId }/config`,
		method: 'GET',
	} );

	if ( ! response || ! response.success ) {
		throw new Error( response?.error || 'Failed to fetch credentials' );
	}

	const credentials = response.config || {};

	// Cache credentials.
	credentialCache.set( providerId, {
		credentials,
		timestamp: Date.now(),
	} );

	return credentials;
}

/**
 * Clear cached credentials for a provider.
 *
 * @param {string} providerId Provider ID.
 */
export function clearCredentials( providerId ) {
	credentialCache.delete( providerId );
}

/**
 * Clear all cached credentials.
 */
export function clearAllCredentials() {
	credentialCache.clear();
}
