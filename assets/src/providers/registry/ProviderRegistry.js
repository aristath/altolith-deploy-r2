/**
 * Provider Registry
 *
 * Central registry for managing all provider instances.
 * Uses WordPress hooks for provider registration (auto-discovery).
 *
 * @package
 */

import { doAction, applyFilters } from '@wordpress/hooks';

/**
 * ProviderRegistry class
 *
 * Singleton registry for all providers.
 * Providers register themselves using WordPress actions.
 */
class ProviderRegistry {
	/**
	 * Singleton instance.
	 *
	 * @type {ProviderRegistry|null}
	 * @private
	 */
	static instance = null;

	/**
	 * Registered providers map.
	 * Key: provider ID, Value: provider class
	 *
	 * @type {Map<string, Function>}
	 */
	providers = new Map();

	/**
	 * Provider instances cache.
	 * Key: provider ID, Value: provider instance
	 *
	 * @type {Map<string, Object>}
	 */
	instances = new Map();

	/**
	 * Whether auto-discovery has been run.
	 *
	 * @type {boolean}
	 */
	discovered = false;

	/**
	 * Private constructor (singleton pattern).
	 */
	constructor() {
		if ( ProviderRegistry.instance ) {
			return ProviderRegistry.instance;
		}
		ProviderRegistry.instance = this;
	}

	/**
	 * Get the singleton instance.
	 *
	 * @return {ProviderRegistry} Registry instance
	 */
	static getInstance() {
		if ( ! ProviderRegistry.instance ) {
			ProviderRegistry.instance = new ProviderRegistry();
		}
		return ProviderRegistry.instance;
	}

	/**
	 * Register a provider class.
	 *
	 * @param {string}   providerId    Provider ID (e.g., 'local-filesystem').
	 * @param {Function} providerClass Provider class constructor.
	 * @return {ProviderRegistry} This instance for chaining
	 */
	register( providerId, providerClass ) {
		// Check if already registered - if so, silently skip (idempotent registration)
		// This handles cases where providers are imported multiple times due to webpack bundling
		if ( this.providers.has( providerId ) ) {
			// Already registered, skip silently to avoid duplicate warnings
			return this;
		}

		this.providers.set( providerId, providerClass );

		// Fire registration action
		doAction( 'aether.providers.registered', providerId, providerClass );

		return this;
	}

	/**
	 * Unregister a provider.
	 *
	 * @param {string} providerId Provider ID.
	 * @return {boolean} True if unregistered, false if not found
	 */
	unregister( providerId ) {
		// Remove from instances cache
		this.instances.delete( providerId );

		// Remove from providers map
		const result = this.providers.delete( providerId );

		if ( result ) {
			doAction( 'aether.providers.unregistered', providerId );
		}

		return result;
	}

	/**
	 * Get a provider instance by ID.
	 *
	 * Creates a new instance if not cached.
	 *
	 * @param {string} providerId Provider ID.
	 * @param {Object} config     Optional configuration to pass to constructor.
	 * @return {Object|null} Provider instance or null if not found
	 */
	get( providerId, config = {} ) {
		// Validate providerId
		if ( ! providerId || typeof providerId !== 'string' ) {
			// eslint-disable-next-line no-console
			console.error(
				'[ProviderRegistry] Invalid provider ID:',
				providerId
			);
			return null;
		}

		// Ensure auto-discovery has run
		this.autoDiscover();

		// Check if instance is cached
		if ( this.instances.has( providerId ) ) {
			return this.instances.get( providerId );
		}

		// Get provider class
		const ProviderClass = this.providers.get( providerId );
		if ( ! ProviderClass ) {
			return null;
		}

		// Create new instance
		try {
			const instance = new ProviderClass( config, providerId );

			// Cache instance
			this.instances.set( providerId, instance );

			// Fire instance created action
			doAction( 'aether.providers.created', providerId, instance );

			return instance;
		} catch ( error ) {
			return null;
		}
	}

	/**
	 * Get a provider instance by ID (alias for get()).
	 *
	 * Backwards compatibility method.
	 *
	 * @param {string} providerId Provider ID.
	 * @param {Object} config     Optional configuration to pass to constructor.
	 * @return {Object|null} Provider instance or null if not found
	 */
	getProvider( providerId, config = {} ) {
		return this.get( providerId, config );
	}

	/**
	 * Create a provider instance without caching.
	 *
	 * Useful for temporary instances or when you need multiple instances.
	 *
	 * @param {string} providerId Provider ID.
	 * @param {Object} config     Optional configuration.
	 * @return {Object|null} Provider instance or null if not found
	 */
	create( providerId, config = {} ) {
		// Ensure auto-discovery has run
		this.autoDiscover();

		const ProviderClass = this.providers.get( providerId );
		if ( ! ProviderClass ) {
			return null;
		}

		try {
			return new ProviderClass( config, providerId );
		} catch ( error ) {
			return null;
		}
	}

	/**
	 * Check if a provider is registered.
	 *
	 * @param {string} providerId Provider ID.
	 * @return {boolean} True if registered
	 */
	has( providerId ) {
		this.autoDiscover();
		return this.providers.has( providerId );
	}

	/**
	 * Get all registered provider IDs.
	 *
	 * @return {Array<string>} Array of provider IDs
	 */
	getAllIds() {
		this.autoDiscover();
		return Array.from( this.providers.keys() );
	}

	/**
	 * Get all registered providers with their metadata.
	 *
	 * @return {Array<Object>} Array of provider metadata objects
	 */
	getAllMetadata() {
		this.autoDiscover();

		return this.getAllIds()
			.map( ( providerId ) => {
				const instance = this.get( providerId );
				return instance ? instance.getMetadata() : null;
			} )
			.filter( Boolean );
	}

	/**
	 * Get providers by capability.
	 *
	 * @param {string} capability Capability constant (e.g., 'storage', 'edge').
	 * @return {Array<Object>} Array of provider instances
	 */
	getByCapability( capability ) {
		this.autoDiscover();

		return this.getAllIds()
			.map( ( providerId ) => this.get( providerId ) )
			.filter(
				( provider ) =>
					provider && provider.supportsCapability( capability )
			);
	}

	/**
	 * Get providers by type.
	 *
	 * @param {string} type Provider type (e.g., 'cloud-storage', 'git-hosting').
	 * @return {Array<Object>} Array of provider instances
	 */
	getByType( type ) {
		this.autoDiscover();

		return this.getAllIds()
			.map( ( providerId ) => this.get( providerId ) )
			.filter( ( provider ) => provider && provider.getType() === type );
	}

	/**
	 * Clear all cached instances.
	 *
	 * Forces providers to be re-instantiated on next get().
	 */
	clearCache() {
		this.instances.clear();
		doAction( 'aether.providers.cache_cleared' );
	}

	/**
	 * Clear cache for a specific provider.
	 *
	 * @param {string} providerId Provider ID.
	 */
	clearProviderCache( providerId ) {
		this.instances.delete( providerId );
	}

	/**
	 * Auto-discover and register providers.
	 *
	 * Triggers WordPress action hook for providers to register themselves.
	 * Can be called multiple times to discover newly loaded providers.
	 *
	 * @param {boolean} force Force re-discovery even if already discovered.
	 */
	autoDiscover( force = false ) {
		// If already discovered and not forcing, skip
		// But allow re-discovery if force is true (for newly loaded providers)
		if ( this.discovered && ! force ) {
			return;
		}

		// Allow providers to register via action hook
		// Providers should call: addAction('aether.providers.register', 'my-provider', (registry) => { ... })
		doAction( 'aether.providers.register', this );

		// Allow filtering of the providers map
		// This enables dynamic provider registration or removal
		const filteredProviders = applyFilters(
			'aether.providers.all',
			this.providers
		);
		if ( filteredProviders instanceof Map ) {
			this.providers = filteredProviders;
		}

		// Only set discovered flag if not forcing (allows re-discovery)
		if ( ! force ) {
			this.discovered = true;
		}

		// Fire discovery complete action
		doAction( 'aether.providers.discovered', this );
	}

	/**
	 * Reset the registry (mainly for testing).
	 *
	 * Clears all providers and instances.
	 */
	reset() {
		this.providers.clear();
		this.instances.clear();
		this.discovered = false;
		doAction( 'aether.providers.reset' );
	}

	/**
	 * Get count of registered providers.
	 *
	 * @return {number} Number of registered providers
	 */
	count() {
		this.autoDiscover();
		return this.providers.size;
	}
}

// Export singleton instance
export default ProviderRegistry.getInstance();

// Also export class for testing
export { ProviderRegistry };
