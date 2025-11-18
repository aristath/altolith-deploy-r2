/**
 * Playground Notice Component
 *
 * Displays a warning notice when plugin is used outside WordPress Playground.
 *
 * @package
 */

import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { usePlaygroundNotice } from '../hooks/usePlaygroundNotice';

export default function PlaygroundNotice() {
	const { shouldShow, loading, dismiss } = usePlaygroundNotice();

	if ( loading || ! shouldShow ) {
		return null;
	}

	return (
		<Notice
			className="aether-playground-notice"
			status="warning"
			isDismissible
			onRemove={ dismiss }
		>
			<h3 className="aether-playground-notice__title">
				{ __(
					'Aether is designed for WordPress Playground',
					'aether'
				) }
			</h3>
			<p className="aether-playground-notice__text">
				{ sprintf(
					/* translators: %s: WordPress Playground URL */
					__(
						'This plugin is specifically designed to work within %s, a browser-based WordPress environment.',
						'aether'
					),
					<a
						className="aether-playground-notice__link"
						href="https://static-wp.s12y.org/index.html"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'WordPress Playground', 'aether-site-exporter' ) }
					</a>
				) }
			</p>
			<p className="aether-playground-notice__text">
				{ __(
					'While it will function on a standard WordPress installation, you may encounter unexpected behavior. For the best experience, please use this plugin within WordPress Playground.',
					'aether'
				) }
			</p>
		</Notice>
	);
}
