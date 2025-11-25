/**
 * GitLab Provider
 *
 * Static metadata class for the GitLab provider.
 * All logic is handled via hooks in index.js.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

/**
 * GitLabProvider class
 *
 * Provides Git-based file storage using GitLab repositories.
 * This is a static metadata class - all operational logic is in index.js.
 */
export class GitLabProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'gitlab';

	/**
	 * Provider name.
	 *
	 * @type {string}
	 */
	static NAME = __(
		'GitLab (Experimental)',
		'aether-site-exporter-providers'
	);

	/**
	 * Provider type.
	 *
	 * @type {string}
	 */
	static TYPE = 'git-hosting';

	/**
	 * Provider description.
	 *
	 * @type {string}
	 */
	static DESCRIPTION = __(
		'Git-based file storage using GitLab repositories. Uses GitLab API for browser-based deployment.',
		'aether-site-exporter-providers'
	);

	/**
	 * Provider icon.
	 *
	 * @type {string}
	 */
	static ICON = '🦊';

	/**
	 * Deployment type this provider supports.
	 *
	 * @type {string}
	 */
	static DEPLOYMENT_TYPE = 'blueprint_bundle';

	/**
	 * Configuration fields.
	 *
	 * @type {Array<Object>}
	 */
	static CONFIG_FIELDS = [
		{
			id: 'personal_access_token',
			label: __(
				'Personal Access Token',
				'aether-site-exporter-providers'
			),
			type: 'text',
			required: true,
			sensitive: true,
			help: __(
				'GitLab Personal Access Token with api and write_repository scopes',
				'aether-site-exporter-providers'
			),
		},
		{
			id: 'project_id',
			label: __( 'Project ID', 'aether-site-exporter-providers' ),
			type: 'text',
			required: false,
			sensitive: false,
			validation: {
				pattern: '^\\d+$',
				message: __(
					'Project ID must be a numeric value',
					'aether-site-exporter-providers'
				),
			},
			help: __(
				'GitLab project ID. Either project_id or namespace+project_path is required.',
				'aether-site-exporter-providers'
			),
		},
		{
			id: 'namespace',
			label: __( 'Namespace', 'aether-site-exporter-providers' ),
			type: 'text',
			required: false,
			sensitive: false,
			help: __(
				'GitLab namespace (username or group) for the repository',
				'aether-site-exporter-providers'
			),
		},
		{
			id: 'project_path',
			label: __( 'Project Path', 'aether-site-exporter-providers' ),
			type: 'text',
			required: false,
			sensitive: false,
			help: __(
				'Repository name/path within the namespace. Either project_id or namespace+project_path is required.',
				'aether-site-exporter-providers'
			),
		},
		{
			id: 'branch',
			label: __( 'Branch', 'aether-site-exporter-providers' ),
			type: 'text',
			required: false,
			sensitive: false,
			default: 'main',
			help: __(
				'Git branch to push to',
				'aether-site-exporter-providers'
			),
		},
	];
}

export default GitLabProvider;
