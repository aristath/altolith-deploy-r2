/**
 * WpOrgCache Tests
 *
 * @package
 */

import { WpOrgCache, getWpOrgCache } from '../wporgCache';

// Mock IndexedDB store
const mockIndexedDBStore = {
	get: jest.fn(),
	set: jest.fn(),
	delete: jest.fn(),
	clear: jest.fn(),
	count: jest.fn(),
	getAll: jest.fn(),
	deleteOlderThan: jest.fn(),
};

jest.mock( '../indexedDB', () => {
	return {
		__esModule: true,
		default: jest.fn( () => mockIndexedDBStore ),
	};
} );

describe( 'WpOrgCache', () => {
	let cache;

	beforeEach( () => {
		cache = new WpOrgCache();
		jest.clearAllMocks();
		mockIndexedDBStore.get.mockResolvedValue( null );
		mockIndexedDBStore.set.mockResolvedValue( true );
		mockIndexedDBStore.delete.mockResolvedValue( true );
		mockIndexedDBStore.clear.mockResolvedValue( true );
		mockIndexedDBStore.count.mockResolvedValue( 0 );
		mockIndexedDBStore.getAll.mockResolvedValue( [] );
		mockIndexedDBStore.deleteOlderThan.mockResolvedValue( 0 );
		cache.memoryCache.clear();
	} );

	describe( 'Cache Key Generation', () => {
		test( 'generates correct cache key for plugin', () => {
			const key = cache.getCacheKey( 'akismet', 'plugin' );
			expect( key ).toBe( 'plugin:akismet' );
		} );

		test( 'generates correct cache key for theme', () => {
			const key = cache.getCacheKey( 'twentytwentyfour', 'theme' );
			expect( key ).toBe( 'theme:twentytwentyfour' );
		} );
	} );

	describe( 'Get and Set', () => {
		test( 'returns null for cache miss', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );

			const result = await cache.get( 'akismet', 'plugin' );

			expect( result ).toBeNull();
			expect( mockIndexedDBStore.get ).toHaveBeenCalledWith(
				'plugin:akismet'
			);
		} );

		test( 'returns cached value if not expired', async () => {
			const cachedData = {
				exists: true,
				timestamp: Date.now() - 1000, // 1 second ago
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			const result = await cache.get( 'akismet', 'plugin' );

			expect( result ).toBe( true );
			expect( cache.memoryCache.get( 'plugin:akismet' ) ).toBe( true );
		} );

		test( 'returns null and deletes if expired', async () => {
			const cachedData = {
				exists: true,
				timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			const result = await cache.get( 'akismet', 'plugin' );

			expect( result ).toBeNull();
			expect( mockIndexedDBStore.delete ).toHaveBeenCalledWith(
				'plugin:akismet'
			);
		} );

		test( 'sets value in both memory and IndexedDB', async () => {
			await cache.set( 'akismet', 'plugin', true );

			expect( cache.memoryCache.get( 'plugin:akismet' ) ).toBe( true );
			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				'plugin:akismet',
				{ exists: true },
				{ type: 'plugin', slug: 'akismet' }
			);
		} );
	} );

	describe( 'Memory Cache (L1)', () => {
		test( 'returns from memory cache without IndexedDB access', async () => {
			cache.memoryCache.set( 'plugin:akismet', true );

			const result = await cache.get( 'akismet', 'plugin' );

			expect( result ).toBe( true );
			expect( mockIndexedDBStore.get ).not.toHaveBeenCalled();
		} );

		test( 'populates memory cache on IndexedDB hit', async () => {
			const cachedData = {
				exists: false,
				timestamp: Date.now() - 1000,
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			await cache.get( 'custom-plugin', 'plugin' );

			expect( cache.memoryCache.get( 'plugin:custom-plugin' ) ).toBe(
				false
			);
		} );
	} );

	describe( 'Cleanup', () => {
		test( 'deletes expired entries', async () => {
			mockIndexedDBStore.deleteOlderThan.mockResolvedValue( 5 );

			const deleted = await cache.cleanup();

			expect( deleted ).toBe( 5 );
			expect( mockIndexedDBStore.deleteOlderThan ).toHaveBeenCalledWith(
				7 * 24 * 60 * 60 * 1000
			);
		} );

		test( 'prevents concurrent cleanup', async () => {
			mockIndexedDBStore.deleteOlderThan.mockImplementation(
				() =>
					new Promise( ( resolve ) =>
						setTimeout( () => resolve( 3 ), 10 )
					)
			);

			const cleanup1Promise = cache.cleanup();
			const cleanup2Promise = cache.cleanup();

			// Should return the same promise
			await expect( cleanup1Promise ).resolves.toBe( 3 );
			await expect( cleanup2Promise ).resolves.toBe( 3 );

			// Should only call deleteOlderThan once
			expect( mockIndexedDBStore.deleteOlderThan ).toHaveBeenCalledTimes(
				1
			);
		} );
	} );

	describe( 'Clear', () => {
		test( 'clears both memory and IndexedDB', async () => {
			cache.memoryCache.set( 'plugin:akismet', true );
			cache.memoryCache.set( 'theme:twentytwentyfour', true );

			await cache.clear();

			expect( cache.memoryCache.size ).toBe( 0 );
			expect( mockIndexedDBStore.clear ).toHaveBeenCalled();
		} );
	} );

	describe( 'Statistics', () => {
		test( 'returns cache statistics', async () => {
			mockIndexedDBStore.count.mockResolvedValue( 10 );
			cache.memoryCache.set( 'plugin:akismet', true );
			cache.memoryCache.set( 'plugin:jetpack', false );

			const stats = await cache.getStats();

			expect( stats ).toEqual( {
				totalCached: 10,
				memoryCached: 2,
				hitRate: null,
			} );
		} );
	} );

	describe( 'Singleton', () => {
		test( 'returns same instance', () => {
			const instance1 = getWpOrgCache();
			const instance2 = getWpOrgCache();

			expect( instance1 ).toBe( instance2 );
		} );
	} );

	describe( 'Error Handling', () => {
		test( 'handles get errors gracefully', async () => {
			mockIndexedDBStore.get.mockRejectedValue(
				new Error( 'Database error' )
			);

			const result = await cache.get( 'akismet', 'plugin' );

			expect( result ).toBeNull();
		} );

		test( 'handles set errors gracefully', async () => {
			mockIndexedDBStore.set.mockRejectedValue(
				new Error( 'Database error' )
			);

			const result = await cache.set( 'akismet', 'plugin', true );

			expect( result ).toBe( false );
		} );
	} );
} );
