/**
 * useProviderConfig Hook Tests
 *
 * Comprehensive tests for useProviderConfig, useProviderConfigValue, and useIsProviderConfigured hooks.
 *
 * @package
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
	useProviderConfig,
	useProviderConfigValue,
	useIsProviderConfigured,
} from '../useProviderConfig';
import { useProvider } from '../useProvider';

// Mock useProvider hook
jest.mock( '../useProvider', () => ( {
	useProvider: jest.fn(),
} ) );

// Mock provider class
class MockProvider {
	constructor() {
		this.config = {};
	}

	async getConfig() {
		return this.config;
	}

	async isConfigured() {
		return Object.keys( this.config ).length > 0;
	}

	async validateConfig( config ) {
		const errors = {};
		if ( config.requiredField && config.requiredField.length < 5 ) {
			errors.requiredField = 'Field must be at least 5 characters';
		}
		return errors;
	}

	async saveConfig( config ) {
		this.config = { ...config };
		return true;
	}

	async deleteConfig() {
		this.config = {};
		return true;
	}
}

describe( 'useProviderConfig', () => {
	let mockProvider;

	beforeEach( () => {
		mockProvider = new MockProvider();
		useProvider.mockReturnValue( {
			provider: mockProvider,
			isLoading: false,
			error: null,
		} );
		jest.clearAllMocks();
	} );

	test( 'should load config on mount', async () => {
		mockProvider.config = { apiKey: 'test-key' };

		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( result.current.config ).toEqual( { apiKey: 'test-key' } );
		expect( result.current.isConfigured ).toBe( true );
	} );

	test( 'should save config successfully', async () => {
		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		const newConfig = { apiKey: 'new-key', bucket: 'test-bucket' };

		await act( async () => {
			const saved = await result.current.saveConfig( newConfig );
			expect( saved ).toBe( true );
		} );

		expect( result.current.config ).toEqual( newConfig );
		expect( result.current.isConfigured ).toBe( true );
		expect( result.current.isSaving ).toBe( false );
	} );

	test( 'should validate config before saving', async () => {
		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		const invalidConfig = { requiredField: 'abc' }; // Too short

		await act( async () => {
			const saved = await result.current.saveConfig( invalidConfig );
			expect( saved ).toBe( false );
		} );

		expect( result.current.errors ).toHaveProperty( 'requiredField' );
		expect( result.current.isSaving ).toBe( false );
	} );

	test( 'should update single config value', async () => {
		mockProvider.config = { apiKey: 'old-key' };

		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		act( () => {
			result.current.updateConfigValue( 'apiKey', 'new-key' );
		} );

		expect( result.current.config.apiKey ).toBe( 'new-key' );
	} );

	test( 'should validate config without saving', async () => {
		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		act( () => {
			result.current.updateConfigValue( 'requiredField', 'abc' );
		} );

		await act( async () => {
			const errors = await result.current.validateConfig();
			expect( errors ).toHaveProperty( 'requiredField' );
		} );

		expect( result.current.errors ).toHaveProperty( 'requiredField' );
	} );

	test( 'should delete config successfully', async () => {
		mockProvider.config = { apiKey: 'test-key' };

		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		await act( async () => {
			const deleted = await result.current.deleteConfig();
			expect( deleted ).toBe( true );
		} );

		expect( result.current.config ).toEqual( {} );
		expect( result.current.isConfigured ).toBe( false );
		expect( result.current.errors ).toEqual( {} );
	} );

	test( 'should reset config to saved state', async () => {
		mockProvider.config = { apiKey: 'saved-key' };

		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		act( () => {
			result.current.updateConfigValue( 'apiKey', 'modified-key' );
		} );

		await act( async () => {
			result.current.resetConfig();
		} );

		await waitFor( () => {
			expect( result.current.config.apiKey ).toBe( 'saved-key' );
		} );
	} );

	test( 'should handle provider loading state', () => {
		useProvider.mockReturnValue( {
			provider: null,
			isLoading: true,
			error: null,
		} );

		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		expect( result.current.isLoading ).toBe( true );
	} );

	test( 'should handle provider error', () => {
		const providerError = new Error( 'Provider not found' );
		useProvider.mockReturnValue( {
			provider: null,
			isLoading: false,
			error: providerError,
		} );

		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		expect( result.current.providerError ).toBe( providerError );
	} );

	test( 'should handle save error', async () => {
		mockProvider.saveConfig = jest
			.fn()
			.mockRejectedValue( new Error( 'Save failed' ) );

		const { result } = renderHook( () =>
			useProviderConfig( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		await act( async () => {
			const saved = await result.current.saveConfig( { apiKey: 'test' } );
			expect( saved ).toBe( false );
		} );

		expect( result.current.saveError ).toBeInstanceOf( Error );
	} );
} );

describe( 'useProviderConfigValue', () => {
	let mockProvider;

	beforeEach( () => {
		mockProvider = new MockProvider();
		mockProvider.config = { apiKey: 'test-key', optional: undefined };
		useProvider.mockReturnValue( {
			provider: mockProvider,
			isLoading: false,
			error: null,
		} );
	} );

	test( 'should return config value', async () => {
		const { result } = renderHook( () =>
			useProviderConfigValue( 'test-provider', 'apiKey' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( result.current.value ).toBe( 'test-key' );
	} );

	test( 'should return default value when key not found', async () => {
		const { result } = renderHook( () =>
			useProviderConfigValue(
				'test-provider',
				'optional',
				'default-value'
			)
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( result.current.value ).toBe( 'default-value' );
	} );
} );

describe( 'useIsProviderConfigured', () => {
	let mockProvider;

	beforeEach( () => {
		mockProvider = new MockProvider();
		useProvider.mockReturnValue( {
			provider: mockProvider,
			isLoading: false,
			error: null,
		} );
	} );

	test( 'should return true when configured', async () => {
		mockProvider.config = { apiKey: 'test-key' };

		const { result } = renderHook( () =>
			useIsProviderConfigured( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( result.current.isConfigured ).toBe( true );
	} );

	test( 'should return false when not configured', async () => {
		mockProvider.config = {};

		const { result } = renderHook( () =>
			useIsProviderConfigured( 'test-provider' )
		);

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( result.current.isConfigured ).toBe( false );
	} );
} );
