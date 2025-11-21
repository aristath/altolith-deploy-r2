/**
 * GitLab Provider Registration
 *
 * Registers the GitLab provider handlers via WordPress hooks.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * @package
 */

import { addFilter, doAction } from '@wordpress/hooks';
import { GitLabProvider } from './GitLabProvider';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

// Create provider instance for hook registration
const provider = new GitLabProvider();

// Register provider in JavaScript registry
ProviderRegistry.register( provider.getId(), provider );

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', provider );

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
