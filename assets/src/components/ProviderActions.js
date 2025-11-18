/**
 * Provider Actions Component
 *
 * Test connection and deploy worker buttons for providers.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useConnectionTest } from '../hooks/useConnectionTest';
import { useWorkerDeploy } from '../hooks/useWorkerDeploy';
import apiFetch from '../utils/api';
import { colors, spacing, createFlexStyle } from '../utils/styles';

export default function ProviderActions( {
	providerId,
	requiresWorker,
	workerType = 'r2',
	onWorkerDeployed,
	currentConfig = null,
} ) {
	const [ config, setConfig ] = useState( {} );
	const [ loadingConfig, setLoadingConfig ] = useState( true );

	// Load provider config for connection testing.
	useEffect( () => {
		const loadConfig = async () => {
			try {
				const response = await apiFetch( {
					path: '/aether/v1/settings',
				} );

				if (
					response?.success &&
					response?.settings?.providers?.[ providerId ]
				) {
					setConfig( response.settings.providers[ providerId ] );
				}
			} catch ( err ) {
				// Silently fail - config will remain empty
			} finally {
				setLoadingConfig( false );
			}
		};

		if ( providerId ) {
			loadConfig();
		}
	}, [ providerId ] );

	// Use currentConfig if provided (from form), otherwise use saved config
	const testConfig =
		currentConfig && Object.keys( currentConfig ).length > 0
			? currentConfig
			: config;

	const {
		test,
		testing,
		result: testResult,
	} = useConnectionTest( providerId, testConfig );
	const {
		deploy,
		deploying,
		error: deployError,
		result: deployResult,
	} = useWorkerDeploy( workerType );

	const handleTestConnection = async () => {
		await test();
	};

	const handleDeployWorker = async () => {
		const result = await deploy( false );
		if ( result.success && result.workerUrl ) {
			setConfig( ( prevConfig ) => ( {
				...prevConfig,
				workerEndpoint: result.workerUrl,
			} ) );

			if ( onWorkerDeployed ) {
				onWorkerDeployed( result.workerUrl );
			}
		}
	};

	const containerStyle = {
		marginTop: spacing.xl,
		paddingTop: spacing.xl,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	const buttonsStyle = {
		...createFlexStyle( 'row', spacing.md ),
		marginTop: spacing.md,
	};

	if ( loadingConfig && ! currentConfig ) {
		return null;
	}

	return (
		<div className="aether-provider-actions" style={ containerStyle }>
			{ testResult && (
				<Notice
					className={ `aether-provider-actions__notice aether-provider-actions__notice--${
						testResult.success ? 'success' : 'error'
					}` }
					status={ testResult.success ? 'success' : 'error' }
					isDismissible={ false }
					onRemove={ () => {} }
				>
					{ testResult.message }
				</Notice>
			) }

			{ deployResult && deployResult.success && (
				<Notice
					className="aether-provider-actions__notice aether-provider-actions__notice--success"
					status="success"
					isDismissible={ false }
					onRemove={ () => {} }
				>
					{ __( 'Worker deployed successfully!', 'aether' ) }
					{ deployResult.workerUrl && (
						<div
							className="aether-provider-actions__worker-url"
							style={ { marginTop: spacing.sm } }
						>
							<strong className="aether-provider-actions__worker-url-label">
								{ __( 'Worker URL:', 'aether' ) }
							</strong>{ ' ' }
							<a
								className="aether-provider-actions__worker-url-link"
								href={ deployResult.workerUrl }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ deployResult.workerUrl }
							</a>
						</div>
					) }
				</Notice>
			) }

			{ deployError && (
				<Notice
					className="aether-provider-actions__notice aether-provider-actions__notice--error"
					status="error"
					isDismissible={ false }
					onRemove={ () => {} }
				>
					{ deployError }
				</Notice>
			) }

			<div
				className="aether-provider-actions__buttons"
				style={ buttonsStyle }
			>
				<Button
					className="aether-provider-actions__test-button"
					variant="secondary"
					onClick={ handleTestConnection }
					isBusy={ testing }
					disabled={ testing || deploying }
				>
					{ testing
						? __( 'Testing…', 'aether' )
						: __( 'Test Connection', 'aether' ) }
				</Button>

				{ requiresWorker && (
					<Button
						className="aether-provider-actions__deploy-button"
						variant="secondary"
						onClick={ handleDeployWorker }
						isBusy={ deploying }
						disabled={ testing || deploying }
					>
						{ deploying
							? __( 'Deploying…', 'aether' )
							: __( 'Deploy Worker', 'aether' ) }
					</Button>
				) }
			</div>
		</div>
	);
}
