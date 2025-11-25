/**
 * Provider Settings Component
 *
 * Dynamic provider settings form that renders based on provider's config fields.
 * Replaces the imperative hook-based approach with a declarative component.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	TextControl,
	TextareaControl,
	SelectControl,
	CheckboxControl,
	Notice,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
import { colors, spacing, fontSize, createFlexStyle } from '../utils/styles';

/**
 * ProviderSettings Component
 *
 * Renders a dynamic settings form for a provider based on its config fields.
 *
 * @param {Object}   props          Component props
 * @param {Object}   props.provider Provider instance
 * @param {Function} props.onSave   Optional callback after successful save
 * @return {JSX.Element} Settings form
 */
export function ProviderSettings( { provider, onSave } ) {
	const [ config, setConfig ] = useState( {} );
	const [ errors, setErrors ] = useState( {} );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ saveSuccess, setSaveSuccess ] = useState( false );
	const [ saveError, setSaveError ] = useState( null );

	// Load provider configuration
	useEffect( () => {
		let mounted = true;

		async function loadConfig() {
			try {
				const providerConfig = await provider.getConfig();
				if ( mounted ) {
					setConfig( providerConfig || {} );
					setIsLoading( false );
				}
			} catch ( error ) {
				if ( mounted ) {
					setSaveError(
						error.message ||
							__(
								'Failed to load configuration',
								'aether-site-exporter'
							)
					);
					setIsLoading( false );
				}
			}
		}

		loadConfig();

		return () => {
			mounted = false;
		};
	}, [ provider ] );

	/**
	 * Handle field value change
	 *
	 * @param {string} fieldId Field identifier
	 * @param {*}      value   New field value
	 */
	const handleFieldChange = ( fieldId, value ) => {
		setConfig( ( prev ) => ( {
			...prev,
			[ fieldId ]: value,
		} ) );

		// Clear error for this field
		if ( errors[ fieldId ] ) {
			setErrors( ( prev ) => {
				const newErrors = { ...prev };
				delete newErrors[ fieldId ];
				return newErrors;
			} );
		}

		// Clear success message when user starts editing
		if ( saveSuccess ) {
			setSaveSuccess( false );
		}
	};

	/**
	 * Handle form submission
	 * @param {Event} event Form submission event
	 */
	const handleSubmit = async ( event ) => {
		event.preventDefault();

		setIsSaving( true );
		setSaveSuccess( false );
		setSaveError( null );
		setErrors( {} );

		try {
			// Validate configuration
			const validationErrors = await provider.validateConfig( config );
			if ( Object.keys( validationErrors ).length > 0 ) {
				setErrors( validationErrors );
				setIsSaving( false );
				return;
			}

			// Save configuration
			await provider.saveConfig( config );

			// Success
			setSaveSuccess( true );
			setIsSaving( false );

			// Trigger WordPress hook for other components
			doAction(
				'aether.admin.provider.settings.saved',
				provider.getId()
			);

			// Call onSave callback if provided
			if ( onSave && typeof onSave === 'function' ) {
				onSave( config );
			}
		} catch ( error ) {
			setSaveError(
				error.message ||
					__( 'Failed to save configuration', 'aether-site-exporter' )
			);
			setIsSaving( false );
		}
	};

	/**
	 * Render a form field based on its type
	 *
	 * @param {Object} field Field definition
	 * @return {JSX.Element|null} Field component
	 */
	const renderField = ( field ) => {
		const {
			id,
			label,
			type = 'text',
			help,
			placeholder,
			options,
			required,
		} = field;

		const value = config[ id ] || '';
		const error = errors[ id ];

		const commonProps = {
			key: id,
			label: required ? `${ label } *` : label,
			help: error || help,
			value,
			onChange: ( newValue ) => handleFieldChange( id, newValue ),
		};

		// Add error styling if field has an error
		const className = error ? 'aether-field-error' : '';

		switch ( type ) {
			case 'text':
			case 'email':
			case 'url':
			case 'number':
				return (
					<TextControl
						{ ...commonProps }
						type={ type }
						placeholder={ placeholder }
						className={ className }
					/>
				);

			case 'password':
				return (
					<TextControl
						{ ...commonProps }
						type="password"
						placeholder={ placeholder }
						className={ className }
						autoComplete="off"
					/>
				);

			case 'textarea':
				return (
					<TextareaControl
						{ ...commonProps }
						placeholder={ placeholder }
						rows={ 4 }
						className={ className }
					/>
				);

			case 'select':
				return (
					<SelectControl
						{ ...commonProps }
						options={ [
							{
								label: __(
									'Select an option…',
									'aether-site-exporter'
								),
								value: '',
							},
							...( options || [] ),
						] }
						className={ className }
					/>
				);

			case 'checkbox':
				return (
					<CheckboxControl
						key={ id }
						label={ label }
						help={ error || help }
						checked={ Boolean( value ) }
						onChange={ ( checked ) =>
							handleFieldChange( id, checked )
						}
						className={ className }
					/>
				);

			default:
				return (
					<TextControl
						{ ...commonProps }
						placeholder={ placeholder }
						className={ className }
					/>
				);
		}
	};

	const containerStyle = {
		...createFlexStyle( 'column', spacing.lg ),
		minHeight: 0,
	};

	const loadingStyle = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '2.5rem',
		gap: spacing.md,
	};

	const descriptionStyle = {
		marginBottom: spacing.md,
	};

	const descriptionParagraphStyle = {
		margin: 0,
		color: colors.textMuted,
		fontSize: fontSize.base,
	};

	const formStyle = {
		...createFlexStyle( 'column', spacing.md ),
	};

	const noFieldsStyle = {
		color: colors.textMuted,
		fontStyle: 'italic',
	};

	const actionsStyle = {
		...createFlexStyle( 'row', spacing.sm ),
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	const requiredNoticeStyle = {
		marginTop: spacing.md,
		color: colors.textMuted,
		fontSize: fontSize.sm,
		fontStyle: 'italic',
	};

	// Loading state
	if ( isLoading ) {
		return (
			<div
				className="aether-provider-settings aether-provider-settings--loading"
				style={ loadingStyle }
			>
				<Spinner className="aether-provider-settings__spinner" />
				<p className="aether-provider-settings__loading-text">
					{ __(
						'Loading provider settings…',
						'aether-site-exporter'
					) }
				</p>
			</div>
		);
	}

	const fields = provider.getConfigFields();

	return (
		<div className="aether-provider-settings" style={ containerStyle }>
			{ /* Success notice */ }
			{ saveSuccess && (
				<Notice
					className="aether-provider-settings__notice aether-provider-settings__notice--success"
					status="success"
					isDismissible={ true }
					onRemove={ () => setSaveSuccess( false ) }
				>
					{ __(
						'Settings saved successfully!',
						'aether-site-exporter'
					) }
				</Notice>
			) }

			{ /* Error notice */ }
			{ saveError && (
				<Notice
					className="aether-provider-settings__notice aether-provider-settings__notice--error"
					status="error"
					isDismissible={ true }
					onRemove={ () => setSaveError( null ) }
				>
					{ saveError }
				</Notice>
			) }

			{ /* Provider description */ }
			<div
				className="aether-provider-settings__description"
				style={ descriptionStyle }
			>
				<p
					className="aether-provider-settings__description-text"
					style={ descriptionParagraphStyle }
				>
					{ provider.getDescription() }
				</p>
			</div>

			{ /* Settings form */ }
			<form
				className="aether-provider-settings__form"
				onSubmit={ handleSubmit }
				style={ formStyle }
			>
				{ fields.length === 0 && (
					<p
						className="aether-provider-settings__no-fields"
						style={ noFieldsStyle }
					>
						{ __(
							'This provider has no configurable settings.',
							'aether-site-exporter-providers'
						) }
					</p>
				) }

				{ fields.map( renderField ) }

				{ /* Form actions */ }
				{ fields.length > 0 && (
					<div
						className="aether-provider-settings__actions"
						style={ actionsStyle }
					>
						<Button
							className="aether-provider-settings__save-button"
							type="submit"
							variant="primary"
							isBusy={ isSaving }
							disabled={ isSaving }
						>
							{ isSaving
								? __( 'Saving…', 'aether-site-exporter' )
								: __(
										'Save Settings',
										'aether-site-exporter'
								  ) }
						</Button>

						{ /* Optional: Test connection button */ }
						{ provider.testConnection && (
							<Button
								className="aether-provider-settings__test-button"
								variant="secondary"
								disabled={
									isSaving || Object.keys( errors ).length > 0
								}
								onClick={ async () => {
									try {
										const result =
											await provider.testConnection(
												config
											);
										if ( result.success ) {
											setSaveSuccess( true );
											setSaveError( null );
										} else {
											setSaveError(
												result.error ||
													__(
														'Connection test failed',
														'aether-site-exporter-providers'
													)
											);
										}
									} catch ( error ) {
										setSaveError(
											error.message ||
												__(
													'Connection test failed',
													'aether-site-exporter-providers'
												)
										);
									}
								} }
							>
								{ __(
									'Test Connection',
									'aether-site-exporter'
								) }
							</Button>
						) }
					</div>
				) }
			</form>

			{ /* Required fields notice */ }
			{ fields.some( ( field ) => field.required ) && (
				<p
					className="aether-provider-settings__required-notice"
					style={ requiredNoticeStyle }
				>
					{ __( '* Required fields', 'aether-site-exporter' ) }
				</p>
			) }
		</div>
	);
}

export default ProviderSettings;
