/**
 * Get REST URL Utility Tests
 *
 * @package
 */

import { getRestUrl } from '../getRestUrl';

describe( 'getRestUrl', () => {
	let originalQuerySelector;

	beforeEach( () => {
		originalQuerySelector = document.querySelector;
		document.querySelector = jest.fn();
	} );

	afterEach( () => {
		document.querySelector = originalQuerySelector;
	} );

	test( 'returns URL from meta tag when present', () => {
		const mockMetaTag = {
			getAttribute: jest.fn( () => '/custom/rest/url/' ),
		};

		document.querySelector.mockReturnValue( mockMetaTag );

		const url = getRestUrl();

		expect( document.querySelector ).toHaveBeenCalledWith(
			'meta[name="aether-rest-url"]'
		);
		expect( mockMetaTag.getAttribute ).toHaveBeenCalledWith( 'content' );
		expect( url ).toBe( '/custom/rest/url/' );
	} );

	test( 'returns default URL when meta tag content is empty', () => {
		const mockMetaTag = {
			getAttribute: jest.fn( () => '' ),
		};

		document.querySelector.mockReturnValue( mockMetaTag );

		const url = getRestUrl();

		expect( url ).toBe( '/wp-json/aether/site-exporter/' );
	} );

	test( 'returns default URL when meta tag is null', () => {
		document.querySelector.mockReturnValue( null );

		const url = getRestUrl();

		expect( url ).toBe( '/wp-json/aether/site-exporter/' );
	} );

	test( 'returns default URL when meta tag content is null', () => {
		const mockMetaTag = {
			getAttribute: jest.fn( () => null ),
		};

		document.querySelector.mockReturnValue( mockMetaTag );

		const url = getRestUrl();

		expect( url ).toBe( '/wp-json/aether/site-exporter/' );
	} );

	test( 'handles different custom URLs', () => {
		const mockMetaTag = {
			getAttribute: jest.fn( () => 'https://api.example.com/wp-json/' ),
		};

		document.querySelector.mockReturnValue( mockMetaTag );

		const url = getRestUrl();

		expect( url ).toBe( 'https://api.example.com/wp-json/' );
	} );
} );
