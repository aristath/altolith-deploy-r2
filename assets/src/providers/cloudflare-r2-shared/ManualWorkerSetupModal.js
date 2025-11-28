/**
 * Manual Worker Setup Modal Component
 *
 * Shows detailed instructions for manually creating a Cloudflare Worker
 * for R2 storage, including the worker code to paste.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import {
	Modal,
	Button,
	Notice,
	TextareaControl,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { CLOUDFLARE_DOCS } from './documentation';

/**
 * Manual Worker Setup Modal component.
 *
 * @param {Object}   props            Component props.
 * @param {boolean}  props.isOpen     Whether modal is open.
 * @param {Function} props.onClose    Function to close the modal.
 * @param {string}   props.bucketName Optional bucket name to show in instructions.
 * @return {JSX.Element|null}         Modal component or null if not open.
 */
export function ManualWorkerSetupModal( { isOpen, onClose, bucketName } ) {
	const [ copied, setCopied ] = useState( false );
	const [ workerCode, setWorkerCode ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	// Fetch worker code when modal opens
	useEffect( () => {
		if ( ! isOpen || workerCode ) {
			return;
		}

		const fetchWorkerCode = async () => {
			setIsLoading( true );
			setError( null );

			try {
				// Get plugin URL from global variable set by PHP
				const pluginUrl = window.altolithSepPluginUrl || '';
				if ( ! pluginUrl ) {
					throw new Error( 'Plugin URL not available' );
				}

				const response = await fetch(
					pluginUrl + 'assets/workers/CloudflareR2Worker.js'
				);

				if ( ! response.ok ) {
					throw new Error(
						`Failed to fetch worker code: ${ response.status }`
					);
				}

				const code = await response.text();
				setWorkerCode( code );
			} catch ( err ) {
				setError( err.message );
			} finally {
				setIsLoading( false );
			}
		};

		fetchWorkerCode();
	}, [ isOpen, workerCode ] );

	if ( ! isOpen ) {
		return null;
	}

	const handleCopyCode = async () => {
		if ( ! workerCode ) {
			return;
		}

		try {
			await navigator.clipboard.writeText( workerCode );
			setCopied( true );
			setTimeout( () => setCopied( false ), 3000 );
		} catch {
			// Fallback for older browsers
			const textarea = document.createElement( 'textarea' );
			textarea.value = workerCode;
			document.body.appendChild( textarea );
			textarea.select();
			document.execCommand( 'copy' );
			document.body.removeChild( textarea );
			setCopied( true );
			setTimeout( () => setCopied( false ), 3000 );
		}
	};

	const modalStyle = {
		maxWidth: '800px',
		width: '90vw',
	};

	const sectionStyle = {
		marginBottom: '1.5rem',
	};

	const headingStyle = {
		fontSize: '1rem',
		fontWeight: '600',
		marginBottom: '0.5rem',
		marginTop: 0,
	};

	const listStyle = {
		margin: '0.5rem 0',
		paddingLeft: '1.5rem',
	};

	const listItemStyle = {
		marginBottom: '0.5rem',
		lineHeight: '1.6',
	};

	const codeBlockStyle = {
		position: 'relative',
		marginTop: '0.5rem',
	};

	const copyButtonContainerStyle = {
		display: 'flex',
		justifyContent: 'flex-end',
		marginBottom: '0.5rem',
	};

	const noteStyle = {
		backgroundColor: '#f0f6fc',
		padding: '0.75rem 1rem',
		borderLeft: '4px solid #2271b1',
		borderRadius: '2px',
		marginTop: '1rem',
		fontSize: '0.875rem',
	};

	const loadingStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '2rem',
		gap: '0.5rem',
	};

	return (
		<Modal
			title={ __(
				'Manual Worker Setup Instructions',
				'altolith-deploy-r2'
			) }
			onRequestClose={ onClose }
			style={ modalStyle }
			className="altolith-manual-worker-modal"
		>
			<div className="altolith-manual-worker-modal__content">
				{ /* Step 1: Create Worker */ }
				<div
					className="altolith-manual-worker-modal__section"
					style={ sectionStyle }
				>
					<h3
						className="altolith-manual-worker-modal__heading"
						style={ headingStyle }
					>
						{ __(
							'Step 1: Create a Worker',
							'altolith-deploy-r2'
						) }
					</h3>
					<ol
						className="altolith-manual-worker-modal__steps"
						style={ listStyle }
					>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __( 'Go to', 'altolith-deploy-r2' ) }{ ' ' }
							<a
								className="altolith-manual-worker-modal__link"
								href="https://dash.cloudflare.com/?to=/:account/workers-and-pages"
								target="_blank"
								rel="noopener noreferrer"
							>
								Cloudflare Dashboard &gt; Workers & Pages
							</a>
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Click "Create" and select "Create Worker"',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Name your worker (e.g., "altolith-r2-mysite")',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Click "Deploy" to create the worker with default code',
								'altolith-deploy-r2'
							) }
						</li>
					</ol>
				</div>

				{ /* Step 2: Add R2 Binding */ }
				<div
					className="altolith-manual-worker-modal__section"
					style={ sectionStyle }
				>
					<h3
						className="altolith-manual-worker-modal__heading"
						style={ headingStyle }
					>
						{ __(
							'Step 2: Add R2 Bucket Binding',
							'altolith-deploy-r2'
						) }
					</h3>
					<ol
						className="altolith-manual-worker-modal__steps"
						style={ listStyle }
					>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'In your worker, go to Settings > Variables',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Scroll down to "R2 Bucket Bindings"',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Click "Add binding"',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							<strong>
								{ __( 'Variable name:', 'altolith-deploy-r2' ) }
							</strong>{ ' ' }
							<code className="altolith-manual-worker-modal__code">
								R2_BUCKET
							</code>{ ' ' }
							{ __(
								'(must be exactly this name)',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							<strong>
								{ __( 'R2 bucket:', 'altolith-deploy-r2' ) }
							</strong>{ ' ' }
							{ bucketName ? (
								<>
									{ __( 'Select', 'altolith-deploy-r2' ) }{ ' ' }
									<code className="altolith-manual-worker-modal__code">
										{ bucketName }
									</code>
								</>
							) : (
								__(
									'Select your R2 bucket',
									'altolith-deploy-r2'
								)
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Click "Save" to save the binding',
								'altolith-deploy-r2'
							) }
						</li>
					</ol>
				</div>

				{ /* Step 3: Replace Worker Code */ }
				<div
					className="altolith-manual-worker-modal__section"
					style={ sectionStyle }
				>
					<h3
						className="altolith-manual-worker-modal__heading"
						style={ headingStyle }
					>
						{ __(
							'Step 3: Replace Worker Code',
							'altolith-deploy-r2'
						) }
					</h3>
					<ol
						className="altolith-manual-worker-modal__steps"
						style={ listStyle }
					>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Go to your worker\'s "Code" tab',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Delete all existing code',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Paste the code below:',
								'altolith-deploy-r2'
							) }
						</li>
					</ol>

					<div
						className="altolith-manual-worker-modal__code-block"
						style={ codeBlockStyle }
					>
						{ isLoading && (
							<div
								className="altolith-manual-worker-modal__loading"
								style={ loadingStyle }
							>
								<Spinner />
								<span className="altolith-manual-worker-modal__loading-text">
									{ __(
										'Loading worker code…',
										'altolith-deploy-r2'
									) }
								</span>
							</div>
						) }
						{ error && (
							<Notice
								className="altolith-manual-worker-modal__error"
								status="error"
								isDismissible={ false }
							>
								{ error }
							</Notice>
						) }
						{ ! isLoading && ! error && workerCode && (
							<>
								<div
									className="altolith-manual-worker-modal__copy-button-container"
									style={ copyButtonContainerStyle }
								>
									<Button
										className="altolith-manual-worker-modal__copy-button"
										variant="secondary"
										onClick={ handleCopyCode }
										disabled={ copied }
									>
										{ copied
											? __(
													'Copied!',
													'altolith-deploy-r2'
											  )
											: __(
													'Copy Code',
													'altolith-deploy-r2'
											  ) }
									</Button>
								</div>
								<TextareaControl
									className="altolith-manual-worker-modal__code-textarea"
									value={ workerCode }
									readOnly
									rows={ 15 }
									style={ {
										fontFamily: 'monospace',
										fontSize: '12px',
										backgroundColor: '#1e1e1e',
										color: '#d4d4d4',
									} }
								/>
							</>
						) }
					</div>
				</div>

				{ /* Step 4: Deploy and Copy URL */ }
				<div
					className="altolith-manual-worker-modal__section"
					style={ sectionStyle }
				>
					<h3
						className="altolith-manual-worker-modal__heading"
						style={ headingStyle }
					>
						{ __(
							'Step 4: Deploy and Copy URL',
							'altolith-deploy-r2'
						) }
					</h3>
					<ol
						className="altolith-manual-worker-modal__steps"
						style={ listStyle }
					>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Click "Save and Deploy" to deploy your worker',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Copy the worker URL (e.g., https://altolith-r2-mysite.your-subdomain.workers.dev)',
								'altolith-deploy-r2'
							) }
						</li>
						<li
							className="altolith-manual-worker-modal__step-item"
							style={ listItemStyle }
						>
							{ __(
								'Paste it in the "Worker Endpoint URL" field in this form',
								'altolith-deploy-r2'
							) }
						</li>
					</ol>
				</div>

				{ /* Important Note */ }
				<Notice
					className="altolith-manual-worker-modal__important-notice"
					status="info"
					isDismissible={ false }
				>
					<strong>
						{ __( 'Important:', 'altolith-deploy-r2' ) }
					</strong>{ ' ' }
					{ __(
						'The R2 bucket binding variable name MUST be exactly "R2_BUCKET" (case-sensitive). The worker will not work without this binding.',
						'altolith-deploy-r2'
					) }
				</Notice>

				<div
					className="altolith-manual-worker-modal__help-note"
					style={ noteStyle }
				>
					<strong>
						{ __( 'Need more help?', 'altolith-deploy-r2' ) }
					</strong>
					<br />
					<a
						className="altolith-manual-worker-modal__link"
						href={ CLOUDFLARE_DOCS.workersBindings }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __(
							'R2 Bucket Bindings Documentation',
							'altolith-deploy-r2'
						) }
					</a>
					{ ' | ' }
					<a
						className="altolith-manual-worker-modal__link"
						href={ CLOUDFLARE_DOCS.r2Overview }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'R2 Overview', 'altolith-deploy-r2' ) }
					</a>
				</div>

				{ /* Close Button */ }
				<div
					className="altolith-manual-worker-modal__actions"
					style={ {
						marginTop: '1.5rem',
						display: 'flex',
						justifyContent: 'flex-end',
					} }
				>
					<Button
						className="altolith-manual-worker-modal__close-button"
						variant="primary"
						onClick={ onClose }
					>
						{ __( 'Close', 'altolith-deploy-r2' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
}
