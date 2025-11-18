/**
 * useProvider Hook Tests
 *
 * Comprehensive tests for useProvider, useProviderExists, useProvidersByCapability, and useProvidersByType hooks.
 * Updated to work with ProviderContext-based implementation.
 *
 * @package
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
	useProvider,
	useProviderExists,
	useProvidersByCapability,
	useProvidersByType,
} from '../useProvider';

// Mock useProviderContext
jest.mock( '../../../hooks/useProviderContext', () => ( {
	useProviderContext: jest.fn(),
} ) );

// Import after mocking
const { useProviderContext } = require( '../../../hooks/useProviderContext' );

// Mock provider class
class MockProvider {
	constructor( config, registeredId ) {
		this.config = config;
		this.registeredId = registeredId;
	}

	getId() {
		return this.registeredId || 'mock-provider';
	}
}

describe( 'useProvider', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should return provider instance when found', async () => {
		const mockProvider = new MockProvider( {}, 'test-provider' );
		useProviderContext.mockReturnValue( {
			getProvider: jest.fn( () => mockProvider ),
			loading: false,
			error: null,
		} );

		const { result } = renderHook( () =>
			useProvider( 'test-provider', {} )
		);

		expect( result.current.provider ).toBe( mockProvider );
		expect( result.current.isLoading ).toBe( false );
		expect( result.current.error ).toBeNull();
	} );

	test( 'should return null when providerId is empty', () => {
		useProviderContext.mockReturnValue( {
			getProvider: jest.fn( () => null ),
			loading: false,
			error: null,
		} );

		const { result } = renderHook( () => useProvider( '', {} ) );

		expect( result.current.provider ).toBeNull();
		expect( result.current.error ).toBeNull();
	} );

	test( 'should return error when provider not found', () => {
		useProviderContext.mockReturnValue( {
			getProvider: jest.fn( () => null ),
			loading: false,
			error: null,
		} );

		const { result } = renderHook( () =>
			useProvider( 'non-existent', {} )
		);

		expect( result.current.provider ).toBeNull();
		expect( result.current.error ).toContain( 'not found' );
		expect( result.current.isLoading ).toBe( false );
	} );

	test( 'should pass config to provider', () => {
		const config = { apiKey: 'test-key' };
		const mockProvider = new MockProvider( config, 'test-provider' );
		const mockGetProvider = jest.fn( () => mockProvider );

		useProviderContext.mockReturnValue( {
			getProvider: mockGetProvider,
			loading: false,
			error: null,
		} );

		renderHook( () => useProvider( 'test-provider', config ) );

		expect( mockGetProvider ).toHaveBeenCalledWith(
			'test-provider',
			config
		);
	} );

	test( 'should show loading state from context', () => {
		useProviderContext.mockReturnValue( {
			getProvider: jest.fn( () => null ),
			loading: true,
			error: null,
		} );

		const { result } = renderHook( () =>
			useProvider( 'test-provider', {} )
		);

		expect( result.current.isLoading ).toBe( true );
	} );

	test( 'should pass through context error', () => {
		useProviderContext.mockReturnValue( {
			getProvider: jest.fn( () => null ),
			loading: false,
			error: 'Context error',
		} );

		const { result } = renderHook( () =>
			useProvider( 'test-provider', {} )
		);

		expect( result.current.error ).toBe( 'Context error' );
	} );
} );

describe( 'useProviderExists', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should return true when provider exists', () => {
		useProviderContext.mockReturnValue( {
			providerExists: jest.fn( () => true ),
			loading: false,
		} );

		const { result } = renderHook( () =>
			useProviderExists( 'test-provider' )
		);

		expect( result.current.exists ).toBe( true );
		expect( result.current.isLoading ).toBe( false );
	} );

	test( 'should return false when provider does not exist', () => {
		useProviderContext.mockReturnValue( {
			providerExists: jest.fn( () => false ),
			loading: false,
		} );

		const { result } = renderHook( () =>
			useProviderExists( 'non-existent' )
		);

		expect( result.current.exists ).toBe( false );
		expect( result.current.isLoading ).toBe( false );
	} );

	test( 'should show loading state', () => {
		useProviderContext.mockReturnValue( {
			providerExists: jest.fn( () => false ),
			loading: true,
		} );

		const { result } = renderHook( () =>
			useProviderExists( 'test-provider' )
		);

		expect( result.current.isLoading ).toBe( true );
	} );
} );

describe( 'useProvidersByCapability', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should return providers with capability', () => {
		const mockProviders = [
			new MockProvider( {}, 'provider1' ),
			new MockProvider( {}, 'provider2' ),
		];
		const mockGetByCapability = jest.fn( () => mockProviders );

		useProviderContext.mockReturnValue( {
			getProvidersByCapability: mockGetByCapability,
			loading: false,
		} );

		const { result } = renderHook( () =>
			useProvidersByCapability( 'storage' )
		);

		expect( result.current.providers ).toEqual( mockProviders );
		expect( result.current.isLoading ).toBe( false );
		expect( mockGetByCapability ).toHaveBeenCalledWith( 'storage' );
	} );

	test( 'should return empty array when no providers match', () => {
		useProviderContext.mockReturnValue( {
			getProvidersByCapability: jest.fn( () => [] ),
			loading: false,
		} );

		const { result } = renderHook( () =>
			useProvidersByCapability( 'storage' )
		);

		expect( result.current.providers ).toEqual( [] );
		expect( result.current.isLoading ).toBe( false );
	} );

	test( 'should show loading state', () => {
		useProviderContext.mockReturnValue( {
			getProvidersByCapability: jest.fn( () => [] ),
			loading: true,
		} );

		const { result } = renderHook( () =>
			useProvidersByCapability( 'storage' )
		);

		expect( result.current.isLoading ).toBe( true );
	} );

	test( 'should update when capability changes', () => {
		const storageProviders = [ new MockProvider( {}, 'storage1' ) ];
		const edgeProviders = [ new MockProvider( {}, 'edge1' ) ];

		const mockGetByCapability = jest
			.fn()
			.mockReturnValueOnce( storageProviders )
			.mockReturnValueOnce( edgeProviders );

		useProviderContext.mockReturnValue( {
			getProvidersByCapability: mockGetByCapability,
			loading: false,
		} );

		const { result, rerender } = renderHook(
			( { capability } ) => useProvidersByCapability( capability ),
			{ initialProps: { capability: 'storage' } }
		);

		expect( result.current.providers ).toEqual( storageProviders );

		rerender( { capability: 'edge' } );

		expect( result.current.providers ).toEqual( edgeProviders );
	} );
} );

describe( 'useProvidersByType', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should return providers with type', () => {
		const mockProviders = [ new MockProvider( {}, 'provider1' ) ];
		const mockGetByType = jest.fn( () => mockProviders );

		useProviderContext.mockReturnValue( {
			getProvidersByType: mockGetByType,
			loading: false,
		} );

		const { result } = renderHook( () =>
			useProvidersByType( 'cloud-storage' )
		);

		expect( result.current.providers ).toEqual( mockProviders );
		expect( result.current.isLoading ).toBe( false );
		expect( mockGetByType ).toHaveBeenCalledWith( 'cloud-storage' );
	} );

	test( 'should return empty array when no providers match', () => {
		useProviderContext.mockReturnValue( {
			getProvidersByType: jest.fn( () => [] ),
			loading: false,
		} );

		const { result } = renderHook( () =>
			useProvidersByType( 'cloud-storage' )
		);

		expect( result.current.providers ).toEqual( [] );
		expect( result.current.isLoading ).toBe( false );
	} );

	test( 'should show loading state', () => {
		useProviderContext.mockReturnValue( {
			getProvidersByType: jest.fn( () => [] ),
			loading: true,
		} );

		const { result } = renderHook( () =>
			useProvidersByType( 'cloud-storage' )
		);

		expect( result.current.isLoading ).toBe( true );
	} );
} );
