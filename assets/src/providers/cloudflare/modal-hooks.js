/**
 * Cloudflare Workers Provider Modal Hooks
 *
 * Adds custom content to the Cloudflare Workers provider configuration modal.
 * Specifically adds a "Deploy Worker" button.
 *
 * @package
 */

import { useState, createRoot } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
// Import provider instance (created in index.js but not exported)
// We'll create our own instance here
import { CloudflareWorkersProvider } from './CloudflareWorkersProvider';

const provider = new CloudflareWorkersProvider();

/**
 * Deploy Worker button component.
 *
 * @param {Object} props        Component props.
 * @param {Object} props.config Current provider configuration (form values).
 * @return {JSX.Element} Deploy Worker button.
 */
function DeployWorkerButton( { config } ) {
	const [ deploying, setDeploying ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ success, setSuccess ] = useState( false );
	const [ workerUrl, setWorkerUrl ] = useState( null );

	// Default worker type - can be made configurable later
	const workerType = 'r2';

	const handleDeploy = async () => {
		setDeploying( true );
		setError( null );
		setSuccess( false );
		setWorkerUrl( null );

		try {
			// Validate credentials
			if ( ! config?.api_token || ! config?.account_id ) {
				throw new Error(
					__(
						'Account ID and API Token are required',
						'aether-site-exporter-providers'
					)
				);
			}

			// Set provider config from form values (temporarily for this deployment)
			provider.config = { ...config };

			// Fetch worker script from REST API
			// The endpoint returns plain text (Content-Type: text/javascript)
			// We need to use fetch directly since apiFetch may try to parse as JSON
			let script = '';
			try {
				// Get the REST API base URL
				const restUrl = window.wpApiSettings?.root || '/wp-json';
				const endpoint = `${ restUrl }/aether/site-exporter/providers/worker-scripts/${ workerType }`;

				// Get nonce for authentication
				const nonce =
					document
						.querySelector( 'meta[name="aether-rest-nonce"]' )
						?.getAttribute( 'content' ) ||
					window.wpApiSettings?.nonce ||
					'';

				const response = await fetch( endpoint, {
					method: 'GET',
					headers: {
						'X-WP-Nonce': nonce,
					},
				} );

				if ( ! response.ok ) {
					throw new Error(
						`HTTP ${ response.status }: ${ response.statusText }`
					);
				}

				// Get response as text (not JSON)
				script = await response.text();

				if ( ! script || script.trim().length === 0 ) {
					throw new Error(
						__(
							'Worker script is empty',
							'aether-site-exporter-providers'
						)
					);
				}
			} catch ( scriptError ) {
				throw new Error(
					scriptError.message ||
						__(
							'Failed to fetch worker script from server',
							'aether-site-exporter-providers'
						)
				);
			}

			// Prepare worker bindings based on configuration
			// For now, pass empty bindings since Cloudflare Workers provider
			// doesn't have bucket configuration (that comes from storage providers)
			const bindings = {};

			// Generate worker name
			const workerName = provider.generateWorkerName( workerType );

			// Deploy worker using server-side REST API endpoint (avoids CORS issues)
			const restUrl = window.wpApiSettings?.root || '/wp-json';
			const endpoint = `${ restUrl }/aether/site-exporter/providers/cloudflare/deploy-worker`;

			// Get nonce for authentication
			const nonce =
				document
					.querySelector( 'meta[name="aether-rest-nonce"]' )
					?.getAttribute( 'content' ) ||
				window.wpApiSettings?.nonce ||
				'';

			const deployResponse = await fetch( endpoint, {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify( {
					worker_type: workerType,
					worker_name: workerName,
					script,
					bindings,
					account_id: config.account_id,
					api_token: config.api_token,
				} ),
			} );

			if ( ! deployResponse.ok ) {
				const errorData = await deployResponse.json().catch( () => ( {
					message: `HTTP ${ deployResponse.status }: ${ deployResponse.statusText }`,
				} ) );
				throw new Error(
					errorData.message ||
						errorData.error ||
						__(
							'Failed to deploy worker',
							'aether-site-exporter-providers'
						)
				);
			}

			const result = await deployResponse.json();

			if ( ! result.success ) {
				throw new Error(
					result.message ||
						result.error ||
						__(
							'Failed to deploy worker',
							'aether-site-exporter-providers'
						)
				);
			}

			setSuccess( true );
			setWorkerUrl( result.worker_url || null );

			// Clear success message after 10 seconds
			setTimeout( () => {
				setSuccess( false );
			}, 10000 );
		} catch ( err ) {
			setError(
				err.message ||
					__(
						'Failed to deploy worker',
						'aether-site-exporter-providers'
					)
			);
		} finally {
			setDeploying( false );
		}
	};

	const containerStyle = {
		marginTop: '1rem',
		paddingTop: '1rem',
		borderTop: '1px solid #ddd',
	};

	return (
		<div style={ containerStyle }>
			<Button
				variant="secondary"
				onClick={ handleDeploy }
				isBusy={ deploying }
				disabled={
					deploying || ! config?.api_token || ! config?.account_id
				}
			>
				{ deploying
					? __( 'Deploying…', 'aether-site-exporter-providers' )
					: __( 'Deploy Worker', 'aether-site-exporter-providers' ) }
			</Button>

			{ error && (
				<Notice
					status="error"
					isDismissible={ false }
					style={ { marginTop: '0.5rem' } }
				>
					{ error }
				</Notice>
			) }

			{ success && (
				<Notice
					status="success"
					isDismissible={ false }
					style={ { marginTop: '0.5rem' } }
				>
					{ __(
						'Worker deployed successfully!',
						'aether-site-exporter-providers'
					) }
					{ workerUrl && (
						<div style={ { marginTop: '0.5rem' } }>
							<strong>
								{ __(
									'Worker URL:',
									'aether-site-exporter-providers'
								) }
							</strong>{ ' ' }
							<a
								href={ workerUrl }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ workerUrl }
							</a>
						</div>
					) }
				</Notice>
			) }
		</div>
	);
}

// Store React roots and container elements for cleanup
const reactRoots = new Map();
const rootContainers = new Map();

/**
 * Initialize modal hooks for Cloudflare Workers provider.
 */
export function initCloudflareModalHooks() {
	// Hook into the after_fields action to add Deploy Worker button
	addAction(
		'aether.provider.form.after_fields',
		'aether-site-exporter-providers/cloudflare/deploy-button',
		( context ) => {
			// Only add button for Cloudflare Workers provider
			if ( context.providerId !== 'cloudflare' ) {
				return;
			}

			// Find the container element
			const container = document.querySelector(
				`.aether-provider-form__after-fields[data-provider-id="${ context.providerId }"]`
			);

			if ( ! container ) {
				return;
			}

			// Clean up previous render if it exists
			const existingRoot = reactRoots.get( context.providerId );
			const existingContainer = rootContainers.get( context.providerId );
			if ( existingRoot ) {
				// Unmount previous React component
				try {
					existingRoot.unmount();
				} catch ( e ) {
					// If unmount fails, just remove the element
					if ( existingContainer && existingContainer.parentNode ) {
						existingContainer.parentNode.removeChild(
							existingContainer
						);
					}
				}
				reactRoots.delete( context.providerId );
				rootContainers.delete( context.providerId );
			}

			// Create a new root element for this render
			const rootElement = document.createElement( 'div' );
			container.appendChild( rootElement );

			// Create React 18 root and render
			const root = createRoot( rootElement );
			reactRoots.set( context.providerId, root );
			rootContainers.set( context.providerId, rootElement );

			root.render( <DeployWorkerButton config={ context.values } /> );
		}
	);
}
