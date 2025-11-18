/**
 * Debug Utility Tests
 *
 * @package
 */

import {
	debug,
	debugError,
	debugWarn,
	debugInfo,
	debugTable,
	debugTime,
	debugTimeEnd,
	debugGroup,
	debugGroupEnd,
	enableDebug,
	disableDebug,
} from '../debug';

describe( 'debug utility', () => {
	let originalConsole;
	let originalWindow;

	beforeEach( () => {
		// Save original console and window
		originalConsole = global.console;
		originalWindow = global.window;

		// Mock console methods
		global.console = {
			log: jest.fn(),
			error: jest.fn(),
			warn: jest.fn(),
			info: jest.fn(),
			table: jest.fn(),
			time: jest.fn(),
			timeEnd: jest.fn(),
			group: jest.fn(),
			groupEnd: jest.fn(),
		};

		// Mock window
		global.window = {
			aetherDebug: false,
			console: global.console,
		};
	} );

	afterEach( () => {
		// Restore original console and window
		global.console = originalConsole;
		global.window = originalWindow;
	} );

	describe( 'debug mode disabled', () => {
		test( 'debug does not log when disabled', () => {
			debug( 'test message' );
			expect( global.console.log ).not.toHaveBeenCalled();
		} );

		test( 'debugError does not log when disabled', () => {
			debugError( 'test error' );
			expect( global.console.error ).not.toHaveBeenCalled();
		} );

		test( 'debugWarn does not log when disabled', () => {
			debugWarn( 'test warning' );
			expect( global.console.warn ).not.toHaveBeenCalled();
		} );

		test( 'debugInfo does not log when disabled', () => {
			debugInfo( 'test info' );
			expect( global.console.info ).not.toHaveBeenCalled();
		} );

		test( 'debugTable does not log when disabled', () => {
			debugTable( { key: 'value' } );
			expect( global.console.table ).not.toHaveBeenCalled();
		} );

		test( 'debugTime does not log when disabled', () => {
			debugTime( 'test timer' );
			expect( global.console.time ).not.toHaveBeenCalled();
		} );

		test( 'debugTimeEnd does not log when disabled', () => {
			debugTimeEnd( 'test timer' );
			expect( global.console.timeEnd ).not.toHaveBeenCalled();
		} );

		test( 'debugGroup does not log when disabled', () => {
			debugGroup( 'test group' );
			expect( global.console.group ).not.toHaveBeenCalled();
		} );

		test( 'debugGroupEnd does not log when disabled', () => {
			debugGroupEnd();
			expect( global.console.groupEnd ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'debug mode enabled', () => {
		beforeEach( () => {
			global.window.aetherDebug = true;
		} );

		test( 'debug logs with prefix when enabled', () => {
			debug( 'test message' );
			expect( global.console.log ).toHaveBeenCalledWith(
				'[Aether]',
				'test message'
			);
		} );

		test( 'debug handles multiple arguments', () => {
			debug( 'message', { key: 'value' }, 123 );
			expect( global.console.log ).toHaveBeenCalledWith(
				'[Aether]',
				'message',
				{ key: 'value' },
				123
			);
		} );

		test( 'debugError logs with prefix when enabled', () => {
			debugError( 'test error' );
			expect( global.console.error ).toHaveBeenCalledWith(
				'[Aether Error]',
				'test error'
			);
		} );

		test( 'debugWarn logs with prefix when enabled', () => {
			debugWarn( 'test warning' );
			expect( global.console.warn ).toHaveBeenCalledWith(
				'[Aether Warning]',
				'test warning'
			);
		} );

		test( 'debugInfo logs with prefix when enabled', () => {
			debugInfo( 'test info' );
			expect( global.console.info ).toHaveBeenCalledWith(
				'[Aether Info]',
				'test info'
			);
		} );

		test( 'debugTable logs table when enabled', () => {
			const data = { key: 'value' };
			debugTable( data );
			expect( global.console.table ).toHaveBeenCalledWith( data );
		} );

		test( 'debugTime logs timer with prefix when enabled', () => {
			debugTime( 'test timer' );
			expect( global.console.time ).toHaveBeenCalledWith(
				'[Aether] test timer'
			);
		} );

		test( 'debugTimeEnd logs timer end with prefix when enabled', () => {
			debugTimeEnd( 'test timer' );
			expect( global.console.timeEnd ).toHaveBeenCalledWith(
				'[Aether] test timer'
			);
		} );

		test( 'debugGroup logs group with prefix when enabled', () => {
			debugGroup( 'test group' );
			expect( global.console.group ).toHaveBeenCalledWith(
				'[Aether] test group'
			);
		} );

		test( 'debugGroupEnd logs group end when enabled', () => {
			debugGroupEnd();
			expect( global.console.groupEnd ).toHaveBeenCalled();
		} );
	} );

	describe( 'enableDebug', () => {
		test( 'enables debug mode', () => {
			global.window.aetherDebug = false;
			enableDebug();
			expect( global.window.aetherDebug ).toBe( true );
		} );

		test( 'logs debug message when enabled', () => {
			global.window.aetherDebug = false;
			enableDebug();
			expect( global.console.log ).toHaveBeenCalledWith(
				'[Aether]',
				'Debug mode enabled'
			);
		} );
	} );

	describe( 'disableDebug', () => {
		test( 'disables debug mode', () => {
			global.window.aetherDebug = true;
			disableDebug();
			expect( global.window.aetherDebug ).toBe( false );
		} );
	} );

	describe( 'handles missing console methods', () => {
		beforeEach( () => {
			global.window.aetherDebug = true;
		} );

		test( 'handles missing console.log gracefully', () => {
			delete global.console.log;
			expect( () => debug( 'test' ) ).not.toThrow();
		} );

		test( 'handles missing console.error gracefully', () => {
			delete global.console.error;
			expect( () => debugError( 'test' ) ).not.toThrow();
		} );

		test( 'handles missing console.warn gracefully', () => {
			delete global.console.warn;
			expect( () => debugWarn( 'test' ) ).not.toThrow();
		} );

		test( 'handles missing console.info gracefully', () => {
			delete global.console.info;
			expect( () => debugInfo( 'test' ) ).not.toThrow();
		} );

		test( 'handles missing console.table gracefully', () => {
			delete global.console.table;
			expect( () => debugTable( {} ) ).not.toThrow();
		} );

		test( 'handles missing console.time gracefully', () => {
			delete global.console.time;
			expect( () => debugTime( 'test' ) ).not.toThrow();
		} );

		test( 'handles missing console.timeEnd gracefully', () => {
			delete global.console.timeEnd;
			expect( () => debugTimeEnd( 'test' ) ).not.toThrow();
		} );

		test( 'handles missing console.group gracefully', () => {
			delete global.console.group;
			expect( () => debugGroup( 'test' ) ).not.toThrow();
		} );

		test( 'handles missing console.groupEnd gracefully', () => {
			delete global.console.groupEnd;
			expect( () => debugGroupEnd() ).not.toThrow();
		} );
	} );

	describe( 'handles missing window', () => {
		beforeEach( () => {
			delete global.window;
		} );

		test( 'handles missing window gracefully', () => {
			expect( () => debug( 'test' ) ).not.toThrow();
			expect( () => debugError( 'test' ) ).not.toThrow();
			expect( () => enableDebug() ).not.toThrow();
			expect( () => disableDebug() ).not.toThrow();
		} );
	} );
} );
