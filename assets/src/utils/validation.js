/**
 * Validation Utilities
 *
 * Client-side validation utilities for provider configurations.
 * Can be used with zod schemas once zod is installed.
 *
 * @package
 */

/**
 * Validate a field value based on validation rules.
 *
 * @param {string} value Value to validate.
 * @param {Object} field Field definition with validation rules.
 * @return {string|null} Error message if invalid, null if valid.
 */
export function validateField( value, field ) {
	const { validation, label, required } = field;

	// Check required fields.
	if (
		required &&
		( value === null || value === undefined || value === '' )
	) {
		return `${ label } is required.`;
	}

	// Skip validation if field is empty and not required.
	if ( ! value && ! required ) {
		return null;
	}

	if ( ! validation ) {
		return null;
	}

	// Pattern validation.
	if ( validation.pattern ) {
		const regex = new RegExp( validation.pattern );
		if ( ! regex.test( value ) ) {
			return validation.message || `${ label } format is invalid.`;
		}
	}

	// Min length validation.
	if ( validation.minLength && value.length < validation.minLength ) {
		return `${ label } must be at least ${ validation.minLength } characters.`;
	}

	// Max length validation.
	if ( validation.maxLength && value.length > validation.maxLength ) {
		return `${ label } must be no more than ${ validation.maxLength } characters.`;
	}

	return null;
}

/**
 * Validate a provider configuration.
 *
 * @param {Object} config Configuration object to validate.
 * @param {Array}  fields Array of field definitions.
 * @return {Object} Object with `valid` boolean and `errors` object.
 */
export function validateConfig( config, fields ) {
	const errors = {};

	fields.forEach( ( field ) => {
		const fieldId = field.id;
		const value = config[ fieldId ];
		const error = validateField( value, field );

		if ( error ) {
			errors[ fieldId ] = error;
		}
	} );

	return {
		valid: Object.keys( errors ).length === 0,
		errors,
	};
}
