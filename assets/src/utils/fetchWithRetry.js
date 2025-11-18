/**
 * Fetch with Retry Utility
 *
 * Provides automatic retry logic for network requests using p-retry.
 * Uses centralized retry configuration from timing.js constants.
 *
 * @package
 */

import pRetry from 'p-retry';
import {
	MAX_RETRIES,
	RETRY_INITIAL_DELAY,
	RETRY_MAX_DELAY,
} from '../constants/timing';

/**
 * Fetch with automatic retry logic using exponential backoff.
 *
 * @param {string}   url                         The URL to fetch.
 * @param {Object}   options                     Fetch options (headers, method, body, etc.).
 * @param {Object}   retryConfig                 Optional retry configuration.
 * @param {number}   retryConfig.retries         Maximum retry attempts (default: MAX_RETRIES).
 * @param {number}   retryConfig.minTimeout      Initial delay in ms (default: RETRY_INITIAL_DELAY).
 * @param {number}   retryConfig.maxTimeout      Maximum delay in ms (default: RETRY_MAX_DELAY).
 * @param {Function} retryConfig.onFailedAttempt Callback for failed attempts.
 * @return {Promise<Response>} The fetch response.
 * @throws {Error} If all retry attempts fail.
 */
export async function fetchWithRetry( url, options = {}, retryConfig = {} ) {
	return pRetry(
		async () => {
			const response = await fetch( url, options );

			// Throw on non-OK responses to trigger retry.
			if ( ! response.ok ) {
				const error = new Error(
					`HTTP ${ response.status }: ${ response.statusText }`
				);
				error.response = response;
				error.status = response.status;
				throw error;
			}

			return response;
		},
		{
			retries: retryConfig.retries ?? MAX_RETRIES,
			minTimeout: retryConfig.minTimeout ?? RETRY_INITIAL_DELAY,
			maxTimeout: retryConfig.maxTimeout ?? RETRY_MAX_DELAY,
			onFailedAttempt: retryConfig.onFailedAttempt,
			...retryConfig,
		}
	);
}

/**
 * Fetch JSON with automatic retry logic.
 *
 * @param {string} url         The URL to fetch.
 * @param {Object} options     Fetch options (headers, method, body, etc.).
 * @param {Object} retryConfig Optional retry configuration.
 * @return {Promise<*>} The parsed JSON response.
 * @throws {Error} If all retry attempts fail or JSON parsing fails.
 */
export async function fetchJsonWithRetry(
	url,
	options = {},
	retryConfig = {}
) {
	const response = await fetchWithRetry( url, options, retryConfig );
	return response.json();
}

/**
 * Check if an error is retryable based on status code or error type.
 *
 * @param {Error} error The error to check.
 * @return {boolean} True if the error is retryable.
 */
export function isRetryableError( error ) {
	// Network errors are retryable.
	if ( error.name === 'TypeError' && error.message.includes( 'fetch' ) ) {
		return true;
	}

	// HTTP status codes that are retryable.
	const retryableStatusCodes = [
		408, // Request Timeout
		429, // Too Many Requests
		500, // Internal Server Error
		502, // Bad Gateway
		503, // Service Unavailable
		504, // Gateway Timeout
	];

	return retryableStatusCodes.includes( error.status );
}

/**
 * Fetch with retry only for specific error types.
 *
 * @param {string} url         The URL to fetch.
 * @param {Object} options     Fetch options.
 * @param {Object} retryConfig Optional retry configuration.
 * @return {Promise<Response>} The fetch response.
 */
export async function fetchWithSelectiveRetry(
	url,
	options = {},
	retryConfig = {}
) {
	return pRetry(
		async () => {
			try {
				const response = await fetch( url, options );

				if ( ! response.ok ) {
					const error = new Error(
						`HTTP ${ response.status }: ${ response.statusText }`
					);
					error.response = response;
					error.status = response.status;

					// If error is not retryable, throw AbortError.
					if ( ! isRetryableError( error ) ) {
						// p-retry stops retrying when it sees AbortError.
						throw new pRetry.AbortError( error.message );
					}

					throw error;
				}

				return response;
			} catch ( error ) {
				// Check if this is already an AbortError.
				if ( error.name === 'AbortError' ) {
					throw error;
				}

				// If error is not retryable, wrap in AbortError.
				if ( ! isRetryableError( error ) ) {
					throw new pRetry.AbortError( error.message );
				}

				// Retryable error - rethrow for p-retry to handle.
				throw error;
			}
		},
		{
			retries: retryConfig.retries ?? MAX_RETRIES,
			minTimeout: retryConfig.minTimeout ?? RETRY_INITIAL_DELAY,
			maxTimeout: retryConfig.maxTimeout ?? RETRY_MAX_DELAY,
			onFailedAttempt: retryConfig.onFailedAttempt,
			...retryConfig,
		}
	);
}
