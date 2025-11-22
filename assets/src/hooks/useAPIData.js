/**
 * useAPIData Hook
 *
 * Generic hook for fetching data from API endpoints with caching and error handling.
 * Provides a reusable pattern for all data fetching operations.
 *
 * @package
 */

import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import apiFetch from '../utils/api';

/**
 * Generic API data fetching hook
 *
 * @param {Object}   options                Configuration options
 * @param {string}   options.path           API endpoint path
 * @param {Function} options.transform      Optional data transformation function
 * @param {*}        options.initialData    Initial data value
 * @param {boolean}  options.fetchOnMount   Whether to fetch on mount (default: true)
 * @param {Array}    options.dependencies   Additional dependencies for refetch
 * @param {Function} options.onSuccess      Success callback
 * @param {Function} options.onError        Error callback
 * @param {boolean}  options.refetchOnFocus Refetch when window gains focus (default: false)
 * @return {Object} Data, loading state, error, and refresh function
 *
 * @example
 * // Simple usage
 * const { data, loading, error, refresh } = useAPIData({
 *     path: '/aether/site-exporter/config',
 *     initialData: {}
 * });
 *
 * @example
 * // With transformation
 * const { data, loading, error } = useAPIData({
 *     path: '/aether/site-exporter/export/jobs?limit=5',
 *     transform: (response) => response.value?.jobs || [],
 *     initialData: []
 * });
 *
 * @example
 * // With dependencies
 * const { data } = useAPIData({
 *     path: `/aether/site-exporter/providers/${providerId}/status`,
 *     dependencies: [providerId],
 *     fetchOnMount: !!providerId
 * });
 */
export function useAPIData( {
	path,
	transform = ( data ) => data,
	initialData = null,
	fetchOnMount = true,
	dependencies = [],
	onSuccess,
	onError,
	refetchOnFocus = false,
} ) {
	const [ data, setData ] = useState( initialData );
	const [ loading, setLoading ] = useState( fetchOnMount );
	const [ error, setError ] = useState( null );
	const isMountedRef = useRef( true );
	const abortControllerRef = useRef( null );

	/**
	 * Fetch data from API
	 */
	const fetchData = useCallback( async () => {
		// Cancel any ongoing request
		if ( abortControllerRef.current ) {
			abortControllerRef.current.abort();
		}

		// Create new abort controller
		abortControllerRef.current = new AbortController();

		try {
			setLoading( true );
			setError( null );

			const response = await apiFetch( {
				path,
				signal: abortControllerRef.current.signal,
			} );

			if ( ! isMountedRef.current ) {
				return;
			}

			// Transform response data
			const transformedData = transform( response );
			setData( transformedData );

			// Call success callback
			if ( onSuccess ) {
				onSuccess( transformedData );
			}
		} catch ( err ) {
			// Ignore abort errors
			if ( err.name === 'AbortError' ) {
				return;
			}

			if ( ! isMountedRef.current ) {
				return;
			}

			const errorMessage = err.message || 'Failed to fetch data';
			setError( errorMessage );

			// Call error callback
			if ( onError ) {
				onError( err );
			}
		} finally {
			if ( isMountedRef.current ) {
				setLoading( false );
			}
			abortControllerRef.current = null;
		}
		// Note: transform, onSuccess, and onError are intentionally excluded from deps
		// to avoid unnecessary re-renders. They should be memoized by the caller if needed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ path, ...dependencies ] );

	/**
	 * Fetch on mount
	 */
	useEffect( () => {
		if ( fetchOnMount ) {
			fetchData();
		}
	}, [ fetchData, fetchOnMount ] );

	/**
	 * Refetch on window focus (optional)
	 */
	useEffect( () => {
		if ( ! refetchOnFocus ) {
			return;
		}

		const handleFocus = () => {
			if ( ! loading ) {
				fetchData();
			}
		};

		window.addEventListener( 'focus', handleFocus );

		return () => {
			window.removeEventListener( 'focus', handleFocus );
		};
	}, [ refetchOnFocus, loading, fetchData ] );

	/**
	 * Cleanup on unmount
	 */
	useEffect( () => {
		isMountedRef.current = true;

		return () => {
			isMountedRef.current = false;
			if ( abortControllerRef.current ) {
				abortControllerRef.current.abort();
			}
		};
	}, [] );

	return {
		data,
		loading,
		error,
		refresh: fetchData,
		setData, // Allow manual data updates for optimistic UI
	};
}

/**
 * Hook for fetching paginated data
 *
 * @param {Object}   options             Configuration options
 * @param {string}   options.path        API endpoint path (without pagination params)
 * @param {number}   options.perPage     Items per page (default: 10)
 * @param {number}   options.initialPage Initial page number (default: 1)
 * @param {Function} options.transform   Optional data transformation function
 * @return {Object} Paginated data, loading state, pagination controls
 *
 * @example
 * const { data, loading, page, totalPages, nextPage, prevPage } = usePaginatedData({
 *     path: '/aether/site-exporter/export/jobs',
 *     perPage: 10
 * });
 */
export function usePaginatedData( {
	path,
	perPage = 10,
	initialPage = 1,
	transform = ( data ) => data,
} ) {
	const [ page, setPage ] = useState( initialPage );
	const [ totalPages, setTotalPages ] = useState( 1 );

	const paginatedPath = `${ path }?page=${ page }&per_page=${ perPage }`;

	const { data, loading, error, refresh } = useAPIData( {
		path: paginatedPath,
		transform: ( response ) => {
			// Extract pagination info from response headers/body
			const total = response.total || response.value?.total || 0;
			setTotalPages( Math.ceil( total / perPage ) );

			// Transform the actual data
			return transform( response );
		},
		dependencies: [ page, perPage ],
	} );

	const nextPage = useCallback( () => {
		if ( page < totalPages ) {
			setPage( ( p ) => p + 1 );
		}
	}, [ page, totalPages ] );

	const prevPage = useCallback( () => {
		if ( page > 1 ) {
			setPage( ( p ) => p - 1 );
		}
	}, [ page ] );

	const goToPage = useCallback(
		( newPage ) => {
			if ( newPage >= 1 && newPage <= totalPages ) {
				setPage( newPage );
			}
		},
		[ totalPages ]
	);

	return {
		data,
		loading,
		error,
		page,
		totalPages,
		nextPage,
		prevPage,
		goToPage,
		refresh,
		hasNextPage: page < totalPages,
		hasPrevPage: page > 1,
	};
}

export default useAPIData;
