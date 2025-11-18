/**
 * useConfigContext Hook
 *
 * Hook to consume the ConfigContext.
 * Provides access to global config state and config operations.
 *
 * @package
 */

import { useContext } from '@wordpress/element';
import { ConfigContext } from '../contexts/ConfigContext';

/**
 * Hook to access config context
 *
 * Must be used within a ConfigProvider.
 *
 * @throws {Error} If used outside ConfigProvider
 * @return {Object} Config context value
 * @property {Object}   config          - Configuration object
 * @property {boolean}  loading         - Loading state
 * @property {string}   error           - Error message (null if no error)
 * @property {Function} refetch         - Force refetch config
 * @property {Function} updateConfig    - Update config optimistically
 * @property {Function} invalidateCache - Invalidate cache
 *
 * @example
 * function MyComponent() {
 *     const { config, loading, error, refetch } = useConfigContext();
 *
 *     if (loading) return <Spinner />;
 *     if (error) return <Error message={error} onRetry={refetch} />;
 *
 *     return <div>Playground URL: {config.playgroundUrl}</div>;
 * }
 *
 * @example
 * // Optimistic update
 * function SettingsForm() {
 *     const { config, updateConfig } = useConfigContext();
 *
 *     const handleChange = (newUrl) => {
 *         // Update UI immediately
 *         updateConfig({ publicUrl: newUrl });
 *         // Then save to API
 *         saveToAPI(newUrl);
 *     };
 * }
 */
export function useConfigContext() {
	const context = useContext( ConfigContext );

	if ( ! context ) {
		throw new Error(
			'useConfigContext must be used within a ConfigProvider'
		);
	}

	return context;
}

export default useConfigContext;
