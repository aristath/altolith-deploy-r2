/**
 * Edge Service Hook
 *
 * React hook for edge worker operations (deploy, test, get status).
 * Uses EdgeService class that calls Cloudflare API directly.
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import { EdgeService } from '../services/edgeService';
import { getCredentials } from '../../utils/credentialManager';
import apiFetch from '../../utils/api';

/**
 * Hook for edge service operations.
 *
 * @param {string} providerId Provider ID (e.g., 'cloudflare-r2').
 * @return {Object} Edge service methods.
 */
export function useEdgeService( providerId ) {
	/**
	 * Get edge service instance.
	 *
	 * @return {Promise<EdgeService>} Edge service instance.
	 */
	const getEdgeService = useCallback( async () => {
		// Fetch edge provider credentials from settings.
		const response = await apiFetch( {
			path: '/aether/v1/settings',
			method: 'GET',
		} );

		const settings = response?.settings || {};
		const providerTypes = settings.provider_types || {};
		const edgeProviderId = providerTypes.edge || 'cloudflare';

		// Get edge provider config from providers array
		const edgeProvider = settings.providers?.[ edgeProviderId ] || {};

		const accountId = edgeProvider.account_id || '';
		const apiToken = edgeProvider.api_token || '';

		if ( ! accountId || ! apiToken ) {
			throw new Error(
				'Edge provider credentials are required for worker deployment'
			);
		}

		// Get storage provider config for worker bindings.
		const storageCredentials = await getCredentials( providerId );

		return new EdgeService(
			accountId,
			apiToken,
			{
				...storageCredentials,
				worker_endpoint: storageCredentials.worker_endpoint || '',
			},
			edgeProviderId
		);
	}, [ providerId ] );

	/**
	 * Deploy edge worker.
	 *
	 * @param {string}  workerType Worker type (e.g., 'r2').
	 * @param {string}  script     Worker script content.
	 * @param {Object}  bindings   Worker bindings (R2 buckets, etc.).
	 * @param {boolean} dryRun     Whether to perform dry run.
	 * @return {Promise<Object>} Deployment result.
	 */
	const deploy = useCallback(
		async ( workerType, script, bindings = {}, dryRun = false ) => {
			const service = await getEdgeService();
			return service.deploy( workerType, script, bindings, dryRun );
		},
		[ getEdgeService ]
	);

	/**
	 * Test worker deployment status.
	 *
	 * @param {string} workerType Worker type.
	 * @param {string} workerUrl  Worker URL (optional).
	 * @return {Promise<Object>} Test result.
	 */
	const testDeployment = useCallback(
		async ( workerType, workerUrl = '' ) => {
			const service = await getEdgeService();
			return service.testDeployment( workerType, workerUrl );
		},
		[ getEdgeService ]
	);

	/**
	 * Get deployed worker endpoint URL.
	 *
	 * @param {string} workerType Worker type.
	 * @return {Promise<string>} Worker URL, empty string if not deployed.
	 */
	const getWorkerUrl = useCallback(
		async ( workerType ) => {
			const service = await getEdgeService();
			return service.getWorkerUrl( workerType );
		},
		[ getEdgeService ]
	);

	/**
	 * Check if worker is deployed.
	 *
	 * @param {string} workerType Worker type.
	 * @return {Promise<boolean>} True if deployed, false otherwise.
	 */
	const isDeployed = useCallback(
		async ( workerType ) => {
			const service = await getEdgeService();
			return service.isDeployed( workerType );
		},
		[ getEdgeService ]
	);

	/**
	 * Get worker script content from REST endpoint.
	 *
	 * @param {string} scriptProviderId Provider ID.
	 * @param {string} workerType       Worker type.
	 * @return {Promise<string>} Worker script content.
	 */
	const getWorkerScript = useCallback(
		async ( scriptProviderId, workerType ) => {
			const response = await apiFetch( {
				path: `/aether/v1/providers/${ scriptProviderId }/edge/worker-script/${ workerType }`,
				method: 'GET',
			} );

			if ( typeof response === 'string' ) {
				return response;
			}

			throw new Error( 'Failed to fetch worker script' );
		},
		[]
	);

	/**
	 * Get worker bindings configuration.
	 *
	 * @param {string} workerType Worker type.
	 * @param {Object} config     Provider configuration.
	 * @return {Promise<Object>} Worker bindings.
	 */
	const getWorkerBindings = useCallback(
		async ( workerType, config = {} ) => {
			const service = await getEdgeService();
			return service.getWorkerBindings( workerType, config );
		},
		[ getEdgeService ]
	);

	return {
		deploy,
		testDeployment,
		getWorkerUrl,
		isDeployed,
		getWorkerScript,
		getWorkerBindings,
	};
}
