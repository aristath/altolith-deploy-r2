/**
 * Cloudflare R2 Provider Settings Component
 *
 * React component for R2 provider configuration.
 *
 * @package
 */

import { TextControl, Button, CheckboxControl } from '@wordpress/components';
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

export default function CloudflareR2Settings( { providerId } ) {
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

			<TextControl
				label={ __( 'Cloudflare Account ID', 'aether' ) }
				help={ __(
					'Your Cloudflare account ID (found in R2 dashboard)',
					'aether'
				) }
				value={ settings.cloudflare_account_id || '' }
				onChange={ ( value ) =>
					handleChange( 'cloudflare_account_id', value )
				}
				required
				pattern="^[a-f0-9]{32}$"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Bucket Name', 'aether' ) }
				help={ __( 'R2 bucket name for file storage', 'aether' ) }
				value={ settings.bucket_name || '' }
				onChange={ ( value ) => handleChange( 'bucket_name', value ) }
				required
				pattern="^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Access Key ID', 'aether' ) }
				help={ __( 'R2 API access key ID', 'aether' ) }
				value={ settings.access_key_id || '' }
				onChange={ ( value ) => handleChange( 'access_key_id', value ) }
				required
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<SecretField
				label={ __( 'Secret Access Key', 'aether' ) }
				help={ __( 'R2 API secret access key (encrypted)', 'aether' ) }
				value={ settings.secret_access_key || '' }
				onChange={ ( value ) =>
					handleChange( 'secret_access_key', value )
				}
				placeholder={ __( 'Enter secret access key', 'aether' ) }
			/>

			<TextControl
				label={ __( 'Public URL (Optional)', 'aether' ) }
				help={ __(
					"Your R2 bucket's public URL. Leave empty if bucket is private.",
					'aether'
				) }
				value={ settings.public_url || '' }
				onChange={ ( value ) => handleChange( 'public_url', value ) }
				type="url"
				placeholder="https://pub-xyz.r2.dev"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Region (Optional)', 'aether' ) }
				help={ __(
					'R2 region hint for optimal performance',
					'aether'
				) }
				value={ settings.region || '' }
				onChange={ ( value ) => handleChange( 'region', value ) }
				placeholder="auto"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Worker Endpoint URL', 'aether' ) }
				help={ __(
					'Deployed Cloudflare Worker endpoint for upload proxy (auto-populated after deployment)',
					'aether'
				) }
				value={ settings.worker_endpoint || '' }
				onChange={ ( value ) =>
					handleChange( 'worker_endpoint', value )
				}
				type="url"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<TextControl
				label={ __( 'Custom Domain (Optional)', 'aether' ) }
				help={ __(
					'Custom domain for R2 bucket access (e.g., https://cdn.example.com)',
					'aether'
				) }
				value={ settings.custom_domain || '' }
				onChange={ ( value ) => handleChange( 'custom_domain', value ) }
				type="url"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<CheckboxControl
				label={ __( 'Enable Public Access', 'aether' ) }
				help={ __(
					'Allow public read access to bucket contents',
					'aether'
				) }
				checked={ settings.public_access || false }
				onChange={ ( value ) => handleChange( 'public_access', value ) }
				__nextHasNoMarginBottom={ true }
			/>

			<ProviderActions
				providerId={ providerId }
				requiresWorker={ true }
				workerType="r2"
				currentConfig={ settings }
				onWorkerDeployed={ ( workerUrl ) => {
					handleChange( 'worker_endpoint', workerUrl );
				} }
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
