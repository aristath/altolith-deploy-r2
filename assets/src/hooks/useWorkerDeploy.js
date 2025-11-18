/**
 * Worker Deploy Hook
 *
 * Handles worker deployment to Cloudflare Workers.
 * Updated to use useEdgeService hook.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEdgeService } from '../providers/hooks/useEdgeService';
import apiFetch from '../utils/api';

/**
 * Hook for deploying workers.
 *
 * @param {string} workerType Worker type (r2, git, media, spaces).
 * @param {string} providerId Provider ID (e.g., 'cloudflare-r2').
 * @return {Object} Deployment methods and state.
 */
export function useWorkerDeploy( workerType, providerId = 'cloudflare-r2' ) {
	const [ deploying, setDeploying ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ result, setResult ] = useState( null );

	const edgeService = useEdgeService( providerId );

	const deploy = useCallback(
		async ( dryRun = false ) => {
			setDeploying( true );
			setError( null );
			setResult( null );

			try {
				// Get edge provider ID from settings.
				const settingsResponse = await apiFetch( {
					path: '/aether/v1/settings',
				} );
				const settings = settingsResponse.settings || {};
				const providerTypes = settings.provider_types || {};
				const edgeProviderId = providerTypes.edge || 'cloudflare';

				// Get worker script from REST API.
				const script = await edgeService.getWorkerScript(
					edgeProviderId,
					workerType
				);

				// Get worker bindings.
				const storageConfigResponse = await apiFetch( {
					path: `/aether/v1/providers/${ providerId }/config`,
				} );
				const config = storageConfigResponse.config || {};
				const bindings = await edgeService.getWorkerBindings(
					workerType,
					config
				);

				// Deploy worker.
				const deployResult = await edgeService.deploy(
					workerType,
					script,
					bindings,
					dryRun
				);

				if ( ! deployResult.success ) {
					throw new Error(
						deployResult.error ||
							__( 'Worker deployment failed', 'aether' )
					);
				}

				// Save deployment info to WordPress settings.
				const deploymentInfo = {
					worker_type: workerType,
					workerName: deployResult.workerName,
					workerUrl: deployResult.workerUrl,
					deployed_at: Date.now(),
				};

				// Get current deployments.
				const deployments = settings.worker_deployments || {};
				deployments[ workerType ] = deploymentInfo;

				await apiFetch( {
					path: '/aether/v1/settings',
					method: 'POST',
					data: { key: 'worker_deployments', value: deployments },
				} );

				// Also update provider config with worker endpoint.
				if ( deployResult.workerUrl ) {
					// Get current providers settings.
					const providersResponse = await apiFetch( {
						path: '/aether/v1/settings',
						method: 'GET',
					} );
					const providers =
						providersResponse.settings?.providers || {};

					// Use full providerId (e.g., 'cloudflare-r2') not truncated version
					if ( ! providers[ providerId ] ) {
						providers[ providerId ] = {};
					}

					providers[ providerId ].worker_endpoint =
						deployResult.workerUrl;

					// Update providers settings.
					await apiFetch( {
						path: '/aether/v1/settings',
						method: 'POST',
						data: {
							key: 'providers',
							value: providers,
						},
					} );
				}

				setResult( deploymentInfo );
				setDeploying( false );

				return {
					success: true,
					...deploymentInfo,
				};
			} catch ( err ) {
				const errorMessage =
					err.message || __( 'Worker deployment failed', 'aether' );
				setError( errorMessage );
				setDeploying( false );
				return {
					success: false,
					error: errorMessage,
				};
			}
		},
		[ workerType, providerId, edgeService ]
	);

	return {
		deploy,
		deploying,
		error,
		result,
	};
}
