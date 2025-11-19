/**
 * ConfigStorage Tests
 *
 * @package
 */

import { ConfigStorage } from '../configStorage';
import apiFetch from '../../../utils/api';

jest.mock( '../../../utils/api' );
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

// Mock IndexedDB store
const mockIndexedDBStore = {
	get: jest.fn(),
	set: jest.fn(),
	delete: jest.fn(),
	clear: jest.fn(),
};

jest.mock( '../../../utils/indexedDB', () => {
	return {
		__esModule: true,
		default: jest.fn( () => mockIndexedDBStore ),
	};
} );

describe( 'ConfigStorage', () => {
	let storage;

	beforeEach( () => {
		storage = new ConfigStorage( 'test-provider' );
		jest.clearAllMocks();
		mockIndexedDBStore.get.mockResolvedValue( null );
		mockIndexedDBStore.set.mockResolvedValue( true );
		mockIndexedDBStore.delete.mockResolvedValue( true );
		mockIndexedDBStore.clear.mockResolvedValue( true );
	} );

	describe( 'Provider Config Isolation', () => {
		test( 'load() returns only config for specific provider', async () => {
			apiFetch.mockResolvedValue( {
				config: {
					api_key: 'test-key',
					bucket_name: 'test-bucket',
				},
			} );

			const config = await storage.load();

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/test-provider/config',
				method: 'GET',
			} );
			expect( config ).toEqual( {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			} );
		} );

		test( 'save() saves only config for specific provider', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const config = {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			};

			await storage.save( config );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/test-provider/config',
				method: 'POST',
				data: { config },
			} );
		} );

		test( 'save() does not affect other provider configs', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const config = {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			};

			await storage.save( config );

			// Verify only this provider's config endpoint was called
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/providers/test-provider/config',
				} )
			);
		} );

		test( 'delete() deletes only config for specific provider', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			await storage.delete();

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/test-provider/config',
				method: 'DELETE',
			} );
		} );
	} );

	describe( 'Cache Management', () => {
		test( 'loads from cache if available and not stale', async () => {
			const cachedConfig = {
				api_key: 'cached-key',
				bucket_name: 'cached-bucket',
			};
			const cacheData = {
				config: cachedConfig,
				timestamp: Date.now() - 1000, // 1 second ago (not stale)
			};
			mockIndexedDBStore.get.mockResolvedValue( cacheData );

			const config = await storage.load();

			expect( config ).toEqual( cachedConfig );
			expect( apiFetch ).not.toHaveBeenCalled();
			expect( mockIndexedDBStore.get ).toHaveBeenCalledWith(
				'provider:test-provider'
			);
		} );

		test( 'fetches from API if cache is stale', async () => {
			const staleCache = {
				config: { api_key: 'stale-key' },
				timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago (stale)
			};
			mockIndexedDBStore.get.mockResolvedValue( staleCache );

			apiFetch.mockResolvedValue( {
				config: { api_key: 'fresh-key' },
			} );

			const config = await storage.load();

			expect( config ).toEqual( { api_key: 'fresh-key' } );
			expect( apiFetch ).toHaveBeenCalled();
			expect( mockIndexedDBStore.delete ).toHaveBeenCalledWith(
				'provider:test-provider'
			);
		} );

		test( 'updates cache after successful save', async () => {
			apiFetch.mockResolvedValue( { success: true } );

			const config = {
				api_key: 'test-key',
				bucket_name: 'test-bucket',
			};

			await storage.save( config );

			// Verify cache was updated
			expect( mockIndexedDBStore.set ).toHaveBeenCalledWith(
				'provider:test-provider',
				{ config },
				{ providerId: 'test-provider' }
			);
		} );
	} );
} );
