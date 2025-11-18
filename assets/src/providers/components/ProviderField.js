/**
 * Provider Field Component
 *
 * Dynamically renders a form field based on provider field definition.
 *
 * @package
 */

import {
	TextControl,
	TextareaControl,
	CheckboxControl,
	SelectControl,
} from '@wordpress/components';
import SecretField from '../../components/SecretField';

/**
 * Render a provider configuration field.
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.field    Field definition from provider metadata.
 * @param {*}        props.value    Current field value.
 * @param {Function} props.onChange Change handler.
 * @param {Object}   props.errors   Validation errors object.
 * @return {JSX.Element} Rendered field component.
 */
export default function ProviderField( { field, value, onChange, errors } ) {
	const {
		id,
		label,
		description,
		type = 'text',
		required = false,
		options = [],
		placeholder = '',
		sensitive = false,
	} = field;

	const error = errors?.[ id ];
	const help = error || description;

	// Handle sensitive fields (passwords, API keys, etc.)
	if ( sensitive || type === 'password' ) {
		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				<SecretField
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					placeholder={ placeholder }
					required={ required }
				/>
			</div>
		);
	}

	// Handle checkbox fields
	if ( type === 'checkbox' ) {
		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				<CheckboxControl
					label={ label }
					help={ help }
					checked={ value || false }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		);
	}

	// Handle toggle group fields (checkbox group with multiple selection)
	if ( type === 'checkbox-group' && options.length > 0 ) {
		const currentValue = Array.isArray( value ) ? value : [];

		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				{ label && (
					<div className="components-base-control__label">
						<strong>{ label }</strong>
						{ required && (
							<span className="components-base-control__label__required">
								*
							</span>
						) }
					</div>
				) }
				{ help && (
					<p className="components-base-control__help">{ help }</p>
				) }
				{ error && (
					<p className="components-base-control__help components-base-control__help--error">
						{ error }
					</p>
				) }
				<div className="aether-checkbox-group">
					{ options.map( ( option ) => {
						const optionValue = option.value;
						const optionLabel = option.label || option.value;
						const isSelected = currentValue.includes( optionValue );

						return (
							<CheckboxControl
								key={ optionValue }
								label={ optionLabel }
								checked={ isSelected }
								onChange={ ( checked ) => {
									let newValue;
									if ( checked ) {
										// Add to array
										newValue = [
											...currentValue,
											optionValue,
										];
									} else {
										// Remove from array
										newValue = currentValue.filter(
											( v ) => v !== optionValue
										);
									}
									onChange( id, newValue );
								} }
								style={ { margin: '0.25rem 0' } }
								__nextHasNoMarginBottom={ true }
							/>
						);
					} ) }
				</div>
			</div>
		);
	}

	// Handle select fields
	if ( type === 'select' && options.length > 0 ) {
		const selectOptions = options.map( ( opt ) => ( {
			label: opt.label || opt.value,
			value: opt.value,
		} ) );

		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				<SelectControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					options={ selectOptions }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		);
	}

	// Handle textarea fields
	if ( type === 'textarea' ) {
		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				<TextareaControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					placeholder={ placeholder }
					required={ required }
				/>
			</div>
		);
	}

	// Handle URL fields
	if ( type === 'url' ) {
		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				<TextControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					type="url"
					placeholder={ placeholder }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		);
	}

	// Handle email fields
	if ( type === 'email' ) {
		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				<TextControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					type="email"
					placeholder={ placeholder }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		);
	}

	// Handle number fields
	if ( type === 'number' ) {
		return (
			<div
				className={ `aether-provider-field aether-provider-field--${ type } ${
					error ? 'aether-provider-field--error' : ''
				}` }
			>
				<TextControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					type="number"
					placeholder={ placeholder }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		);
	}

	// Default: text field
	return (
		<div
			className={ `aether-provider-field aether-provider-field--${ type } ${
				error ? 'aether-provider-field--error' : ''
			}` }
		>
			<TextControl
				label={ label }
				help={ help }
				value={ value || '' }
				onChange={ ( newValue ) => onChange( id, newValue ) }
				placeholder={ placeholder }
				required={ required }
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
			/>
		</div>
	);
}
