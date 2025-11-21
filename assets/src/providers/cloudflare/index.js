/**
 * Cloudflare Workers Provider Registration
 *
 * Registers the Cloudflare Workers provider handlers via WordPress hooks.
 * Provider metadata is registered in JavaScript, not PHP.
 *
 * This provider handles edge function deployment only.
 * File uploads are handled by storage providers like cloudflare-r2.
 *
 * @package
 */

import { addFilter, doAction } from '@wordpress/hooks';
import { CloudflareWorkersProvider } from './CloudflareWorkersProvider';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

// Create provider instance for hook registration
const provider = new CloudflareWorkersProvider();

// Register provider in JavaScript registry
ProviderRegistry.register( provider.getId(), provider );

// Also trigger the hook for any listeners
doAction( 'aether.providers.register', provider );

/**
 * Register test connection handler hook.
 */
addFilter(
	'aether.provider.test',
	'aether/cloudflare',
	( handler, providerId, config ) => {
		// Handle 'cloudflare' or 'cloudflare:uuid' format
		if (
			providerId !== 'cloudflare' &&
			! providerId?.startsWith( 'cloudflare:' )
		) {
			return handler;
		}
		return async ( testConfig ) =>
			provider.testConnection( testConfig || config );
	},
	10
);
