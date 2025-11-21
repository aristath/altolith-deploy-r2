/**
 * GitLab Pages Provider Registration
 *
 * Registers the GitLab Pages provider handlers via WordPress hooks.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * @package
 */

import { addFilter, doAction } from '@wordpress/hooks';
import { GitLabPagesProvider } from './GitLabPagesProvider';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

// Create provider instance for hook registration
const provider = new GitLabPagesProvider();

// Register provider in JavaScript registry
ProviderRegistry.register( provider.getId(), provider );

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', provider );

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
