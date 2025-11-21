/**
 * Cloudflare Workers Provider
 *
 * JavaScript implementation of the Cloudflare Workers edge provider.
 * Provides edge function deployment and management capabilities.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { debug, debugWarn, debugError } from '../../utils/debug';
import apiFetch from '../../utils/api';
import {
	deployWorker,
	testTokenPermissions,
	deleteWorker as deleteWorkerAPI,
	listCustomDomains,
	attachCustomDomain,
	removeCustomDomain,
} from '../../utils/cloudflareWorkersApi';
import { AbstractProvider } from '@aether/base/providers/base/AbstractProvider';
import { DEPLOYMENT_TYPES } from '@aether/base/constants/deploymentTypes';

/**
 * CloudflareWorkersProvider class
 *
 * Provides Cloudflare Workers edge computing platform integration.
 */
export class CloudflareWorkersProvider extends AbstractProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'cloudflare';

	/**
	 * Get supported deployment types.
	 *
	 * Cloudflare Workers support edge functions only.
	 *
	 * @return {Array<string>} Supported deployment types
	 */
	getSupportedDeploymentTypes() {
		return [ DEPLOYMENT_TYPES.EDGE_FUNCTIONS ];
	}

	/**
	 * Worker script file paths
	 *
	 * @type {Object}
	 */
	workerScripts = {
		r2: 'assets/workers/CloudflareR2Worker.js',
		git: 'includes/Providers/GitHubPages/assets/worker/index-git.js',
		spaces: 'includes/Providers/DigitalOceanSpaces/assets/worker/index-spaces.js',
	};

	/**
	 * Deployment info cache
	 *
	 * @type {Object}
	 */
	deploymentInfo = {};

	/**
	 * Get the unique provider identifier.
	 *
	 * @return {string} Provider ID
	 */
	getId() {
		return this.registeredId || CloudflareWorkersProvider.ID;
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * @return {string} Provider name
	 */
	getName() {
		return __( 'Cloudflare Workers', 'aether' );
	}

	/**
	 * Get the provider type.
	 *
	 * @return {string} Provider type
	 */
	getType() {
		return 'edge-computing';
	}

	/**
	 * Get the provider description.
	 *
	 * @return {string} Provider description
	 */
	getDescription() {
		return __(
			'Deploy edge functions to 200+ global locations with Cloudflare Workers',
			'aether'
		);
	}

	/**
	 * Get the provider icon.
	 *
	 * @return {string} Provider icon
	 */
	getIcon() {
		return '⚡';
	}

	/**
	 * Get provider-specific configuration fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getProviderSpecificConfigFields() {
		return [
			{
				id: 'account_id',
				label: __( 'Account ID', 'aether' ),
				type: 'text',
				required: true,
				sensitive: false,
				validation: {
					pattern: /^[a-f0-9]{32}$/,
					message: __(
						'Account ID must be a 32-character hexadecimal string',
						'aether'
					),
				},
			},
			{
				id: 'api_token',
				label: __( 'API Token', 'aether' ),
				type: 'text',
				required: true,
				sensitive: true,
				validation: {
					minLength: 20,
					message: __(
						'API Token must be at least 20 characters',
						'aether'
					),
				},
			},
		];
	}

	/**
	 * Deploy worker to Cloudflare.
	 *
	 * @param {string}  workerType   Worker type (r2, git, spaces).
	 * @param {string}  script       Worker script content.
	 * @param {Object}  bindings     Optional worker bindings.
	 * @param {boolean} dryRun       Whether to perform dry run.
	 * @param {string}  customDomain Optional custom domain to attach.
	 * @return {Promise<Object>} Deployment result
	 */
	async deployWorker(
		workerType,
		script,
		bindings = {},
		dryRun = false,
		customDomain = null
	) {
		// Validate worker type
		if ( ! this.isValidWorkerType( workerType ) ) {
			return {
				success: false,
				error: `Invalid worker type: ${ workerType }`,
			};
		}

		// Validate credentials
		const validation = await this.validateCredentials();
		if ( ! validation.valid ) {
			return {
				success: false,
				error:
					validation.error || __( 'Invalid credentials', 'aether' ),
			};
		}

		// Test API token permissions
		if ( ! dryRun ) {
			const tokenTest = await this.testTokenPermissions();
			if ( ! tokenTest.success ) {
				return {
					success: false,
					error:
						tokenTest.error ||
						__( 'Token permission test failed', 'aether' ),
				};
			}
		}

		// Generate worker name
		const workerName = this.generateWorkerName( workerType );

		// Dry run mode
		if ( dryRun ) {
			const dryRunName = `${ workerName }-dry-run`;
			return {
				success: true,
				workerName: dryRunName,
				workerUrl: this.getWorkerUrlFromName( dryRunName ),
				workerType,
				message: __( 'Dry run successful', 'aether' ),
			};
		}

		try {
			const config = await this.getConfig();

			// Deploy to Cloudflare
			const result = await deployWorker(
				config.account_id,
				config.api_token,
				workerName,
				script,
				bindings
			);

			if ( ! result.success ) {
				return result;
			}

			// Save deployment info
			await this.saveDeploymentInfo( workerType, {
				worker_type: workerType,
				workerName,
				workerUrl: result.workerUrl,
				deployed_at: Date.now(),
			} );

			const response = {
				success: true,
				workerName,
				workerUrl: result.workerUrl,
				workerType,
				message: __( 'Worker deployed successfully', 'aether' ),
			};

			// Attach custom domain if provided
			if ( customDomain ) {
				// eslint-disable-next-line no-console
				debug(
					`[Aether] Attaching custom domain ${ customDomain } to worker ${ workerName }...`
				);

				const domainResult = await this.ensureCustomDomainAttached(
					workerName,
					customDomain
				);

				if ( domainResult.success ) {
					response.custom_domain = customDomain;
					response.domainAttached = true;
					response.message += ` (custom domain attached)`;
					// eslint-disable-next-line no-console
					debug( `[Aether] Custom domain attached successfully` );
				} else {
					response.domainAttached = false;
					response.domainError = domainResult.error;
					// eslint-disable-next-line no-console
					debugWarn(
						`[Aether] Failed to attach custom domain: ${ domainResult.error }`
					);
					// Don't fail the entire deployment just because domain attachment failed
				}
			}

			return response;
		} catch ( error ) {
			return {
				success: false,
				error:
					error.message || __( 'Worker deployment failed', 'aether' ),
			};
		}
	}

	/**
	 * Test connection to Cloudflare Workers API.
	 *
	 * Uses WordPress REST API endpoint to proxy the request server-side,
	 * avoiding CORS issues with direct browser requests to Cloudflare API.
	 *
	 * @return {Promise<Object>} Connection test result
	 */
	async testConnection() {
		// Validate credentials
		const validation = await this.validateCredentials();
		if ( ! validation.valid ) {
			return {
				success: false,
				error:
					validation.error || __( 'Invalid credentials', 'aether' ),
			};
		}

		try {
			// Get current config
			const config = await this.getConfig();

			// Use REST API endpoint to proxy request server-side (avoids CORS)
			const response = await apiFetch( {
				path: `/aether/v1/providers/${ this.getId() }/test`,
				method: 'POST',
				data: {
					config,
				},
			} );

			// Handle WP_Error responses (WordPress REST API error format)
			if ( response.code && response.message ) {
				return {
					success: false,
					error: response.message,
				};
			}

			// Handle successful response
			if ( response.success ) {
				return {
					success: true,
					message:
						response.message ||
						__( 'Connection successful', 'aether' ),
				};
			}

			// Handle error response
			return {
				success: false,
				error:
					response.error ||
					response.message ||
					__( 'Connection test failed', 'aether' ),
			};
		} catch ( error ) {
			// Handle network errors or other exceptions
			return {
				success: false,
				error:
					error?.message ||
					error?.data?.message ||
					error?.error ||
					__( 'Connection test failed', 'aether' ),
			};
		}
	}

	/**
	 * Delete worker from Cloudflare.
	 *
	 * @param {string}  workerName Worker name to delete.
	 * @param {boolean} dryRun     Whether to perform dry run.
	 * @return {Promise<Object>} Deletion result
	 */
	async deleteWorker( workerName, dryRun = false ) {
		// Validate credentials
		const validation = await this.validateCredentials();
		if ( ! validation.valid ) {
			return {
				success: false,
				error:
					validation.error || __( 'Invalid credentials', 'aether' ),
			};
		}

		// Dry run mode
		if ( dryRun ) {
			return {
				success: true,
				message: `Dry run: Would delete worker ${ workerName }`,
			};
		}

		try {
			const config = await this.getConfig();

			const result = await deleteWorkerAPI(
				config.account_id,
				config.api_token,
				workerName
			);

			return result;
		} catch ( error ) {
			return {
				success: false,
				error:
					error.message || __( 'Worker deletion failed', 'aether' ),
			};
		}
	}

	/**
	 * Get deployed worker URL.
	 *
	 * @param {string} workerType Worker type.
	 * @return {string} Worker URL or empty string
	 */
	getWorkerUrl( workerType ) {
		const deployments = this.getDeploymentInfo();

		if (
			deployments[ workerType ] &&
			deployments[ workerType ].workerUrl
		) {
			return deployments[ workerType ].workerUrl;
		}

		return '';
	}

	/**
	 * Generate unique worker name.
	 *
	 * @param {string} workerType Worker type.
	 * @return {string} Generated worker name
	 */
	generateWorkerName( workerType ) {
		const randomId = Math.random().toString( 36 ).substring( 2, 10 );
		return `aether-${ workerType }-${ randomId }`;
	}

	/**
	 * Get worker URL from worker name.
	 *
	 * @param {string} workerName Worker name.
	 * @return {string} Worker URL
	 */
	getWorkerUrlFromName( workerName ) {
		return `https://${ workerName }.workers.dev`;
	}

	/**
	 * Get supported operations.
	 *
	 * @return {Array<string>} Supported operations
	 */
	getSupportedOperations() {
		return [ 'upload', 'delete', 'copy', 'cors-proxy', 'images', 'stream' ];
	}

	/**
	 * Validate credentials format.
	 *
	 * @protected
	 * @return {Promise<Object>} Validation result
	 */
	async validateCredentials() {
		const config = await this.getConfig();

		if ( ! config.account_id ) {
			return {
				valid: false,
				error: __( 'Account ID is required', 'aether' ),
			};
		}

		if ( ! config.api_token ) {
			return {
				valid: false,
				error: __( 'API token is required', 'aether' ),
			};
		}

		return { valid: true };
	}

	/**
	 * Test API token permissions.
	 *
	 * @protected
	 * @return {Promise<Object>} Test result
	 */
	async testTokenPermissions() {
		const config = await this.getConfig();

		try {
			const result = await testTokenPermissions(
				config.account_id,
				config.api_token
			);

			return result;
		} catch ( error ) {
			return {
				success: false,
				error:
					error.message ||
					__( 'Token permission test failed', 'aether' ),
			};
		}
	}

	/**
	 * Check if worker type is valid.
	 *
	 * @protected
	 * @param {string} workerType Worker type.
	 * @return {boolean} True if valid
	 */
	isValidWorkerType( workerType ) {
		return [ 'r2', 'git', 'spaces' ].includes( workerType );
	}

	/**
	 * Get deployment info.
	 *
	 * @protected
	 * @return {Object} Deployment info
	 */
	getDeploymentInfo() {
		return this.deploymentInfo;
	}

	/**
	 * Save deployment information for a worker type.
	 * Stores deployment info in memory for the current session.
	 * Persistence to storage is not needed as this is session-only data.
	 *
	 * @param {string} workerType Worker type.
	 * @param {Object} info       Deployment information.
	 * @return {Promise<void>}
	 */
	async saveDeploymentInfo( workerType, info ) {
		this.deploymentInfo[ workerType ] = info;
	}

	/**
	 * Prepare worker environment variables.
	 *
	 * @param {string} workerType Worker type.
	 * @param {Object} config     Configuration.
	 * @return {Object} Environment variables
	 */
	prepareWorkerEnvironment( workerType, config ) {
		const env = {};

		if ( workerType === 'r2' ) {
			if ( config.bucket_name ) {
				env.R2_BUCKET = config.bucket_name;
			}
			if ( config.account_id ) {
				env.CF_ACCOUNT_ID = config.account_id;
			}
		}

		if ( workerType === 'media' ) {
			if ( config.bucket_name ) {
				env.R2_BUCKET = config.bucket_name;
			}
			if ( config.images_account_hash ) {
				env.CF_IMAGES_ACCOUNT_HASH = config.images_account_hash;
			}
			if ( config.images_api_token ) {
				env.CF_IMAGES_TOKEN = config.images_api_token;
			}
		}

		if ( workerType === 'spaces' ) {
			if ( config.bucket_name ) {
				env.SPACES_BUCKET = config.bucket_name;
			}
			if ( config.region ) {
				env.SPACES_REGION = config.region;
			}
		}

		return env;
	}

	/**
	 * Get Cloudflare zone ID for a hostname.
	 *
	 * @param {string} hostname Hostname (e.g., "s12y.org" or "https://s12y.org").
	 * @return {Promise<string|null>} Zone ID or null if not found.
	 */
	async getZoneIdForHostname( hostname ) {
		// Clean hostname (remove protocol and paths)
		const cleanHostname = hostname
			.replace( /^https?:\/\//, '' )
			.replace( /\/.*$/, '' );

		try {
			const config = await this.getConfig();
			const url = `https://api.cloudflare.com/client/v4/zones?name=${ encodeURIComponent(
				cleanHostname
			) }`;

			const response = await fetch( url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${ config.api_token }`,
					'Content-Type': 'application/json',
				},
			} );

			if ( ! response.ok ) {
				// eslint-disable-next-line no-console
				debugError(
					`[Aether] Failed to get zone ID for ${ cleanHostname }: HTTP ${ response.status }`
				);
				return null;
			}

			const data = await response.json();
			if ( data.result && data.result.length > 0 ) {
				return data.result[ 0 ].id;
			}

			// eslint-disable-next-line no-console
			debugWarn(
				`[Aether] Zone not found for hostname: ${ cleanHostname }`
			);
			return null;
		} catch ( error ) {
			// eslint-disable-next-line no-console
			debugError( 'Error getting zone ID:', error.message );
			return null;
		}
	}

	/**
	 * Ensure custom domain is attached to worker with conflict resolution.
	 * If the domain is already attached to another worker, removes it first.
	 *
	 * @param {string} workerName Worker name to attach domain to.
	 * @param {string} hostname   Domain hostname to attach.
	 * @return {Promise<Object>} Result with success and optional error/message.
	 */
	async ensureCustomDomainAttached( workerName, hostname ) {
		try {
			const config = await this.getConfig();

			// Get zone ID for the hostname
			const zoneId = await this.getZoneIdForHostname( hostname );
			if ( ! zoneId ) {
				return {
					success: false,
					error: __(
						'Zone not found for hostname. Ensure the domain is added to your Cloudflare account.',
						'aether'
					),
				};
			}

			// Try to attach the domain
			const attachResult = await attachCustomDomain(
				config.account_id,
				config.api_token,
				workerName,
				hostname,
				zoneId
			);

			// If successful, we're done
			if ( attachResult.success ) {
				// eslint-disable-next-line no-console
				debug(
					`[Aether] Custom domain ${ hostname } attached to worker ${ workerName }`
				);
				return {
					success: true,
					message: `Custom domain attached successfully`,
				};
			}

			// If failed, check if it's a conflict (domain already attached)
			// Common error codes: 409 (conflict) or error messages containing "already"
			const isConflict =
				attachResult.statusCode === 409 ||
				( attachResult.error &&
					attachResult.error.toLowerCase().includes( 'already' ) );

			if ( ! isConflict ) {
				// Different error, return it
				return attachResult;
			}

			// Domain is already attached to another worker, try to resolve conflict
			// eslint-disable-next-line no-console
			debug(
				`[Aether] Domain ${ hostname } is already attached, attempting to resolve conflict...`
			);

			// List all custom domains
			const listResult = await listCustomDomains(
				config.account_id,
				config.api_token
			);

			if ( ! listResult.success ) {
				return {
					success: false,
					error: `Failed to list custom domains: ${ listResult.error }`,
				};
			}

			// Find the domain we want to attach
			const cleanHostname = hostname
				.replace( /^https?:\/\//, '' )
				.replace( /\/.*$/, '' );

			const existingDomain = listResult.domains.find(
				( domain ) => domain.hostname === cleanHostname
			);

			if ( ! existingDomain ) {
				return {
					success: false,
					error: __(
						'Domain conflict detected but could not find existing assignment',
						'aether'
					),
				};
			}

			// eslint-disable-next-line no-console
			debug(
				`[Aether] Removing domain from old worker: ${ existingDomain.service }`
			);

			// Remove the domain from the old worker
			const removeResult = await removeCustomDomain(
				config.account_id,
				config.api_token,
				existingDomain.id
			);

			if ( ! removeResult.success ) {
				return {
					success: false,
					error: `Failed to remove old domain assignment: ${ removeResult.error }`,
				};
			}

			// eslint-disable-next-line no-console
			debug(
				`[Aether] Domain removed from old worker, retrying attachment...`
			);

			// Retry attaching to new worker
			const retryResult = await attachCustomDomain(
				config.account_id,
				config.api_token,
				workerName,
				hostname,
				zoneId
			);

			if ( retryResult.success ) {
				// eslint-disable-next-line no-console
				debug(
					`[Aether] Custom domain ${ hostname } successfully attached to worker ${ workerName } after conflict resolution`
				);
				return {
					success: true,
					message: `Custom domain attached successfully (replaced old assignment)`,
				};
			}

			return retryResult;
		} catch ( error ) {
			// eslint-disable-next-line no-console
			debugError(
				'[Aether] Error ensuring custom domain:',
				error.message
			);
			return {
				success: false,
				error:
					error.message ||
					__( 'Failed to attach custom domain', 'aether' ),
			};
		}
	}
}

export default CloudflareWorkersProvider;
