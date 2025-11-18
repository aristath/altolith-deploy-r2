/**
 * Standard Response Test Suite
 *
 * Tests for standardized response format utilities.
 *
 * @package
 */

import {
	createSuccessResponse,
	createErrorResponse,
	normalizeResponse,
	isSuccessResponse,
	isErrorResponse,
	getResponseData,
	getResponseError,
	getResponseErrors,
} from '../standardResponse';

describe( 'createSuccessResponse', () => {
	it( 'should create success response with data', () => {
		const result = createSuccessResponse( { id: 123, name: 'Test' } );

		expect( result ).toEqual( {
			success: true,
			data: { id: 123, name: 'Test' },
		} );
	} );

	it( 'should create success response with null data', () => {
		const result = createSuccessResponse();

		expect( result ).toEqual( {
			success: true,
			data: null,
		} );
	} );

	it( 'should create success response with message', () => {
		const result = createSuccessResponse(
			{ id: 123 },
			'Operation successful'
		);

		expect( result ).toEqual( {
			success: true,
			data: { id: 123, message: 'Operation successful' },
		} );
	} );

	it( 'should create success response with message only', () => {
		const result = createSuccessResponse( null, 'Operation successful' );

		expect( result ).toEqual( {
			success: true,
			data: { message: 'Operation successful' },
		} );
	} );

	it( 'should handle primitive data types', () => {
		const result = createSuccessResponse( 'simple string' );

		expect( result ).toEqual( {
			success: true,
			data: 'simple string',
		} );
	} );
} );

describe( 'createErrorResponse', () => {
	it( 'should create error response with string', () => {
		const result = createErrorResponse( 'Something went wrong' );

		expect( result ).toEqual( {
			success: false,
			error: 'Something went wrong',
		} );
	} );

	it( 'should create error response with Error object', () => {
		const error = new Error( 'Test error' );
		const result = createErrorResponse( error );

		expect( result ).toEqual( {
			success: false,
			error: 'Test error',
		} );
	} );

	it( 'should create error response with multiple errors', () => {
		const result = createErrorResponse( 'Main error', [
			'Error 1',
			'Error 2',
		] );

		expect( result ).toEqual( {
			success: false,
			error: 'Main error',
			errors: [ 'Error 1', 'Error 2' ],
		} );
	} );

	it( 'should handle empty errors array', () => {
		const result = createErrorResponse( 'Main error', [] );

		expect( result ).toEqual( {
			success: false,
			error: 'Main error',
		} );
	} );

	it( 'should handle null error', () => {
		const result = createErrorResponse( null );

		expect( result ).toEqual( {
			success: false,
			error: 'Unknown error',
		} );
	} );
} );

describe( 'normalizeResponse', () => {
	it( 'should keep standard format unchanged', () => {
		const response = {
			success: true,
			data: { id: 123 },
		};

		const result = normalizeResponse( response );

		expect( result ).toEqual( response );
	} );

	it( 'should normalize legacy success format', () => {
		const response = {
			success: true,
			workerName: 'test-worker',
			workerUrl: 'https://test.workers.dev',
		};

		const result = normalizeResponse( response );

		expect( result ).toEqual( {
			success: true,
			data: {
				workerName: 'test-worker',
				workerUrl: 'https://test.workers.dev',
			},
		} );
	} );

	it( 'should normalize legacy error format', () => {
		const response = {
			success: false,
			error: 'Something failed',
		};

		const result = normalizeResponse( response );

		expect( result ).toEqual( {
			success: false,
			error: 'Something failed',
		} );
	} );

	it( 'should normalize error with message field', () => {
		const response = {
			success: false,
			message: 'Operation failed',
		};

		const result = normalizeResponse( response );

		expect( result ).toEqual( {
			success: false,
			error: 'Operation failed',
		} );
	} );

	it( 'should normalize with multiple errors', () => {
		const response = {
			success: false,
			error: 'Main error',
			errors: [ 'Error 1', 'Error 2' ],
		};

		const result = normalizeResponse( response );

		expect( result ).toEqual( {
			success: false,
			error: 'Main error',
			errors: [ 'Error 1', 'Error 2' ],
		} );
	} );
} );

describe( 'isSuccessResponse', () => {
	it( 'should return true for success response', () => {
		const response = { success: true, data: {} };

		expect( isSuccessResponse( response ) ).toBe( true );
	} );

	it( 'should return false for error response', () => {
		const response = { success: false, error: 'Error' };

		expect( isSuccessResponse( response ) ).toBe( false );
	} );

	it( 'should return false for null', () => {
		expect( isSuccessResponse( null ) ).toBe( false );
	} );

	it( 'should return false for undefined', () => {
		expect( isSuccessResponse( undefined ) ).toBe( false );
	} );
} );

describe( 'isErrorResponse', () => {
	it( 'should return true for error response', () => {
		const response = { success: false, error: 'Error' };

		expect( isErrorResponse( response ) ).toBe( true );
	} );

	it( 'should return false for success response', () => {
		const response = { success: true, data: {} };

		expect( isErrorResponse( response ) ).toBe( false );
	} );

	it( 'should return false for null', () => {
		expect( isErrorResponse( null ) ).toBe( false );
	} );
} );

describe( 'getResponseData', () => {
	it( 'should get data from success response', () => {
		const response = { success: true, data: { id: 123 } };

		const result = getResponseData( response );

		expect( result ).toEqual( { id: 123 } );
	} );

	it( 'should return fallback for error response', () => {
		const response = { success: false, error: 'Error' };

		const result = getResponseData( response, 'fallback' );

		expect( result ).toBe( 'fallback' );
	} );

	it( 'should return null fallback by default', () => {
		const response = { success: false, error: 'Error' };

		const result = getResponseData( response );

		expect( result ).toBe( null );
	} );

	it( 'should return null data if present', () => {
		const response = { success: true, data: null };

		const result = getResponseData( response, 'fallback' );

		expect( result ).toBe( null );
	} );
} );

describe( 'getResponseError', () => {
	it( 'should get error from error response', () => {
		const response = { success: false, error: 'Something failed' };

		const result = getResponseError( response );

		expect( result ).toBe( 'Something failed' );
	} );

	it( 'should return default for success response', () => {
		const response = { success: true, data: {} };

		const result = getResponseError( response, 'Default error' );

		expect( result ).toBe( 'Default error' );
	} );

	it( 'should return "Unknown error" by default', () => {
		const response = { success: true, data: {} };

		const result = getResponseError( response );

		expect( result ).toBe( 'Unknown error' );
	} );
} );

describe( 'getResponseErrors', () => {
	it( 'should get all errors from response', () => {
		const response = {
			success: false,
			error: 'Main error',
			errors: [ 'Error 1', 'Error 2' ],
		};

		const result = getResponseErrors( response );

		expect( result ).toEqual( [ 'Main error', 'Error 1', 'Error 2' ] );
	} );

	it( 'should get single error', () => {
		const response = { success: false, error: 'Single error' };

		const result = getResponseErrors( response );

		expect( result ).toEqual( [ 'Single error' ] );
	} );

	it( 'should return empty array for success response', () => {
		const response = { success: true, data: {} };

		const result = getResponseErrors( response );

		expect( result ).toEqual( [] );
	} );

	it( 'should handle errors array only', () => {
		const response = {
			success: false,
			errors: [ 'Error 1', 'Error 2' ],
		};

		const result = getResponseErrors( response );

		expect( result ).toEqual( [ 'Error 1', 'Error 2' ] );
	} );
} );
