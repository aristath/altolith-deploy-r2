/**
 * GitLab Provider Settings Component
 *
 * @package
 */

import { TextControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SecretField from '../../components/SecretField';
import ProviderActions from '../../components/ProviderActions';
import { useProviderSettingsForm } from '../../hooks/useProviderSettingsForm';
import {
	noticeStyles,
	colors,
	spacing,
	createFlexStyle,
} from '../../utils/styles';

export default function GitLabSettings( { providerId } ) {
	const {
		settings,
		loading,
		saving,
		error,
		success,
		handleChange,
		handleSubmit,
	} = useProviderSettingsForm( providerId );

	const formStyle = {
		...createFlexStyle( 'column', spacing.md ),
	};

	const noticeErrorStyle = {
		...noticeStyles.error,
		padding: spacing.md,
		marginBottom: spacing.md,
	};

	const noticeSuccessStyle = {
		...noticeStyles.success,
		padding: spacing.md,
		marginBottom: spacing.md,
	};

	const noticeParagraphStyle = {
		margin: 0,
	};

	const actionsStyle = {
		...createFlexStyle( 'row', spacing.sm ),
		justifyContent: 'flex-end',
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	if ( loading ) {
		return (
			<p className="aether-provider-settings-form aether-provider-settings-form--loading">
				{ __( 'Loading settings…', 'aether' ) }
			</p>
		);
	}

	return (
		<form
			className="aether-provider-settings-form"
			onSubmit={ handleSubmit }
			style={ formStyle }
		>
			{ error && (
				<div
					className="aether-provider-settings-form__notice aether-provider-settings-form__notice--error"
					style={ noticeErrorStyle }
				>
					<p
						className="aether-provider-settings-form__notice-text"
						style={ noticeParagraphStyle }
					>
						{ error }
					</p>
				</div>
			) }

			{ success && (
				<div
					className="aether-provider-settings-form__notice aether-provider-settings-form__notice--success"
					style={ noticeSuccessStyle }
				>
					<p
						className="aether-provider-settings-form__notice-text"
						style={ noticeParagraphStyle }
					>
						{ __( 'Settings saved successfully!', 'aether' ) }
					</p>
				</div>
			) }

			<SecretField
				label={ __( 'Personal Access Token', 'aether' ) }
				help={ __(
					'GitLab Personal Access Token with api and write_repository permissions',
					'aether'
				) }
				value={ settings.personal_access_token || '' }
				onChange={ ( value ) =>
					handleChange( 'personal_access_token', value )
				}
				placeholder={ __( 'Enter personal access token', 'aether' ) }
			/>

			<TextControl
				label={ __( 'Project ID', 'aether' ) }
				help={ __( 'GitLab project ID (numeric)', 'aether' ) }
				value={ settings.project_id || '' }
				onChange={ ( value ) => handleChange( 'project_id', value ) }
				required
				pattern="^\d+$"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Namespace (Optional)', 'aether' ) }
				help={ __(
					'GitLab namespace (username or group) for repository URL',
					'aether'
				) }
				value={ settings.namespace || '' }
				onChange={ ( value ) => handleChange( 'namespace', value ) }
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Project Path (Optional)', 'aether' ) }
				help={ __( 'Project path for repository URL', 'aether' ) }
				value={ settings.project_path || '' }
				onChange={ ( value ) => handleChange( 'project_path', value ) }
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Branch', 'aether' ) }
				help={ __( 'Git branch name (default: main)', 'aether' ) }
				value={ settings.branch || 'main' }
				onChange={ ( value ) => handleChange( 'branch', value ) }
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Git Worker URL (Optional)', 'aether' ) }
				help={ __(
					'CORS proxy worker for browser-based Git operations (for WordPress Playground)',
					'aether'
				) }
				value={ settings.git_worker_url || '' }
				onChange={ ( value ) =>
					handleChange( 'git_worker_url', value )
				}
				type="url"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<ProviderActions
				providerId={ providerId }
				requiresWorker={ false }
			/>

			<div
				className="aether-provider-settings-form__actions"
				style={ actionsStyle }
			>
				<Button
					className="aether-provider-settings-form__submit-button"
					type="submit"
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
				>
					{ saving
						? __( 'Saving…', 'aether' )
						: __( 'Save Settings', 'aether' ) }
				</Button>
			</div>
		</form>
	);
}
