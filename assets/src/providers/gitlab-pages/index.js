/**
 * GitLab Pages Provider Registration
 *
 * Registers the GitLab Pages provider class and settings component via WordPress hooks.
 *
 * @package
 */

import { addAction } from '@wordpress/hooks';
import { render } from '@wordpress/element';
import GitLabPagesSettings from './Settings';
import { GitLabPagesProvider } from './GitLabPagesProvider';

// Register the provider class with the registry
addAction(
	'aether.providers.register',
	'gitlab-pages/register',
	( registry ) => {
		registry.register( GitLabPagesProvider.ID, GitLabPagesProvider );
	}
);

// Register the settings component via action hook
addAction(
	'aether.admin.provider.settings',
	'gitlab-pages/settings',
	( providerId, container ) => {
		if ( providerId === 'gitlab-pages' && container ) {
			render(
				<GitLabPagesSettings providerId={ providerId } />,
				container
			);
		}
	}
);
