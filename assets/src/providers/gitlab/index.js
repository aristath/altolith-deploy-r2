/**
 * GitLab Provider Registration
 *
 * Registers the GitLab provider handlers via WordPress hooks.
 * Provider metadata and settings are registered via PHP.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';
import { GitLabProvider } from './GitLabProvider';

const provider = new GitLabProvider();

/**
 * Register test connection handler hook.
 */
addFilter(
	'aether.provider.test',
	'aether/gitlab',
	( handler, providerId, config ) => {
		// Handle 'gitlab' or 'gitlab:uuid' format
		if (
			providerId !== 'gitlab' &&
			! providerId?.startsWith( 'gitlab:' )
		) {
			return handler;
		}
		return async ( testConfig ) =>
			provider.testConnection( testConfig || config );
	},
	10
);
