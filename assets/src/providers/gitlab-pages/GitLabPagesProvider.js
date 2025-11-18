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
import { CAP_STATIC_SITE } from '../base/AbstractProvider';
import { ConfigFieldBuilder } from '../utils/configFieldBuilder';

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
	 * Provider capabilities.
	 *
	 * GitLab Pages is a static site provider, not a storage provider.
	 * While it inherits Git storage functionality from GitLabProvider,
	 * it should only appear in the static site providers dropdown.
	 *
	 * @type {Array<string>}
	 */
	capabilities = [ CAP_STATIC_SITE ];

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
	 * Get configuration fields for this provider.
	 *
	 * Includes all fields from GitLabProvider plus Pages-specific fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getConfigFields() {
		// Get base fields from GitLabProvider (already built)
		const baseFields = super.getConfigFields();

		// Add Pages-specific fields
		const pagesFields = ConfigFieldBuilder.buildAll( [
			ConfigFieldBuilder.checkbox( 'pages_enabled' )
				.label( __( 'Enable GitLab Pages', 'aether' ) )
				.description(
					__(
						'Enable static site hosting via GitLab Pages',
						'aether'
					)
				)
				.default( true ),

			ConfigFieldBuilder.url( 'pages_url' )
				.label( __( 'GitLab Pages URL (Optional)', 'aether' ) )
				.description(
					__(
						'Auto-detected if namespace provided (e.g., https://namespace.gitlab.io/project)',
						'aether'
					)
				),

			ConfigFieldBuilder.url( 'custom_domain' )
				.label( __( 'Custom Domain (Optional)', 'aether' ) )
				.description(
					__(
						'Custom domain for GitLab Pages (e.g., https://www.example.com)',
						'aether'
					)
				),
		] );

		// Combine base fields and Pages-specific fields
		return [ ...baseFields, ...pagesFields ];
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
