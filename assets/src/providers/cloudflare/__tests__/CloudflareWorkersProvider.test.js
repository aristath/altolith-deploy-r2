/**
 * CloudflareWorkersProvider Tests
 *
 * @package
 */

import { CloudflareWorkersProvider } from '../CloudflareWorkersProvider';
import { CAP_EDGE } from '../../base/AbstractProvider';
import {
	deployWorker,
	testTokenPermissions,
	deleteWorker as deleteWorkerAPI,
	listCustomDomains,
	attachCustomDomain,
	removeCustomDomain,
} from '../../../utils/cloudflareWorkersApi';
import apiFetch from '../../../utils/api';

// Mock cloudflareWorkersApi
jest.mock( '../../../utils/cloudflareWorkersApi' );

// Mock apiFetch for testConnection
jest.mock( '../../../utils/api', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Mock ConfigStorage
jest.mock( '../../utils/configStorage', () => ( {
	ConfigStorage: jest.fn().mockImplementation( () => ( {
		load: jest.fn().mockResolvedValue( {
			account_id: 'a'.repeat( 32 ),
			api_token: 'test-token-123',
		} ),
		save: jest.fn().mockResolvedValue( true ),
		delete: jest.fn().mockResolvedValue( true ),
	} ) ),
} ) );

describe( 'CloudflareWorkersProvider', () => {
	let provider;

	beforeEach( () => {
		provider = new CloudflareWorkersProvider();
		jest.clearAllMocks();
	} );

	describe( 'Metadata', () => {
		test( 'returns correct provider ID', () => {
			expect( provider.getId() ).toBe( 'cloudflare' );
		} );

		test( 'returns correct provider name', () => {
			expect( provider.getName() ).toBe( 'Cloudflare Workers' );
		} );

		test( 'returns correct provider type', () => {
			expect( provider.getType() ).toBe( 'edge-computing' );
		} );

		test( 'returns provider description', () => {
			const description = provider.getDescription();

			expect( description ).toContain( 'Cloudflare Workers' );
			expect( description.toLowerCase() ).toContain( 'edge' );
		} );

		test( 'returns lightning icon', () => {
			expect( provider.getIcon() ).toBe( '⚡' );
		} );

		test( 'supports only edge capability', () => {
			const capabilities = provider.getCapabilities();

			expect( capabilities ).toContain( CAP_EDGE );
			expect( capabilities ).toHaveLength( 1 );
		} );
	} );

	describe( 'Configuration Fields', () => {
		test( 'defines required fields', () => {
			const fields = provider.getConfigFields();

			const fieldIds = fields.map( ( f ) => f.id );

			expect( fieldIds ).toContain( 'account_id' );
			expect( fieldIds ).toContain( 'api_token' );
			expect( fields ).toHaveLength( 2 );
		} );

		test( 'marks both fields as required', () => {
			const fields = provider.getConfigFields();

			const requiredFields = fields.filter( ( f ) => f.required );

			expect( requiredFields ).toHaveLength( 2 );
		} );

		test( 'marks sensitive fields correctly', () => {
			const fields = provider.getConfigFields();

			const sensitiveFields = fields
				.filter( ( f ) => f.sensitive )
				.map( ( f ) => f.id );

			expect( sensitiveFields ).toContain( 'account_id' );
			expect( sensitiveFields ).toContain( 'api_token' );
		} );

		test( 'sets validation pattern for account_id', () => {
			const fields = provider.getConfigFields();

			const accountIdField = fields.find(
				( f ) => f.id === 'account_id'
			);

			expect( accountIdField.validation.pattern ).toBe(
				'^[a-f0-9]{32}$'
			);
		} );

		test( 'sets password type for api_token', () => {
			const fields = provider.getConfigFields();

			const apiTokenField = fields.find( ( f ) => f.id === 'api_token' );

			expect( apiTokenField.type ).toBe( 'password' );
		} );
	} );

	describe( 'Worker Deployment', () => {
		test( 'deploys worker successfully', async () => {
			const mockResult = {
				success: true,
				workerUrl: 'https://aether-r2-abc123.workers.dev',
			};

			deployWorker.mockResolvedValue( mockResult );
			testTokenPermissions.mockResolvedValue( {
				success: true,
				message: 'Token valid',
			} );

			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");',
				{}
			);

			expect( result.success ).toBe( true );
			expect( result.workerName ).toMatch( /^aether-r2-/ );
			expect( result.workerUrl ).toBe( mockResult.workerUrl );
			expect( result.workerType ).toBe( 'r2' );
		} );

		test( 'performs dry run deployment', async () => {
			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");',
				{},
				true
			);

			expect( result.success ).toBe( true );
			expect( result.workerName ).toMatch( /^aether-r2-.*-dry-run$/ );
			expect( result.workerUrl ).toContain( 'workers.dev' );
			expect( result.message ).toContain( 'Dry run' );
			expect( deployWorker ).not.toHaveBeenCalled();
		} );

		test( 'fails with invalid worker type', async () => {
			const result = await provider.deployWorker(
				'invalid',
				'console.log("worker");'
			);

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'Invalid worker type' );
		} );

		test( 'fails when credentials are invalid', async () => {
			// Mock empty config
			const mockStorage = {
				load: jest
					.fn()
					.mockResolvedValue( { account_id: '', api_token: '' } ),
				save: jest.fn().mockResolvedValue( true ),
				delete: jest.fn().mockResolvedValue( true ),
			};

			provider.configStorage = mockStorage;

			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");'
			);

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'Account ID is required' );
		} );

		test( 'fails when token permissions test fails', async () => {
			testTokenPermissions.mockResolvedValue( {
				success: false,
				error: 'Invalid token permissions',
			} );

			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");'
			);

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Invalid token permissions' );
		} );

		test( 'saves deployment info after successful deployment', async () => {
			const mockResult = {
				success: true,
				workerUrl: 'https://aether-r2-abc123.workers.dev',
			};

			deployWorker.mockResolvedValue( mockResult );
			testTokenPermissions.mockResolvedValue( { success: true } );

			const saveDeploymentInfoSpy = jest.spyOn(
				provider,
				'saveDeploymentInfo'
			);

			await provider.deployWorker( 'r2', 'console.log("worker");' );

			expect( saveDeploymentInfoSpy ).toHaveBeenCalledWith(
				'r2',
				expect.objectContaining( {
					worker_type: 'r2',
					workerUrl: mockResult.workerUrl,
				} )
			);
		} );
	} );

	describe( 'Connection Testing', () => {
		test( 'tests connection successfully', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				message: 'Connection successful',
			} );

			const result = await provider.testConnection();

			expect( result.success ).toBe( true );
			expect( result.message ).toContain( 'Connection successful' );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `/aether/v1/providers/${ provider.getId() }/test`,
				method: 'POST',
				data: {
					config: {
						account_id: 'a'.repeat( 32 ),
						api_token: 'test-token-123',
					},
				},
			} );
		} );

		test( 'fails connection test with invalid credentials', async () => {
			// Mock empty config
			const mockStorage = {
				load: jest
					.fn()
					.mockResolvedValue( { account_id: '', api_token: '' } ),
				save: jest.fn().mockResolvedValue( true ),
				delete: jest.fn().mockResolvedValue( true ),
			};

			provider.configStorage = mockStorage;

			const result = await provider.testConnection();

			expect( result.success ).toBe( false );
			expect( result.error ).toBeDefined();
		} );

		test( 'fails connection test when API call fails', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				error: 'API error',
			} );

			const result = await provider.testConnection();

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'API error' );
		} );

		test( 'handles WordPress error format', async () => {
			apiFetch.mockResolvedValue( {
				code: 'rest_error',
				message: 'WordPress error message',
			} );

			const result = await provider.testConnection();

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'WordPress error message' );
		} );

		test( 'handles network errors', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const result = await provider.testConnection();

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Network error' );
		} );
	} );

	describe( 'Worker Deletion', () => {
		test( 'deletes worker successfully', async () => {
			deleteWorkerAPI.mockResolvedValue( {
				success: true,
				message: 'Worker deleted',
			} );

			const result = await provider.deleteWorker( 'aether-r2-abc123' );

			expect( result.success ).toBe( true );
			expect( deleteWorkerAPI ).toHaveBeenCalledWith(
				'a'.repeat( 32 ),
				'test-token-123',
				'aether-r2-abc123'
			);
		} );

		test( 'performs dry run deletion', async () => {
			const result = await provider.deleteWorker(
				'aether-r2-abc123',
				true
			);

			expect( result.success ).toBe( true );
			expect( result.message ).toContain( 'Dry run' );
			expect( deleteWorkerAPI ).not.toHaveBeenCalled();
		} );

		test( 'fails deletion with invalid credentials', async () => {
			// Mock empty config
			const mockStorage = {
				load: jest
					.fn()
					.mockResolvedValue( { account_id: '', api_token: '' } ),
				save: jest.fn().mockResolvedValue( true ),
				delete: jest.fn().mockResolvedValue( true ),
			};

			provider.configStorage = mockStorage;

			const result = await provider.deleteWorker( 'aether-r2-abc123' );

			expect( result.success ).toBe( false );
			expect( result.error ).toBeDefined();
		} );
	} );

	describe( 'Worker Management', () => {
		test( 'generates unique worker names', () => {
			const name1 = provider.generateWorkerName( 'r2' );
			const name2 = provider.generateWorkerName( 'r2' );

			expect( name1 ).toMatch( /^aether-r2-[a-z0-9]{8}$/ );
			expect( name2 ).toMatch( /^aether-r2-[a-z0-9]{8}$/ );
			expect( name1 ).not.toBe( name2 );
		} );

		test( 'generates worker URL from name', () => {
			const url = provider.getWorkerUrlFromName( 'aether-r2-abc123' );

			expect( url ).toBe( 'https://aether-r2-abc123.workers.dev' );
		} );

		test( 'validates worker types', () => {
			expect( provider.isValidWorkerType( 'r2' ) ).toBe( true );
			expect( provider.isValidWorkerType( 'git' ) ).toBe( true );
			expect( provider.isValidWorkerType( 'spaces' ) ).toBe( true );
			expect( provider.isValidWorkerType( 'invalid' ) ).toBe( false );
		} );

		test( 'gets worker URL from deployment info', async () => {
			await provider.saveDeploymentInfo( 'r2', {
				workerUrl: 'https://aether-r2-abc123.workers.dev',
			} );

			const url = provider.getWorkerUrl( 'r2' );

			expect( url ).toBe( 'https://aether-r2-abc123.workers.dev' );
		} );

		test( 'returns empty string for non-existent worker', () => {
			const url = provider.getWorkerUrl( 'nonexistent' );

			expect( url ).toBe( '' );
		} );

		test( 'stores deployment info', async () => {
			const info = {
				workerType: 'r2',
				workerName: 'aether-r2-abc123',
				workerUrl: 'https://aether-r2-abc123.workers.dev',
				deployedAt: Date.now(),
			};

			await provider.saveDeploymentInfo( 'r2', info );

			const deploymentInfo = provider.getDeploymentInfo();

			expect( deploymentInfo.r2 ).toEqual( info );
		} );
	} );

	describe( 'Supported Operations', () => {
		test( 'returns list of supported operations', () => {
			const operations = provider.getSupportedOperations();

			expect( operations ).toContain( 'upload' );
			expect( operations ).toContain( 'delete' );
			expect( operations ).toContain( 'copy' );
			expect( operations ).toContain( 'cors-proxy' );
			expect( operations ).toContain( 'images' );
			expect( operations ).toContain( 'stream' );
		} );
	} );

	describe( 'Worker Environment', () => {
		test( 'prepares R2 worker environment', () => {
			const config = {
				bucket_name: 'my-bucket',
				account_id: 'abc123',
			};

			const env = provider.prepareWorkerEnvironment( 'r2', config );

			expect( env.R2_BUCKET ).toBe( 'my-bucket' );
			expect( env.CF_ACCOUNT_ID ).toBe( 'abc123' );
		} );

		test( 'prepares media worker environment', () => {
			const config = {
				bucket_name: 'my-bucket',
				images_account_hash: 'hash123',
				images_api_token: 'token123',
			};

			const env = provider.prepareWorkerEnvironment( 'media', config );

			expect( env.R2_BUCKET ).toBe( 'my-bucket' );
			expect( env.CF_IMAGES_ACCOUNT_HASH ).toBe( 'hash123' );
			expect( env.CF_IMAGES_TOKEN ).toBe( 'token123' );
		} );

		test( 'prepares spaces worker environment', () => {
			const config = {
				bucket_name: 'my-bucket',
				region: 'nyc3',
			};

			const env = provider.prepareWorkerEnvironment( 'spaces', config );

			expect( env.SPACES_BUCKET ).toBe( 'my-bucket' );
			expect( env.SPACES_REGION ).toBe( 'nyc3' );
		} );

		test( 'returns empty object for unknown worker type', () => {
			const env = provider.prepareWorkerEnvironment( 'unknown', {} );

			expect( env ).toEqual( {} );
		} );
	} );

	describe( 'Custom Domain Management', () => {
		beforeEach( () => {
			// Mock fetch for zone lookup
			global.fetch = jest.fn();
		} );

		afterEach( () => {
			delete global.fetch;
		} );

		test( 'attaches custom domain after successful deployment', async () => {
			const mockDeployResult = {
				success: true,
				workerUrl: 'https://aether-r2-abc123.workers.dev',
			};

			const mockZoneResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( {
					result: [ { id: 'zone123' } ],
				} ),
			};

			const mockDomainResult = {
				success: true,
				domain: { id: 'domain123', hostname: 's12y.org' },
			};

			deployWorker.mockResolvedValue( mockDeployResult );
			testTokenPermissions.mockResolvedValue( { success: true } );
			global.fetch.mockResolvedValue( mockZoneResponse );
			attachCustomDomain.mockResolvedValue( mockDomainResult );

			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");',
				{},
				false,
				'https://s12y.org'
			);

			expect( result.success ).toBe( true );
			expect( result.domainAttached ).toBe( true );
			expect( result.custom_domain ).toBe( 'https://s12y.org' );
			expect( attachCustomDomain ).toHaveBeenCalledWith(
				'a'.repeat( 32 ),
				'test-token-123',
				expect.stringMatching( /^aether-r2-/ ),
				'https://s12y.org',
				'zone123'
			);
		} );

		test( 'handles domain conflict by removing and reattaching', async () => {
			const mockDeployResult = {
				success: true,
				workerUrl: 'https://aether-r2-abc123.workers.dev',
			};

			const mockZoneResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( {
					result: [ { id: 'zone123' } ],
				} ),
			};

			const mockConflictResult = {
				success: false,
				statusCode: 409,
				error: 'Domain already attached',
			};

			const mockListResult = {
				success: true,
				domains: [
					{
						id: 'domain123',
						hostname: 's12y.org',
						service: 'old-worker',
					},
				],
			};

			const mockRemoveResult = {
				success: true,
				message: 'Domain removed',
			};

			const mockRetryResult = {
				success: true,
				domain: { id: 'domain456', hostname: 's12y.org' },
			};

			deployWorker.mockResolvedValue( mockDeployResult );
			testTokenPermissions.mockResolvedValue( { success: true } );
			global.fetch.mockResolvedValue( mockZoneResponse );
			attachCustomDomain
				.mockResolvedValueOnce( mockConflictResult )
				.mockResolvedValueOnce( mockRetryResult );
			listCustomDomains.mockResolvedValue( mockListResult );
			removeCustomDomain.mockResolvedValue( mockRemoveResult );

			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");',
				{},
				false,
				'https://s12y.org'
			);

			expect( result.success ).toBe( true );
			expect( result.domainAttached ).toBe( true );
			expect( listCustomDomains ).toHaveBeenCalled();
			expect( removeCustomDomain ).toHaveBeenCalledWith(
				'a'.repeat( 32 ),
				'test-token-123',
				'domain123'
			);
			expect( attachCustomDomain ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'continues deployment if domain attachment fails', async () => {
			const mockDeployResult = {
				success: true,
				workerUrl: 'https://aether-r2-abc123.workers.dev',
			};

			const mockZoneResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( {
					result: [],
				} ),
			};

			deployWorker.mockResolvedValue( mockDeployResult );
			testTokenPermissions.mockResolvedValue( { success: true } );
			global.fetch.mockResolvedValue( mockZoneResponse );

			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");',
				{},
				false,
				'https://s12y.org'
			);

			expect( result.success ).toBe( true );
			expect( result.domainAttached ).toBe( false );
			expect( result.domainError ).toBeDefined();
			expect( result.workerName ).toMatch( /^aether-r2-/ );
		} );

		test( 'deploys without domain if not provided', async () => {
			const mockDeployResult = {
				success: true,
				workerUrl: 'https://aether-r2-abc123.workers.dev',
			};

			deployWorker.mockResolvedValue( mockDeployResult );
			testTokenPermissions.mockResolvedValue( { success: true } );

			const result = await provider.deployWorker(
				'r2',
				'console.log("worker");',
				{},
				false
			);

			expect( result.success ).toBe( true );
			expect( result.domainAttached ).toBeUndefined();
			expect( result.custom_domain ).toBeUndefined();
			expect( attachCustomDomain ).not.toHaveBeenCalled();
		} );

		test( 'gets zone ID for hostname', async () => {
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( {
					result: [ { id: 'zone123', name: 's12y.org' } ],
				} ),
			};

			global.fetch.mockResolvedValue( mockResponse );

			const zoneId = await provider.getZoneIdForHostname( 's12y.org' );

			expect( zoneId ).toBe( 'zone123' );
			expect( global.fetch ).toHaveBeenCalledWith(
				expect.stringContaining( 'zones?name=s12y.org' ),
				expect.any( Object )
			);
		} );

		test( 'returns null when zone not found', async () => {
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( {
					result: [],
				} ),
			};

			global.fetch.mockResolvedValue( mockResponse );

			const zoneId =
				await provider.getZoneIdForHostname( 'nonexistent.com' );

			expect( zoneId ).toBeNull();
		} );

		test( 'cleans hostname before zone lookup', async () => {
			const mockResponse = {
				ok: true,
				json: jest.fn().mockResolvedValue( {
					result: [ { id: 'zone123' } ],
				} ),
			};

			global.fetch.mockResolvedValue( mockResponse );

			await provider.getZoneIdForHostname( 'https://s12y.org/path' );

			expect( global.fetch ).toHaveBeenCalledWith(
				expect.stringContaining( 'zones?name=s12y.org' ),
				expect.any( Object )
			);
		} );
	} );
} );
