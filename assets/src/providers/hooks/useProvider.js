/**
 * useProvider Hook
 *
 * React hook for accessing provider instances from the registry.
 * Now uses ProviderContext for centralized state management.
 *
 * @package
 */

import { useProviderContext } from '../../hooks/useProviderContext';

/**
 * Get a provider instance by ID.
 *
 * @param {string} providerId Provider ID (e.g., 'cloudflare-r2').
 * @param {Object} config     Optional configuration to pass to provider.
 * @return {{provider: Object|null, isLoading: boolean, error: string|null}} Provider instance, loading state, and error
 */
export function useProvider( providerId, config = {} ) {
	const { getProvider, loading, error } = useProviderContext();

	const provider = getProvider( providerId, config );

	return {
		provider,
		isLoading: loading,
		error:
			error ||
			( ! provider && providerId
				? `Provider ${ providerId } not found`
				: null ),
	};
}

/**
 * Check if a provider exists in the registry.
 *
 * @param {string} providerId Provider ID.
 * @return {{exists: boolean, isLoading: boolean}} Whether provider exists and loading state
 */
export function useProviderExists( providerId ) {
	const { providerExists, loading } = useProviderContext();

	return {
		exists: providerExists( providerId ),
		isLoading: loading,
	};
}

/**
 * Get providers by capability.
 *
 * @param {string} capability Capability constant (e.g., 'storage', 'edge').
 * @return {{providers: Array<Object>, isLoading: boolean}} Providers array and loading state
 */
export function useProvidersByCapability( capability ) {
	const { getProvidersByCapability, loading } = useProviderContext();

	return {
		providers: getProvidersByCapability( capability ),
		isLoading: loading,
	};
}

/**
 * Get providers by type.
 *
 * @param {string} type Provider type (e.g., 'cloud-storage', 'git-hosting').
 * @return {{providers: Array<Object>, isLoading: boolean}} Providers array and loading state
 */
export function useProvidersByType( type ) {
	const { getProvidersByType, loading } = useProviderContext();

	return {
		providers: getProvidersByType( type ),
		isLoading: loading,
	};
}

export default useProvider;
