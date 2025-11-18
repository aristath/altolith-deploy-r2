/**
 * EdgeService Test Suite
 *
 * Comprehensive tests for EdgeService class.
 * Tests worker deployment, testing, URL generation, and bindings.
 *
 * @package
 */

import { EdgeService } from '../edgeService';
import apiFetch from '../../../utils/api';

// Mock API fetch
jest.mock( '../../../utils/api', () => ( {
	__esModule: true,
	default: jest.fn(),
	createAuthHeaders: jest.fn( ( token ) => ( {
		Authorization: `Bearer ${ token }`,
		'Content-Type': 'application/json',
	} ) ),
} ) );

// Mock error parser
jest.mock( '../../../utils/errorParser', () => ( {
	parseErrorResponse: jest.fn( ( responseText, defaultMessage ) => {
		try {
			const data = JSON.parse( responseText );
			if ( data.errors?.[ 0 ]?.message ) {
				return data.errors[ 0 ].message;
			}
			if ( data.error ) {
				return data.error;
			}
			return defaultMessage;
		} catch ( e ) {
			return responseText || defaultMessage;
		}
	} ),
} ) );

// Mock global fetch
global.fetch = jest.fn();

// Mock p-retry to avoid retry logic in tests
jest.mock( 'p-retry', () => {
	return jest.fn( ( fn ) => fn() );
} );

describe( 'EdgeService', () => {
	let service;
	const mockAccountId = 'test-account-id';
	const mockApiToken = 'test-api-token';
	const mockConfig = {
		worker_endpoint: 'https://test-worker.workers.dev',
	};

	beforeEach( () => {
		service = new EdgeService( mockAccountId, mockApiToken, mockConfig );
		jest.clearAllMocks();
		global.fetch.mockClear();
		apiFetch.mockClear();
	} );

	describe( 'Constructor', () => {
		test( 'should initialize with account ID, API token, and config', () => {
			expect( service.accountId ).toBe( mockAccountId );
			expect( service.apiToken ).toBe( mockApiToken );
			expect( service.config ).toEqual( mockConfig );
			expect( service.providerId ).toBe( 'cloudflare' );
		} );

		test( 'should use custom provider ID', () => {
			const customService = new EdgeService(
				mockAccountId,
				mockApiToken,
				{},
				'custom-provider'
			);
			expect( customService.providerId ).toBe( 'custom-provider' );
		} );
	} );

	describe( 'cloudflareApiRequest', () => {
		test( 'should make successful API request', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: { id: 'test-id' },
				} ),
			} );

			const result = await service.cloudflareApiRequest(
				'/accounts/test/workers/scripts',
				{ method: 'GET' }
			);

			expect( result.success ).toBe( true );
			expect( result.data.result ).toEqual( { id: 'test-id' } );
			expect( global.fetch ).toHaveBeenCalledWith(
				'https://api.cloudflare.com/client/v4/accounts/test/workers/scripts',
				expect.objectContaining( {
					method: 'GET',
					headers: expect.objectContaining( {
						Authorization: `Bearer ${ mockApiToken }`,
					} ),
				} )
			);
		} );

		test( 'should handle API errors', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'API error' } ],
				} ),
			} );

			const result = await service.cloudflareApiRequest(
				'/accounts/test/workers/scripts'
			);

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'API error' );
		} );

		test( 'should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce( new Error( 'Network error' ) );

			const result = await service.cloudflareApiRequest(
				'/accounts/test/workers/scripts'
			);

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Network error' );
		} );
	} );

	describe( 'deploy', () => {
		test( 'should perform dry run successfully', async () => {
			const workerType = 'r2';
			const script = 'export default { fetch: () => new Response("OK") }';
			const bindings = { R2_BUCKET: { bucket_name: 'test-bucket' } };

			const result = await service.deploy(
				workerType,
				script,
				bindings,
				true
			);

			expect( result.success ).toBe( true );
			expect( result.data.workerName ).toContain( 'aether-r2-' );
			expect( result.data.workerName ).toContain( '-dry-run' );
			expect( result.data.workerUrl ).toContain( '.workers.dev' );
			expect( result.data.message ).toBe( 'Dry run successful' );
			expect( global.fetch ).not.toHaveBeenCalled();
		} );

		test( 'should deploy worker successfully', async () => {
			const workerType = 'r2';
			const script = 'export default { fetch: () => new Response("OK") }';
			const bindings = {
				R2_BUCKET: { type: 'r2_bucket', bucket_name: 'test-bucket' },
			};

			// Mock apiFetch for R2 deployment (uses PHP endpoint)
			apiFetch.mockResolvedValueOnce( {
				success: true,
				worker_name: 'aether-r2-abc123',
				worker_url: 'https://aether-r2-abc123.workers.dev',
			} );

			const result = await service.deploy(
				workerType,
				script,
				bindings,
				false
			);

			expect( result.success ).toBe( true );
			expect( result.data.workerName ).toContain( 'aether-r2-' );
			expect( result.data.workerUrl ).toContain( '.workers.dev' );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/v1/providers/cloudflare-r2/deploy-worker',
				method: 'POST',
				data: expect.objectContaining( {
					worker_name: expect.stringMatching( /^aether-r2-/ ),
					script,
					bindings,
				} ),
			} );
		} );

		test( 'should handle deployment failure', async () => {
			const workerType = 'r2';
			const script = 'export default {}';

			apiFetch.mockResolvedValueOnce( {
				success: false,
				error: 'Deployment failed',
			} );

			const result = await service.deploy( workerType, script );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Deployment failed' );
		} );

		test( 'should handle network errors', async () => {
			const workerType = 'r2';
			const script = 'export default {}';

			apiFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

			const result = await service.deploy( workerType, script );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Network error' );
		} );
	} );

	describe( 'testDeployment', () => {
		test( 'should return not deployed when no worker URL', async () => {
			const result = await service.testDeployment( 'r2', '' );

			expect( result.success ).toBe( true );
			expect( result.data.deployed ).toBe( false );
			expect( result.data.message ).toBe( 'Worker not deployed' );
		} );

		test( 'should test deployment successfully', async () => {
			const workerUrl = 'https://aether-r2-abc123.workers.dev';

			// Mock listWorkers call
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [],
				} ),
			} );

			// Mock getWorker call
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: { name: 'aether-r2-abc123' },
				} ),
			} );

			const result = await service.testDeployment( 'r2', workerUrl );

			expect( result.success ).toBe( true );
			expect( result.data.deployed ).toBe( true );
			expect( global.fetch ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'should handle token test failure', async () => {
			const workerUrl = 'https://aether-r2-abc123.workers.dev';

			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'Token invalid' } ],
				} ),
			} );

			const result = await service.testDeployment( 'r2', workerUrl );

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'Token invalid' );
		} );

		test( 'should handle worker info retrieval failure gracefully', async () => {
			const workerUrl = 'https://aether-r2-abc123.workers.dev';

			// Mock listWorkers success
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [],
				} ),
			} );

			// Mock getWorker failure
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'Worker not found' } ],
				} ),
			} );

			const result = await service.testDeployment( 'r2', workerUrl );

			expect( result.success ).toBe( true );
			expect( result.data.deployed ).toBe( true );
			expect( result.data.message ).toContain( 'verification failed' );
		} );
	} );

	describe( 'getWorkerUrl', () => {
		test( 'should return worker endpoint from config', () => {
			const url = service.getWorkerUrl();
			expect( url ).toBe( 'https://test-worker.workers.dev' );
		} );

		test( 'should return empty string when not configured', () => {
			const serviceNoConfig = new EdgeService(
				mockAccountId,
				mockApiToken,
				{}
			);
			const url = serviceNoConfig.getWorkerUrl();
			expect( url ).toBe( '' );
		} );
	} );

	describe( 'isDeployed', () => {
		test( 'should return true when worker URL exists', () => {
			const deployed = service.isDeployed( 'r2' );
			expect( deployed ).toBe( true );
		} );

		test( 'should return false when worker URL not configured', () => {
			const serviceNoConfig = new EdgeService(
				mockAccountId,
				mockApiToken,
				{}
			);
			const deployed = serviceNoConfig.isDeployed( 'r2' );
			expect( deployed ).toBe( false );
		} );
	} );

	describe( 'getWorkerBindings', () => {
		test( 'should return R2 bindings for r2 worker type', () => {
			const config = { bucket_name: 'test-bucket' };
			const bindings = service.getWorkerBindings( 'r2', config );

			expect( bindings ).toEqual( {
				R2_BUCKET: {
					type: 'r2_bucket',
					bucket_name: 'test-bucket', // Cloudflare API expects snake_case
				},
			} );
		} );

		test( 'should return empty bindings when bucket name missing', () => {
			const config = {};
			const bindings = service.getWorkerBindings( 'r2', config );
			expect( bindings ).toEqual( {} );
		} );

		test( 'should return empty bindings for unknown worker type', () => {
			const config = { bucket_name: 'test-bucket' };
			const bindings = service.getWorkerBindings( 'unknown', config );
			expect( bindings ).toEqual( {} );
		} );
	} );

	describe( 'generateWorkerName', () => {
		test( 'should generate worker name with type and random suffix', () => {
			const name = service.generateWorkerName( 'r2' );
			expect( name ).toMatch( /^aether-r2-[a-z0-9]{8}$/ );
		} );

		test( 'should generate unique names', () => {
			const name1 = service.generateWorkerName( 'r2' );
			const name2 = service.generateWorkerName( 'r2' );
			expect( name1 ).not.toBe( name2 );
		} );
	} );

	describe( 'getWorkerUrlFromName', () => {
		test( 'should construct worker URL from name', () => {
			const url = service.getWorkerUrlFromName( 'aether-r2-abc123' );
			expect( url ).toBe( 'https://aether-r2-abc123.workers.dev' );
		} );
	} );

	describe( 'extractWorkerNameFromUrl', () => {
		test( 'should extract worker name from URL', () => {
			const name = service.extractWorkerNameFromUrl(
				'https://aether-r2-abc123.workers.dev'
			);
			expect( name ).toBe( 'aether-r2-abc123' );
		} );

		test( 'should handle HTTP URLs', () => {
			const name = service.extractWorkerNameFromUrl(
				'http://aether-r2-abc123.workers.dev'
			);
			expect( name ).toBe( 'aether-r2-abc123' );
		} );

		test( 'should return null for invalid URL', () => {
			const name = service.extractWorkerNameFromUrl( 'not-a-url' );
			expect( name ).toBeNull();
		} );
	} );

	describe( 'listWorkers', () => {
		test( 'should list workers successfully', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [
						{ id: 'worker-1', script: 'aether-r2-abc123' },
						{ id: 'worker-2', script: 'aether-media-def456' },
					],
				} ),
			} );

			const result = await service.listWorkers();

			expect( result.success ).toBe( true );
			expect( result.data.workers ).toHaveLength( 2 );
			expect( global.fetch ).toHaveBeenCalledWith(
				`https://api.cloudflare.com/client/v4/accounts/${ mockAccountId }/workers/scripts`,
				expect.objectContaining( {
					method: 'GET',
				} )
			);
		} );

		test( 'should handle list workers failure', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'Failed to list workers' } ],
				} ),
			} );

			const result = await service.listWorkers();

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Failed to list workers' );
		} );
	} );

	describe( 'getWorker', () => {
		test( 'should get worker info successfully', async () => {
			const workerName = 'aether-r2-abc123';
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: { id: 'worker-id', script: workerName },
				} ),
			} );

			const result = await service.getWorker( workerName );

			expect( result.success ).toBe( true );
			expect( result.data.worker ).toEqual( {
				id: 'worker-id',
				script: workerName,
			} );
			expect( global.fetch ).toHaveBeenCalledWith(
				`https://api.cloudflare.com/client/v4/accounts/${ mockAccountId }/workers/scripts/${ workerName }`,
				expect.objectContaining( {
					method: 'GET',
				} )
			);
		} );

		test( 'should handle get worker failure', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'Worker not found' } ],
				} ),
			} );

			const result = await service.getWorker( 'nonexistent-worker' );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Worker not found' );
		} );
	} );

	describe( 'getZoneIdForHostname', () => {
		test( 'should get zone ID successfully', async () => {
			const hostname = 'example.com';
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [ { id: 'zone-123', name: 'example.com' } ],
				} ),
			} );

			const result = await service.getZoneIdForHostname( hostname );

			expect( result.success ).toBe( true );
			expect( result.data.zoneId ).toBe( 'zone-123' );
			expect( result.data.zoneName ).toBe( 'example.com' );
		} );

		test( 'should handle zone not found', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [],
				} ),
			} );

			const result =
				await service.getZoneIdForHostname( 'nonexistent.com' );

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'No zone found' );
		} );
	} );

	describe( 'testConnection', () => {
		test( 'should test connection successfully with worker endpoint', async () => {
			// Mock listWorkers call
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [],
				} ),
			} );

			// Mock R2 worker test call
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				status: 404,
			} );

			const result = await service.testConnection(
				'https://test-worker.workers.dev'
			);

			expect( result.success ).toBe( true );
			expect( result.workersApi ).toBe( true );
			expect( result.r2Access ).toBe( true );
			expect( result.errors ).toEqual( [] );
		} );

		test( 'should test connection without worker endpoint', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [],
				} ),
			} );

			const result = await service.testConnection();

			expect( result.success ).toBe( true );
			expect( result.workersApi ).toBe( true );
			expect( result.r2Access ).toBe( false );
		} );

		test( 'should handle Workers API failure', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'Auth failed' } ],
				} ),
			} );

			const result = await service.testConnection();

			expect( result.success ).toBe( false );
			expect( result.workersApi ).toBe( false );
			expect( result.errors ).toContain( 'Workers API: Auth failed' );
		} );

		test( 'should handle R2 worker failure', async () => {
			// Mock listWorkers success
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: [],
				} ),
			} );

			// Mock R2 worker test failure
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				status: 500,
			} );

			const result = await service.testConnection(
				'https://test-worker.workers.dev'
			);

			expect( result.success ).toBe( false );
			expect( result.workersApi ).toBe( true );
			expect( result.r2Access ).toBe( false );
			expect( result.errors ).toContainEqual(
				expect.stringContaining( 'R2 Worker' )
			);
		} );
	} );

	describe( 'enableWorkersDevSubdomain', () => {
		test( 'should enable subdomain successfully', async () => {
			// Mock GET subdomain
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: { subdomain: 'test-subdomain' },
				} ),
			} );

			// Mock POST enable subdomain
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: {},
				} ),
			} );

			const result =
				await service.enableWorkersDevSubdomain( 'aether-r2-abc123' );

			expect( result.success ).toBe( true );
			expect( global.fetch ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'should handle subdomain fetch failure', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'Failed to get subdomain' } ],
				} ),
			} );

			const result =
				await service.enableWorkersDevSubdomain( 'aether-r2-abc123' );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Failed to get subdomain' );
		} );

		test( 'should handle no subdomain configured', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: {},
				} ),
			} );

			const result =
				await service.enableWorkersDevSubdomain( 'aether-r2-abc123' );

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'No subdomain configured' );
		} );
	} );

	describe( 'attachWorkerToCustomDomain', () => {
		it( 'should attach worker to custom domain successfully', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: {
						id: 'domain-123',
						hostname: 'example.com',
						service: 'aether-r2-abc123',
					},
				} ),
			} );

			const result = await service.attachWorkerToCustomDomain(
				'aether-r2-abc123',
				'example.com',
				'zone-123'
			);

			expect( result.success ).toBe( true );
			expect( result.data.message ).toContain( 'example.com' );
			expect( global.fetch ).toHaveBeenCalledWith(
				'https://api.cloudflare.com/client/v4/accounts/test-account-id/workers/domains',
				expect.objectContaining( {
					method: 'PUT',
					headers: expect.objectContaining( {
						Authorization: 'Bearer test-api-token',
						'Content-Type': 'application/json',
					} ),
				} )
			);
		} );

		it( 'should clean hostname before attaching', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: true,
				json: async () => ( {
					success: true,
					result: {},
				} ),
			} );

			await service.attachWorkerToCustomDomain(
				'aether-r2-abc123',
				'https://example.com/path',
				'zone-123'
			);

			const fetchCall = global.fetch.mock.calls[ 0 ][ 1 ];
			const body = JSON.parse( fetchCall.body );
			expect( body.hostname ).toBe( 'example.com' );
		} );

		it( 'should handle Cloudflare API errors', async () => {
			global.fetch.mockResolvedValueOnce( {
				ok: false,
				json: async () => ( {
					success: false,
					errors: [ { message: 'Zone not found' } ],
				} ),
			} );

			const result = await service.attachWorkerToCustomDomain(
				'aether-r2-abc123',
				'example.com',
				'invalid-zone'
			);

			expect( result.success ).toBe( false );
			expect( result.error ).toBeTruthy();
		} );

		it( 'should handle network errors', async () => {
			global.fetch.mockRejectedValueOnce( new Error( 'Network error' ) );

			const result = await service.attachWorkerToCustomDomain(
				'aether-r2-abc123',
				'example.com',
				'zone-123'
			);

			expect( result.success ).toBe( false );
			expect( result.error ).toContain( 'Network error' );
		} );
	} );
} );
