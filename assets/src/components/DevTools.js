/**
 * DevTools Component
 *
 * Development-only component for debugging context state and API calls.
 * Only renders in development mode (when SCRIPT_DEBUG is true).
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { useConfigContext } from '../hooks/useConfigContext';
import { useProviderContext } from '../hooks/useProviderContext';
import { spacing, colors } from '../utils/styles';

/**
 * Check if we're in development mode
 *
 * @return {boolean} True if in development mode
 */
function isDevelopmentMode() {
	// Check for WordPress SCRIPT_DEBUG constant
	return (
		typeof window.aetherDebug !== 'undefined' && window.aetherDebug === true
	);
}

/**
 * DevTools Panel Component
 *
 * Displays context state, API call logs, and performance metrics.
 * Toggleable panel in bottom-right corner.
 */
export function DevTools() {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ activeTab, setActiveTab ] = useState( 'contexts' );
	const [ apiLogs, setApiLogs ] = useState( [] );

	// Get context data (hooks must be called before any conditional returns)
	const configContext = useConfigContext();
	const providerContext = useProviderContext();

	// Monitor API calls (intercept apiFetch)
	useEffect( () => {
		if ( typeof window.wp?.apiFetch === 'undefined' ) {
			return;
		}

		const originalFetch = window.wp.apiFetch;

		window.wp.apiFetch = async ( options ) => {
			const startTime = performance.now();
			const timestamp = new Date().toISOString();

			try {
				const result = await originalFetch( options );
				const endTime = performance.now();
				const duration = endTime - startTime;

				// Log successful API call
				setApiLogs( ( prev ) => [
					{
						timestamp,
						method: options.method || 'GET',
						path: options.path,
						duration: Math.round( duration ),
						status: 'success',
					},
					...prev.slice( 0, 49 ), // Keep last 50 calls
				] );

				return result;
			} catch ( error ) {
				const endTime = performance.now();
				const duration = endTime - startTime;

				// Log failed API call
				setApiLogs( ( prev ) => [
					{
						timestamp,
						method: options.method || 'GET',
						path: options.path,
						duration: Math.round( duration ),
						status: 'error',
						error: error.message,
					},
					...prev.slice( 0, 49 ),
				] );

				throw error;
			}
		};

		return () => {
			window.wp.apiFetch = originalFetch;
		};
	}, [] );

	// Don't render in production (after all hooks are called)
	if ( ! isDevelopmentMode() ) {
		return null;
	}

	if ( ! isOpen ) {
		return (
			<button
				className="aether-dev-tools__toggle"
				onClick={ () => setIsOpen( true ) }
				style={ {
					position: 'fixed',
					bottom: '20px',
					right: '20px',
					padding: '10px 15px',
					backgroundColor: '#0073aa',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: 'pointer',
					zIndex: 99999,
					fontSize: '12px',
					fontFamily: 'monospace',
				} }
			>
				🔧 DevTools
			</button>
		);
	}

	return (
		<div
			className="aether-dev-tools"
			style={ {
				position: 'fixed',
				bottom: 0,
				right: 0,
				width: '500px',
				height: '400px',
				backgroundColor: '#1e1e1e',
				color: '#d4d4d4',
				border: '1px solid #333',
				borderRadius: '8px 0 0 0',
				zIndex: 99999,
				fontFamily: 'monospace',
				fontSize: '12px',
				display: 'flex',
				flexDirection: 'column',
			} }
		>
			{ /* Header */ }
			<div
				className="aether-dev-tools__header"
				style={ {
					padding: '10px',
					backgroundColor: '#2d2d2d',
					borderBottom: '1px solid #333',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				} }
			>
				<span
					className="aether-dev-tools__title"
					style={ { fontWeight: 'bold' } }
				>
					🔧 Aether DevTools
				</span>
				<button
					className="aether-dev-tools__close-button"
					onClick={ () => setIsOpen( false ) }
					style={ {
						background: 'none',
						border: 'none',
						color: '#d4d4d4',
						cursor: 'pointer',
						fontSize: '16px',
					} }
				>
					×
				</button>
			</div>

			{ /* Tabs */ }
			<div
				className="aether-dev-tools__tabs"
				style={ {
					display: 'flex',
					gap: '10px',
					padding: '10px',
					backgroundColor: '#252525',
					borderBottom: '1px solid #333',
				} }
			>
				{ [ 'contexts', 'api', 'performance' ].map( ( tab ) => (
					<button
						key={ tab }
						className={ `aether-dev-tools__tab aether-dev-tools__tab--${ tab } ${
							activeTab === tab
								? 'aether-dev-tools__tab--active'
								: ''
						}` }
						onClick={ () => setActiveTab( tab ) }
						style={ {
							padding: '5px 10px',
							backgroundColor:
								activeTab === tab ? '#0073aa' : 'transparent',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textTransform: 'capitalize',
						} }
					>
						{ tab }
					</button>
				) ) }
			</div>

			{ /* Content */ }
			<div
				className="aether-dev-tools__content"
				style={ {
					flex: 1,
					overflow: 'auto',
					padding: '10px',
				} }
			>
				{ activeTab === 'contexts' && (
					<ContextsTab
						configContext={ configContext }
						providerContext={ providerContext }
					/>
				) }
				{ activeTab === 'api' && <ApiTab apiLogs={ apiLogs } /> }
				{ activeTab === 'performance' && (
					<PerformanceTab apiLogs={ apiLogs } />
				) }
			</div>
		</div>
	);
}

/**
 * Contexts Tab - Display context state
 * @param root0
 * @param root0.configContext
 * @param root0.providerContext
 */
function ContextsTab( { configContext, providerContext } ) {
	return (
		<div className="aether-dev-tools__contexts-tab">
			<Section title="ConfigContext">
				<KeyValue label="Loading" value={ configContext.loading } />
				<KeyValue label="Error" value={ configContext.error } />
				<KeyValue
					label="Config"
					value={ JSON.stringify( configContext.config, null, 2 ) }
					isCode
				/>
			</Section>

			<Section title="ProviderContext">
				<KeyValue label="Loading" value={ providerContext.loading } />
				<KeyValue label="Error" value={ providerContext.error } />
				<KeyValue
					label="Provider Count"
					value={ providerContext.providerCount }
				/>
				<KeyValue
					label="Provider IDs"
					value={ providerContext.providerIds.join( ', ' ) }
				/>
			</Section>
		</div>
	);
}

/**
 * API Tab - Display API call logs
 * @param root0
 * @param root0.apiLogs
 */
function ApiTab( { apiLogs } ) {
	return (
		<div className="aether-dev-tools__api-tab">
			<div
				className="aether-dev-tools__api-header"
				style={ {
					marginBottom: '10px',
					paddingBottom: '10px',
					borderBottom: '1px solid #333',
				} }
			>
				<strong className="aether-dev-tools__api-title">
					Recent API Calls ({ apiLogs.length })
				</strong>
			</div>
			{ apiLogs.length === 0 && (
				<div
					className="aether-dev-tools__api-empty"
					style={ { color: '#888' } }
				>
					No API calls recorded yet
				</div>
			) }
			{ apiLogs.map( ( log, index ) => (
				<div
					key={ index }
					className={ `aether-dev-tools__api-log aether-dev-tools__api-log--${ log.status }` }
					style={ {
						marginBottom: '10px',
						padding: '8px',
						backgroundColor: '#2d2d2d',
						borderRadius: '4px',
						borderLeft: `3px solid ${
							log.status === 'success' ? '#4caf50' : '#f44336'
						}`,
					} }
				>
					<div
						className="aether-dev-tools__api-log-header"
						style={ {
							display: 'flex',
							justifyContent: 'space-between',
							marginBottom: '4px',
						} }
					>
						<span
							className={ `aether-dev-tools__api-method aether-dev-tools__api-method--${ log.status }` }
							style={ {
								color:
									log.status === 'success'
										? '#4caf50'
										: '#f44336',
								fontWeight: 'bold',
							} }
						>
							{ log.method }
						</span>
						<span
							className="aether-dev-tools__api-duration"
							style={ { color: '#888', fontSize: '10px' } }
						>
							{ log.duration }ms
						</span>
					</div>
					<div
						className="aether-dev-tools__api-path"
						style={ { fontSize: '11px', color: '#aaa' } }
					>
						{ log.path }
					</div>
					{ log.error && (
						<div
							className="aether-dev-tools__api-error"
							style={ {
								fontSize: '10px',
								color: '#f44336',
								marginTop: '4px',
							} }
						>
							Error: { log.error }
						</div>
					) }
				</div>
			) ) }
		</div>
	);
}

/**
 * Performance Tab - Display performance metrics
 * @param root0
 * @param root0.apiLogs
 */
function PerformanceTab( { apiLogs } ) {
	const stats = apiLogs.reduce(
		( acc, log ) => {
			acc.total++;
			if ( log.status === 'success' ) {
				acc.successful++;
			} else {
				acc.failed++;
			}
			acc.totalDuration += log.duration;
			return acc;
		},
		{ total: 0, successful: 0, failed: 0, totalDuration: 0 }
	);

	const avgDuration =
		stats.total > 0 ? Math.round( stats.totalDuration / stats.total ) : 0;

	return (
		<div className="aether-dev-tools__performance-tab">
			<Section title="API Performance">
				<KeyValue label="Total Calls" value={ stats.total } />
				<KeyValue label="Successful" value={ stats.successful } />
				<KeyValue label="Failed" value={ stats.failed } />
				<KeyValue
					label="Average Duration"
					value={ `${ avgDuration }ms` }
				/>
				<KeyValue
					label="Total Duration"
					value={ `${ stats.totalDuration }ms` }
				/>
			</Section>

			<Section title="Memory Usage">
				{ performance.memory ? (
					<>
						<KeyValue
							label="Used JS Heap"
							value={ formatBytes(
								performance.memory.usedJSHeapSize
							) }
						/>
						<KeyValue
							label="Total JS Heap"
							value={ formatBytes(
								performance.memory.totalJSHeapSize
							) }
						/>
						<KeyValue
							label="Heap Limit"
							value={ formatBytes(
								performance.memory.jsHeapSizeLimit
							) }
						/>
					</>
				) : (
					<div
						className="aether-dev-tools__memory-unavailable"
						style={ { color: '#888' } }
					>
						Memory API not available
					</div>
				) }
			</Section>
		</div>
	);
}

/**
 * Section Component
 * @param root0
 * @param root0.title
 * @param root0.children
 */
function Section( { title, children } ) {
	return (
		<div
			className="aether-dev-tools__section"
			style={ { marginBottom: '20px' } }
		>
			<div
				className="aether-dev-tools__section-title"
				style={ {
					fontWeight: 'bold',
					marginBottom: '8px',
					paddingBottom: '4px',
					borderBottom: '1px solid #333',
				} }
			>
				{ title }
			</div>
			{ children }
		</div>
	);
}

/**
 * Key-Value Component
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.isCode
 */
function KeyValue( { label, value, isCode = false } ) {
	return (
		<div
			className="aether-dev-tools__key-value"
			style={ {
				marginBottom: spacing.sm,
				display: 'flex',
				gap: spacing.sm,
			} }
		>
			<span
				className="aether-dev-tools__key-value-label"
				style={ { color: colors.textMuted, minWidth: '120px' } }
			>
				{ label }:
			</span>
			{ isCode ? (
				<pre
					className="aether-dev-tools__key-value-code"
					style={ {
						margin: 0,
						color: '#d4d4d4',
						fontSize: '10px',
						overflow: 'auto',
					} }
				>
					{ value }
				</pre>
			) : (
				<span
					className="aether-dev-tools__key-value-text"
					style={ { color: '#d4d4d4' } }
				>
					{ typeof value === 'boolean'
						? String( value )
						: value || 'null' }
				</span>
			) }
		</div>
	);
}

/**
 * Format bytes to human-readable size
 * @param bytes
 */
function formatBytes( bytes ) {
	if ( bytes === 0 ) {
		return '0 Bytes';
	}
	const k = 1024;
	const sizes = [ 'Bytes', 'KB', 'MB', 'GB' ];
	const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
	return Math.round( bytes / Math.pow( k, i ) ) + ' ' + sizes[ i ];
}

export default DevTools;
