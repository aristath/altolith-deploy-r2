/**
 * useSettingsContext Hook
 *
 * Hook to consume the SettingsContext.
 * Provides access to global settings state and operations.
 *
 * @package
 */

import { useContext } from '@wordpress/element';
import { SettingsContext } from '../contexts/SettingsContext';

/**
 * Hook to access settings context
 *
 * Must be used within a SettingsProvider.
 *
 * @throws {Error} If used outside SettingsProvider
 * @return {Object} Settings context value
 * @property {Object}   settings        - All settings
 * @property {boolean}  loading         - Loading state
 * @property {string}   error           - Error message (null if no error)
 * @property {Object}   provider_types  - Provider type mappings (edge, storage, static_site, media)
 * @property {Function} setProviderType - Set a provider type
 * @property {Function} refetch         - Refetch settings from API
 * @property {Function} invalidateCache - Invalidate cache and refetch
 *
 * @example
 * function ProviderSelector() {
 *     const { providerTypes, setProviderType, loading } = useSettingsContext();
 *
 *     if (loading) return <Spinner />;
 *
 *     return (
 *         <select
 *             value={providerTypes.storage || ''}
 *             onChange={(e) => setProviderType('storage', e.target.value)}
 *         >
 *             <option value="">Select provider</option>
 *             <option value="local-filesystem">Local Filesystem</option>
 *         </select>
 *     );
 * }
 *
 * @example
 * // Get all settings
 * function SettingsDebug() {
 *     const { settings } = useSettingsContext();
 *
 *     return <pre>{JSON.stringify(settings, null, 2)}</pre>;
 * }
 *
 * @example
 * // Update provider with error handling
 * function ProviderSaveButton({ providerType, providerId }) {
 *     const { setProviderType, error } = useSettingsContext();
 *
 *     const handleSave = async () => {
 *         const success = await setProviderType(providerType, providerId);
 *         if (success) {
 *             alert('Saved successfully!');
 *         }
 *     };
 *
 *     return (
 *         <div>
 *             <button onClick={handleSave}>Save</button>
 *             {error && <p>{error}</p>}
 *         </div>
 *     );
 * }
 */
export function useSettingsContext() {
	const context = useContext( SettingsContext );

	if ( ! context ) {
		throw new Error(
			'useSettingsContext must be used within a SettingsProvider'
		);
	}

	return context;
}

export default useSettingsContext;
