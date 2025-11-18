/**
 * Cloudflare Workers Provider Settings Component
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

export default function CloudflareWorkersSettings( { providerId } ) {
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
				label={ __( 'Account ID', 'aether' ) }
				help={ __(
					'Your Cloudflare account ID (found in Workers dashboard)',
					'aether'
				) }
				value={ settings.account_id || '' }
				onChange={ ( value ) => handleChange( 'account_id', value ) }
				required
				pattern="^[a-f0-9]{32}$"
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>

			<SecretField
				label={ __( 'API Token', 'aether' ) }
				help={ __(
					'Cloudflare API token with Workers permissions',
					'aether'
				) }
				value={ settings.api_token || '' }
				onChange={ ( value ) => handleChange( 'api_token', value ) }
				placeholder={ __( 'Enter API token', 'aether' ) }
			/>

			<ProviderActions
				providerId={ providerId }
				requiresWorker={ false }
				currentConfig={ settings }
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
