/**
 * Credential Manager Tests
 *
 * @package
 */

import {
	getCredentials,
	clearCredentials,
	clearAllCredentials,
} from '../credentialManager';
import apiFetch from '../api';

jest.mock( '../api' );

describe( 'credentialManager', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		clearAllCredentials();
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	describe( 'getCredentials', () => {
		test( 'fetches credentials from API', async () => {
			const providerId = 'local-filesystem';
			const mockCredentials = {
				access_key_id: 'test-key',
				secret_access_key: 'test-secret',
			};

			apiFetch.mockResolvedValueOnce( {
				success: true,
				config: mockCredentials,
			} );

			const credentials = await getCredentials( providerId );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `/aether/site-exporter/providers/${ providerId }/config`,
				method: 'GET',
			} );
			expect( credentials ).toEqual( mockCredentials );
		} );

		test( 'caches credentials', async () => {
			const providerId = 'local-filesystem';
			const mockCredentials = {
				access_key_id: 'test-key',
			};

			apiFetch.mockResolvedValueOnce( {
				success: true,
				config: mockCredentials,
			} );

			// First call
			await getCredentials( providerId );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			// Second call should use cache
			const credentials = await getCredentials( providerId );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			expect( credentials ).toEqual( mockCredentials );
		} );

		test( 'expires cache after 5 minutes', async () => {
			const providerId = 'local-filesystem';
			const mockCredentials = {
				access_key_id: 'test-key',
			};

			apiFetch.mockResolvedValue( {
				success: true,
				config: mockCredentials,
			} );

			// First call
			await getCredentials( providerId );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			// Advance time by 5 minutes + 1ms
			jest.advanceTimersByTime( 5 * 60 * 1000 + 1 );

			// Second call should fetch again
			await getCredentials( providerId );
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'throws error on API failure', async () => {
			const providerId = 'local-filesystem';

			apiFetch.mockResolvedValueOnce( {
				success: false,
				error: 'Provider not configured',
			} );

			await expect( getCredentials( providerId ) ).rejects.toThrow(
				'Provider not configured'
			);
		} );

		test( 'throws error when response is missing', async () => {
			const providerId = 'local-filesystem';

			apiFetch.mockResolvedValueOnce( null );

			await expect( getCredentials( providerId ) ).rejects.toThrow(
				'Failed to fetch credentials'
			);
		} );

		test( 'handles empty config', async () => {
			const providerId = 'local-filesystem';

			apiFetch.mockResolvedValueOnce( {
				success: true,
				config: {},
			} );

			const credentials = await getCredentials( providerId );
			expect( credentials ).toEqual( {} );
		} );
	} );

	describe( 'clearCredentials', () => {
		test( 'clears cached credentials for provider', async () => {
			const providerId = 'local-filesystem';
			const mockCredentials = {
				access_key_id: 'test-key',
			};

			apiFetch.mockResolvedValueOnce( {
				success: true,
				config: mockCredentials,
			} );

			// Cache credentials
			await getCredentials( providerId );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			// Clear cache
			clearCredentials( providerId );

			// Next call should fetch again
			apiFetch.mockResolvedValueOnce( {
				success: true,
				config: mockCredentials,
			} );
			await getCredentials( providerId );
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'handles clearing non-existent credentials', () => {
			expect( () => clearCredentials( 'non-existent' ) ).not.toThrow();
		} );
	} );

	describe( 'clearAllCredentials', () => {
		test( 'clears all cached credentials', async () => {
			const provider1 = 'local-filesystem';
			const provider2 = 's3';
			const mockCredentials = {
				access_key_id: 'test-key',
			};

			apiFetch.mockResolvedValue( {
				success: true,
				config: mockCredentials,
			} );

			// Cache credentials for both providers
			await getCredentials( provider1 );
			await getCredentials( provider2 );
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );

			// Clear all
			clearAllCredentials();

			// Both should fetch again
			await getCredentials( provider1 );
			await getCredentials( provider2 );
			expect( apiFetch ).toHaveBeenCalledTimes( 4 );
		} );
	} );
} );
