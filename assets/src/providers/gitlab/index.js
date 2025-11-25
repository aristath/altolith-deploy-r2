/**
 * GitLab Provider Registration
 *
 * Registers the GitLab provider handlers via WordPress hooks.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { addFilter, doAction } from '@wordpress/hooks';
import { GitLabProvider } from './GitLabProvider';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
import apiFetch from '../../utils/api';

/**
 * Load provider configuration from REST API.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<Object>} Provider configuration or empty object.
 */
async function loadProviderConfig( providerId ) {
	try {
		const response = await apiFetch( {
			path: `/aether/site-exporter/providers/${ providerId }/config`,
			method: 'GET',
		} );
		return response.config || {};
	} catch ( error ) {
		if (
			error.code === 'restProviderNotConfigured' ||
			error.status === 404
		) {
			return {};
		}
		throw error;
	}
}

// Register provider class in JavaScript registry
ProviderRegistry.register( GitLabProvider.ID, GitLabProvider );

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', GitLabProvider );

/**
 * GitLab API base URL.
 */
const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

/**
 * Test connection to GitLab API.
 *
 * @param {string} providerId Provider instance ID.
 * @return {Promise<Object>} Connection test result.
 */
async function testConnection( providerId ) {
	const config = await loadProviderConfig( providerId );

	if ( ! config.personal_access_token ) {
		return {
			success: false,
			error: __(
				'Personal access token is required',
				'aether-site-exporter-providers'
			),
		};
	}

	try {
		const response = await fetch( `${ GITLAB_API_BASE }/user`, {
			headers: {
				Authorization: `Bearer ${ config.personal_access_token }`,
			},
		} );

		if ( ! response.ok ) {
			return {
				success: false,
				error: sprintf(
					/* translators: %d: HTTP status code */
					__(
						'GitLab API returned status %d',
						'aether-site-exporter-providers'
					),
					response.status
				),
			};
		}

		const userData = await response.json();

		// If project_id is provided, verify project access
		if ( config.project_id ) {
			const projectResponse = await fetch(
				`${ GITLAB_API_BASE }/projects/${ config.project_id }`,
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
						'aether-site-exporter-providers'
					),
				};
			}
		}

		return {
			success: true,
			message: sprintf(
				/* translators: %s: GitLab username */
				__(
					'Successfully connected to GitLab as %s',
					'aether-site-exporter-providers'
				),
				userData.username || userData.name
			),
		};
	} catch ( error ) {
		return {
			success: false,
			error:
				error.message ||
				__(
					'Failed to connect to GitLab API',
					'aether-site-exporter-providers'
				),
		};
	}
}

/**
 * Register test connection handler hook.
 */
addFilter(
	'aether.provider.test',
	'aether/gitlab',
	( handler, providerId ) => {
		// Handle 'gitlab' or 'gitlab:uuid' format
		if ( ! providerId?.startsWith( 'gitlab' ) ) {
			return handler;
		}
		// Exclude gitlab-pages
		if ( providerId.startsWith( 'gitlab-pages' ) ) {
			return handler;
		}
		return async () => testConnection( providerId );
	},
	10
);

/**
 * Register upload strategy filter.
 */
addFilter(
	'aether.provider.upload_strategy',
	'aether/gitlab',
	( strategy, providerId ) => {
		if (
			providerId?.startsWith( 'gitlab' ) &&
			! providerId.startsWith( 'gitlab-pages' )
		) {
			return 'git';
		}
		return strategy;
	},
	10
);
