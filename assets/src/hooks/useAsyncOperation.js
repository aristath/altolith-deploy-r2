/**
 * useAsyncOperation Hook
 *
 * Generic hook for managing async operations with loading and error states.
 * Consolidates the common pattern of loading/error state management across the app.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';

/**
 * Hook for managing async operations with automatic loading and error state.
 *
 * @param {Object}   options             Configuration options.
 * @param {Function} options.onSuccess   Optional callback when operation succeeds.
 * @param {Function} options.onError     Optional callback when operation fails.
 * @param {*}        options.initialData Optional initial data value.
 * @return {Object} State and execution function.
 */
export function useAsyncOperation( options = {} ) {
	const { onSuccess, onError, initialData = null } = options;

	const [ state, setState ] = useState( {
		loading: false,
		error: null,
		data: initialData,
	} );

	/**
	 * Execute an async operation.
	 *
	 * @param {Function} operation Async function to execute.
	 * @return {Promise<*>} Result of the operation.
	 */
	const execute = useCallback(
		async ( operation ) => {
			setState( {
				loading: true,
				error: null,
				data: state.data, // Preserve previous data during loading
			} );

			try {
				const result = await operation();

				setState( {
					loading: false,
					error: null,
					data: result,
				} );

				if ( onSuccess ) {
					onSuccess( result );
				}

				return result;
			} catch ( err ) {
				const errorMessage =
					err?.message || 'An unexpected error occurred';

				setState( {
					loading: false,
					error: errorMessage,
					data: state.data, // Preserve previous data on error
				} );

				if ( onError ) {
					onError( err );
				}

				throw err;
			}
		},
		[ onSuccess, onError, state.data ]
	);

	/**
	 * Reset the operation state.
	 */
	const reset = useCallback( () => {
		setState( {
			loading: false,
			error: null,
			data: initialData,
		} );
	}, [ initialData ] );

	/**
	 * Set error manually.
	 *
	 * @param {string|Error} error Error message or Error object.
	 */
	const setError = useCallback( ( error ) => {
		const errorMessage =
			typeof error === 'string' ? error : error?.message || 'Error';
		setState( ( prev ) => ( {
			...prev,
			error: errorMessage,
			loading: false,
		} ) );
	}, [] );

	/**
	 * Set data manually.
	 *
	 * @param {*} data Data to set.
	 */
	const setData = useCallback( ( data ) => {
		setState( ( prev ) => ( {
			...prev,
			data,
		} ) );
	}, [] );

	/**
	 * Set loading state manually.
	 *
	 * @param {boolean} loading Loading state.
	 */
	const setLoading = useCallback( ( loading ) => {
		setState( ( prev ) => ( {
			...prev,
			loading,
		} ) );
	}, [] );

	return {
		...state,
		execute,
		reset,
		setError,
		setData,
		setLoading,
		isLoading: state.loading, // Alias for backward compatibility
	};
}

export default useAsyncOperation;
