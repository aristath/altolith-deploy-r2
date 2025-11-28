/**
 * Deployment Error Help Component
 *
 * Shows expandable "How to fix" instructions when worker
 * deployment or domain attachment fails.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { Button, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	MANUAL_WORKER_DEPLOYMENT,
	MANUAL_DOMAIN_ATTACHMENT,
	CLOUDFLARE_DOCS,
} from './documentation';

/**
 * Expandable help section for deployment errors.
 *
 * @param {Object} props           Component props.
 * @param {string} props.errorType Type of error: 'worker_deployment' or 'domain_attachment'.
 * @param {string} props.hostname  Optional hostname for domain attachment errors.
 * @return {JSX.Element|null} Help section or null if invalid error type.
 */
export function DeploymentErrorHelp( { errorType, hostname } ) {
	const [ isExpanded, setIsExpanded ] = useState( false );

	const containerStyle = {
		marginTop: '0.5rem',
	};

	const toggleButtonStyle = {
		padding: 0,
		height: 'auto',
		minHeight: 'auto',
		fontSize: '12px',
		color: '#2271b1',
	};

	const contentStyle = {
		marginTop: '0.5rem',
		padding: '0.75rem',
		backgroundColor: '#fff8e5',
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

	const noteStyle = {
		marginTop: '0.5rem',
		fontStyle: 'italic',
		color: '#50575e',
	};

	if ( errorType === 'worker_deployment' ) {
		return (
			<div
				className={ `altolith-deployment-error-help altolith-deployment-error-help--worker${
					isExpanded
						? ' altolith-deployment-error-help--expanded'
						: ''
				}` }
				style={ containerStyle }
			>
				<Button
					className="altolith-deployment-error-help__toggle"
					variant="link"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					style={ toggleButtonStyle }
					aria-expanded={ isExpanded }
				>
					{ isExpanded
						? __( 'Hide manual instructions', 'altolith-deploy-r2' )
						: __( 'How to deploy manually', 'altolith-deploy-r2' ) }
				</Button>

				{ isExpanded && (
					<div
						className="altolith-deployment-error-help__content"
						style={ contentStyle }
					>
						<p
							className="altolith-deployment-error-help__text"
							style={ { margin: '0 0 0.5rem' } }
						>
							{ __(
								'If automatic deployment fails, you can deploy the worker manually:',
								'altolith-deploy-r2'
							) }
						</p>
						<ol
							className="altolith-deployment-error-help__steps"
							style={ listStyle }
						>
							{ MANUAL_WORKER_DEPLOYMENT.steps.map(
								( step, index ) => (
									<li
										key={ index }
										className="altolith-deployment-error-help__step-item"
										style={ listItemStyle }
									>
										{ step }
									</li>
								)
							) }
						</ol>
						<ExternalLink
							className="altolith-deployment-error-help__link"
							href={ MANUAL_WORKER_DEPLOYMENT.workersUrl }
						>
							{ __(
								'Open Workers & Pages',
								'altolith-deploy-r2'
							) }
						</ExternalLink>
						{ ' | ' }
						<ExternalLink
							className="altolith-deployment-error-help__link"
							href={ CLOUDFLARE_DOCS.workersBindings }
						>
							{ __(
								'View Bindings Documentation',
								'altolith-deploy-r2'
							) }
						</ExternalLink>
					</div>
				) }
			</div>
		);
	}

	if ( errorType === 'domain_attachment' ) {
		return (
			<div
				className={ `altolith-deployment-error-help altolith-deployment-error-help--domain${
					isExpanded
						? ' altolith-deployment-error-help--expanded'
						: ''
				}` }
				style={ containerStyle }
			>
				<Button
					className="altolith-deployment-error-help__toggle"
					variant="link"
					onClick={ () => setIsExpanded( ! isExpanded ) }
					style={ toggleButtonStyle }
					aria-expanded={ isExpanded }
				>
					{ isExpanded
						? __( 'Hide manual instructions', 'altolith-deploy-r2' )
						: __(
								'How to attach domain manually',
								'altolith-deploy-r2'
						  ) }
				</Button>

				{ isExpanded && (
					<div
						className="altolith-deployment-error-help__content"
						style={ contentStyle }
					>
						<p
							className="altolith-deployment-error-help__text"
							style={ { margin: '0 0 0.5rem' } }
						>
							{ __(
								'If custom domain attachment fails, configure it manually:',
								'altolith-deploy-r2'
							) }
						</p>
						<ol
							className="altolith-deployment-error-help__steps"
							style={ listStyle }
						>
							{ MANUAL_DOMAIN_ATTACHMENT.steps.map(
								( step, index ) => (
									<li
										key={ index }
										className="altolith-deployment-error-help__step-item"
										style={ listItemStyle }
									>
										{ index === 4 && hostname
											? `${ step }: ${ hostname }`
											: step }
									</li>
								)
							) }
						</ol>
						<p
							className="altolith-deployment-error-help__note"
							style={ noteStyle }
						>
							{ MANUAL_DOMAIN_ATTACHMENT.note }
						</p>
						<ExternalLink
							className="altolith-deployment-error-help__link"
							href={ MANUAL_DOMAIN_ATTACHMENT.docsUrl }
						>
							{ __(
								'View Custom Domains Documentation',
								'altolith-deploy-r2'
							) }
						</ExternalLink>
					</div>
				) }
			</div>
		);
	}

	return null;
}
