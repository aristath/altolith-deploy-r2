/**
 * Cloudflare Workers Provider Registration
 *
 * Registers the Cloudflare Workers provider class and settings component via WordPress hooks.
 *
 * @package
 */

import { addAction } from '@wordpress/hooks';
import { render } from '@wordpress/element';
import CloudflareWorkersSettings from './Settings';
import { CloudflareWorkersProvider } from './CloudflareWorkersProvider';

// Register the provider class with the registry
addAction( 'aether.providers.register', 'cloudflare/register', ( registry ) => {
	registry.register(
		CloudflareWorkersProvider.ID,
		CloudflareWorkersProvider
	);
} );

// Register the settings component via action hook
addAction(
	'aether.admin.provider.settings',
	'cloudflare/settings',
	( providerId, container ) => {
		if ( providerId === 'cloudflare' && container ) {
			render(
				<CloudflareWorkersSettings providerId={ providerId } />,
				container
			);
		}
	}
);
