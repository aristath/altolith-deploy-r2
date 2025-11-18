/**
 * Config Field Builder
 *
 * Provides a fluent interface for defining configuration fields.
 * JavaScript equivalent of includes/Providers/ConfigFieldBuilder.php
 *
 * Example usage:
 * ```javascript
 * const field = ConfigFieldBuilder.text('api_key')
 *     .label('API Key')
 *     .description('Your API key from the provider')
 *     .required()
 *     .placeholder('Enter your API key')
 *     .pattern('[A-Za-z0-9]+')
 *     .build();
 * ```
 *
 * @package
 */

/**
 * ConfigFieldBuilder class
 *
 * Provides a fluent interface for building field configurations.
 */
export class ConfigFieldBuilder {
	/**
	 * Field configuration object
	 *
	 * @type {Object}
	 */
	field = {};

	/**
	 * Private constructor to enforce factory methods
	 *
	 * @param {string} name Field name/key.
	 * @param {string} type Field type.
	 */
	constructor( name, type ) {
		this.field = {
			name,
			type,
		};
	}

	/**
	 * Create a text field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static text( name ) {
		return new ConfigFieldBuilder( name, 'text' );
	}

	/**
	 * Create a password field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static password( name ) {
		return new ConfigFieldBuilder( name, 'password' );
	}

	/**
	 * Create a select field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static select( name ) {
		return new ConfigFieldBuilder( name, 'select' );
	}

	/**
	 * Create a textarea field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static textarea( name ) {
		return new ConfigFieldBuilder( name, 'textarea' );
	}

	/**
	 * Create a checkbox field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static checkbox( name ) {
		return new ConfigFieldBuilder( name, 'checkbox' );
	}

	/**
	 * Create a number field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static number( name ) {
		return new ConfigFieldBuilder( name, 'number' );
	}

	/**
	 * Create an email field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static email( name ) {
		return new ConfigFieldBuilder( name, 'email' );
	}

	/**
	 * Create a URL field
	 *
	 * @param {string} name Field name/key.
	 * @return {ConfigFieldBuilder} Builder instance
	 */
	static url( name ) {
		return new ConfigFieldBuilder( name, 'url' );
	}

	/**
	 * Set the field label
	 *
	 * @param {string} label Field label for display.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	label( label ) {
		this.field.label = label;
		return this;
	}

	/**
	 * Set the field description
	 *
	 * @param {string} description Help text for the field.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	description( description ) {
		this.field.description = description;
		return this;
	}

	/**
	 * Mark field as required
	 *
	 * @param {boolean} required Whether field is required.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	required( required = true ) {
		this.field.required = required;
		return this;
	}

	/**
	 * Set validation pattern (regex)
	 *
	 * @param {string} pattern Regular expression pattern.
	 * @param {string} message Optional error message for pattern mismatch.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	pattern( pattern, message = '' ) {
		if ( ! this.field.validation ) {
			this.field.validation = {};
		}
		this.field.validation.pattern = pattern;
		if ( message ) {
			this.field.validation.message = message;
		}
		return this;
	}

	/**
	 * Set placeholder text
	 *
	 * @param {string} placeholder Placeholder text.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	placeholder( placeholder ) {
		this.field.placeholder = placeholder;
		return this;
	}

	/**
	 * Set default value
	 *
	 * @param {*} value Default value.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	default( value ) {
		this.field.default = value;
		return this;
	}

	/**
	 * Set options for select field
	 *
	 * @param {Array<{value: string, label: string}>} options Array of option objects.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	options( options ) {
		this.field.options = options;
		return this;
	}

	/**
	 * Set minimum value/length
	 *
	 * @param {number} min Minimum value for number fields or minimum length for text.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	min( min ) {
		if ( ! this.field.validation ) {
			this.field.validation = {};
		}
		this.field.validation.minLength = min;
		this.field.min = min; // Also set for HTML input
		return this;
	}

	/**
	 * Set maximum value/length
	 *
	 * @param {number} max Maximum value for number fields or maximum length for text.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	max( max ) {
		if ( ! this.field.validation ) {
			this.field.validation = {};
		}
		this.field.validation.maxLength = max;
		this.field.max = max; // Also set for HTML input
		return this;
	}

	/**
	 * Set step for number fields
	 *
	 * @param {number} step Step value for number inputs.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	step( step ) {
		this.field.step = step;
		return this;
	}

	/**
	 * Set rows for textarea
	 *
	 * @param {number} rows Number of visible text rows.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	rows( rows ) {
		this.field.rows = rows;
		return this;
	}

	/**
	 * Mark field as sensitive (for passwords, API keys, etc.)
	 *
	 * Note: Actual encryption happens server-side via REST API
	 *
	 * @param {boolean} sensitive Whether field contains sensitive data.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	sensitive( sensitive = true ) {
		this.field.sensitive = sensitive;
		return this;
	}

	/**
	 * Set custom validation callback
	 *
	 * @param {Function} callback Validation callback that receives value and returns string (error) or null (valid).
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	validate( callback ) {
		if ( ! this.field.validation ) {
			this.field.validation = {};
		}
		this.field.validation.callback = callback;
		return this;
	}

	/**
	 * Set custom sanitization callback
	 *
	 * @param {Function} callback Sanitization callback that receives and returns value.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	sanitize( callback ) {
		this.field.sanitize = callback;
		return this;
	}

	/**
	 * Add conditional visibility
	 *
	 * @param {string} dependsOn Field name this field depends on.
	 * @param {*}      value     Value the dependent field must have.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	showIf( dependsOn, value ) {
		this.field.showIf = {
			field: dependsOn,
			value,
		};
		return this;
	}

	/**
	 * Set field group (for grouping related fields)
	 *
	 * @param {string} group Group identifier.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	group( group ) {
		this.field.group = group;
		return this;
	}

	/**
	 * Add CSS class to field
	 *
	 * @param {string} className CSS class name.
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	cssClass( className ) {
		this.field.class = className;
		return this;
	}

	/**
	 * Set field width (for layout)
	 *
	 * @param {string} width Width value (e.g., '50%', '200px', 'half').
	 * @return {ConfigFieldBuilder} This instance for chaining
	 */
	width( width ) {
		this.field.width = width;
		return this;
	}

	/**
	 * Build and return the field configuration object
	 *
	 * @return {Object} The complete field configuration
	 */
	build() {
		// Set default label if not provided
		if ( ! this.field.label ) {
			this.field.label = this.field.name
				.replace( /[_-]/g, ' ' )
				.replace( /\b\w/g, ( char ) => char.toUpperCase() );
		}

		// Set 'id' as an alias for 'name'
		if ( ! this.field.id ) {
			this.field.id = this.field.name;
		}

		return { ...this.field };
	}

	/**
	 * Create multiple fields at once
	 *
	 * @param {Array<ConfigFieldBuilder>} builders Array of ConfigFieldBuilder instances.
	 * @return {Array<Object>} Array of built field configurations
	 */
	static buildAll( builders ) {
		return builders.map( ( builder ) => builder.build() );
	}
}

export default ConfigFieldBuilder;
