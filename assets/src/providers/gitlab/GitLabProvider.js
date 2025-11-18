/**
 * GitLab Provider
 *
 * JavaScript implementation of the GitLab provider.
 * Provides Git-based storage using GitLab repositories.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { AbstractGitProvider, CAP_STORAGE } from '../git/AbstractGitProvider';
import { ConfigFieldBuilder } from '../utils/configFieldBuilder';
import { debugWarn } from '../../utils/debug';

/**
 * GitLabProvider class
 *
 * Provides Git-based file storage using GitLab repositories.
 * Uses GitLab API and isomorphic-git for browser-based deployment.
 */
export class GitLabProvider extends AbstractGitProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'gitlab';

	/**
	 * Provider capabilities.
	 *
	 * @type {Array<string>}
	 */
	capabilities = [ CAP_STORAGE ];

	/**
	 * Get the unique provider identifier.
	 *
	 * @return {string} Provider ID
	 */
	getId() {
		return this.registeredId || GitLabProvider.ID;
	}

	/**
	 * Get the base provider name without experimental suffix.
	 *
	 * @return {string} Base provider name
	 */
	getBaseName() {
		return __( 'GitLab', 'aether' );
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
	 * Get the provider description.
	 *
	 * @return {string} Provider description
	 */
	getDescription() {
		return __(
			'Git-based file storage using GitLab repositories. Uses GitLab API and isomorphic-git for browser-based deployment.',
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
	 * Includes common Git fields from AbstractGitProvider plus GitLab-specific fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getConfigFields() {
		// Get base Git fields from AbstractGitProvider (already built)
		const baseFields = super.getConfigFields();

		// Add GitLab-specific fields
		const gitlabFields = ConfigFieldBuilder.buildAll( [
			ConfigFieldBuilder.text( 'project_id' )
				.label( __( 'Project ID', 'aether' ) )
				.description( __( 'GitLab project ID (numeric)', 'aether' ) )
				.required()
				.pattern(
					'^\\d+$',
					__( 'Project ID must be numeric', 'aether' )
				),

			ConfigFieldBuilder.text( 'namespace' )
				.label( __( 'Namespace (Optional)', 'aether' ) )
				.description(
					__(
						'GitLab namespace (username or group) for repository URL',
						'aether'
					)
				),

			ConfigFieldBuilder.text( 'project_path' )
				.label( __( 'Project Path (Optional)', 'aether' ) )
				.description(
					__( 'Project path for repository URL', 'aether' )
				),
		] );

		// Combine base fields and GitLab-specific fields
		return [ ...baseFields, ...gitlabFields ];
	}

	/**
	 * Get the API base URL for GitLab.
	 *
	 * @return {string} API base URL
	 */
	getApiBaseUrl() {
		return 'https://gitlab.com/api/v4';
	}

	/**
	 * Get the Git repository URL.
	 *
	 * Constructs GitLab repository URL from namespace and projectPath, or uses projectId.
	 *
	 * @return {Promise<string>} Full Git repository URL
	 */
	async getGitRepositoryUrl() {
		const config = await this.getConfig();

		// If namespace and project_path are provided, use them
		if ( config.namespace && config.project_path ) {
			return `https://gitlab.com/${ config.namespace }/${ config.project_path }.git`;
		}

		// If only project_id is provided, fetch project info from GitLab API
		if ( config.project_id ) {
			// If we have namespace, try to use it with project_id
			if ( config.namespace ) {
				// Try to fetch project info to get the full path
				try {
					const apiUrl = this.getApiBaseUrl();
					const projectInfo = await fetch(
						`${ apiUrl }/projects/${ config.project_id }`,
						{
							headers: {
								Authorization: `Bearer ${ config.personal_access_token }`,
							},
						}
					);

					if ( projectInfo.ok ) {
						const project = await projectInfo.json();
						if ( project.path_with_namespace ) {
							return `https://gitlab.com/${ project.path_with_namespace }.git`;
						}
					}
				} catch ( error ) {
					debugWarn(
						'Failed to fetch project info from GitLab API:',
						error
					);
				}

				// Fallback: use namespace with project_id (may not work for all cases)
				return `https://gitlab.com/${ config.namespace }/${ config.project_id }.git`;
			}

			// If no namespace, fetch project info to get full path
			if ( config.personal_access_token ) {
				try {
					const apiUrl = this.getApiBaseUrl();
					const projectInfo = await fetch(
						`${ apiUrl }/projects/${ config.project_id }`,
						{
							headers: {
								Authorization: `Bearer ${ config.personal_access_token }`,
							},
						}
					);

					if ( projectInfo.ok ) {
						const project = await projectInfo.json();
						if ( project.path_with_namespace ) {
							return `https://gitlab.com/${ project.path_with_namespace }.git`;
						}
						if ( project.web_url ) {
							// Extract namespace and path from web_url
							const urlMatch = project.web_url.match(
								/https?:\/\/[^\/]+\/(.+)/
							);
							if ( urlMatch ) {
								return `https://gitlab.com/${ urlMatch[ 1 ] }.git`;
							}
						}
					}
				} catch ( error ) {
					debugWarn(
						'Failed to fetch project info from GitLab API:',
						error
					);
				}
			}

			// Last fallback: return URL with project_id (may not work for all GitLab instances)
			return `https://gitlab.com/projects/${ config.project_id }.git`;
		}

		throw new Error(
			__(
				'GitLab repository URL cannot be constructed. Please provide namespace and project_path, or project_id with personal_access_token.',
				'aether'
			)
		);
	}

	/**
	 * Test connection to GitLab API.
	 *
	 * @return {Promise<Object>} Connection test result
	 */
	async testConnection() {
		const config = await this.getConfig();

		if ( ! config.personal_access_token ) {
			return {
				success: false,
				error: __( 'Personal access token is required', 'aether' ),
			};
		}

		try {
			const apiUrl = this.getApiBaseUrl();
			const response = await fetch( `${ apiUrl }/user`, {
				headers: {
					Authorization: `Bearer ${ config.personal_access_token }`,
				},
			} );

			if ( ! response.ok ) {
				return {
					success: false,
					error: sprintf(
						/* translators: %d: HTTP status code */
						__( 'GitLab API returned status %d', 'aether' ),
						response.status
					),
				};
			}

			const userData = await response.json();

			// If project_id is provided, verify project access
			if ( config.project_id ) {
				const projectResponse = await fetch(
					`${ apiUrl }/projects/${ config.project_id }`,
					{
						headers: {
							Authorization: `Bearer ${ config.personal_access_token }`,
						},
					}
				);

				if ( ! projectResponse.ok ) {
					return {
						success: false,
						error: __(
							'Cannot access GitLab project. Please verify project ID and token permissions.',
							'aether'
						),
					};
				}
			}

			return {
				success: true,
				message: sprintf(
					/* translators: %s: GitLab username */
					__( 'Successfully connected to GitLab as %s', 'aether' ),
					userData.username || userData.name
				),
			};
		} catch ( error ) {
			return {
				success: false,
				error:
					error.message ||
					__( 'Failed to connect to GitLab API', 'aether' ),
			};
		}
	}
}

export default GitLabProvider;
