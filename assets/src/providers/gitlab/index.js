/**
 * GitLab Provider Registration
 *
 * Registers the GitLab provider class and settings component via WordPress hooks.
 *
 * @package
 */

import { addAction } from '@wordpress/hooks';
import { render } from '@wordpress/element';
import GitLabSettings from './Settings';
import { GitLabProvider } from './GitLabProvider';

// Register the provider class with the registry
addAction( 'aether.providers.register', 'gitlab/register', ( registry ) => {
	registry.register( GitLabProvider.ID, GitLabProvider );
} );

// Register the settings component via action hook
addAction(
	'aether.admin.provider.settings',
	'gitlab/settings',
	( providerId, container ) => {
		if ( providerId === 'gitlab' && container ) {
			render( <GitLabSettings providerId={ providerId } />, container );
		}
	}
);
