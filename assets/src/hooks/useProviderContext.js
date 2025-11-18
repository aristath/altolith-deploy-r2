/**
 * useProviderContext Hook
 *
 * Hook to consume the ProviderContext.
 * Provides access to global provider registry state and operations.
 *
 * @package
 */

import { useContext } from '@wordpress/element';
import { ProviderContext } from '../contexts/ProviderContext';

/**
 * Hook to access provider context
 *
 * Must be used within a ProviderProvider.
 *
 * @throws {Error} If used outside ProviderProvider
 * @return {Object} Provider context value
 * @property {Object}   registry                        - Registry instance
 * @property {Array}    providers                       - All provider metadata
 * @property {Array}    providerIds                     - All provider IDs
 * @property {boolean}  loading                         - Loading state
 * @property {string}   error                           - Error message (null if no error)
 * @property {Function} getProvider                     - Get provider by ID
 * @property {Function} getProvidersByCapability        - Get providers by capability
 * @property {Function} getProvidersByType              - Get providers by type
 * @property {Function} getProvidersGroupedByType       - Get providers grouped by type
 * @property {Function} getProvidersGroupedByCapability - Get providers grouped by capability
 * @property {Function} providerExists                  - Check if provider exists
 * @property {number}   providerCount                   - Number of providers
 * @property {Function} refresh                         - Refresh provider list
 *
 * @example
 * function MyComponent() {
 *     const { providers, loading, error } = useProviderContext();
 *
 *     if (loading) return <Spinner />;
 *     if (error) return <Error message={error} />;
 *
 *     return (
 *         <ul>
 *             {providers.map(p => <li key={p.id}>{p.name}</li>)}
 *         </ul>
 *     );
 * }
 *
 * @example
 * // Get specific provider
 * function ProviderCard({ providerId }) {
 *     const { getProvider } = useProviderContext();
 *     const provider = getProvider(providerId);
 *
 *     if (!provider) return <div>Provider not found</div>;
 *
 *     return <div>{provider.getName()}</div>;
 * }
 *
 * @example
 * // Get providers by capability
 * function StorageProviders() {
 *     const { getProvidersByCapability } = useProviderContext();
 *     const storageProviders = getProvidersByCapability('storage');
 *
 *     return (
 *         <select>
 *             {storageProviders.map(p => (
 *                 <option key={p.id} value={p.id}>{p.name}</option>
 *             ))}
 *         </select>
 *     );
 * }
 */
export function useProviderContext() {
	const context = useContext( ProviderContext );

	if ( ! context ) {
		throw new Error(
			'useProviderContext must be used within a ProviderProvider'
		);
	}

	return context;
}

export default useProviderContext;
