/**
 * Settings Helper Utilities Tests
 *
 * @package
 */

import {
	getProviderSettings,
	updateProviderSettings,
} from '../settingsHelpers';

describe( 'settingsHelpers', () => {
	describe( 'getProviderSettings', () => {
		test( 'returns provider settings from full settings object', () => {
			const settings = {
				providers: {
					'local-filesystem': {
						bucket_name: 'my-bucket',
						access_key_id: 'key123',
					},
					gitlab: {
						project_id: '123',
					},
				},
			};

			const result = getProviderSettings( settings, 'local-filesystem' );

			expect( result ).toEqual( {
				bucket_name: 'my-bucket',
				access_key_id: 'key123',
			} );
		} );

		test( 'returns empty object when provider not found', () => {
			const settings = {
				providers: {
					'local-filesystem': {
						bucket_name: 'my-bucket',
					},
				},
			};

			const result = getProviderSettings( settings, 'gitlab' );

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when providers object missing', () => {
			const settings = {};

			const result = getProviderSettings( settings, 'local-filesystem' );

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when settings is null', () => {
			const result = getProviderSettings( null, 'local-filesystem' );

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when settings is undefined', () => {
			const result = getProviderSettings( undefined, 'local-filesystem' );

			expect( result ).toEqual( {} );
		} );
	} );

	describe( 'updateProviderSettings', () => {
		test( 'updates provider settings in full settings object', () => {
			const allSettings = {
				providers: {
					'local-filesystem': {
						bucket_name: 'old-bucket',
					},
					gitlab: {
						project_id: '123',
					},
				},
			};

			const providerSettings = {
				bucket_name: 'new-bucket',
				access_key_id: 'key123',
			};

			const result = updateProviderSettings(
				allSettings,
				'local-filesystem',
				providerSettings
			);

			expect( result.providers[ 'local-filesystem' ] ).toEqual(
				providerSettings
			);
			expect( result.providers.gitlab ).toEqual( { project_id: '123' } );
			expect( result._saveKey ).toBe( 'providers' );
			expect( result._saveValue ).toEqual( result.providers );
		} );

		test( 'creates providers object if it does not exist', () => {
			const allSettings = {};

			const providerSettings = {
				bucket_name: 'my-bucket',
			};

			const result = updateProviderSettings(
				allSettings,
				'local-filesystem',
				providerSettings
			);

			expect( result.providers ).toEqual( {
				'local-filesystem': providerSettings,
			} );
			expect( result._saveKey ).toBe( 'providers' );
			expect( result._saveValue ).toEqual( result.providers );
		} );

		test( 'preserves other settings in allSettings', () => {
			const allSettings = {
				otherSetting: 'value',
				providers: {
					gitlab: { project_id: '123' },
				},
			};

			const providerSettings = {
				bucket_name: 'my-bucket',
			};

			const result = updateProviderSettings(
				allSettings,
				'local-filesystem',
				providerSettings
			);

			expect( result.otherSetting ).toBe( 'value' );
			expect( result.providers.gitlab ).toEqual( { project_id: '123' } );
		} );

		test( 'sets _saveKey and _saveValue correctly', () => {
			const allSettings = {
				providers: {},
			};

			const providerSettings = {
				bucket_name: 'my-bucket',
			};

			const result = updateProviderSettings(
				allSettings,
				'local-filesystem',
				providerSettings
			);

			expect( result._saveKey ).toBe( 'providers' );
			expect( result._saveValue ).toEqual( {
				'local-filesystem': providerSettings,
			} );
		} );
	} );
} );
