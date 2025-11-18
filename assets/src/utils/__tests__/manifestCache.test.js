/**
 * ManifestCache Tests
 *
 * @package
 */

import { ManifestCache, getManifestCache } from '../manifestCache';

// Mock IndexedDB store
const mockIndexedDBStore = {
	get: jest.fn(),
	set: jest.fn(),
	delete: jest.fn(),
	clear: jest.fn(),
	count: jest.fn(),
	deleteOlderThan: jest.fn(),
};

jest.mock( '../indexedDB', () => {
	return {
		__esModule: true,
		default: jest.fn( () => mockIndexedDBStore ),
	};
} );

describe( 'ManifestCache', () => {
	let cache;

	beforeEach( () => {
		cache = new ManifestCache();
		jest.clearAllMocks();
		mockIndexedDBStore.get.mockResolvedValue( null );
		mockIndexedDBStore.set.mockResolvedValue( true );
		mockIndexedDBStore.delete.mockResolvedValue( true );
		mockIndexedDBStore.clear.mockResolvedValue( true );
		mockIndexedDBStore.count.mockResolvedValue( 0 );
		mockIndexedDBStore.deleteOlderThan.mockResolvedValue( 0 );
	} );

	describe( 'Cache Key Generation', () => {
		test( 'generates correct cache key for provider', () => {
			const key = cache.getCacheKey( 'cloudflare-r2' );
			expect( key ).toBe( 'manifest:cloudflare-r2' );
		} );

		test( 'generates different keys for different providers', () => {
			const key1 = cache.getCacheKey( 'cloudflare-r2' );
			const key2 = cache.getCacheKey( 'github-pages' );
			expect( key1 ).not.toBe( key2 );
		} );
	} );

	describe( 'Get and Set', () => {
		test( 'returns null for cache miss', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );

			const result = await cache.get( 'cloudflare-r2' );

			expect( result ).toBeNull();
			expect( mockIndexedDBStore.get ).toHaveBeenCalledWith(
				'manifest:cloudflare-r2'
			);
		} );

		test( 'returns cached manifest if not expired', async () => {
			const manifest = {
				'index.html': { size: 1024, hash: 'abc123' },
				'style.css': { size: 512, hash: 'def456' },
			};
			const cachedData = {
				manifest,
				timestamp: Date.now() - 1000, // 1 second ago
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			const result = await cache.get( 'cloudflare-r2' );

			expect( result ).toEqual( manifest );
		} );

		test( 'returns null and deletes if expired', async () => {
			const manifest = {
				'index.html': { size: 1024, hash: 'abc123' },
			};
			const cachedData = {
				manifest,
				timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
			};
			mockIndexedDBStore.get.mockResolvedValue( cachedData );

			const result = await cache.get( 'cloudflare-r2' );

			expect( result ).toBeNull();
			expect( mockIndexedDBStore.delete ).toHaveBeenCalledWith(
				'manifest:cloudflare-r2'
			);
		} );

		test( 'sets manifest with provider metadata', async () => {
			const manifest = {
				'index.html': { size: 1024, hash: 'abc123' },
				'style.css': { size: 512, hash: 'def456' },
			};

			await cache.set( 'cloudflare-r2', manifest );

			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				'manifest:cloudflare-r2',
				{ manifest },
				{ providerId: 'cloudflare-r2' }
			);
		} );

		test( 'handles empty manifest', async () => {
			const manifest = {};

			await cache.set( 'cloudflare-r2', manifest );

			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				'manifest:cloudflare-r2',
				{ manifest: {} },
				{ providerId: 'cloudflare-r2' }
			);
		} );
	} );

	describe( 'Invalidate', () => {
		test( 'deletes cached manifest for provider', async () => {
			await cache.invalidate( 'cloudflare-r2' );

			expect( mockIndexedDBStore.delete ).toHaveBeenCalledWith(
				'manifest:cloudflare-r2'
			);
		} );

		test( 'returns true on successful invalidation', async () => {
			mockIndexedDBStore.delete.mockResolvedValue( true );

			const result = await cache.invalidate( 'cloudflare-r2' );

			expect( result ).toBe( true );
		} );

		test( 'returns false on error', async () => {
			mockIndexedDBStore.delete.mockRejectedValue(
				new Error( 'Database error' )
			);

			const result = await cache.invalidate( 'cloudflare-r2' );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'Cleanup', () => {
		test( 'deletes expired entries', async () => {
			mockIndexedDBStore.deleteOlderThan.mockResolvedValue( 3 );

			const deleted = await cache.cleanup();

			expect( deleted ).toBe( 3 );
			expect( mockIndexedDBStore.deleteOlderThan ).toHaveBeenCalledWith(
				60 * 60 * 1000
			);
		} );

		test( 'prevents concurrent cleanup', async () => {
			mockIndexedDBStore.deleteOlderThan.mockImplementation(
				() =>
					new Promise( ( resolve ) =>
						setTimeout( () => resolve( 2 ), 10 )
					)
			);

			const cleanup1Promise = cache.cleanup();
			const cleanup2Promise = cache.cleanup();

			// Should return the same promise
			await expect( cleanup1Promise ).resolves.toBe( 2 );
			await expect( cleanup2Promise ).resolves.toBe( 2 );

			// Should only call deleteOlderThan once
			expect( mockIndexedDBStore.deleteOlderThan ).toHaveBeenCalledTimes(
				1
			);
		} );
	} );

	describe( 'Clear', () => {
		test( 'clears all cached manifests', async () => {
			await cache.clear();

			expect( mockIndexedDBStore.clear ).toHaveBeenCalled();
		} );
	} );

	describe( 'Statistics', () => {
		test( 'returns cache statistics', async () => {
			mockIndexedDBStore.count.mockResolvedValue( 5 );

			const stats = await cache.getStats();

			expect( stats ).toEqual( {
				totalCached: 5,
			} );
		} );
	} );

	describe( 'Singleton', () => {
		test( 'returns same instance', () => {
			const instance1 = getManifestCache();
			const instance2 = getManifestCache();

			expect( instance1 ).toBe( instance2 );
		} );
	} );

	describe( 'Error Handling', () => {
		test( 'handles get errors gracefully', async () => {
			mockIndexedDBStore.get.mockRejectedValue(
				new Error( 'Database error' )
			);

			const result = await cache.get( 'cloudflare-r2' );

			expect( result ).toBeNull();
		} );

		test( 'handles set errors gracefully', async () => {
			mockIndexedDBStore.set.mockRejectedValue(
				new Error( 'Database error' )
			);

			const manifest = { 'index.html': { size: 1024, hash: 'abc123' } };
			const result = await cache.set( 'cloudflare-r2', manifest );

			expect( result ).toBe( false );
		} );
	} );
} );
