/**
 * Loading State Component
 *
 * @package
 */

import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { spacing, colors } from '../utils/styles';

export default function LoadingState( {
	message = __( 'Loading…', 'aether-site-exporter' ),
} ) {
	const containerStyle = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.md,
		padding: spacing[ '2xl' ],
	};

	const messageStyle = {
		margin: 0,
		color: colors.textMuted,
	};

	return (
		<div className="aether-loading-state" style={ containerStyle }>
			<Spinner className="aether-loading-state__spinner" />
			{ message && (
				<p
					className="aether-loading-state__message"
					style={ messageStyle }
				>
					{ message }
				</p>
			) }
		</div>
	);
}
