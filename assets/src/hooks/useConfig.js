/**
 * useConfig Hook
 *
 * Fetches configuration values from ConfigContext.
 * Replaces values previously localized via wp_localize_script.
 *
 * Now uses ConfigContext for centralized state management.
 * Maintains backward compatibility with previous API.
 *
 * @package
 */

import { useConfigContext } from './useConfigContext';

/**
 * Hook to fetch and cache configuration values.
 *
 * This hook now consumes ConfigContext instead of making its own API call.
 * Multiple components using this hook will share the same config state.
 *
 * @return {Object} Configuration object with loading state and config values
 * @property {boolean} loading       - Loading state
 * @property {string}  playgroundUrl - Playground URL
 * @property {string}  publicUrl     - Public URL
 * @property {string}  adminUrl      - Admin URL
 */
export function useConfig() {
	const { config, loading } = useConfigContext();

	// Return in the same format as before for backward compatibility
	return {
		loading,
		playgroundUrl: config.playgroundUrl || '',
		publicUrl: config.publicUrl || '',
		adminUrl: config.adminUrl || '',
		...config, // Include any additional config fields
	};
}
