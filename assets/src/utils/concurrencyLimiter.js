/**
 * Concurrency Limiter Utility
 *
 * Limits the number of concurrent async operations to prevent overwhelming
 * the browser/server with too many simultaneous requests.
 *
 * @package
 */

/**
 * Create a concurrency limiter function.
 *
 * Returns a function that wraps async operations and ensures only
 * a limited number run concurrently. Additional operations are queued
 * and executed as slots become available.
 *
 * @param {number} limit Maximum number of concurrent operations (default: 5)
 * @return {Function} Limiter function that wraps async operations
 *
 * @example
 * const limiter = createConcurrencyLimiter(3);
 * const results = await Promise.allSettled([
 *   limiter(() => asyncOperation1()),
 *   limiter(() => asyncOperation2()),
 *   limiter(() => asyncOperation3()),
 *   limiter(() => asyncOperation4()), // Will wait until one of the first 3 completes
 * ]);
 */
export function createConcurrencyLimiter( limit = 5 ) {
	let running = 0;
	const queue = [];

	/**
	 * Execute the next queued operation if slots are available.
	 */
	const processQueue = () => {
		// If we're at the limit or queue is empty, nothing to do
		if ( running >= limit || queue.length === 0 ) {
			return;
		}

		// Get next operation from queue
		const { operation, resolve, reject } = queue.shift();
		running++;

		// Execute the operation
		Promise.resolve( operation() )
			.then( ( result ) => {
				running--;
				resolve( result );
				// Process next item in queue
				processQueue();
			} )
			.catch( ( error ) => {
				running--;
				reject( error );
				// Process next item in queue
				processQueue();
			} );
	};

	/**
	 * Limiter function that wraps async operations.
	 *
	 * @param {Function} operation Async operation to execute
	 * @return {Promise} Promise that resolves when operation completes
	 */
	return ( operation ) => {
		return new Promise( ( resolve, reject ) => {
			queue.push( { operation, resolve, reject } );
			processQueue();
		} );
	};
}
