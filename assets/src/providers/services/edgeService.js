/**
 * Edge Service (React)
 *
 * React implementation of edge service for Cloudflare Workers.
 * Replaces R2EdgeService.php logic.
 * Handles worker deployment and management via Cloudflare API.
 *
 * Deployment strategy:
 * - R2 workers: Uses PHP endpoint (avoids browser PUT request limitations in Playground)
 * - Other worker types: Makes direct browser-based Cloudflare API calls
 *
 * @package
 */

import apiFetch, { createAuthHeaders } from '../../utils/api';
import { parseErrorResponse } from '../../utils/errorParser';
import {
	createSuccessResponse,
	createErrorResponse,
} from '../../utils/standardResponse';
import { debugError, debugWarn } from '../../utils/debug';
import pRetry from 'p-retry';
import {
	MAX_RETRIES,
	RETRY_INITIAL_DELAY,
	RETRY_MAX_DELAY,
} from '../../constants/timing';

/**
 * Edge Service class.
 */
export class EdgeService {
	/**
	 * Constructor.
	 *
	 * @param {string} accountId  Cloudflare account ID.
	 * @param {string} apiToken   Cloudflare API token.
	 * @param {Object} config     Optional configuration.
	 * @param {string} providerId Provider ID for REST API endpoints (default: 'cloudflare').
	 */
	constructor( accountId, apiToken, config = {}, providerId = 'cloudflare' ) {
		this.accountId = accountId;
		this.apiToken = apiToken;
		this.config = config;
		this.providerId = providerId;
		this.cloudflareApiBase = 'https://api.cloudflare.com/client/v4';
	}

	/**
	 * Make a request to Cloudflare API.
	 *
	 * @param {string} endpoint API endpoint (e.g., '/accounts/ID/workers/scripts').
	 * @param {Object} options  Fetch options (method, headers, body, etc.).
	 * @return {Promise<Object>} API response.
	 */
	async cloudflareApiRequest( endpoint, options = {} ) {
		const url = `${ this.cloudflareApiBase }${ endpoint }`;
		const authHeaders = createAuthHeaders( this.apiToken );
		const headers = {
			...authHeaders,
			...( options.headers || {} ),
		};

		try {
			// Use pRetry to wrap fetch with retry logic for network errors only.
			// We don't retry on HTTP errors because they contain useful error info.
			const response = await pRetry(
				async () => {
					return await fetch( url, {
						...options,
						headers,
					} );
				},
				{
					retries: MAX_RETRIES,
					minTimeout: RETRY_INITIAL_DELAY,
					maxTimeout: RETRY_MAX_DELAY,
					onFailedAttempt: ( error ) => {
						// Only network errors will trigger retry.
						debugWarn(
							`Cloudflare API request failed (${ endpoint }), retrying... (attempt ${ error.attemptNumber })`,
							error.message
						);
					},
					// Only retry on network errors, not HTTP errors.
					shouldRetry: ( error ) => {
						return (
							error.name === 'TypeError' &&
							error.message.includes( 'fetch' )
						);
					},
				}
			);

			const data = await response.json();

			if ( ! response.ok || ! data.success ) {
				const responseText = JSON.stringify( data );
				const error = parseErrorResponse(
					responseText,
					'Cloudflare API request failed'
				);
				debugError( `Cloudflare API error (${ endpoint }):`, error );
				return createErrorResponse( error, data.errors || [] );
			}

			return createSuccessResponse( { result: data.result } );
		} catch ( error ) {
			debugError(
				`Cloudflare API request failed (${ endpoint }):`,
				error
			);
			return createErrorResponse(
				error.message || 'Network request failed'
			);
		}
	}

	/**
	 * Deploy edge worker.
	 *
	 * Deployment method depends on worker type:
	 * - R2 workers: Uses PHP endpoint (server-side PUT request, no CORS issues)
	 * - Other worker types: Uses direct browser-based Cloudflare API calls
	 *
	 * @param {string}  workerType Worker type (e.g., 'r2').
	 * @param {string}  script     Worker script content.
	 * @param {Object}  bindings   Worker bindings (R2 buckets, etc.).
	 * @param {boolean} dryRun     Whether to perform dry run.
	 * @return {Promise<Object>} Result array with 'success' and optional 'workerName', 'workerUrl', 'error'.
	 */
	async deploy( workerType, script, bindings = {}, dryRun = false ) {
		if ( dryRun ) {
			const workerName = this.generateWorkerName( workerType );
			return createSuccessResponse(
				{
					workerName: workerName + '-dry-run',
					workerUrl: this.getWorkerUrlFromName(
						workerName + '-dry-run'
					),
				},
				'Dry run successful'
			);
		}

		// Generate worker name.
		const workerName = this.generateWorkerName( workerType );

		// For R2 workers, use PHP endpoint (avoids browser PUT request limitations in Playground)
		if ( workerType === 'r2' ) {
			try {
				const response = await apiFetch( {
					path: '/aether/v1/providers/cloudflare-r2/deploy-worker',
					method: 'POST',
					data: {
						worker_name: workerName,
						script,
						bindings,
					},
				} );

				if ( ! response.success ) {
					return createErrorResponse(
						response.error || 'Worker deployment failed'
					);
				}

				return createSuccessResponse( {
					workerName: response.worker_name,
					workerUrl: response.worker_url,
				} );
			} catch ( error ) {
				return createErrorResponse(
					error.message || 'Worker deployment failed'
				);
			}
		}

		// For other worker types, use direct Cloudflare API call (browser-based).
		try {
			// Build multipart/form-data body for Cloudflare Workers API.
			const formData = new FormData();

			// Add worker script.
			const scriptBlob = new Blob( [ script ], {
				type: 'application/javascript+module',
			} );
			formData.append( 'worker.js', scriptBlob, 'worker.js' );

			// Add metadata with bindings.
			const metadata = {
				main_module: 'worker.js',
				bindings: [],
			};

			// Convert bindings object to Cloudflare API format.
			for ( const [ name, binding ] of Object.entries( bindings ) ) {
				if ( binding.type === 'r2_bucket' ) {
					metadata.bindings.push( {
						type: 'r2_bucket',
						name,
						bucket_name: binding.bucket_name,
					} );
				}
			}

			formData.append(
				'metadata',
				new Blob( [ JSON.stringify( metadata ) ], {
					type: 'application/json',
				} ),
				'metadata.json'
			);

			// Deploy to Cloudflare API.
			const endpoint = `/accounts/${ this.accountId }/workers/scripts/${ workerName }`;
			const response = await this.cloudflareApiRequest( endpoint, {
				method: 'PUT',
				body: formData,
			} );

			if ( ! response.success ) {
				return createErrorResponse(
					response.error || 'Worker deployment failed'
				);
			}

			// Get the worker URL.
			const workerUrl = this.getWorkerUrlFromName( workerName );

			// Try to enable workers.dev subdomain.
			await this.enableWorkersDevSubdomain( workerName );

			return createSuccessResponse( {
				workerName,
				workerUrl,
			} );
		} catch ( error ) {
			return createErrorResponse(
				error.message || 'Worker deployment failed'
			);
		}
	}

	/**
	 * Enable workers.dev subdomain for a worker.
	 *
	 * @param {string} workerName Worker name.
	 * @return {Promise<Object>} Result object.
	 */
	async enableWorkersDevSubdomain( workerName ) {
		try {
			// First, get the subdomain name.
			const subdomainEndpoint = `/accounts/${ this.accountId }/workers/subdomain`;
			const subdomainResponse = await this.cloudflareApiRequest(
				subdomainEndpoint,
				{
					method: 'GET',
				}
			);

			if ( ! subdomainResponse.success ) {
				debugWarn(
					'Failed to get workers.dev subdomain:',
					subdomainResponse.error
				);
				return createErrorResponse( subdomainResponse.error );
			}

			const subdomain = subdomainResponse.data?.result?.subdomain;
			if ( ! subdomain ) {
				debugWarn( 'No workers.dev subdomain configured' );
				return createErrorResponse( 'No subdomain configured' );
			}

			// Enable the subdomain for this worker.
			const enableEndpoint = `/accounts/${ this.accountId }/workers/scripts/${ workerName }/subdomain`;
			const enableResponse = await this.cloudflareApiRequest(
				enableEndpoint,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify( { enabled: true } ),
				}
			);

			if ( ! enableResponse.success ) {
				debugWarn(
					'Failed to enable workers.dev subdomain:',
					enableResponse.error
				);
				return createErrorResponse( enableResponse.error );
			}

			return createSuccessResponse();
		} catch ( error ) {
			debugWarn( 'Error enabling workers.dev subdomain:', error );
			return createErrorResponse( error.message );
		}
	}

	/**
	 * Test worker deployment status.
	 *
	 * @param {string} workerType Worker type.
	 * @param {string} workerUrl  Worker URL (optional).
	 * @return {Promise<Object>} Result array with 'success', 'deployed' and optional 'workerUrl', 'error'.
	 */
	async testDeployment( workerType, workerUrl = '' ) {
		if ( ! workerUrl ) {
			return createSuccessResponse(
				{ deployed: false },
				'Worker not deployed'
			);
		}

		// Test API token permissions via direct Cloudflare API call.
		try {
			const listResponse = await this.listWorkers();

			if ( ! listResponse.success ) {
				return createErrorResponse(
					listResponse.error ||
						'Failed to verify API token permissions'
				);
			}
		} catch ( error ) {
			return createErrorResponse(
				error.message || 'Token permission test failed'
			);
		}

		// Try to fetch worker info via direct Cloudflare API call.
		const workerName = this.extractWorkerNameFromUrl( workerUrl );
		if ( workerName ) {
			try {
				const workerInfo = await this.getWorker( workerName );

				if ( workerInfo.success ) {
					return createSuccessResponse(
						{ deployed: true, workerUrl },
						'Worker is deployed and accessible'
					);
				}
			} catch ( error ) {
				// Worker might not exist yet, continue
			}
		}

		return createSuccessResponse(
			{ deployed: true, workerUrl },
			'Worker URL provided but verification failed'
		);
	}

	/**
	 * List all deployed workers.
	 *
	 * @return {Promise<Object>} Result with workers array.
	 */
	async listWorkers() {
		const endpoint = `/accounts/${ this.accountId }/workers/scripts`;
		const response = await this.cloudflareApiRequest( endpoint, {
			method: 'GET',
		} );

		if ( ! response.success ) {
			return createErrorResponse(
				response.error || 'Failed to list workers'
			);
		}

		return createSuccessResponse( {
			workers: response.data?.result || [],
		} );
	}

	/**
	 * Get information about a specific worker.
	 *
	 * @param {string} workerName Worker name.
	 * @return {Promise<Object>} Result with worker info.
	 */
	async getWorker( workerName ) {
		const endpoint = `/accounts/${ this.accountId }/workers/scripts/${ workerName }`;
		const response = await this.cloudflareApiRequest( endpoint, {
			method: 'GET',
		} );

		if ( ! response.success ) {
			return createErrorResponse(
				response.error || 'Failed to get worker info'
			);
		}

		return createSuccessResponse( {
			worker: response.data?.result,
		} );
	}

	/**
	 * Get zone ID for a hostname (for custom domain attachment).
	 *
	 * @param {string} hostname Hostname to lookup.
	 * @return {Promise<Object>} Result with zone ID.
	 */
	async getZoneIdForHostname( hostname ) {
		// List zones and find matching one.
		const endpoint = `/zones?name=${ encodeURIComponent( hostname ) }`;
		const response = await this.cloudflareApiRequest( endpoint, {
			method: 'GET',
		} );

		if ( ! response.success ) {
			return createErrorResponse(
				response.error || 'Failed to get zone ID'
			);
		}

		const zones = response.data?.result || [];
		if ( zones.length === 0 ) {
			return createErrorResponse(
				`No zone found for hostname: ${ hostname }`
			);
		}

		return createSuccessResponse( {
			zoneId: zones[ 0 ].id,
			zoneName: zones[ 0 ].name,
		} );
	}

	/**
	 * Attach worker to a custom domain.
	 *
	 * @param {string} workerName Worker name.
	 * @param {string} hostname   The hostname to attach (e.g., "example.com").
	 * @param {string} zoneId     Cloudflare zone ID.
	 * @return {Promise<Object>} Result with success status.
	 */
	async attachWorkerToCustomDomain( workerName, hostname, zoneId ) {
		// Clean hostname (remove protocol and path).
		const cleanHostname = hostname
			.replace( /^https?:\/\//, '' )
			.replace( /\/.*$/, '' );

		const endpoint = `/accounts/${ this.accountId }/workers/domains`;
		const response = await this.cloudflareApiRequest( endpoint, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( {
				environment: 'production',
				hostname: cleanHostname,
				service: workerName,
				zone_id: zoneId,
				override_existing_dns_record: true,
			} ),
		} );

		if ( ! response.success ) {
			return createErrorResponse(
				response.error || 'Failed to attach worker to custom domain'
			);
		}

		return createSuccessResponse(
			null,
			`Worker attached to ${ cleanHostname }`
		);
	}

	/**
	 * Test connection to Cloudflare Workers and R2.
	 *
	 * @param {string} workerEndpoint Optional worker endpoint to test.
	 * @return {Promise<Object>} Result with connection status.
	 */
	async testConnection( workerEndpoint = '' ) {
		const results = {
			success: true,
			workersApi: false,
			r2Access: false,
			errors: [],
		};

		// Test Cloudflare Workers API access.
		try {
			const workersResponse = await this.listWorkers();

			if ( workersResponse.success ) {
				results.workersApi = true;
			} else {
				results.errors.push(
					`Workers API: ${ workersResponse.error }`
				);
				results.success = false;
			}
		} catch ( error ) {
			results.errors.push( `Workers API: ${ error.message }` );
			results.success = false;
		}

		// Test R2 access if workerEndpoint is provided.
		if ( workerEndpoint ) {
			try {
				// Create a test URL to check R2 worker access.
				const testSiteKey = 'connection-test-' + Date.now();
				const testUrl = `${ workerEndpoint.replace(
					/\/+$/,
					''
				) }/${ testSiteKey }/test.html`;

				const response = await fetch( testUrl, {
					method: 'GET',
				} );

				// We expect 404 for non-existent file, but that proves R2 worker is accessible.
				if ( response.status === 404 || response.ok ) {
					results.r2Access = true;
				} else {
					results.errors.push(
						`R2 Worker: HTTP ${ response.status }`
					);
					results.success = false;
				}
			} catch ( error ) {
				results.errors.push( `R2 Worker: ${ error.message }` );
				results.success = false;
			}
		}

		return results;
	}

	/**
	 * Get deployed worker endpoint URL.
	 *
	 * @return {string} Worker URL, empty string if not deployed.
	 */
	getWorkerUrl() {
		// Get worker endpoint from config (set after deployment).
		return this.config.worker_endpoint || '';
	}

	/**
	 * Check if worker is deployed.
	 *
	 * @param {string} workerType Worker type.
	 * @return {boolean} True if deployed, false otherwise.
	 */
	isDeployed( workerType ) {
		const url = this.getWorkerUrl( workerType );
		return !! url;
	}

	/**
	 * Get worker script content.
	 * Fetches worker script from REST endpoint.
	 *
	 * @param {string} providerId Optional provider ID (defaults to this.providerId).
	 * @param {string} workerType Worker type (e.g., 'r2', 'git', 'media').
	 * @return {Promise<string>} Worker script content.
	 */
	async getWorkerScript( providerId = null, workerType = '' ) {
		// Support both calling conventions:
		// - getWorkerScript(workerType) - uses instance providerId
		// - getWorkerScript(providerId, workerType) - uses provided providerId
		if ( ! workerType && providerId ) {
			// First param is workerType, second is undefined
			workerType = providerId;
			providerId = null;
		}

		if ( ! workerType ) {
			debugWarn( 'Worker type is required to fetch script' );
			return '';
		}

		// Use provided providerId or fall back to instance providerId
		const targetProviderId = providerId || this.providerId;

		try {
			const response = await apiFetch( {
				path: `/aether/v1/providers/${ targetProviderId }/edge/worker-script/${ workerType }`,
				method: 'GET',
			} );

			// The REST endpoint returns the script as plain text (Content-Type: text/javascript)
			if ( typeof response === 'string' ) {
				return response;
			}

			debugWarn(
				'Failed to fetch worker script: unexpected response format'
			);
			return '';
		} catch ( error ) {
			debugError( 'Error fetching worker script:', error );
			return '';
		}
	}

	/**
	 * Get worker bindings configuration.
	 *
	 * @param {string} workerType Worker type.
	 * @param {Object} config     Provider configuration.
	 * @return {Object} Worker bindings.
	 */
	getWorkerBindings( workerType, config ) {
		if ( workerType === 'r2' ) {
			const bucketName = config.bucket_name || '';
			if ( ! bucketName ) {
				return {};
			}

			return {
				R2_BUCKET: {
					type: 'r2_bucket',
					bucket_name: bucketName, // Cloudflare API expects snake_case
				},
			};
		}

		return {};
	}

	/**
	 * Generate unique worker name.
	 *
	 * @param {string} workerType Worker type.
	 * @return {string} Generated worker name.
	 */
	generateWorkerName( workerType ) {
		const randomSuffix = Math.random().toString( 36 ).substring( 2, 10 );
		return `aether-${ workerType }-${ randomSuffix }`;
	}

	/**
	 * Get worker URL from worker name.
	 *
	 * @param {string} workerName Worker name.
	 * @return {string} Worker URL.
	 */
	getWorkerUrlFromName( workerName ) {
		return `https://${ workerName }.workers.dev`;
	}

	/**
	 * Extract worker name from URL.
	 *
	 * @param {string} workerUrl Worker URL.
	 * @return {string|null} Worker name or null.
	 */
	extractWorkerNameFromUrl( workerUrl ) {
		const match = workerUrl.match( /https?:\/\/([^.]+)\.workers\.dev/ );
		return match ? match[ 1 ] : null;
	}
}
