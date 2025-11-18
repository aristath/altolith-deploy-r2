/**
 * Tests for LoadingState Component
 *
 * @package
 */

import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe( 'LoadingState', () => {
	it( 'should render spinner', () => {
		render( <LoadingState /> );

		expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
	} );

	it( 'should render default loading message', () => {
		render( <LoadingState /> );

		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
	} );

	it( 'should render custom message', () => {
		render( <LoadingState message="Please wait..." /> );

		expect( screen.getByText( 'Please wait...' ) ).toBeInTheDocument();
	} );

	it( 'should not render message when empty string provided', () => {
		render( <LoadingState message="" /> );

		expect( screen.queryByText( 'Loading…' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
	} );
} );
