/**
 * Cloudflare R2 Blueprint Bundle Provider Modal Hooks
 *
 * Adds custom content to the Cloudflare R2 blueprint bundle provider configuration modal.
 * Specifically adds a "Deploy Worker" button for R2 storage worker.
 *
 * @package
 */

import { useState, createRoot } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addAction } from '@wordpress/hooks';
import apiFetch from '../../utils/api';

/**
 * Deploy Worker button component for Cloudflare R2.
 *
 * @param {Object}   props            Component props.
 * @param {string}   props.providerId Provider ID.
 * @param {Object}   props.config     Current provider configuration (form values).
 * @param {Function} props.onChange   Optional function to update form field values.
 * @return {JSX.Element} Deploy Worker button.
 */
function DeployWorkerButton( { providerId, config, onChange } ) {
	const [ deploying, setDeploying ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ success, setSuccess ] = useState( false );
	const [ workerUrl, setWorkerUrl ] = useState( null );

	const handleDeploy = async () => {
		setDeploying( true );
		setError( null );
		setSuccess( false );
		setWorkerUrl( null );

		try {
			// Validate required credentials from this provider's config
			if ( ! config?.account_id || ! config?.api_token ) {
				throw new Error(
					__(
						'Cloudflare Account ID and API Token are required',
						'aether-site-exporter-providers'
					)
				);
			}

			if (
				! config?.access_key_id ||
				! config?.secret_access_key ||
				! config?.bucket_name
			) {
				throw new Error(
					__(
						'R2 Access Key ID, Secret Access Key, and Bucket Name are required',
						'aether-site-exporter-providers'
					)
				);
			}

			const restUrl = window.wpApiSettings?.root || '/wp-json';

			// Get nonce for authentication
			const nonce =
				document
					.querySelector( 'meta[name="aether-rest-nonce"]' )
					?.getAttribute( 'content' ) ||
				window.wpApiSettings?.nonce ||
				'';

			// Generate worker name (format: aether-r2-{random})
			const randomId = Math.random().toString( 36 ).substring( 2, 10 );
			const workerName = `aether-r2-${ randomId }`;

			// Prepare bindings - R2 bucket binding
			const bindings = {};
			if ( config.bucket_name ) {
				bindings.R2_BUCKET = {
					type: 'r2_bucket',
					bucket_name: config.bucket_name,
				};
			}

			// Deploy worker using server-side REST API endpoint (avoids CORS issues)
			const deployEndpoint = `${ restUrl }/aether/site-exporter/providers/cloudflare/deploy-worker`;

			const deployResponse = await fetch( deployEndpoint, {
				method: 'POST',
				headers: {
					'X-WP-Nonce': nonce,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify( {
					worker_type: 'r2',
					worker_name: workerName,
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

			// Save worker endpoint to provider config and update form field
			if ( result.worker_url ) {
				// Update the form field value immediately (if onChange is available)
				if ( onChange && typeof onChange === 'function' ) {
					onChange( 'worker_endpoint', result.worker_url );
				}

				// Save to provider config using the provider config endpoint
				try {
					await apiFetch( {
						path: `/aether/site-exporter/providers/${ providerId }/config`,
						method: 'PUT',
						data: {
							worker_endpoint: result.worker_url,
						},
					} );
				} catch {
					// Error saving worker endpoint - the value is already in the form
					// so deployment is still successful. The user can manually save if needed.
				}
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
					deploying ||
					! config?.account_id ||
					! config?.api_token ||
					! config?.access_key_id ||
					! config?.secret_access_key ||
					! config?.bucket_name
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
 * Initialize modal hooks for Cloudflare R2 provider.
 *
 * @param {string} providerIdPrefix Provider ID prefix to match (e.g., 'cloudflare-r2-blueprint-bundle').
 */
export function initCloudflareR2ModalHooks( providerIdPrefix ) {
	// Hook into the after_fields action to add Deploy Worker button
	addAction(
		'aether.provider.form.after_fields',
		`aether/${ providerIdPrefix }/deploy-button`,
		( context ) => {
			// Only add button for matching provider
			if ( ! context.providerId?.startsWith( providerIdPrefix ) ) {
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
				try {
					existingRoot.unmount();
				} catch {
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

			root.render(
				<DeployWorkerButton
					providerId={ context.providerId }
					config={ context.values }
					onChange={ context.onChange }
				/>
			);
		}
	);
}
