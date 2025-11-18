/**
 * Provider Form Component
 *
 * Dynamically renders a form based on provider field definitions.
 * Can be enhanced with react-hook-form once installed.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '../../utils/api';
import { validateConfig } from '../../utils/validation';
import ProviderField from './ProviderField';
import { useSuccessTimeout } from '../../hooks/useSuccessTimeout';
import { colors, spacing, createFlexStyle } from '../../utils/styles';

/**
 * Provider Form Component.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.providerId    Provider ID.
 * @param {Array}    props.fields        Array of field definitions from provider metadata.
 * @param {Object}   props.initialValues Initial form values.
 * @param {Function} props.onSubmit      Optional submit handler.
 * @param {Function} props.onChange      Optional change handler.
 * @return {JSX.Element} Rendered form component.
 */
export default function ProviderForm( {
	providerId,
	fields = [],
	initialValues = {},
	onSubmit,
	onChange,
} ) {
	const [ values, setValues ] = useState( initialValues );
	const [ errors, setErrors ] = useState( {} );
	const [ saving, setSaving ] = useState( false );
	const [ success, setSuccess ] = useState( false );
	const [ error, setError ] = useState( null );
	const { showSuccess, clearSuccess } = useSuccessTimeout();

	// Update values when initialValues change
	useEffect( () => {
		setValues( initialValues );
	}, [ initialValues ] );

	const handleFieldChange = ( fieldId, value ) => {
		const newValues = {
			...values,
			[ fieldId ]: value,
		};
		setValues( newValues );
		setErrors( {} );
		setError( null );
		clearSuccess();
		setSuccess( false );

		// Call onChange callback if provided
		if ( onChange ) {
			onChange( newValues );
		}
	};

	const handleSubmit = async ( e ) => {
		e.preventDefault();
		setSaving( true );
		setError( null );
		setSuccess( false );

		// Client-side validation
		const validation = validateConfig( values, fields );
		if ( ! validation.valid ) {
			setErrors( validation.errors );
			setSaving( false );
			return;
		}

		try {
			// Call custom onSubmit if provided
			if ( onSubmit ) {
				await onSubmit( values );
			} else {
				// Default: save to settings using /aether/site-exporter/settings endpoint
				// Get current providers settings
				const settingsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );

				if ( ! settingsResponse.success ) {
					throw new Error( 'Failed to load current settings' );
				}

				// Merge new provider settings with existing providers
				const currentProviders = settingsResponse.value || {};
				const updatedProviders = {
					...currentProviders,
					[ providerId ]: values,
				};

				// Save updated providers object
				const saveResponse = await apiFetch( {
					path: '/aether/site-exporter/settings',
					method: 'POST',
					data: {
						key: 'providers',
						value: updatedProviders,
					},
				} );

				if ( ! saveResponse.success ) {
					throw new Error(
						saveResponse.message || 'Failed to save settings'
					);
				}
			}

			setSuccess( true );
			showSuccess( () => setSuccess( false ) );
		} catch ( err ) {
			setError(
				err.message ||
					__( 'Failed to save settings', 'aether-site-exporter' )
			);
		} finally {
			setSaving( false );
		}
	};

	const formStyle = {
		...createFlexStyle( 'column', spacing.md ),
	};

	const actionsStyle = {
		...createFlexStyle( 'row', spacing.sm ),
		justifyContent: 'flex-end',
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	return (
		<form
			className="aether-provider-form"
			onSubmit={ handleSubmit }
			style={ formStyle }
		>
			{ error && (
				<Notice
					className="aether-provider-form__notice aether-provider-form__notice--error"
					status="error"
					isDismissible
					onRemove={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			{ success && (
				<Notice
					className="aether-provider-form__notice aether-provider-form__notice--success"
					status="success"
					isDismissible
					onRemove={ () => setSuccess( false ) }
				>
					{ __(
						'Settings saved successfully!',
						'aether-site-exporter'
					) }
				</Notice>
			) }

			{ fields.map( ( field ) => (
				<ProviderField
					key={ field.id }
					field={ field }
					value={ values[ field.id ] }
					onChange={ handleFieldChange }
					errors={ errors }
				/>
			) ) }

			<div
				className="aether-provider-form__actions"
				style={ actionsStyle }
			>
				<Button
					className="aether-provider-form__submit-button"
					type="submit"
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
				>
					{ saving
						? __( 'Saving…', 'aether-site-exporter' )
						: __( 'Save Settings', 'aether-site-exporter' ) }
				</Button>
			</div>
		</form>
	);
}
