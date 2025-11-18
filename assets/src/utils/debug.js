/**
 * Debug Utility
 *
 * Centralized logging utility for development debugging.
 * Can be enabled/disabled via window.aetherDebug flag.
 *
 * @package
 */

/**
 * Check if debug mode is enabled.
 *
 * @return {boolean} True if debug mode is enabled.
 */
function isDebugEnabled() {
	return typeof window !== 'undefined' && window.aetherDebug === true;
}

/**
 * Log a message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
export function debug( ...args ) {
	if ( isDebugEnabled() && window.console && window.console.log ) {
		window.console.log( '[Aether]', ...args );
	}
}

/**
 * Log an error to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
export function debugError( ...args ) {
	if ( isDebugEnabled() && window.console && window.console.error ) {
		window.console.error( '[Aether Error]', ...args );
	}
}

/**
 * Log a warning to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
export function debugWarn( ...args ) {
	if ( isDebugEnabled() && window.console && window.console.warn ) {
		window.console.warn( '[Aether Warning]', ...args );
	}
}

/**
 * Log an info message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
export function debugInfo( ...args ) {
	if ( isDebugEnabled() && window.console && window.console.info ) {
		window.console.info( '[Aether Info]', ...args );
	}
}

/**
 * Log a table to console (only in debug mode).
 *
 * @param {*} data Data to display as table.
 */
export function debugTable( data ) {
	if ( isDebugEnabled() && window.console && window.console.table ) {
		window.console.table( data );
	}
}

/**
 * Start a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
export function debugTime( label ) {
	if ( isDebugEnabled() && window.console && window.console.time ) {
		window.console.time( `[Aether] ${ label }` );
	}
}

/**
 * End a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
export function debugTimeEnd( label ) {
	if ( isDebugEnabled() && window.console && window.console.timeEnd ) {
		window.console.timeEnd( `[Aether] ${ label }` );
	}
}

/**
 * Group console messages (only in debug mode).
 *
 * @param {string} label Group label.
 */
export function debugGroup( label ) {
	if ( isDebugEnabled() && window.console && window.console.group ) {
		window.console.group( `[Aether] ${ label }` );
	}
}

/**
 * End console message group (only in debug mode).
 */
export function debugGroupEnd() {
	if ( isDebugEnabled() && window.console && window.console.groupEnd ) {
		window.console.groupEnd();
	}
}

/**
 * Enable debug mode.
 *
 * Usage: aetherDebug.enable() in browser console.
 */
export function enableDebug() {
	if ( typeof window !== 'undefined' ) {
		window.aetherDebug = true;
		debug( 'Debug mode enabled' );
	}
}

/**
 * Disable debug mode.
 *
 * Usage: aetherDebug.disable() in browser console.
 */
export function disableDebug() {
	if ( typeof window !== 'undefined' ) {
		window.aetherDebug = false;
	}
}

// Export as single object for easier importing
const debugUtil = {
	debug,
	error: debugError,
	warn: debugWarn,
	info: debugInfo,
	table: debugTable,
	time: debugTime,
	timeEnd: debugTimeEnd,
	group: debugGroup,
	groupEnd: debugGroupEnd,
	enable: enableDebug,
	disable: disableDebug,
	isEnabled: isDebugEnabled,
};

// Make available globally for easy browser console access
if ( typeof window !== 'undefined' ) {
	window.aetherDebug = window.aetherDebug || false;
	window.aetherDebugUtil = debugUtil;
}

export default debugUtil;
