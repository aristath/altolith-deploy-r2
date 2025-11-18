/**
 * ConfigFieldBuilder Tests
 *
 * @package
 */

import { ConfigFieldBuilder } from '../configFieldBuilder';

describe( 'ConfigFieldBuilder', () => {
	describe( 'Factory Methods', () => {
		test( 'creates text field', () => {
			const field = ConfigFieldBuilder.text( 'api_key' ).build();

			expect( field.name ).toBe( 'api_key' );
			expect( field.type ).toBe( 'text' );
			expect( field.id ).toBe( 'api_key' );
		} );

		test( 'creates password field', () => {
			const field = ConfigFieldBuilder.password( 'secret' ).build();

			expect( field.type ).toBe( 'password' );
		} );

		test( 'creates select field', () => {
			const field = ConfigFieldBuilder.select( 'region' ).build();

			expect( field.type ).toBe( 'select' );
		} );

		test( 'creates textarea field', () => {
			const field = ConfigFieldBuilder.textarea( 'description' ).build();

			expect( field.type ).toBe( 'textarea' );
		} );

		test( 'creates checkbox field', () => {
			const field = ConfigFieldBuilder.checkbox( 'enabled' ).build();

			expect( field.type ).toBe( 'checkbox' );
		} );

		test( 'creates number field', () => {
			const field = ConfigFieldBuilder.number( 'port' ).build();

			expect( field.type ).toBe( 'number' );
		} );

		test( 'creates email field', () => {
			const field = ConfigFieldBuilder.email( 'contact' ).build();

			expect( field.type ).toBe( 'email' );
		} );

		test( 'creates URL field', () => {
			const field = ConfigFieldBuilder.url( 'endpoint' ).build();

			expect( field.type ).toBe( 'url' );
		} );
	} );

	describe( 'Fluent Interface', () => {
		test( 'sets label', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.label( 'API Key' )
				.build();

			expect( field.label ).toBe( 'API Key' );
		} );

		test( 'sets description', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.description( 'Enter your API key from the provider' )
				.build();

			expect( field.description ).toBe(
				'Enter your API key from the provider'
			);
		} );

		test( 'marks as required', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.required()
				.build();

			expect( field.required ).toBe( true );
		} );

		test( 'sets placeholder', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.placeholder( 'Enter key...' )
				.build();

			expect( field.placeholder ).toBe( 'Enter key...' );
		} );

		test( 'sets default value', () => {
			const field = ConfigFieldBuilder.text( 'name' )
				.default( 'my-site' )
				.build();

			expect( field.default ).toBe( 'my-site' );
		} );

		test( 'sets pattern validation', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.pattern( '[A-Za-z0-9]+', 'Must be alphanumeric' )
				.build();

			expect( field.validation.pattern ).toBe( '[A-Za-z0-9]+' );
			expect( field.validation.message ).toBe( 'Must be alphanumeric' );
		} );

		test( 'sets min length', () => {
			const field = ConfigFieldBuilder.text( 'password' )
				.min( 8 )
				.build();

			expect( field.validation.minLength ).toBe( 8 );
			expect( field.min ).toBe( 8 );
		} );

		test( 'sets max length', () => {
			const field = ConfigFieldBuilder.text( 'username' )
				.max( 20 )
				.build();

			expect( field.validation.maxLength ).toBe( 20 );
			expect( field.max ).toBe( 20 );
		} );

		test( 'marks as sensitive', () => {
			const field = ConfigFieldBuilder.password( 'api_key' )
				.sensitive()
				.build();

			expect( field.sensitive ).toBe( true );
		} );

		test( 'sets options for select field', () => {
			const options = [
				{ value: 'us-east-1', label: 'US East' },
				{ value: 'eu-west-1', label: 'EU West' },
			];

			const field = ConfigFieldBuilder.select( 'region' )
				.options( options )
				.build();

			expect( field.options ).toEqual( options );
		} );

		test( 'sets step for number field', () => {
			const field = ConfigFieldBuilder.number( 'price' )
				.step( 0.01 )
				.build();

			expect( field.step ).toBe( 0.01 );
		} );

		test( 'sets rows for textarea', () => {
			const field = ConfigFieldBuilder.textarea( 'description' )
				.rows( 10 )
				.build();

			expect( field.rows ).toBe( 10 );
		} );

		test( 'sets conditional visibility', () => {
			const field = ConfigFieldBuilder.text( 'custom_domain' )
				.showIf( 'use_custom_domain', true )
				.build();

			expect( field.showIf ).toEqual( {
				field: 'use_custom_domain',
				value: true,
			} );
		} );

		test( 'sets field group', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.group( 'credentials' )
				.build();

			expect( field.group ).toBe( 'credentials' );
		} );

		test( 'sets CSS class', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.cssClass( 'my-custom-class' )
				.build();

			expect( field.class ).toBe( 'my-custom-class' );
		} );

		test( 'sets width', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.width( '50%' )
				.build();

			expect( field.width ).toBe( '50%' );
		} );

		test( 'chains multiple methods', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.label( 'API Key' )
				.description( 'Your API key' )
				.required()
				.placeholder( 'Enter key...' )
				.pattern( '[A-Za-z0-9]+' )
				.sensitive()
				.build();

			expect( field.label ).toBe( 'API Key' );
			expect( field.description ).toBe( 'Your API key' );
			expect( field.required ).toBe( true );
			expect( field.placeholder ).toBe( 'Enter key...' );
			expect( field.validation.pattern ).toBe( '[A-Za-z0-9]+' );
			expect( field.sensitive ).toBe( true );
		} );
	} );

	describe( 'Auto-generated Label', () => {
		test( 'generates label from field name', () => {
			const field = ConfigFieldBuilder.text( 'api_key' ).build();

			expect( field.label ).toBe( 'Api Key' );
		} );

		test( 'handles hyphens in field name', () => {
			const field = ConfigFieldBuilder.text( 'worker-endpoint' ).build();

			expect( field.label ).toBe( 'Worker Endpoint' );
		} );

		test( 'handles underscores in field name', () => {
			const field = ConfigFieldBuilder.text( 'bucket_name' ).build();

			expect( field.label ).toBe( 'Bucket Name' );
		} );

		test( 'does not override explicit label', () => {
			const field = ConfigFieldBuilder.text( 'api_key' )
				.label( 'Custom Label' )
				.build();

			expect( field.label ).toBe( 'Custom Label' );
		} );
	} );

	describe( 'buildAll', () => {
		test( 'builds multiple fields at once', () => {
			const builders = [
				ConfigFieldBuilder.text( 'api_key' ).label( 'API Key' ),
				ConfigFieldBuilder.text( 'bucket_name' ).label( 'Bucket Name' ),
				ConfigFieldBuilder.checkbox( 'enabled' ).label( 'Enabled' ),
			];

			const fields = ConfigFieldBuilder.buildAll( builders );

			expect( fields ).toHaveLength( 3 );
			expect( fields[ 0 ].name ).toBe( 'api_key' );
			expect( fields[ 1 ].name ).toBe( 'bucket_name' );
			expect( fields[ 2 ].name ).toBe( 'enabled' );
		} );

		test( 'returns empty array for empty input', () => {
			const fields = ConfigFieldBuilder.buildAll( [] );

			expect( fields ).toEqual( [] );
		} );
	} );

	describe( 'Custom Validators', () => {
		test( 'sets custom validation callback', () => {
			const validator = ( value ) => {
				return value.length < 8 ? 'Too short' : null;
			};

			const field = ConfigFieldBuilder.text( 'password' )
				.validate( validator )
				.build();

			expect( field.validation.callback ).toBe( validator );
		} );
	} );

	describe( 'Custom Sanitization', () => {
		test( 'sets custom sanitization callback', () => {
			const sanitizer = ( value ) => value.trim().toLowerCase();

			const field = ConfigFieldBuilder.text( 'username' )
				.sanitize( sanitizer )
				.build();

			expect( field.sanitize ).toBe( sanitizer );
		} );
	} );
} );
