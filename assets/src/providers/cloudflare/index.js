/**
 * Cloudflare Workers Provider Registration
 *
 * Registers the Cloudflare Workers provider handlers via WordPress hooks.
 * Provider metadata and settings are registered via PHP.
 *
 * This provider handles edge function deployment only.
 * File uploads are handled by storage providers like cloudflare-r2.
 *
 * @package
 */

import { addFilter } from '@wordpress/hooks';
import { CloudflareWorkersProvider } from './CloudflareWorkersProvider';

const provider = new CloudflareWorkersProvider();

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
