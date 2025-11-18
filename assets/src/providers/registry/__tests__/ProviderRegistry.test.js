/**
 * ProviderRegistry Tests
 *
 * @package
 */

import { ProviderRegistry } from '../ProviderRegistry';
import {
	AbstractProvider,
	CAP_STORAGE,
	CAP_EDGE,
} from '../../base/AbstractProvider';

// Mock @wordpress/hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

// Mock provider class for testing
class MockProvider extends AbstractProvider {
	getId() {
		return 'mock-provider';
	}

	getName() {
		return 'Mock Provider';
	}

	getType() {
		return 'test';
	}

	getDescription() {
		return 'A mock provider for testing';
	}

	getConfigFields() {
		return [];
	}
}

class MockStorageProvider extends AbstractProvider {
	capabilities = [ CAP_STORAGE ];

	getId() {
		return 'mock-storage';
	}

	getName() {
		return 'Mock Storage';
	}

	getType() {
		return 'cloud-storage';
	}

	getDescription() {
		return 'Mock storage provider';
	}

	getConfigFields() {
		return [];
	}
}

class MockEdgeProvider extends AbstractProvider {
	capabilities = [ CAP_EDGE ];

	getId() {
		return 'mock-edge';
	}

	getName() {
		return 'Mock Edge';
	}

	getType() {
		return 'edge-compute';
	}

	getDescription() {
		return 'Mock edge provider';
	}

	getConfigFields() {
		return [];
	}
}

describe( 'ProviderRegistry', () => {
	let registry;

	beforeEach( () => {
		// Create a fresh registry instance for each test
		registry = new ProviderRegistry();
		registry.reset();
	} );

	afterEach( () => {
		registry.reset();
	} );

	describe( 'Singleton Pattern', () => {
		test( 'returns same instance', () => {
			const instance1 = ProviderRegistry.getInstance();
			const instance2 = ProviderRegistry.getInstance();

			expect( instance1 ).toBe( instance2 );
		} );
	} );

	describe( 'Registration', () => {
		test( 'registers a provider', () => {
			registry.register( 'mock-provider', MockProvider );

			expect( registry.has( 'mock-provider' ) ).toBe( true );
		} );

		test( 'registers multiple providers', () => {
			registry.register( 'mock-provider', MockProvider );
			registry.register( 'mock-storage', MockStorageProvider );

			expect( registry.count() ).toBe( 2 );
		} );

		test( 'silently skips when overwriting existing provider (idempotent)', () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation();

			registry.register( 'mock-provider', MockProvider );
			registry.register( 'mock-provider', MockStorageProvider );

			// Registry silently skips overwriting (idempotent registration)
			// This handles cases where providers are imported multiple times
			expect( consoleSpy ).not.toHaveBeenCalled();

			// First registration should still be in place
			const instance = registry.get( 'mock-provider' );
			expect( instance ).toBeInstanceOf( MockProvider );

			consoleSpy.mockRestore();
		} );

		test( 'returns registry instance for chaining', () => {
			const result = registry.register( 'mock-provider', MockProvider );

			expect( result ).toBe( registry );
		} );
	} );

	describe( 'Unregistration', () => {
		test( 'unregisters a provider', () => {
			registry.register( 'mock-provider', MockProvider );
			const result = registry.unregister( 'mock-provider' );

			expect( result ).toBe( true );
			expect( registry.has( 'mock-provider' ) ).toBe( false );
		} );

		test( 'returns false for non-existent provider', () => {
			const result = registry.unregister( 'non-existent' );

			expect( result ).toBe( false );
		} );

		test( 'clears instance cache on unregister', () => {
			registry.register( 'mock-provider', MockProvider );
			const instance = registry.get( 'mock-provider' );

			registry.unregister( 'mock-provider' );
			registry.register( 'mock-provider', MockProvider );
			const newInstance = registry.get( 'mock-provider' );

			expect( newInstance ).not.toBe( instance );
		} );
	} );

	describe( 'Provider Retrieval', () => {
		test( 'gets provider instance', () => {
			registry.register( 'mock-provider', MockProvider );
			const instance = registry.get( 'mock-provider' );

			expect( instance ).toBeInstanceOf( MockProvider );
			expect( instance.getId() ).toBe( 'mock-provider' );
		} );

		test( 'returns null for non-existent provider', () => {
			const instance = registry.get( 'non-existent' );

			expect( instance ).toBeNull();
		} );

		test( 'caches provider instances', () => {
			registry.register( 'mock-provider', MockProvider );
			const instance1 = registry.get( 'mock-provider' );
			const instance2 = registry.get( 'mock-provider' );

			expect( instance1 ).toBe( instance2 );
		} );

		test( 'passes config to provider constructor', () => {
			registry.register( 'mock-provider', MockProvider );
			const config = { apiKey: 'test-key' };
			const instance = registry.get( 'mock-provider', config );

			expect( instance.config ).toEqual( config );
		} );

		test( 'passes registered ID to provider', () => {
			registry.register( 'custom-id', MockProvider );
			const instance = registry.get( 'custom-id' );

			expect( instance.registeredId ).toBe( 'custom-id' );
		} );
	} );

	describe( 'Provider Creation (Non-cached)', () => {
		test( 'creates new provider instance', () => {
			registry.register( 'mock-provider', MockProvider );
			const instance1 = registry.create( 'mock-provider' );
			const instance2 = registry.create( 'mock-provider' );

			expect( instance1 ).toBeInstanceOf( MockProvider );
			expect( instance2 ).toBeInstanceOf( MockProvider );
			expect( instance1 ).not.toBe( instance2 );
		} );

		test( 'returns null for non-existent provider', () => {
			const instance = registry.create( 'non-existent' );

			expect( instance ).toBeNull();
		} );
	} );

	describe( 'Provider Existence Check', () => {
		test( 'checks if provider exists', () => {
			registry.register( 'mock-provider', MockProvider );

			expect( registry.has( 'mock-provider' ) ).toBe( true );
			expect( registry.has( 'non-existent' ) ).toBe( false );
		} );
	} );

	describe( 'Get All Provider IDs', () => {
		test( 'returns all provider IDs', () => {
			registry.register( 'provider-1', MockProvider );
			registry.register( 'provider-2', MockStorageProvider );

			const ids = registry.getAllIds();

			expect( ids ).toContain( 'provider-1' );
			expect( ids ).toContain( 'provider-2' );
			expect( ids ).toHaveLength( 2 );
		} );

		test( 'returns empty array when no providers registered', () => {
			const ids = registry.getAllIds();

			expect( ids ).toEqual( [] );
		} );
	} );

	describe( 'Get All Provider Metadata', () => {
		test( 'returns metadata for all providers', () => {
			registry.register( 'mock-provider', MockProvider );
			registry.register( 'mock-storage', MockStorageProvider );

			const metadata = registry.getAllMetadata();

			expect( metadata ).toHaveLength( 2 );
			expect( metadata[ 0 ] ).toHaveProperty( 'id' );
			expect( metadata[ 0 ] ).toHaveProperty( 'name' );
			expect( metadata[ 0 ] ).toHaveProperty( 'type' );
		} );
	} );

	describe( 'Get Providers by Capability', () => {
		beforeEach( () => {
			registry.register( 'mock-provider', MockProvider );
			registry.register( 'mock-storage', MockStorageProvider );
			registry.register( 'mock-edge', MockEdgeProvider );
		} );

		test( 'returns providers with specific capability', () => {
			const storageProviders = registry.getByCapability( CAP_STORAGE );

			expect( storageProviders ).toHaveLength( 1 );
			expect( storageProviders[ 0 ].getId() ).toBe( 'mock-storage' );
		} );

		test( 'returns empty array for unsupported capability', () => {
			const mediaProviders = registry.getByCapability( 'media' );

			expect( mediaProviders ).toEqual( [] );
		} );

		test( 'filters providers correctly', () => {
			const edgeProviders = registry.getByCapability( CAP_EDGE );

			expect( edgeProviders ).toHaveLength( 1 );
			expect( edgeProviders[ 0 ].getId() ).toBe( 'mock-edge' );
		} );
	} );

	describe( 'Get Providers by Type', () => {
		beforeEach( () => {
			registry.register( 'mock-provider', MockProvider );
			registry.register( 'mock-storage', MockStorageProvider );
			registry.register( 'mock-edge', MockEdgeProvider );
		} );

		test( 'returns providers with specific type', () => {
			const storageProviders = registry.getByType( 'cloud-storage' );

			expect( storageProviders ).toHaveLength( 1 );
			expect( storageProviders[ 0 ].getId() ).toBe( 'mock-storage' );
		} );

		test( 'returns empty array for non-existent type', () => {
			const gitProviders = registry.getByType( 'git-hosting' );

			expect( gitProviders ).toEqual( [] );
		} );
	} );

	describe( 'Cache Management', () => {
		test( 'clears all cached instances', () => {
			registry.register( 'mock-provider', MockProvider );
			const instance1 = registry.get( 'mock-provider' );

			registry.clearCache();

			const instance2 = registry.get( 'mock-provider' );

			expect( instance1 ).not.toBe( instance2 );
		} );

		test( 'clears specific provider cache', () => {
			registry.register( 'provider-1', MockProvider );
			registry.register( 'provider-2', MockStorageProvider );

			const instance1a = registry.get( 'provider-1' );
			const instance2a = registry.get( 'provider-2' );

			registry.clearProviderCache( 'provider-1' );

			const instance1b = registry.get( 'provider-1' );
			const instance2b = registry.get( 'provider-2' );

			expect( instance1a ).not.toBe( instance1b );
			expect( instance2a ).toBe( instance2b );
		} );
	} );

	describe( 'Provider Count', () => {
		test( 'returns correct count', () => {
			expect( registry.count() ).toBe( 0 );

			registry.register( 'provider-1', MockProvider );
			expect( registry.count() ).toBe( 1 );

			registry.register( 'provider-2', MockStorageProvider );
			expect( registry.count() ).toBe( 2 );

			registry.unregister( 'provider-1' );
			expect( registry.count() ).toBe( 1 );
		} );
	} );

	describe( 'Reset', () => {
		test( 'clears all providers and instances', () => {
			registry.register( 'provider-1', MockProvider );
			registry.register( 'provider-2', MockStorageProvider );
			registry.get( 'provider-1' );

			registry.reset();

			expect( registry.count() ).toBe( 0 );
			expect( registry.has( 'provider-1' ) ).toBe( false );
			expect( registry.has( 'provider-2' ) ).toBe( false );
		} );
	} );
} );
