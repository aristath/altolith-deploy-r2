/**
 * AbstractAWSProvider Test Suite
 *
 * Tests for AbstractAWSProvider using a mock concrete implementation.
 * Ensures abstract methods are enforced and common functionality works.
 *
 * @package
 */

import { AbstractAWSProvider } from '../AbstractAWSProvider';
import { CAP_STORAGE } from '../../base/AbstractProvider';
import { StorageService } from '../../services/storageService';
import apiFetch from '../../../utils/api';

// Mock dependencies
jest.mock( '../../services/storageService' );
jest.mock( '../../../utils/api', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock( '../../utils/configStorage', () => {
	const actual = jest.requireActual( '../../utils/configStorage' );
	return {
		...actual,
		ConfigStorage: jest.fn().mockImplementation( ( providerId ) => {
			const instance = new actual.ConfigStorage( providerId );
			instance.load = jest.fn().mockResolvedValue( {} );
			return instance;
		} ),
	};
} );

/**
 * Mock concrete implementation of AbstractAWSProvider for testing.
 */
class MockAWSProvider extends AbstractAWSProvider {
	static ID = 'mock-aws';

	capabilities = [ CAP_STORAGE ];

	getId() {
		return this.registeredId || MockAWSProvider.ID;
	}

	getName() {
		return 'Mock AWS Provider';
	}

	getType() {
		return 'cloud-storage';
	}

	getDescription() {
		return 'Mock AWS provider for testing';
	}

	getIcon() {
		return '☁️';
	}

	getConfigFields() {
		return [];
	}

	// Implement abstract methods
	async getStorageEndpoint() {
		return this.config.worker_endpoint || 'https://endpoint.example.com';
	}

	async getStorageServiceConfig() {
		return {
			worker_endpoint: this.config.worker_endpoint,
			bucket_name: this.config.bucket_name,
			...this.config,
		};
	}

	async testConnection() {
		return {
			success: true,
			message: 'Connection successful',
		};
	}

	getPublicUrl( key ) {
		return `https://example.com/${ key }`;
	}
}

describe( 'AbstractAWSProvider (via MockAWSProvider)', () => {
	let provider;
	const mockConfig = {
		access_key_id: 'test-access-key-id-123456789012',
		secret_access_key:
			'test-secret-access-key-123456789012345678901234567890',
		bucket_name: 'test-bucket',
		region: 'us-east-1',
		endpoint: 'https://s3.amazonaws.com',
		worker_endpoint: 'https://worker.example.com',
	};

	beforeEach( () => {
		provider = new MockAWSProvider( mockConfig );
		jest.clearAllMocks();
	} );

	describe( 'Basic Properties', () => {
		test( 'should have correct type', () => {
			expect( provider.getType() ).toBe( 'cloud-storage' );
		} );

		test( 'should have storage capability', () => {
			expect( provider.capabilities ).toContain( CAP_STORAGE );
		} );
	} );

	describe( 'Abstract Method Enforcement', () => {
		test( 'should throw error if getStorageEndpoint is not implemented', async () => {
			class IncompleteProvider extends AbstractAWSProvider {
				getId() {
					return 'incomplete';
				}

				getName() {
					return 'Incomplete';
				}

				getType() {
					return 'cloud-storage';
				}

				getDescription() {
					return 'Incomplete provider';
				}

				getConfigFields() {
					return [];
				}
			}

			const incomplete = new IncompleteProvider( mockConfig );

			await expect( incomplete.getStorageEndpoint() ).rejects.toThrow(
				'AbstractAWSProvider.getStorageEndpoint() must be implemented by subclass'
			);
		} );
	} );

	describe( 'getStorageEndpoint', () => {
		test( 'should return worker_endpoint when available', async () => {
			const endpoint = await provider.getStorageEndpoint();
			expect( endpoint ).toBe( mockConfig.worker_endpoint );
		} );

		test( 'should return default endpoint when worker_endpoint is missing', async () => {
			const providerNoWorker = new MockAWSProvider( {
				...mockConfig,
				worker_endpoint: '',
			} );

			const endpoint = await providerNoWorker.getStorageEndpoint();
			expect( endpoint ).toBe( 'https://endpoint.example.com' );
		} );
	} );

	describe( 'getStorageServiceConfig', () => {
		test( 'should return config with worker_endpoint and bucket_name', async () => {
			const config = await provider.getStorageServiceConfig();

			expect( config ).toHaveProperty( 'worker_endpoint' );
			expect( config ).toHaveProperty( 'bucket_name' );
			expect( config.worker_endpoint ).toBe( mockConfig.worker_endpoint );
			expect( config.bucket_name ).toBe( mockConfig.bucket_name );
		} );
	} );

	describe( 'testConnection', () => {
		test( 'should return success result', async () => {
			const result = await provider.testConnection();

			expect( result.success ).toBe( true );
			expect( result.message ).toBe( 'Connection successful' );
		} );
	} );

	describe( 'getStorageService', () => {
		test( 'should initialize StorageService with endpoint and bucket', async () => {
			const storageService = await provider.getStorageService();

			expect( StorageService ).toHaveBeenCalledWith(
				mockConfig.worker_endpoint,
				mockConfig.bucket_name,
				expect.objectContaining( {
					worker_endpoint: mockConfig.worker_endpoint,
					bucket_name: mockConfig.bucket_name,
				} )
			);
			expect( storageService ).toBeInstanceOf( StorageService );
		} );

		test( 'should return null when endpoint is missing', async () => {
			const providerNoEndpoint = new MockAWSProvider( {
				...mockConfig,
				worker_endpoint: '',
			} );
			// Override getStorageEndpoint to return empty string
			providerNoEndpoint.getStorageEndpoint = jest
				.fn()
				.mockResolvedValue( '' );

			const storageService = await providerNoEndpoint.getStorageService();
			expect( storageService ).toBeNull();
		} );

		test( 'should cache StorageService instance', async () => {
			const service1 = await provider.getStorageService();
			const service2 = await provider.getStorageService();

			expect( service1 ).toBe( service2 );
			expect( StorageService ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'getPublicUrl', () => {
		test( 'should construct public URL from key', () => {
			const url = provider.getPublicUrl( 'path/to/file.jpg' );
			expect( url ).toBe( 'https://example.com/path/to/file.jpg' );
		} );
	} );
} );
