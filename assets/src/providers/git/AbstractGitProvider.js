/**
 * Abstract Git Provider Base Class
 *
 * Base class for all Git-based providers (GitHub, GitLab, Bitbucket, etc.).
 * Provides common Git operations and functionality shared by all Git providers.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { AbstractProvider, CAP_STORAGE } from '../base/AbstractProvider';
import { ConfigFieldBuilder } from '../utils/configFieldBuilder';
import { getRestUrl } from '../../utils/getRestUrl';

/**
 * AbstractGitProvider class
 *
 * Abstract base class for Git-based storage providers.
 * Subclasses must implement provider-specific methods.
 */
export class AbstractGitProvider extends AbstractProvider {
	/**
	 * Provider capabilities.
	 *
	 * @type {Array<string>}
	 */
	capabilities = [ CAP_STORAGE ];

	/**
	 * Whether this provider is experimental.
	 *
	 * Git-based providers are currently experimental.
	 *
	 * @type {boolean}
	 */
	experimental = true;

	/**
	 * Get the human-readable provider name.
	 *
	 * Appends "(Experimental)" suffix if provider is experimental.
	 *
	 * @return {string} Provider name with experimental suffix if applicable
	 */
	getName() {
		const baseName = this.getBaseName();
		if ( this.experimental ) {
			return sprintf(
				/* translators: %s: Provider name */
				__( '%s (Experimental)', 'aether' ),
				baseName
			);
		}
		return baseName;
	}

	/**
	 * Get the base provider name without experimental suffix.
	 *
	 * Must be implemented by subclasses.
	 *
	 * @abstract
	 * @return {string} Base provider name
	 */
	getBaseName() {
		throw new Error(
			'AbstractGitProvider.getBaseName() must be implemented by subclass'
		);
	}

	/**
	 * Get the provider type.
	 *
	 * @return {string} Provider type
	 */
	getType() {
		return 'git-hosting';
	}

	/**
	 * Get configuration fields for this provider.
	 *
	 * Defines common Git fields shared by all Git providers.
	 * Subclasses should override and call super.getConfigFields() to add provider-specific fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getConfigFields() {
		return ConfigFieldBuilder.buildAll( [
			ConfigFieldBuilder.password( 'personal_access_token' )
				.label( __( 'Personal Access Token', 'aether' ) )
				.description(
					__(
						'Personal access token with repository write permissions',
						'aether'
					)
				)
				.required()
				.sensitive()
				.min( 20 )
				.max( 255 ),

			ConfigFieldBuilder.text( 'branch' )
				.label( __( 'Branch', 'aether' ) )
				.description(
					__( 'Git branch name (default: main)', 'aether' )
				)
				.default( 'main' ),

			ConfigFieldBuilder.url( 'git_worker_url' )
				.label( __( 'Git Worker URL (Optional)', 'aether' ) )
				.description(
					__(
						'CORS proxy worker for browser-based Git operations (for WordPress Playground)',
						'aether'
					)
				),
		] );
	}

	/**
	 * Normalize Git URL to ensure it ends with .git
	 *
	 * @param {string} url Git repository URL.
	 * @return {string} Normalized Git URL
	 */
	normalizeGitUrl( url ) {
		if ( ! url ) {
			return '';
		}
		return url.endsWith( '.git' ) ? url : url + '.git';
	}

	/**
	 * Get Git CORS proxy URL from settings.
	 *
	 * @return {Promise<string|null>} Proxy URL or null if not available
	 */
	async getGitProxyUrl() {
		const config = await this.getConfig();
		if ( config.git_worker_url ) {
			return config.git_worker_url;
		}

		// Try to get worker endpoint from storage provider settings
		try {
			const restUrl = getRestUrl();
			const nonceMeta = document.querySelector(
				'meta[name="aether-rest-nonce"]'
			);
			const nonce = nonceMeta ? nonceMeta.getAttribute( 'content' ) : '';

			const settingsResponse = await fetch( `${ restUrl }settings`, {
				headers: {
					'X-WP-Nonce': nonce,
				},
			} );

			if ( settingsResponse.ok ) {
				const settings = await settingsResponse.json();
				const workerEndpoint =
					settings?.providers?.[ settings?.provider_types?.storage ]
						?.worker_endpoint;
				if ( workerEndpoint ) {
					return workerEndpoint;
				}
			}
		} catch ( error ) {
			// Worker endpoint not available, return null
		}

		return null;
	}

	/**
	 * Get Git authentication object for isomorphic-git.
	 *
	 * @return {Promise<Object>} Auth object with username and password
	 */
	async getGitAuth() {
		const config = await this.getConfig();
		return {
			username: config.personal_access_token || '',
			password: '',
		};
	}

	/**
	 * Get the Git repository URL.
	 *
	 * Must be implemented by subclasses to construct provider-specific Git URL.
	 *
	 * @abstract
	 * @return {Promise<string>} Full Git repository URL
	 */
	async getGitRepositoryUrl() {
		throw new Error(
			'AbstractGitProvider.getGitRepositoryUrl() must be implemented by subclass'
		);
	}

	/**
	 * Get the API base URL for this provider.
	 *
	 * Must be implemented by subclasses to return provider-specific API base URL.
	 *
	 * @abstract
	 * @return {string} API base URL
	 */
	getApiBaseUrl() {
		throw new Error(
			'AbstractGitProvider.getApiBaseUrl() must be implemented by subclass'
		);
	}

	/**
	 * Test connection to provider API.
	 *
	 * Must be implemented by subclasses to test provider-specific API connection.
	 *
	 * @abstract
	 * @return {Promise<Object>} Connection test result
	 */
	async testConnection() {
		throw new Error(
			'AbstractGitProvider.testConnection() must be implemented by subclass'
		);
	}

	/**
	 * Get Git configuration for browser-side uploads.
	 *
	 * Returns configuration object compatible with useGitUpload hook.
	 *
	 * @return {Promise<Object>} Git configuration object
	 */
	async getGitConfig() {
		const config = await this.getConfig();
		const gitUrl = await this.getGitRepositoryUrl();

		return {
			config: {
				gitUrl: this.normalizeGitUrl( gitUrl ),
				branch: config.branch || 'main',
				personalAccessToken: config.personal_access_token || '',
			},
		};
	}

	/**
	 * Get the upload strategy for Git-based providers.
	 *
	 * All Git providers use 'git' upload strategy.
	 *
	 * @return {string} Upload strategy: 'git'
	 */
	getUploadStrategy() {
		return 'git';
	}
}

export { CAP_STORAGE };
export default AbstractGitProvider;
