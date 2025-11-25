/**
 * GitLab Pages Provider
 *
 * Static metadata class for the GitLab Pages provider.
 * All logic is handled via hooks in index.js.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

/**
 * GitLabPagesProvider class
 *
 * Provides GitLab Pages static site hosting.
 * This is a static metadata class - all operational logic is in index.js.
 */
export class GitLabPagesProvider {
	/**
	 * Provider ID constant.
	 *
	 * @type {string}
	 */
	static ID = 'gitlab-pages';

	/**
	 * Provider name.
	 *
	 * @type {string}
	 */
	static NAME = __(
		'GitLab Pages (Experimental)',
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
		'GitLab Pages static site hosting with automatic CI/CD pipelines. Uses GitLab API for browser-based deployment.',
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
	static DEPLOYMENT_TYPE = 'static_site';

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
			required: true,
			sensitive: false,
			validation: {
				pattern: '^\\d+$',
				message: __(
					'Project ID must be a numeric value',
					'aether-site-exporter-providers'
				),
			},
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
				'Repository name/path within the namespace',
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
		{
			id: 'pages_url',
			label: __( 'Pages URL', 'aether-site-exporter-providers' ),
			type: 'url',
			required: false,
			sensitive: false,
			help: __(
				'Custom GitLab Pages URL',
				'aether-site-exporter-providers'
			),
		},
		{
			id: 'custom_domain',
			label: __( 'Custom Domain', 'aether-site-exporter-providers' ),
			type: 'url',
			required: false,
			sensitive: false,
			isAdvanced: true,
		},
	];
}

export default GitLabPagesProvider;
