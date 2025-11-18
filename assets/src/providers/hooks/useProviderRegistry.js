/**
 * useProviderRegistry Hook
 *
 * React hook for accessing the provider registry and listing all providers.
 * Now uses ProviderContext for centralized state management.
 *
 * @package
 */

import { useProviderContext } from '../../hooks/useProviderContext';

/**
 * Get all registered provider IDs.
 *
 * @return {{providerIds: Array<string>, isLoading: boolean, refresh: Function}} Provider IDs, loading state, and refresh function
 */
export function useProviderRegistry() {
	const { providerIds, loading, refresh } = useProviderContext();

	return {
		providerIds,
		isLoading: loading,
		refresh,
	};
}

/**
 * Get all registered providers with their metadata.
 *
 * @return {{providers: Array<Object>, isLoading: boolean, refresh: Function}} Providers array, loading state, and refresh function
 */
export function useProviderMetadata() {
	const { providers, loading, refresh } = useProviderContext();

	return {
		providers,
		isLoading: loading,
		refresh,
	};
}

/**
 * Get providers grouped by type.
 *
 * @return {{providersByType: Object, isLoading: boolean, refresh: Function}} Providers grouped by type, loading state, and refresh function
 */
export function useProvidersGroupedByType() {
	const { getProvidersGroupedByType, loading, refresh } =
		useProviderContext();

	return {
		providersByType: getProvidersGroupedByType(),
		isLoading: loading,
		refresh,
	};
}

/**
 * Get providers grouped by capability.
 *
 * @return {{providersByCapability: Object, isLoading: boolean, refresh: Function}} Providers grouped by capability, loading state, and refresh function
 */
export function useProvidersGroupedByCapability() {
	const { getProvidersGroupedByCapability, loading, refresh } =
		useProviderContext();

	return {
		providersByCapability: getProvidersGroupedByCapability(),
		isLoading: loading,
		refresh,
	};
}

/**
 * Get the number of registered providers.
 *
 * @return {{count: number, isLoading: boolean}} Provider count and loading state
 */
export function useProviderCount() {
	const { providerCount, loading } = useProviderContext();

	return {
		count: providerCount,
		isLoading: loading,
	};
}

export default useProviderRegistry;
