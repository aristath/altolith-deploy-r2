/**
 * Connection Test Hooks
 *
 * Provides direct API calls for testing provider connections from React.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '../utils/api';

/**
 * Hook for testing provider connection (generic).
 *
 * @param {string} providerId Provider ID.
 * @param {Object} config     Provider configuration.
 * @return {Object} Test methods and state.
 */
export function useConnectionTest( providerId, config ) {
	const [ testing, setTesting ] = useState( false );
	const [ result, setResult ] = useState( null );

	const test = useCallback( async () => {
		setTesting( true );
		setResult( null );

		try {
			// Use REST API endpoint to test connection
			const response = await apiFetch( {
				path: `/aether/site-exporter/providers/${ providerId }/test`,
				method: 'POST',
				data: { config },
			} );

			if ( ! response.success ) {
				throw new Error(
					response.message ||
						response.error ||
						__( 'Connection test failed', 'aether-site-exporter' )
				);
			}

			setResult( {
				success: true,
				message:
					response.message ||
					__( 'Connection test successful', 'aether-site-exporter' ),
			} );
		} catch ( err ) {
			setResult( {
				success: false,
				message:
					err.message ||
					__( 'Connection test failed', 'aether-site-exporter' ),
			} );
		} finally {
			setTesting( false );
		}
	}, [ providerId, config ] );

	return {
		test,
		testing,
		result,
	};
}
