/**
 * Concurrency Limiter Tests
 *
 * @package
 */

import { createConcurrencyLimiter } from '../concurrencyLimiter';

describe( 'createConcurrencyLimiter', () => {
	test( 'executes operations concurrently up to limit', async () => {
		const limiter = createConcurrencyLimiter( 2 );
		const executed = [];
		const operations = [
			() =>
				new Promise( ( resolve ) => {
					executed.push( 1 );
					setTimeout( () => resolve( 1 ), 10 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					executed.push( 2 );
					setTimeout( () => resolve( 2 ), 10 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					executed.push( 3 );
					setTimeout( () => resolve( 3 ), 10 );
				} ),
		];

		const promises = operations.map( ( op ) => limiter( op ) );
		await Promise.all( promises );

		// First two should start immediately
		expect( executed.slice( 0, 2 ) ).toEqual( [ 1, 2 ] );
		// Third should wait
		expect( executed ).toHaveLength( 3 );
	} );

	test( 'queues operations when limit is reached', async () => {
		const limiter = createConcurrencyLimiter( 2 );
		const startTimes = [];
		const operations = [
			() =>
				new Promise( ( resolve ) => {
					startTimes.push( { id: 1, time: Date.now() } );
					setTimeout( () => resolve( 1 ), 50 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					startTimes.push( { id: 2, time: Date.now() } );
					setTimeout( () => resolve( 2 ), 50 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					startTimes.push( { id: 3, time: Date.now() } );
					setTimeout( () => resolve( 3 ), 10 );
				} ),
		];

		const promises = operations.map( ( op ) => limiter( op ) );
		await Promise.all( promises );

		// First two should start at roughly the same time
		const timeDiff = Math.abs(
			startTimes[ 0 ].time - startTimes[ 1 ].time
		);
		expect( timeDiff ).toBeLessThan( 10 );

		// Third should start after first two complete (after ~50ms)
		const timeToThird = startTimes[ 2 ].time - startTimes[ 0 ].time;
		expect( timeToThird ).toBeGreaterThan( 40 );
	} );

	test( 'processes queue as operations complete', async () => {
		const limiter = createConcurrencyLimiter( 2 );
		const results = [];

		const operations = [
			() =>
				new Promise( ( resolve ) => {
					setTimeout( () => {
						results.push( 1 );
						resolve( 1 );
					}, 20 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					setTimeout( () => {
						results.push( 2 );
						resolve( 2 );
					}, 20 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					setTimeout( () => {
						results.push( 3 );
						resolve( 3 );
					}, 10 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					setTimeout( () => {
						results.push( 4 );
						resolve( 4 );
					}, 10 );
				} ),
		];

		const promises = operations.map( ( op ) => limiter( op ) );
		const resolved = await Promise.all( promises );

		expect( resolved ).toEqual( [ 1, 2, 3, 4 ] );
		expect( results ).toHaveLength( 4 );
	} );

	test( 'handles operation errors', async () => {
		const limiter = createConcurrencyLimiter( 2 );
		const error = new Error( 'Operation failed' );

		const operations = [
			() => Promise.resolve( 1 ),
			() => Promise.reject( error ),
			() => Promise.resolve( 3 ),
		];

		const promises = operations.map( ( op ) => limiter( op ) );

		await expect( promises[ 0 ] ).resolves.toBe( 1 );
		await expect( promises[ 1 ] ).rejects.toThrow( 'Operation failed' );
		await expect( promises[ 2 ] ).resolves.toBe( 3 );
	} );

	test( 'continues processing queue after error', async () => {
		const limiter = createConcurrencyLimiter( 2 );
		const results = [];

		const operations = [
			() =>
				new Promise( ( resolve ) => {
					setTimeout( () => {
						results.push( 1 );
						resolve( 1 );
					}, 10 );
				} ),
			() =>
				new Promise( ( _, reject ) => {
					setTimeout( () => {
						reject( new Error( 'Failed' ) );
					}, 10 );
				} ),
			() =>
				new Promise( ( resolve ) => {
					setTimeout( () => {
						results.push( 3 );
						resolve( 3 );
					}, 10 );
				} ),
		];

		const promises = operations.map( ( op ) =>
			limiter( op ).catch( () => null )
		);
		await Promise.allSettled( promises );

		// Should process all operations despite error
		expect( results ).toEqual( [ 1, 3 ] );
	} );

	test( 'uses default limit of 5', async () => {
		const limiter = createConcurrencyLimiter();
		const executed = [];

		// Create 7 operations
		const operations = Array.from(
			{ length: 7 },
			( _, i ) => () =>
				new Promise( ( resolve ) => {
					executed.push( i + 1 );
					setTimeout( () => resolve( i + 1 ), 10 );
				} )
		);

		const promises = operations.map( ( op ) => limiter( op ) );
		await Promise.all( promises );

		// First 5 should start immediately
		expect( executed.slice( 0, 5 ) ).toEqual( [ 1, 2, 3, 4, 5 ] );
		// Remaining 2 should wait
		expect( executed ).toHaveLength( 7 );
	} );

	test( 'handles synchronous operations', async () => {
		const limiter = createConcurrencyLimiter( 2 );
		const operations = [
			() => Promise.resolve( 1 ),
			() => Promise.resolve( 2 ),
			() => Promise.resolve( 3 ),
		];

		const promises = operations.map( ( op ) => limiter( op ) );
		const results = await Promise.all( promises );

		expect( results ).toEqual( [ 1, 2, 3 ] );
	} );

	test( 'handles single operation', async () => {
		const limiter = createConcurrencyLimiter( 2 );
		const result = await limiter( () => Promise.resolve( 42 ) );

		expect( result ).toBe( 42 );
	} );
} );
