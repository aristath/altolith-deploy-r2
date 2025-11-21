/**
 * GitLab Pages Provider Registration
 *
 * Registers the GitLab Pages provider handlers via WordPress hooks.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';
import { GitLabPagesProvider } from './GitLabPagesProvider';

const provider = new GitLabPagesProvider();

/**
 * Register test connection handler hook.
 */
addFilter(
	'aether.provider.test',
	'aether/gitlab-pages',
	( handler, providerId, config ) => {
		// Handle 'gitlab-pages' or 'gitlab-pages:uuid' format
		if (
			providerId !== 'gitlab-pages' &&
			! providerId?.startsWith( 'gitlab-pages:' )
		) {
			return handler;
		}
		return async ( testConfig ) =>
			provider.testConnection( testConfig || config );
	},
	10
);
