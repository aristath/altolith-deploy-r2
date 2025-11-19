/**
 * Tests for useAsyncOperation hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAsyncOperation } from '../useAsyncOperation';

describe( 'useAsyncOperation', () => {
	it( 'should initialize with default state', () => {
		const { result } = renderHook( () => useAsyncOperation() );

		expect( result.current.loading ).toBe( false );
		expect( result.current.error ).toBe( null );
		expect( result.current.data ).toBe( null );
	} );

	it( 'should initialize with custom initial data', () => {
		const initialData = { foo: 'bar' };
		const { result } = renderHook( () =>
			useAsyncOperation( { initialData } )
		);

		expect( result.current.data ).toEqual( initialData );
	} );

	it( 'should handle successful async operation', async () => {
		const { result } = renderHook( () => useAsyncOperation() );
		const mockData = { success: true };

		await act( async () => {
			await result.current.execute( async () => mockData );
		} );

		expect( result.current.loading ).toBe( false );
		expect( result.current.error ).toBe( null );
		expect( result.current.data ).toEqual( mockData );
	} );

	it( 'should set loading state during operation', async () => {
		const { result } = renderHook( () => useAsyncOperation() );
		let resolveOperation;
		const operation = new Promise( ( resolve ) => {
			resolveOperation = resolve;
		} );

		act( () => {
			result.current.execute( () => operation );
		} );

		// Should be loading
		expect( result.current.loading ).toBe( true );
		expect( result.current.error ).toBe( null );

		// Resolve the operation
		await act( async () => {
			resolveOperation( { done: true } );
			await operation;
		} );

		// Should no longer be loading
		expect( result.current.loading ).toBe( false );
		expect( result.current.data ).toEqual( { done: true } );
	} );

	it( 'should handle operation errors', async () => {
		const { result } = renderHook( () => useAsyncOperation() );
		const errorMessage = 'Something went wrong';

		await act( async () => {
			try {
				await result.current.execute( async () => {
					throw new Error( errorMessage );
				} );
			} catch ( err ) {
				// Expected to throw
			}
		} );

		expect( result.current.loading ).toBe( false );
		expect( result.current.error ).toBe( errorMessage );
		expect( result.current.data ).toBe( null );
	} );

	it( 'should call onSuccess callback', async () => {
		const onSuccess = jest.fn();
		const { result } = renderHook( () =>
			useAsyncOperation( { onSuccess } )
		);
		const mockData = { success: true };

		await act( async () => {
			await result.current.execute( async () => mockData );
		} );

		expect( onSuccess ).toHaveBeenCalledWith( mockData );
		expect( onSuccess ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should call onError callback', async () => {
		const onError = jest.fn();
		const { result } = renderHook( () => useAsyncOperation( { onError } ) );
		const error = new Error( 'Test error' );

		await act( async () => {
			try {
				await result.current.execute( async () => {
					throw error;
				} );
			} catch ( err ) {
				// Expected to throw
			}
		} );

		expect( onError ).toHaveBeenCalledWith( error );
		expect( onError ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should reset state', async () => {
		const { result } = renderHook( () => useAsyncOperation() );

		// First, execute an operation
		await act( async () => {
			await result.current.execute( async () => ( {
				success: true,
			} ) );
		} );

		expect( result.current.data ).toEqual( { success: true } );

		// Then reset
		act( () => {
			result.current.reset();
		} );

		expect( result.current.loading ).toBe( false );
		expect( result.current.error ).toBe( null );
		expect( result.current.data ).toBe( null );
	} );

	it( 'should preserve previous data during loading', async () => {
		const { result } = renderHook( () => useAsyncOperation() );
		const initialData = { count: 1 };

		// Set initial data
		await act( async () => {
			await result.current.execute( async () => initialData );
		} );

		expect( result.current.data ).toEqual( initialData );

		// Start a new operation
		let resolveOperation;
		const operation = new Promise( ( resolve ) => {
			resolveOperation = resolve;
		} );

		act( () => {
			result.current.execute( () => operation );
		} );

		// Data should be preserved during loading
		expect( result.current.loading ).toBe( true );
		expect( result.current.data ).toEqual( initialData );

		// Complete the operation
		await act( async () => {
			resolveOperation( { count: 2 } );
			await operation;
		} );

		expect( result.current.data ).toEqual( { count: 2 } );
	} );

	it( 'should preserve previous data on error', async () => {
		const { result } = renderHook( () => useAsyncOperation() );
		const initialData = { count: 1 };

		// Set initial data
		await act( async () => {
			await result.current.execute( async () => initialData );
		} );

		// Try an operation that fails
		await act( async () => {
			try {
				await result.current.execute( async () => {
					throw new Error( 'Failed' );
				} );
			} catch ( err ) {
				// Expected to throw
			}
		} );

		// Data should be preserved
		expect( result.current.data ).toEqual( initialData );
		expect( result.current.error ).toBe( 'Failed' );
	} );

	it( 'should allow manual error setting', () => {
		const { result } = renderHook( () => useAsyncOperation() );

		act( () => {
			result.current.setError( 'Manual error' );
		} );

		expect( result.current.error ).toBe( 'Manual error' );
		expect( result.current.loading ).toBe( false );
	} );

	it( 'should allow manual data setting', () => {
		const { result } = renderHook( () => useAsyncOperation() );
		const data = { foo: 'bar' };

		act( () => {
			result.current.setData( data );
		} );

		expect( result.current.data ).toEqual( data );
	} );

	it( 'should allow manual loading setting', () => {
		const { result } = renderHook( () => useAsyncOperation() );

		act( () => {
			result.current.setLoading( true );
		} );

		expect( result.current.loading ).toBe( true );
		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'should provide isLoading alias', () => {
		const { result } = renderHook( () => useAsyncOperation() );

		expect( result.current.isLoading ).toBe( result.current.loading );
	} );
} );
