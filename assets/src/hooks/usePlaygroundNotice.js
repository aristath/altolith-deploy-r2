/**
 * usePlaygroundNotice Hook
 *
 * Fetches playground notice state from REST API.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import apiFetch from '../utils/api';

/**
 * Hook to fetch and manage playground notice state.
 *
 * @return {Object} Notice state with loading, shouldShow, and dismiss function.
 */
export function usePlaygroundNotice() {
	const [ state, setState ] = useState( {
		loading: true,
		shouldShow: false,
		isPlayground: false,
		isDismissed: false,
	} );

	const fetchState = async () => {
		try {
			const response = await apiFetch( {
				path: '/aether/site-exporter/notices/playground',
			} );

			if ( response.success ) {
				setState( {
					loading: false,
					shouldShow: response.shouldShow || false,
					isPlayground: response.isPlayground || false,
					isDismissed: response.isDismissed || false,
				} );
			} else {
				setState( ( prev ) => ( { ...prev, loading: false } ) );
			}
		} catch ( error ) {
			setState( ( prev ) => ( { ...prev, loading: false } ) );
		}
	};

	const dismiss = async () => {
		try {
			const response = await apiFetch( {
				path: '/aether/site-exporter/notices/playground/dismiss',
				method: 'POST',
			} );

			if ( response.success ) {
				setState( ( prev ) => ( {
					...prev,
					shouldShow: false,
					isDismissed: true,
				} ) );
			}
		} catch ( error ) {
			// Failed to dismiss notice
		}
	};

	useEffect( () => {
		fetchState();
	}, [] );

	return {
		...state,
		dismiss,
		refresh: fetchState,
	};
}
