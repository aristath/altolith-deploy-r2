/**
 * Tests for API Middleware
 *
 * Tests request deduplication and response caching through integration tests.
 * Since middleware are internal to the module, we test their behavior through
 * actual API calls using the exported apiFetch.
 */

import { invalidateCache, createAuthHeaders } from '../api';

// Create a test-friendly version that doesn't auto-configure
jest.mock( '@wordpress/api-fetch', () => {
	let middlewares = [];
	const handlers = new Map();

	// Core apiFetch function that runs through middleware
	const apiFetch = jest.fn( async ( options ) => {
		const finalOptions = { ...options };
		let next = async ( opts ) => {
			// Default handler (returns mock response)
			const handler =
				handlers.get( opts.path ) || handlers.get( 'default' );
			if ( handler ) {
				return handler( opts );
			}
			return { success: true, data: 'mock' };
		};

		// Run middleware stack in reverse order (like real apiFetch)
		for ( let i = middlewares.length - 1; i >= 0; i-- ) {
			const middleware = middlewares[ i ];
			const currentNext = next;
			next = async ( opts ) => middleware( opts, currentNext );
		}

		return next( finalOptions );
	} );

	// Mock middleware registration
	apiFetch.use = jest.fn( ( middleware ) => {
		middlewares.push( middleware );
	} );

	// Mock nonce middleware creator
	apiFetch.createNonceMiddleware = jest.fn(
		() => ( options, next ) => next( options )
	);

	// Mock root URL middleware creator
	apiFetch.createRootURLMiddleware = jest.fn(
		() => ( options, next ) => next( options )
	);

	// Helper to set response handler for testing
	apiFetch.setMockHandler = ( path, handler ) => {
		handlers.set( path, handler );
	};

	// Helper to clear mock handlers
	apiFetch.clearMockHandlers = () => {
		handlers.clear();
	};

	// Helper to clear middleware (for test isolation)
	apiFetch.clearMiddleware = () => {
		middlewares = [];
	};

	return apiFetch;
} );

describe( 'API Middleware', () => {
	let apiFetch;

	beforeAll( () => {
		// Import after mock is set up
		apiFetch = require( '@wordpress/api-fetch' );

		// Now import the api module which will register middleware
		require( '../api' );
	} );

	beforeEach( () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		apiFetch.clearMockHandlers();
		invalidateCache(); // Clear cache between tests
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	describe( 'Request Deduplication', () => {
		it( 'should deduplicate concurrent identical GET requests', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( '/test', async () => {
				callCount++;
				return { success: true, data: 'test', call: callCount };
			} );

			// Make 3 concurrent identical requests
			const promises = [
				apiFetch( { method: 'GET', path: '/test' } ),
				apiFetch( { method: 'GET', path: '/test' } ),
				apiFetch( { method: 'GET', path: '/test' } ),
			];

			const results = await Promise.all( promises );

			// Should only execute handler once
			expect( callCount ).toBe( 1 );

			// All results should be identical
			expect( results[ 0 ] ).toEqual( {
				success: true,
				data: 'test',
				call: 1,
			} );
			expect( results[ 1 ] ).toEqual( {
				success: true,
				data: 'test',
				call: 1,
			} );
			expect( results[ 2 ] ).toEqual( {
				success: true,
				data: 'test',
				call: 1,
			} );
		} );

		it( 'should not deduplicate requests with different paths', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( 'default', async ( opts ) => {
				callCount++;
				return { success: true, path: opts.path };
			} );

			await apiFetch( { path: '/test1' } );
			await apiFetch( { path: '/test2' } );

			// Should call handler twice
			expect( callCount ).toBe( 2 );
		} );

		it( 'should allow new requests after previous completes', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( '/test', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// First request
			await apiFetch( { path: '/test' } );
			expect( callCount ).toBe( 1 );

			// Second request after first completes (will use cache, not deduplication)
			await apiFetch( { path: '/test' } );
			// With caching enabled, this should still be 1 (cached)
			// Without cache (after expiry), it would be 2
			expect( callCount ).toBe( 1 ); // Cached response
		} );
	} );

	describe( 'Response Caching', () => {
		it( 'should cache GET requests', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( '/test', async () => {
				callCount++;
				return { success: true, data: 'cached', call: callCount };
			} );

			// First request
			const result1 = await apiFetch( { method: 'GET', path: '/test' } );
			expect( callCount ).toBe( 1 );
			expect( result1.call ).toBe( 1 );

			// Second request (should use cache)
			const result2 = await apiFetch( { method: 'GET', path: '/test' } );
			expect( callCount ).toBe( 1 ); // Still 1 (cached)
			expect( result2.call ).toBe( 1 ); // Same as first
		} );

		it( 'should not cache POST requests', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( '/test', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// First request
			await apiFetch( {
				method: 'POST',
				path: '/test',
				data: { foo: 'bar' },
			} );
			expect( callCount ).toBe( 1 );

			// Second request (should not use cache)
			await apiFetch( {
				method: 'POST',
				path: '/test',
				data: { foo: 'bar' },
			} );
			expect( callCount ).toBe( 2 );
		} );

		it( 'should return cached response within TTL', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( '/test', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// First request
			const result1 = await apiFetch( { method: 'GET', path: '/test' } );
			expect( result1.call ).toBe( 1 );

			// Advance time by 4 minutes (within 5-minute TTL)
			jest.advanceTimersByTime( 4 * 60 * 1000 );

			// Second request (should use cache)
			const result2 = await apiFetch( { method: 'GET', path: '/test' } );
			expect( callCount ).toBe( 1 ); // Still 1 (cached)
			expect( result2.call ).toBe( 1 );
		} );

		it( 'should refetch after cache expires', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( '/test', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// First request
			const result1 = await apiFetch( { method: 'GET', path: '/test' } );
			expect( result1.call ).toBe( 1 );

			// Advance time by 6 minutes (beyond 5-minute TTL)
			jest.advanceTimersByTime( 6 * 60 * 1000 );

			// Second request (should refetch)
			const result2 = await apiFetch( { method: 'GET', path: '/test' } );
			expect( callCount ).toBe( 2 );
			expect( result2.call ).toBe( 2 );
		} );

		it( 'should cache responses with different paths separately', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( 'default', async ( opts ) => {
				callCount++;
				return { success: true, path: opts.path, call: callCount };
			} );

			// Request to path1
			const result1 = await apiFetch( { method: 'GET', path: '/test1' } );
			expect( result1.path ).toBe( '/test1' );
			expect( callCount ).toBe( 1 );

			// Request to path2
			const result2 = await apiFetch( { method: 'GET', path: '/test2' } );
			expect( result2.path ).toBe( '/test2' );
			expect( callCount ).toBe( 2 );

			// Request to path1 again (should use cache)
			const result3 = await apiFetch( { method: 'GET', path: '/test1' } );
			expect( result3.path ).toBe( '/test1' );
			expect( callCount ).toBe( 2 ); // Still 2 (cached)
		} );
	} );

	describe( 'Cache Invalidation', () => {
		it( 'should invalidate cache for specific path', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( 'default', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// Cache two paths
			await apiFetch( { method: 'GET', path: '/test1' } );
			await apiFetch( { method: 'GET', path: '/test2' } );
			expect( callCount ).toBe( 2 );

			// Verify they're cached
			await apiFetch( { method: 'GET', path: '/test1' } );
			await apiFetch( { method: 'GET', path: '/test2' } );
			expect( callCount ).toBe( 2 ); // Still 2 (both cached)

			// Invalidate only /test1
			invalidateCache( '/test1' );

			// /test1 should refetch, /test2 should use cache
			await apiFetch( { method: 'GET', path: '/test1' } );
			expect( callCount ).toBe( 3 );

			await apiFetch( { method: 'GET', path: '/test2' } );
			expect( callCount ).toBe( 3 ); // Still 3 (/test2 cached)
		} );

		it( 'should invalidate all cache when no path provided', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( 'default', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// Cache two paths
			await apiFetch( { method: 'GET', path: '/test1' } );
			await apiFetch( { method: 'GET', path: '/test2' } );
			expect( callCount ).toBe( 2 );

			// Invalidate all cache
			invalidateCache();

			// Both should refetch
			await apiFetch( { method: 'GET', path: '/test1' } );
			await apiFetch( { method: 'GET', path: '/test2' } );
			expect( callCount ).toBe( 4 );
		} );

		it( 'should support partial path matching', async () => {
			let callCount = 0;
			apiFetch.setMockHandler( 'default', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// Cache multiple related paths
			await apiFetch( { method: 'GET', path: '/api/users/1' } );
			await apiFetch( { method: 'GET', path: '/api/users/2' } );
			await apiFetch( { method: 'GET', path: '/api/posts/1' } );
			expect( callCount ).toBe( 3 );

			// Invalidate all /api/users/* paths
			invalidateCache( '/api/users' );

			// User paths should refetch, post path should use cache
			await apiFetch( { method: 'GET', path: '/api/users/1' } );
			await apiFetch( { method: 'GET', path: '/api/users/2' } );
			expect( callCount ).toBe( 5 );

			await apiFetch( { method: 'GET', path: '/api/posts/1' } );
			expect( callCount ).toBe( 5 ); // Still 5 (cached)
		} );
	} );

	describe( 'Integration: Deduplication + Caching', () => {
		it( 'should work together for optimal performance', async () => {
			// Use real timers for this test to avoid timeout issues with async operations
			jest.useRealTimers();

			let callCount = 0;
			apiFetch.setMockHandler( '/test', async () => {
				callCount++;
				return { success: true, call: callCount };
			} );

			// First wave: concurrent requests (deduplication)
			const wave1 = await Promise.all( [
				apiFetch( { method: 'GET', path: '/test' } ),
				apiFetch( { method: 'GET', path: '/test' } ),
				apiFetch( { method: 'GET', path: '/test' } ),
			] );

			// Should only call once due to deduplication
			expect( callCount ).toBe( 1 );
			expect( wave1 ).toHaveLength( 3 );

			// Second wave: later requests (caching)
			const wave2 = await Promise.all( [
				apiFetch( { method: 'GET', path: '/test' } ),
				apiFetch( { method: 'GET', path: '/test' } ),
			] );

			// Should still be only 1 call due to caching
			expect( callCount ).toBe( 1 );
			expect( wave2 ).toHaveLength( 2 );

			// Restore fake timers for other tests
			jest.useFakeTimers();
		} );
	} );

	describe( 'Auth Header Utilities', () => {
		describe( 'createAuthHeaders', () => {
			it( 'should create Bearer token headers by default', () => {
				const headers = createAuthHeaders( 'my-api-token' );

				expect( headers ).toEqual( {
					Authorization: 'Bearer my-api-token',
					'Content-Type': 'application/json',
				} );
			} );

			it( 'should support custom auth types', () => {
				const headers = createAuthHeaders( 'my-token', 'Token' );

				expect( headers ).toEqual( {
					Authorization: 'Token my-token',
					'Content-Type': 'application/json',
				} );
			} );

			it( 'should handle empty tokens', () => {
				const headers = createAuthHeaders( '' );

				expect( headers ).toEqual( {
					Authorization: 'Bearer ',
					'Content-Type': 'application/json',
				} );
			} );
		} );
	} );
} );
