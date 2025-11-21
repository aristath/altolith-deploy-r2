/**
 * GitLab Pages Provider
 *
 * JavaScript implementation of the GitLab Pages provider.
 * Provides GitLab Pages static site hosting.
 * Extends GitLabProvider to inherit Git-based storage functionality.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { GitLabProvider } from '../gitlab/GitLabProvider';
import { DEPLOYMENT_TYPES } from '@aether/base/constants/deploymentTypes';

/**
 * GitLabPagesProvider class
 *
 * Provides GitLab Pages static site hosting.
 * Extends GitLabProvider to inherit Git-based storage functionality.
 * Uses GitLab API and isomorphic-git for browser-based deployment.
 */
export class GitLabPagesProvider extends GitLabProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'gitlab-pages';

	/**
	 * Get supported deployment types.
	 *
	 * GitLab Pages supports static sites only (not blueprint bundles).
	 * Overrides parent GitLabProvider which supports both.
	 *
	 * @return {Array<string>} Supported deployment types
	 */
	getSupportedDeploymentTypes() {
		return [ DEPLOYMENT_TYPES.STATIC_SITE ];
	}

	/**
	 * Get the unique provider identifier.
	 *
	 * @return {string} Provider ID
	 */
	getId() {
		return this.registeredId || GitLabPagesProvider.ID;
	}

	/**
	 * Get the base provider name without experimental suffix.
	 *
	 * @return {string} Base provider name
	 */
	getBaseName() {
		return __( 'GitLab Pages', 'aether' );
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * @return {string} Provider name
	 */
	getName() {
		return super.getName();
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
	 * Get the provider description.
	 *
	 * @return {string} Provider description
	 */
	getDescription() {
		return __(
			'GitLab Pages static site hosting with automatic CI/CD pipelines. Uses GitLab API and isomorphic-git for browser-based deployment.',
			'aether'
		);
	}

	/**
	 * Get the provider icon.
	 *
	 * @return {string} Provider icon
	 */
	getIcon() {
		return '🦊';
	}

	/**
	 * Get provider-specific configuration fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getProviderSpecificConfigFields() {
		return [
			{
				id: 'personal_access_token',
				label: __( 'Personal Access Token', 'aether' ),
				type: 'text',
				required: true,
				sensitive: true,
				help: __(
					'GitLab Personal Access Token with api and write_repository scopes',
					'aether'
				),
			},
			{
				id: 'project_id',
				label: __( 'Project ID', 'aether' ),
				type: 'text',
				required: true,
				sensitive: false,
				validation: {
					pattern: '^\\d+$',
					message: __(
						'Project ID must be a numeric value',
						'aether'
					),
				},
			},
			{
				id: 'namespace',
				label: __( 'Namespace', 'aether' ),
				type: 'text',
				required: false,
				sensitive: false,
				help: __(
					'GitLab namespace (username or group) for the repository',
					'aether'
				),
			},
			{
				id: 'project_path',
				label: __( 'Project Path', 'aether' ),
				type: 'text',
				required: false,
				sensitive: false,
				help: __(
					'Repository name/path within the namespace',
					'aether'
				),
			},
			{
				id: 'branch',
				label: __( 'Branch', 'aether' ),
				type: 'text',
				required: false,
				sensitive: false,
				default: 'main',
				help: __( 'Git branch to push to', 'aether' ),
			},
			{
				id: 'pages_enabled',
				label: __( 'GitLab Pages Enabled', 'aether' ),
				type: 'checkbox',
				required: false,
				sensitive: false,
				default: true,
			},
			{
				id: 'pages_url',
				label: __( 'Pages URL', 'aether' ),
				type: 'url',
				required: false,
				sensitive: false,
				help: __( 'Custom GitLab Pages URL', 'aether' ),
			},
			{
				id: 'custom_domain',
				label: __( 'Custom Domain', 'aether' ),
				type: 'url',
				required: false,
				sensitive: false,
			},
			{
				id: 'git_worker_url',
				label: __( 'Git Worker URL', 'aether' ),
				type: 'url',
				required: false,
				sensitive: false,
				isAdvanced: true,
			},
		];
	}

	/**
	 * Deploy to GitLab Pages.
	 *
	 * @return {Promise<Object>} Deployment result
	 */
	async deploy() {
		const configured = await this.isConfigured();
		if ( ! configured ) {
			return {
				success: false,
				message: __(
					'Cannot deploy: provider is not configured.',
					'aether'
				),
			};
		}

		return {
			success: true,
			message: __(
				'GitLab Pages deployment is automatic when files are pushed to the repository.',
				'aether'
			),
		};
	}

	/**
	 * Get provider status.
	 *
	 * @return {Promise<Object>} Status object
	 */
	async getStatus() {
		const status = await super.getStatus();

		const config = await this.getConfig();
		status.pages_enabled = Boolean( config.pages_enabled );
		status.hasCustomDomain = Boolean( config.custom_domain );
		status.supportsBrowserGit = Boolean( config.git_worker_url );

		return status;
	}
}

export default GitLabPagesProvider;
