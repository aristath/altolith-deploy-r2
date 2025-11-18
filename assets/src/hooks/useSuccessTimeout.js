/**
 * Success Timeout Hook
 *
 * Manages success message timeout with automatic cleanup.
 * Prevents memory leaks and ensures proper cleanup on unmount.
 *
 * @package
 */

import { useRef, useEffect, useCallback } from '@wordpress/element';
import { SUCCESS_MESSAGE_DURATION_MS } from '../utils/constants';

/**
 * Hook for managing success message timeout.
 *
 * @return {Object} { showSuccess, clearSuccess }
 */
export function useSuccessTimeout() {
	const timeoutRef = useRef( null );

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => {
			if ( timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
				timeoutRef.current = null;
			}
		};
	}, [] );

	const showSuccess = useCallback( ( callback ) => {
		// Clear any existing timeout
		if ( timeoutRef.current ) {
			clearTimeout( timeoutRef.current );
			timeoutRef.current = null;
		}

		// Set new timeout
		timeoutRef.current = setTimeout( () => {
			if ( callback ) {
				callback();
			}
			timeoutRef.current = null;
		}, SUCCESS_MESSAGE_DURATION_MS );
	}, [] );

	const clearSuccess = useCallback( () => {
		if ( timeoutRef.current ) {
			clearTimeout( timeoutRef.current );
			timeoutRef.current = null;
		}
	}, [] );

	return {
		showSuccess,
		clearSuccess,
	};
}
