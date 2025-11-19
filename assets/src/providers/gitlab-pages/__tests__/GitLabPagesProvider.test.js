/**
 * GitLabPagesProvider Tests
 *
 * @package
 */

import { GitLabPagesProvider } from '../GitLabPagesProvider';
import { CAP_STATIC_SITE } from '../../base/AbstractProvider';

// Mock ConfigStorage
jest.mock( '../../utils/configStorage', () => ( {
	ConfigStorage: jest.fn().mockImplementation( () => ( {
		load: jest.fn().mockResolvedValue( {
			personal_access_token: 'glpat-test-token-123456',
			project_id: '12345',
			branch: 'main',
			pages_enabled: true,
		} ),
		save: jest.fn().mockResolvedValue( true ),
		delete: jest.fn().mockResolvedValue( true ),
	} ) ),
} ) );

describe( 'GitLabPagesProvider', () => {
	let provider;

	beforeEach( () => {
		provider = new GitLabPagesProvider();
		jest.clearAllMocks();
	} );

	describe( 'Metadata', () => {
		test( 'returns correct provider ID', () => {
			expect( provider.getId() ).toBe( 'gitlab-pages' );
		} );

		test( 'returns correct provider name', () => {
			expect( provider.getName() ).toBe( 'GitLab Pages (Experimental)' );
		} );

		test( 'returns correct provider type', () => {
			expect( provider.getType() ).toBe( 'git-hosting' );
		} );

		test( 'returns provider description', () => {
			const description = provider.getDescription();

			expect( description ).toContain( 'GitLab' );
			expect( description ).toContain( 'Pages' );
		} );

		test( 'returns fox icon', () => {
			expect( provider.getIcon() ).toBe( '🦊' );
		} );

		test( 'supports static-site capability', () => {
			const capabilities = provider.getCapabilities();

			expect( capabilities ).toContain( CAP_STATIC_SITE );
			expect( capabilities ).toHaveLength( 1 );
		} );
	} );

	describe( 'Configuration Fields', () => {
		test( 'defines all required fields', () => {
			const fields = provider.getConfigFields();

			const fieldIds = fields.map( ( f ) => f.id );

			expect( fieldIds ).toContain( 'personal_access_token' );
			expect( fieldIds ).toContain( 'project_id' );
			expect( fieldIds ).toContain( 'namespace' );
			expect( fieldIds ).toContain( 'project_path' );
			expect( fieldIds ).toContain( 'branch' );
			expect( fieldIds ).toContain( 'pages_enabled' );
			expect( fieldIds ).toContain( 'pages_url' );
			expect( fieldIds ).toContain( 'custom_domain' );
			expect( fieldIds ).toContain( 'git_worker_url' );
			expect( fields ).toHaveLength( 9 );
		} );

		test( 'marks required fields correctly', () => {
			const fields = provider.getConfigFields();

			const requiredFields = fields
				.filter( ( f ) => f.required )
				.map( ( f ) => f.id );

			expect( requiredFields ).toContain( 'personal_access_token' );
			expect( requiredFields ).toContain( 'project_id' );
			expect( requiredFields ).toHaveLength( 2 );
		} );

		test( 'marks sensitive fields correctly', () => {
			const fields = provider.getConfigFields();

			const sensitiveFields = fields
				.filter( ( f ) => f.sensitive )
				.map( ( f ) => f.id );

			expect( sensitiveFields ).toContain( 'personal_access_token' );
		} );

		test( 'sets validation pattern for project_id', () => {
			const fields = provider.getConfigFields();

			const projectIdField = fields.find(
				( f ) => f.id === 'project_id'
			);

			expect( projectIdField.validation.pattern ).toBe( '^\\d+$' );
		} );

		test( 'sets default value for branch', () => {
			const fields = provider.getConfigFields();

			const branchField = fields.find( ( f ) => f.id === 'branch' );

			expect( branchField.default ).toBe( 'main' );
		} );

		test( 'sets default value for pages_enabled', () => {
			const fields = provider.getConfigFields();

			const pagesEnabledField = fields.find(
				( f ) => f.id === 'pages_enabled'
			);

			expect( pagesEnabledField.default ).toBe( true );
		} );

		test( 'sets correct field types', () => {
			const fields = provider.getConfigFields();

			const tokenField = fields.find(
				( f ) => f.id === 'personal_access_token'
			);
			const projectIdField = fields.find(
				( f ) => f.id === 'project_id'
			);
			const pagesEnabledField = fields.find(
				( f ) => f.id === 'pages_enabled'
			);
			const pagesUrlField = fields.find( ( f ) => f.id === 'pages_url' );

			expect( tokenField.type ).toBe( 'password' );
			expect( projectIdField.type ).toBe( 'text' );
			expect( pagesEnabledField.type ).toBe( 'checkbox' );
			expect( pagesUrlField.type ).toBe( 'url' );
		} );
	} );

	describe( 'Configuration Validation', () => {
		test( 'validates project_id format', async () => {
			const config = {
				personal_access_token: 'glpat-test-token-123456',
				project_id: 'not-numeric',
			};

			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'project_id' );
		} );

		test( 'passes validation with valid numeric project_id', async () => {
			const config = {
				personal_access_token: 'glpat-test-token-123456',
				project_id: '12345',
			};

			const errors = await provider.validateConfig( config );

			expect( Object.keys( errors ) ).toHaveLength( 0 );
		} );

		test( 'validates token minimum length', async () => {
			const config = {
				personal_access_token: 'short',
				project_id: '12345',
			};

			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'personal_access_token' );
		} );
	} );

	describe( 'Deployment', () => {
		test( 'returns success with automatic deployment message', async () => {
			const result = await provider.deploy();

			expect( result.success ).toBe( true );
			expect( result.message ).toContain( 'automatic' );
		} );

		test( 'fails when provider is not configured', async () => {
			// Mock empty config
			const mockStorage = {
				load: jest.fn().mockResolvedValue( {} ),
				save: jest.fn().mockResolvedValue( true ),
				delete: jest.fn().mockResolvedValue( true ),
			};

			provider.configStorage = mockStorage;

			const result = await provider.deploy();

			expect( result.success ).toBe( false );
			expect( result.message ).toContain( 'not configured' );
		} );
	} );

	describe( 'Status Checks', () => {
		test( 'returns status with pages info', async () => {
			const status = await provider.getStatus();

			expect( status ).toHaveProperty( 'configured' );
			expect( status ).toHaveProperty( 'healthy' );
			expect( status ).toHaveProperty( 'pages_enabled' );
			expect( status ).toHaveProperty( 'hasCustomDomain' );
			expect( status ).toHaveProperty( 'supportsBrowserGit' );
		} );

		test( 'marks pages_enabled as true when configured', async () => {
			const status = await provider.getStatus();

			expect( status.pages_enabled ).toBe( true );
		} );

		test( 'marks hasCustomDomain as false when not set', async () => {
			const status = await provider.getStatus();

			expect( status.hasCustomDomain ).toBe( false );
		} );

		test( 'marks supportsBrowserGit as false when worker URL not set', async () => {
			const status = await provider.getStatus();

			expect( status.supportsBrowserGit ).toBe( false );
		} );

		test( 'marks hasCustomDomain as true when custom_domain is set', async () => {
			// Mock config with custom_domain
			const mockStorage = {
				load: jest.fn().mockResolvedValue( {
					personal_access_token: 'glpat-test-token-123456',
					project_id: '12345',
					custom_domain: 'https://example.com',
				} ),
				save: jest.fn().mockResolvedValue( true ),
				delete: jest.fn().mockResolvedValue( true ),
			};

			provider.configStorage = mockStorage;

			const status = await provider.getStatus();

			expect( status.hasCustomDomain ).toBe( true );
		} );

		test( 'marks supportsBrowserGit as true when git_worker_url is set', async () => {
			// Mock config with git_worker_url
			const mockStorage = {
				load: jest.fn().mockResolvedValue( {
					personal_access_token: 'glpat-test-token-123456',
					project_id: '12345',
					git_worker_url: 'https://worker.example.com',
				} ),
				save: jest.fn().mockResolvedValue( true ),
				delete: jest.fn().mockResolvedValue( true ),
			};

			provider.configStorage = mockStorage;

			const status = await provider.getStatus();

			expect( status.supportsBrowserGit ).toBe( true );
		} );
	} );
} );
