/**
 * Delay Utility Tests
 *
 * @package
 */

import { delay } from '../delay';
import { SHORT_DELAY_MS } from '../constants';

describe( 'delay', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	test( 'resolves after default delay', async () => {
		const promise = delay();
		jest.advanceTimersByTime( SHORT_DELAY_MS );
		await expect( promise ).resolves.toBeUndefined();
	} );

	test( 'resolves after custom delay', async () => {
		const customDelay = 1000;
		const promise = delay( customDelay );
		jest.advanceTimersByTime( customDelay );
		await expect( promise ).resolves.toBeUndefined();
	} );

	test( 'does not resolve before delay completes', async () => {
		const customDelay = 1000;
		const promise = delay( customDelay );
		jest.advanceTimersByTime( customDelay - 1 );
		// Promise should still be pending
		expect( promise ).toBeInstanceOf( Promise );
		jest.advanceTimersByTime( 1 );
		await expect( promise ).resolves.toBeUndefined();
	} );

	test( 'handles zero delay', async () => {
		const promise = delay( 0 );
		jest.advanceTimersByTime( 0 );
		await expect( promise ).resolves.toBeUndefined();
	} );
} );
