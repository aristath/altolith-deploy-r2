/**
 * Validation Utilities Tests
 *
 * Comprehensive tests for validation utility functions.
 *
 * @package
 */

import { validateField, validateConfig } from '../../utils/validation';

describe( 'validateField', () => {
	test( 'should return null for valid field', () => {
		const field = {
			id: 'testField',
			label: 'Test Field',
			required: false,
		};

		expect( validateField( 'test value', field ) ).toBeNull();
	} );

	test( 'should return error for required empty field', () => {
		const field = {
			id: 'requiredField',
			label: 'Required Field',
			required: true,
		};

		expect( validateField( '', field ) ).toBe(
			'Required Field is required.'
		);
		expect( validateField( null, field ) ).toBe(
			'Required Field is required.'
		);
		expect( validateField( undefined, field ) ).toBe(
			'Required Field is required.'
		);
	} );

	test( 'should skip validation for empty non-required field', () => {
		const field = {
			id: 'optionalField',
			label: 'Optional Field',
			required: false,
			validation: {
				pattern: '^\\d+$',
				message: 'Must be numeric',
			},
		};

		expect( validateField( '', field ) ).toBeNull();
	} );

	test( 'should validate pattern', () => {
		const field = {
			id: 'numericField',
			label: 'Numeric Field',
			required: true,
			validation: {
				pattern: '^\\d+$',
				message: 'Must be numeric',
			},
		};

		expect( validateField( '123', field ) ).toBeNull();
		expect( validateField( 'abc', field ) ).toBe( 'Must be numeric' );
	} );

	test( 'should use default pattern error message', () => {
		const field = {
			id: 'patternField',
			label: 'Pattern Field',
			required: true,
			validation: {
				pattern: '^\\d+$',
			},
		};

		expect( validateField( 'abc', field ) ).toBe(
			'Pattern Field format is invalid.'
		);
	} );

	test( 'should validate min length', () => {
		const field = {
			id: 'minField',
			label: 'Min Field',
			required: true,
			validation: {
				minLength: 5,
			},
		};

		expect( validateField( '12345', field ) ).toBeNull();
		expect( validateField( '123', field ) ).toBe(
			'Min Field must be at least 5 characters.'
		);
	} );

	test( 'should validate max length', () => {
		const field = {
			id: 'maxField',
			label: 'Max Field',
			required: true,
			validation: {
				maxLength: 10,
			},
		};

		expect( validateField( '1234567890', field ) ).toBeNull();
		expect( validateField( '12345678901', field ) ).toBe(
			'Max Field must be no more than 10 characters.'
		);
	} );

	test( 'should combine validations', () => {
		const field = {
			id: 'combinedField',
			label: 'Combined Field',
			required: true,
			validation: {
				pattern: '^[A-Z]+$',
				minLength: 3,
				maxLength: 5,
			},
		};

		expect( validateField( 'ABC', field ) ).toBeNull();
		expect( validateField( 'AB', field ) ).toBe(
			'Combined Field must be at least 3 characters.'
		);
		expect( validateField( 'ABCDEF', field ) ).toBe(
			'Combined Field must be no more than 5 characters.'
		);
		expect( validateField( 'abc', field ) ).toBe(
			'Combined Field format is invalid.'
		);
	} );
} );

describe( 'validateConfig', () => {
	test( 'should return valid for correct config', () => {
		const fields = [
			{
				id: 'field1',
				label: 'Field 1',
				required: true,
			},
			{
				id: 'field2',
				label: 'Field 2',
				required: false,
			},
		];

		const config = {
			field1: 'value1',
			field2: 'value2',
		};

		const result = validateConfig( config, fields );

		expect( result.valid ).toBe( true );
		expect( Object.keys( result.errors ) ).toHaveLength( 0 );
	} );

	test( 'should return errors for invalid config', () => {
		const fields = [
			{
				id: 'requiredField',
				label: 'Required Field',
				required: true,
			},
			{
				id: 'patternField',
				label: 'Pattern Field',
				required: true,
				validation: {
					pattern: '^\\d+$',
					message: 'Must be numeric',
				},
			},
		];

		const config = {
			requiredField: '',
			patternField: 'abc',
		};

		const result = validateConfig( config, fields );

		expect( result.valid ).toBe( false );
		expect( result.errors ).toHaveProperty( 'requiredField' );
		expect( result.errors ).toHaveProperty( 'patternField' );
		expect( result.errors.patternField ).toBe( 'Must be numeric' );
	} );

	test( 'should validate only provided fields', () => {
		const fields = [
			{
				id: 'field1',
				label: 'Field 1',
				required: true,
			},
			{
				id: 'field2',
				label: 'Field 2',
				required: false,
			},
		];

		const config = {
			field1: 'value1',
			// field2 not provided, but optional
		};

		const result = validateConfig( config, fields );

		expect( result.valid ).toBe( true );
	} );

	test( 'should handle empty config', () => {
		const fields = [
			{
				id: 'requiredField',
				label: 'Required Field',
				required: true,
			},
		];

		const config = {};

		const result = validateConfig( config, fields );

		expect( result.valid ).toBe( false );
		expect( result.errors ).toHaveProperty( 'requiredField' );
	} );

	test( 'should ignore extra config fields', () => {
		const fields = [
			{
				id: 'field1',
				label: 'Field 1',
				required: true,
			},
		];

		const config = {
			field1: 'value1',
			extraField: 'extra_value',
		};

		const result = validateConfig( config, fields );

		expect( result.valid ).toBe( true );
		expect( result.errors ).not.toHaveProperty( 'extraField' );
	} );
} );
