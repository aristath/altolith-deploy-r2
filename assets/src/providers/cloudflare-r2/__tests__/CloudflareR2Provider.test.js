/**
 * CloudflareR2Provider Tests
 *
 * @package
 */

import { CloudflareR2Provider } from '../CloudflareR2Provider';
import {
	CAP_STORAGE,
	CAP_MEDIA,
	CAP_STATIC_SITE,
} from '../../base/AbstractProvider';

// Mock API
jest.mock( '../../../utils/api', () => {
	const mockApiFetch = jest.fn().mockResolvedValue( {} );
	mockApiFetch.use = jest.fn();
	mockApiFetch.createNonceMiddleware = jest.fn(
		() => ( options, next ) => next( options )
	);
	mockApiFetch.createRootURLMiddleware = jest.fn(
		() => ( options, next ) => next( options )
	);
	return { default: mockApiFetch, invalidateCache: jest.fn() };
} );

// Mock services
jest.mock( '../../services/edgeService' );
jest.mock( '../../services/storageService' );

// Mock ConfigStorage
jest.mock( '../../utils/configStorage', () => ( {
	ConfigStorage: jest.fn().mockImplementation( () => ( {
		load: jest.fn().mockResolvedValue( {
			cloudflare_account_id: 'abc123',
			bucket_name: 'my-bucket',
			access_key_id: 'access123',
			secret_access_key: 'secret123',
			worker_endpoint: 'https://worker.example.com',
		} ),
		save: jest.fn().mockResolvedValue( true ),
		delete: jest.fn().mockResolvedValue( true ),
	} ) ),
} ) );

describe( 'CloudflareR2Provider', () => {
	let provider;

	beforeEach( () => {
		provider = new CloudflareR2Provider();
	} );

	describe( 'Metadata', () => {
		test( 'returns correct provider ID', () => {
			expect( provider.getId() ).toBe( 'cloudflare-r2' );
		} );

		test( 'returns correct provider name', () => {
			expect( provider.getName() ).toBe( 'Cloudflare R2' );
		} );

		test( 'returns correct provider type', () => {
			expect( provider.getType() ).toBe( 'cloud-storage' );
		} );

		test( 'returns provider description', () => {
			const description = provider.getDescription();

			expect( description ).toContain( 'Cloudflare R2' );
			expect( description ).toContain( 'zero egress fees' );
		} );

		test( 'returns cloud icon', () => {
			expect( provider.getIcon() ).toBe( '☁️' );
		} );

		test( 'supports all required capabilities', () => {
			const capabilities = provider.getCapabilities();

			expect( capabilities ).toContain( CAP_STORAGE );
			expect( capabilities ).toContain( CAP_MEDIA );
			expect( capabilities ).toContain( CAP_STATIC_SITE );
			expect( capabilities ).toHaveLength( 3 );
		} );
	} );

	describe( 'Configuration Fields', () => {
		test( 'defines all required fields', () => {
			const fields = provider.getConfigFields();

			const fieldIds = fields.map( ( f ) => f.id );

			expect( fieldIds ).toContain( 'cloudflare_account_id' );
			expect( fieldIds ).toContain( 'bucket_name' );
			expect( fieldIds ).toContain( 'access_key_id' );
			expect( fieldIds ).toContain( 'secret_access_key' );
			expect( fieldIds ).toContain( 'worker_endpoint' );
			expect( fieldIds ).toContain( 'custom_domain' );
			expect( fieldIds ).toContain( 'public_access' );
		} );

		test( 'marks required fields correctly', () => {
			const fields = provider.getConfigFields();

			const requiredFields = fields
				.filter( ( f ) => f.required )
				.map( ( f ) => f.id );

			expect( requiredFields ).toContain( 'cloudflare_account_id' );
			expect( requiredFields ).toContain( 'bucket_name' );
			expect( requiredFields ).toContain( 'access_key_id' );
			expect( requiredFields ).toContain( 'secret_access_key' );
		} );

		test( 'marks sensitive fields correctly', () => {
			const fields = provider.getConfigFields();

			const sensitiveFields = fields
				.filter( ( f ) => f.sensitive )
				.map( ( f ) => f.id );

			expect( sensitiveFields ).toContain( 'cloudflare_account_id' );
			expect( sensitiveFields ).toContain( 'secret_access_key' );
		} );

		test( 'sets validation patterns', () => {
			const fields = provider.getConfigFields();

			const accountIdField = fields.find(
				( f ) => f.id === 'cloudflare_account_id'
			);
			expect( accountIdField.validation.pattern ).toBeDefined();

			const bucketNameField = fields.find(
				( f ) => f.id === 'bucket_name'
			);
			expect( bucketNameField.validation.pattern ).toBeDefined();
		} );

		test( 'sets default values', () => {
			const fields = provider.getConfigFields();

			const publicAccessField = fields.find(
				( f ) => f.id === 'public_access'
			);
			expect( publicAccessField.default ).toBe( false );
		} );
	} );

	describe( 'Configuration Validation', () => {
		test( 'validates account ID format', async () => {
			const config = {
				cloudflare_account_id: 'invalid',
				bucket_name: 'my-bucket',
				access_key_id: 'key123',
				secret_access_key: 'secret123',
			};

			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'cloudflare_account_id' );
		} );

		test( 'validates bucket name format', async () => {
			const config = {
				cloudflare_account_id: 'a'.repeat( 32 ),
				bucket_name: 'Invalid-Bucket-Name!',
				access_key_id: 'key123',
				secret_access_key: 'secret123',
			};

			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'bucket_name' );
		} );

		test( 'validates bucket name length', async () => {
			const config = {
				cloudflare_account_id: 'a'.repeat( 32 ),
				bucket_name: 'ab', // Too short
				access_key_id: 'key123',
				secret_access_key: 'a'.repeat( 32 ),
			};

			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'bucket_name' );
		} );

		test( 'passes validation with valid config', async () => {
			const config = {
				cloudflare_account_id: 'a'.repeat( 32 ),
				bucket_name: 'my-bucket',
				access_key_id: 'a'.repeat( 20 ),
				secret_access_key: 'a'.repeat( 32 ),
			};

			const errors = await provider.validateConfig( config );

			expect( Object.keys( errors ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'Status Checks', () => {
		test( 'returns deployment status', async () => {
			const status = await provider.getStatus();

			expect( status ).toHaveProperty( 'configured' );
			expect( status ).toHaveProperty( 'healthy' );
			expect( status ).toHaveProperty( 'deployed' );
		} );

		test( 'marks as deployed when worker_endpoint is set', async () => {
			// Config is already mocked with worker_endpoint
			const status = await provider.getStatus();

			expect( status.deployed ).toBe( true );
		} );
	} );

	describe( 'Service Lazy Loading', () => {
		test( 'creates edge service when needed', async () => {
			const edgeService = await provider.getEdgeService();

			expect( edgeService ).toBeDefined();
		} );

		test( 'caches edge service instance', async () => {
			const service1 = await provider.getEdgeService();
			const service2 = await provider.getEdgeService();

			expect( service1 ).toBe( service2 );
		} );

		test( 'creates storage service when needed', async () => {
			const storageService = await provider.getStorageService();

			expect( storageService ).toBeDefined();
		} );

		test( 'caches storage service instance', async () => {
			const service1 = await provider.getStorageService();
			const service2 = await provider.getStorageService();

			expect( service1 ).toBe( service2 );
		} );
	} );

	describe( 'Deployment', () => {
		test( 'returns default deployment message (no deployment needed)', async () => {
			const result = await provider.deploy();

			expect( result.success ).toBe( true );
			expect( result.message ).toContain( 'No deployment needed' );
		} );
	} );

	// Note: CloudflareR2Provider does not support media operations
	// Media capabilities are handled by Cloudflare Images provider
} );
