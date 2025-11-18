/**
 * Tests for SecretField Component
 *
 * @package
 */

import { render, screen, fireEvent } from '@testing-library/react';
import SecretField from '../SecretField';

describe( 'SecretField', () => {
	const defaultProps = {
		value: 'secret-value',
		onChange: jest.fn(),
		label: 'API Token',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render with label', () => {
		render( <SecretField { ...defaultProps } /> );

		expect( screen.getByLabelText( 'API Token' ) ).toBeInTheDocument();
	} );

	it( 'should render password input by default', () => {
		render( <SecretField { ...defaultProps } /> );

		const input = screen.getByLabelText( 'API Token' );
		expect( input ).toHaveAttribute( 'type', 'password' );
	} );

	it( 'should show value in input', () => {
		render( <SecretField { ...defaultProps } /> );

		const input = screen.getByLabelText( 'API Token' );
		expect( input ).toHaveValue( 'secret-value' );
	} );

	it( 'should toggle visibility when show/hide button is clicked', () => {
		render( <SecretField { ...defaultProps } /> );

		const input = screen.getByLabelText( 'API Token' );
		const toggleButton = screen.getByRole( 'button', { name: /show/i } );

		expect( input ).toHaveAttribute( 'type', 'password' );

		fireEvent.click( toggleButton );

		expect( input ).toHaveAttribute( 'type', 'text' );
		expect(
			screen.getByRole( 'button', { name: /hide/i } )
		).toBeInTheDocument();
	} );

	it( 'should call onChange when input value changes', () => {
		const onChange = jest.fn();
		render( <SecretField { ...defaultProps } onChange={ onChange } /> );

		const input = screen.getByLabelText( 'API Token' );
		fireEvent.change( input, { target: { value: 'new-value' } } );

		expect( onChange ).toHaveBeenCalledWith( 'new-value' );
	} );

	it( 'should render help text when provided', () => {
		render(
			<SecretField { ...defaultProps } help="Enter your API token" />
		);

		expect(
			screen.getByText( 'Enter your API token' )
		).toBeInTheDocument();
	} );

	it( 'should render placeholder when provided', () => {
		render(
			<SecretField { ...defaultProps } placeholder="Enter token here" />
		);

		const input = screen.getByLabelText( 'API Token' );
		expect( input ).toHaveAttribute( 'placeholder', 'Enter token here' );
	} );

	it( 'should handle empty value', () => {
		render( <SecretField { ...defaultProps } value="" /> );

		const input = screen.getByLabelText( 'API Token' );
		expect( input ).toHaveValue( '' );
	} );
} );
