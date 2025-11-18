/**
 * Delay Utility
 *
 * Utility function for creating delays in async operations.
 * Replaces inline setTimeout patterns with a reusable function.
 *
 * @package
 */

import { SHORT_DELAY_MS } from './constants';

/**
 * Create a delay promise.
 *
 * @param {number} ms Milliseconds to delay (defaults to SHORT_DELAY_MS).
 * @return {Promise<void>} Promise that resolves after delay.
 */
export function delay( ms = SHORT_DELAY_MS ) {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}
