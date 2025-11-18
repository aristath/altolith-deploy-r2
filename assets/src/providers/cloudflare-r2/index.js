/**
 * Cloudflare R2 Provider Registration
 *
 * Registers the Cloudflare R2 provider class and settings component via WordPress hooks.
 *
 * @package
 */

import { addAction } from '@wordpress/hooks';
import { render } from '@wordpress/element';
import CloudflareR2Settings from './Settings';
import { CloudflareR2Provider } from './CloudflareR2Provider';

// Register the provider class with the registry
addAction(
	'aether.providers.register',
	'cloudflare-r2/register',
	( registry ) => {
		registry.register( CloudflareR2Provider.ID, CloudflareR2Provider );
	}
);

// Register the settings component via action hook
addAction(
	'aether.admin.provider.settings',
	'cloudflare-r2/settings',
	( providerId, container ) => {
		if ( providerId === 'cloudflare-r2' && container ) {
			render(
				<CloudflareR2Settings providerId={ providerId } />,
				container
			);
		}
	}
);
