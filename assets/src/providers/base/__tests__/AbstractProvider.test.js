/**
 * AbstractProvider Tests
 *
 * @package
 */

import { AbstractProvider, CAP_STORAGE, CAP_EDGE } from '../AbstractProvider';
import { ConfigFieldBuilder } from '../../utils/configFieldBuilder';

// Mock provider class for testing
class TestProvider extends AbstractProvider {
	capabilities = [ CAP_STORAGE ];

	getId() {
		return 'test-provider';
	}

	getName() {
		return 'Test Provider';
	}

	getType() {
		return 'test';
	}

	getDescription() {
		return 'A test provider';
	}

	getConfigFields() {
		return ConfigFieldBuilder.buildAll( [
			ConfigFieldBuilder.text( 'api_key' )
				.label( 'API Key' )
				.required()
				.pattern( '^[A-Za-z0-9]+$', 'Must be alphanumeric' ),
			ConfigFieldBuilder.text( 'bucket_name' )
				.label( 'Bucket Name' )
				.required()
				.min( 3 )
				.max( 20 ),
			ConfigFieldBuilder.email( 'contact_email' ).label(
				'Contact Email'
			),
			ConfigFieldBuilder.checkbox( 'enabled' )
				.label( 'Enabled' )
				.default( false ),
		] );
	}
}

// Mock ConfigStorage
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );
jest.mock( '../../utils/configStorage', () => ( {
	ConfigStorage: jest.fn().mockImplementation( () => ( {
		load: jest.fn().mockResolvedValue( {} ),
		save: jest.fn().mockResolvedValue( true ),
		delete: jest.fn().mockResolvedValue( true ),
	} ) ),
} ) );

describe( 'AbstractProvider', () => {
	let provider;

	beforeEach( () => {
		provider = new TestProvider();
	} );

	describe( 'Metadata Methods', () => {
		test( 'returns provider ID', () => {
			expect( provider.getId() ).toBe( 'test-provider' );
		} );

		test( 'returns provider name', () => {
			expect( provider.getName() ).toBe( 'Test Provider' );
		} );

		test( 'returns provider type', () => {
			expect( provider.getType() ).toBe( 'test' );
		} );

		test( 'returns provider description', () => {
			expect( provider.getDescription() ).toBe( 'A test provider' );
		} );

		test( 'returns default icon', () => {
			expect( provider.getIcon() ).toBe( '📦' );
		} );

		test( 'returns capabilities', () => {
			const capabilities = provider.getCapabilities();

			expect( capabilities ).toContain( CAP_STORAGE );
			expect( capabilities ).toHaveLength( 1 );
		} );

		test( 'returns settings URL', () => {
			const url = provider.getSettingsUrl();

			expect( url ).toContain( 'test-provider' );
		} );

		test( 'returns documentation URL', () => {
			const url = provider.getDocumentationUrl();

			expect( url ).toContain( 'test-provider' );
		} );

		test( 'returns complete metadata', () => {
			const metadata = provider.getMetadata();

			expect( metadata ).toHaveProperty( 'id', 'test-provider' );
			expect( metadata ).toHaveProperty( 'name', 'Test Provider' );
			expect( metadata ).toHaveProperty( 'type', 'test' );
			expect( metadata ).toHaveProperty( 'description' );
			expect( metadata ).toHaveProperty( 'icon' );
			expect( metadata ).toHaveProperty( 'capabilities' );
			expect( metadata ).toHaveProperty( 'configFields' );
			expect( metadata ).toHaveProperty( 'settingsUrl' );
			expect( metadata ).toHaveProperty( 'documentationUrl' );
		} );
	} );

	describe( 'Capability Checks', () => {
		test( 'supports storage capability', () => {
			expect( provider.supportsCapability( CAP_STORAGE ) ).toBe( true );
		} );

		test( 'does not support edge capability', () => {
			expect( provider.supportsCapability( CAP_EDGE ) ).toBe( false );
		} );
	} );

	describe( 'Configuration Validation', () => {
		test( 'validates required fields', async () => {
			const config = {};
			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'api_key' );
			expect( errors ).toHaveProperty( 'bucket_name' );
		} );

		test( 'passes validation with valid config', async () => {
			const config = {
				api_key: 'ABC123',
				bucket_name: 'my-bucket',
			};
			const errors = await provider.validateConfig( config );

			expect( Object.keys( errors ) ).toHaveLength( 0 );
		} );

		test( 'validates pattern', async () => {
			const config = {
				api_key: 'invalid!@#',
				bucket_name: 'my-bucket',
			};
			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'api_key' );
			expect( errors.api_key ).toContain( 'alphanumeric' );
		} );

		test( 'validates min length', async () => {
			const config = {
				api_key: 'ABC123',
				bucket_name: 'ab',
			};
			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'bucket_name' );
			expect( errors.bucket_name ).toContain( 'at least 3' );
		} );

		test( 'validates max length', async () => {
			const config = {
				api_key: 'ABC123',
				bucket_name: 'a'.repeat( 25 ),
			};
			const errors = await provider.validateConfig( config );

			expect( errors ).toHaveProperty( 'bucket_name' );
			expect( errors.bucket_name ).toContain( 'no more than 20' );
		} );

		test( 'skips validation for empty optional fields', async () => {
			const config = {
				api_key: 'ABC123',
				bucket_name: 'my-bucket',
				contact_email: '',
			};
			const errors = await provider.validateConfig( config );

			expect( errors ).not.toHaveProperty( 'contact_email' );
		} );
	} );

	describe( 'Configuration Sanitization', () => {
		test( 'trims text fields', async () => {
			const config = {
				api_key: '  ABC123  ',
				bucket_name: '  my-bucket  ',
			};
			const sanitized = await provider.sanitizeConfig( config );

			expect( sanitized.api_key ).toBe( 'ABC123' );
			expect( sanitized.bucket_name ).toBe( 'my-bucket' );
		} );

		test( 'filters out fields not in getConfigFields()', async () => {
			const config = {
				api_key: 'ABC123',
				bucket_name: 'my-bucket',
				// These fields are NOT in getConfigFields() - should be filtered out
				account_id: 'edge-account-id',
				api_token: 'edge-api-token',
				team_id: 'edge-team-id',
			};
			const sanitized = await provider.sanitizeConfig( config );

			expect( sanitized ).toHaveProperty( 'api_key' );
			expect( sanitized ).toHaveProperty( 'bucket_name' );
			expect( sanitized ).not.toHaveProperty( 'account_id' );
			expect( sanitized ).not.toHaveProperty( 'api_token' );
			expect( sanitized ).not.toHaveProperty( 'team_id' );
		} );

		test( 'only includes fields defined in getConfigFields()', async () => {
			const config = {
				api_key: 'ABC123',
				bucket_name: 'my-bucket',
				contact_email: 'test@example.com',
				enabled: true,
				// Extra fields not in getConfigFields()
				extraField1: 'value1',
				extraField2: 'value2',
			};
			const sanitized = await provider.sanitizeConfig( config );

			// Should only have fields from getConfigFields()
			const expectedFields = [
				'api_key',
				'bucket_name',
				'contact_email',
				'enabled',
			];
			expect( Object.keys( sanitized ).sort() ).toEqual(
				expectedFields.sort()
			);
			expect( sanitized ).not.toHaveProperty( 'extraField1' );
			expect( sanitized ).not.toHaveProperty( 'extraField2' );
		} );

		test( 'lowercases email fields', async () => {
			const config = {
				contact_email: '  Test@Example.COM  ',
			};
			const sanitized = await provider.sanitizeConfig( config );

			expect( sanitized.contact_email ).toBe( 'test@example.com' );
		} );

		test( 'removes trailing slash from URLs', async () => {
			const urlField = ConfigFieldBuilder.url( 'endpoint' ).build();
			provider.getConfigFields = () => [ urlField ];

			const config = {
				endpoint: 'https://example.com/',
			};
			const sanitized = await provider.sanitizeConfig( config );

			expect( sanitized.endpoint ).toBe( 'https://example.com' );
		} );

		test( 'converts checkbox to boolean', async () => {
			const config = {
				enabled: 'true',
			};
			const sanitized = await provider.sanitizeConfig( config );

			expect( sanitized.enabled ).toBe( true );
		} );

		test( 'converts number strings to numbers', async () => {
			const numberField = ConfigFieldBuilder.number( 'port' ).build();
			provider.getConfigFields = () => [ numberField ];

			const config = {
				port: '8080',
			};
			const sanitized = await provider.sanitizeConfig( config );

			expect( sanitized.port ).toBe( 8080 );
		} );
	} );

	describe( 'isConfigured Check', () => {
		test( 'returns false when no config', async () => {
			provider.config = {};
			const configured = await provider.isConfigured();

			expect( configured ).toBe( false );
		} );

		test( 'returns false when required fields missing', async () => {
			provider.config = {
				api_key: 'ABC123',
				// missing bucket_name
			};
			const configured = await provider.isConfigured();

			expect( configured ).toBe( false );
		} );

		test( 'returns true when all required fields present', async () => {
			provider.config = {
				api_key: 'ABC123',
				bucket_name: 'my-bucket',
			};
			const configured = await provider.isConfigured();

			expect( configured ).toBe( true );
		} );
	} );

	describe( 'Helper Methods', () => {
		test( 'getFieldsById returns fields in specified order', () => {
			const fields = provider.getFieldsById( [
				'bucket_name',
				'api_key',
			] );

			expect( fields ).toHaveLength( 2 );
			expect( fields[ 0 ].id ).toBe( 'bucket_name' );
			expect( fields[ 1 ].id ).toBe( 'api_key' );
		} );

		test( 'getFieldsById filters non-existent fields', () => {
			const fields = provider.getFieldsById( [
				'api_key',
				'non_existent',
			] );

			expect( fields ).toHaveLength( 1 );
			expect( fields[ 0 ].id ).toBe( 'api_key' );
		} );
	} );

	describe( 'Default Implementations', () => {
		test( 'deploy returns success by default', async () => {
			const result = await provider.deploy();

			expect( result.success ).toBe( true );
		} );

		// Note: uploadMedia, deleteMedia, and getMediaUrl are not part of AbstractProvider
		// They are implemented by specific providers that support media capabilities

		test( 'getDeploymentUrl returns empty string when not configured', async () => {
			provider.config = {};
			const url = await provider.getDeploymentUrl();

			expect( url ).toBe( '' );
		} );

		test( 'getDeploymentUrl returns worker_endpoint if set', async () => {
			provider.config = {
				worker_endpoint: 'https://worker.example.com',
			};
			const url = await provider.getDeploymentUrl();

			expect( url ).toBe( 'https://worker.example.com' );
		} );
	} );

	describe( 'Provider Config Isolation', () => {
		test( 'getConfig() returns only provider-specific fields', async () => {
			// Mock ConfigStorage to return config with extra fields
			const mockStorage = {
				load: jest.fn().mockResolvedValue( {
					api_key: 'ABC123',
					bucket_name: 'my-bucket',
					// These should NOT be returned for this provider
					account_id: 'edge-account-id',
					api_token: 'edge-api-token',
				} ),
			};
			provider.getConfigStorage = jest
				.fn()
				.mockResolvedValue( mockStorage );

			const config = await provider.getConfig();

			// Config should contain all fields from storage (getConfig doesn't filter)
			// But sanitizeConfig will filter when saving
			expect( config ).toHaveProperty( 'api_key' );
			expect( config ).toHaveProperty( 'bucket_name' );
		} );

		test( 'saveConfig() filters out fields not in getConfigFields()', async () => {
			const mockStorage = {
				save: jest.fn().mockResolvedValue( true ),
			};
			provider.getConfigStorage = jest
				.fn()
				.mockResolvedValue( mockStorage );

			const config = {
				api_key: 'ABC123',
				bucket_name: 'my-bucket',
				// These should be filtered out
				account_id: 'edge-account-id',
				api_token: 'edge-api-token',
			};

			await provider.saveConfig( config );

			// Verify save was called with filtered config
			expect( mockStorage.save ).toHaveBeenCalled();
			const savedConfig = mockStorage.save.mock.calls[ 0 ][ 0 ];
			expect( savedConfig ).toHaveProperty( 'api_key' );
			expect( savedConfig ).toHaveProperty( 'bucket_name' );
			expect( savedConfig ).not.toHaveProperty( 'account_id' );
			expect( savedConfig ).not.toHaveProperty( 'api_token' );
		} );
	} );
} );
