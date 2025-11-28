/**
 * R2 Setup Guide Component
 *
 * Displays important setup information at the top of the provider modal.
 * Collapsible to avoid overwhelming users who already know the setup.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { REQUIRED_PERMISSIONS } from './documentation';

/**
 * Collapsible setup guide showing required API permissions.
 *
 * @return {JSX.Element} Setup guide component.
 */
export function R2SetupGuide() {
	const [ isExpanded, setIsExpanded ] = useState( false );

	const containerStyle = {
		marginBottom: '1rem',
		padding: '0.75rem 1rem',
		backgroundColor: '#f0f6fc',
		borderLeft: '4px solid #2271b1',
		borderRadius: '2px',
	};

	const headerStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		margin: 0,
	};

	const toggleButtonStyle = {
		padding: 0,
		height: 'auto',
		minHeight: 'auto',
	};

	const contentStyle = {
		marginTop: '0.75rem',
		fontSize: '13px',
		lineHeight: '1.6',
	};

	const listStyle = {
		margin: '0.5rem 0 0.75rem',
		paddingLeft: '1.5rem',
	};

	const listItemStyle = {
		marginBottom: '0.25rem',
	};

	return (
		<div
			className={ `altolith-r2-setup-guide${
				isExpanded ? ' altolith-r2-setup-guide--expanded' : ''
			}` }
			style={ containerStyle }
		>
			<div
				className="altolith-r2-setup-guide__header"
				style={ headerStyle }
			>
				<strong className="altolith-r2-setup-guide__title">
					{ __( 'Before you begin', 'altolith-deploy-r2' ) }
				</strong>
				<Button
					className="altolith-r2-setup-guide__toggle"
					variant="link"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					style={ toggleButtonStyle }
					aria-expanded={ isExpanded }
				>
					{ isExpanded
						? __( 'Hide details', 'altolith-deploy-r2' )
						: __( 'Show details', 'altolith-deploy-r2' ) }
				</Button>
			</div>

			{ ! isExpanded && (
				<p
					className="altolith-r2-setup-guide__summary"
					style={ { margin: '0.5rem 0 0', fontSize: '13px' } }
				>
					{ __(
						'You need a Cloudflare API token with R2, Workers, and Zone permissions.',
						'altolith-deploy-r2'
					) }{ ' ' }
					<ExternalLink
						className="altolith-r2-setup-guide__link"
						href={ REQUIRED_PERMISSIONS.createTokenUrl }
					>
						{ __( 'Create API Token', 'altolith-deploy-r2' ) }
					</ExternalLink>
				</p>
			) }

			{ isExpanded && (
				<div
					className="altolith-r2-setup-guide__content"
					style={ contentStyle }
				>
					<p
						className="altolith-r2-setup-guide__intro"
						style={ { margin: '0 0 0.5rem' } }
					>
						{ __(
							'Create a Cloudflare API token with these permissions:',
							'altolith-deploy-r2'
						) }
					</p>
					{ REQUIRED_PERMISSIONS.sections.map(
						( section, sectionIndex ) => (
							<div
								key={ sectionIndex }
								className="altolith-r2-setup-guide__section"
								style={ { marginBottom: '0.5rem' } }
							>
								<strong
									className="altolith-r2-setup-guide__section-title"
									style={ {
										fontSize: '12px',
										color: '#50575e',
									} }
								>
									{ section.title }
								</strong>
								<ul
									className="altolith-r2-setup-guide__list"
									style={ listStyle }
								>
									{ section.items.map(
										( item, itemIndex ) => (
											<li
												key={ itemIndex }
												className="altolith-r2-setup-guide__list-item"
												style={ listItemStyle }
											>
												<code className="altolith-r2-setup-guide__permission">
													{ item.permission }
												</code>
												{ ' - ' }
												{ item.description }
											</li>
										)
									) }
								</ul>
							</div>
						)
					) }
					<p
						className="altolith-r2-setup-guide__footer"
						style={ { margin: 0 } }
					>
						<ExternalLink
							className="altolith-r2-setup-guide__link"
							href={ REQUIRED_PERMISSIONS.createTokenUrl }
						>
							{ __(
								'Create API Token in Cloudflare Dashboard',
								'altolith-deploy-r2'
							) }
						</ExternalLink>
					</p>
				</div>
			) }
		</div>
	);
}
