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
export const POLLING_INTERVAL = 500;

/**
 * Retry Configuration
 *
 * Configuration for retry logic
 */

/**
 * Maximum number of retry attempts
 * @constant {number}
 */
export const MAX_RETRIES = 3;

/**
 * Initial retry delay (exponential backoff starts from this)
 * @constant {number} milliseconds
 */
export const RETRY_INITIAL_DELAY = 1000;

/**
 * Maximum retry delay (exponential backoff caps at this)
 * @constant {number} milliseconds
 */
export const RETRY_MAX_DELAY = 30000;
