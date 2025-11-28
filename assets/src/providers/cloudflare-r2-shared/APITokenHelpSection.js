/**
 * API Token Help Section Component
 *
 * Collapsible help section displayed after the API token field.
 * Contains step-by-step instructions for creating a token.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { CLOUDFLARE_DOCS } from './documentation';

/**
 * Collapsible section with API token creation instructions.
 *
 * @return {JSX.Element} Help section component.
 */
export function APITokenHelpSection() {
	const [ isExpanded, setIsExpanded ] = useState( false );

	const containerStyle = {
		marginTop: '0.5rem',
	};

	const toggleButtonStyle = {
		padding: 0,
		height: 'auto',
		minHeight: 'auto',
		fontSize: '12px',
	};

	const contentStyle = {
		marginTop: '0.5rem',
		padding: '0.75rem',
		backgroundColor: '#f6f7f7',
		borderRadius: '4px',
		fontSize: '12px',
		lineHeight: '1.6',
	};

	const listStyle = {
		margin: '0.5rem 0',
		paddingLeft: '1.25rem',
	};

	const listItemStyle = {
		marginBottom: '0.35rem',
	};

	const nestedListStyle = {
		marginTop: '0.25rem',
		marginBottom: '0.25rem',
		paddingLeft: '1.25rem',
		listStyleType: 'disc',
	};

	return (
		<div
			className={ `altolith-api-token-help${
				isExpanded ? ' altolith-api-token-help--expanded' : ''
			}` }
			style={ containerStyle }
		>
			<Button
				className="altolith-api-token-help__toggle"
				variant="link"
				onClick={ () => setIsExpanded( ! isExpanded ) }
				style={ toggleButtonStyle }
				aria-expanded={ isExpanded }
			>
				{ isExpanded
					? __( 'Hide token creation steps', 'altolith-deploy-r2' )
					: __( 'How to create an API token', 'altolith-deploy-r2' ) }
			</Button>

			{ isExpanded && (
				<div
					className="altolith-api-token-help__content"
					style={ contentStyle }
				>
					<ol
						className="altolith-api-token-help__steps"
						style={ listStyle }
					>
						<li
							className="altolith-api-token-help__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Go to Cloudflare Dashboard > My Profile > API Tokens',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-api-token-help__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Click "Create Token"',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-api-token-help__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Select "Create Custom Token"',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-api-token-help__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Add these permissions:',
								'altolith-deploy-r2'
							) }
							<ul
								className="altolith-api-token-help__permissions"
								style={ nestedListStyle }
							>
								<li className="altolith-api-token-help__permission-item">
									Account &gt; Workers Scripts &gt; Edit
								</li>
								<li className="altolith-api-token-help__permission-item">
									Account &gt; Workers Routes &gt; Edit
								</li>
								<li className="altolith-api-token-help__permission-item">
									Zone &gt; Zone &gt; Read (select your zones)
								</li>
							</ul>
						</li>
						<li
							className="altolith-api-token-help__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Create the token and copy it here',
								'altolith-deploy-r2'
							) }
						</li>
					</ol>
					<ExternalLink
						className="altolith-api-token-help__link"
						href={ CLOUDFLARE_DOCS.createApiToken }
					>
						{ __(
							'View Cloudflare Documentation',
							'altolith-deploy-r2'
						) }
					</ExternalLink>
				</div>
			) }
		</div>
	);
}
