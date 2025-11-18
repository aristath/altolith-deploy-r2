/**
 * Abstract Provider Base Class
 *
 * Provides common functionality for all providers.
 * JavaScript equivalent of includes/Providers/AbstractProvider.php
 *
 * @package
 */

import { applyFilters, doAction } from '@wordpress/hooks';

/**
 * Provider capability constants
 */
export const CAP_STORAGE = 'storage';
export const CAP_EDGE = 'edge';
export const CAP_MEDIA = 'media';
export const CAP_STATIC_SITE = 'staticSite';

/**
 * Abstract base class for providers.
 *
 * Provides default implementations and helper methods.
 */
export class AbstractProvider {
	/**
	 * Provider configuration.
	 *
	 * @type {Object}
	 */
	config = {};

	/**
	 * Provider capabilities.
	 *
	 * @type {Array<string>}
	 */
	capabilities = [];

	/**
	 * Registered provider ID (overrides getId() if set).
	 *
	 * @type {string|null}
	 */
	registeredId = null;

	/**
	 * Config storage instance.
	 *
	 * @type {Object|null}
	 */
	configStorage = null;

	/**
	 * Constructor.
	 *
	 * @param {Object}      config       Provider configuration.
	 * @param {string|null} registeredId Optional registered provider ID.
	 */
	constructor( config = {}, registeredId = null ) {
		this.config = config;
		this.registeredId = registeredId;
		this.initialize();
	}

	/**
	 * Initialize the provider.
	 *
	 * Called during construction. Subclasses can override to perform setup.
	 */
	initialize() {
		// Default: no initialization needed.
		// Subclasses can override to set up services, etc.
	}

	/**
	 * Get the unique provider identifier.
	 *
	 * Must be overridden by subclasses.
	 *
	 * @abstract
	 * @return {string} Provider ID
	 */
	getId() {
		throw new Error(
			'AbstractProvider.getId() must be implemented by subclass'
		);
	}

	/**
	 * Get the human-readable provider name.
	 *
	 * Must be overridden by subclasses.
	 *
	 * @abstract
	 * @return {string} Provider name
	 */
	getName() {
		throw new Error(
			'AbstractProvider.getName() must be implemented by subclass'
		);
	}

	/**
	 * Get the provider type.
	 *
	 * Must be overridden by subclasses.
	 *
	 * @abstract
	 * @return {string} Provider type
	 */
	getType() {
		throw new Error(
			'AbstractProvider.getType() must be implemented by subclass'
		);
	}

	/**
	 * Get the provider description.
	 *
	 * Must be overridden by subclasses.
	 *
	 * @abstract
	 * @return {string} Provider description
	 */
	getDescription() {
		throw new Error(
			'AbstractProvider.getDescription() must be implemented by subclass'
		);
	}

	/**
	 * Get the provider icon.
	 *
	 * Can be a dashicons class, emoji, SVG path, or URL.
	 *
	 * @abstract
	 * @return {string} Provider icon
	 */
	getIcon() {
		return '📦'; // Default generic icon
	}

	/**
	 * Get the capabilities this provider supports.
	 *
	 * @return {Array<string>} Array of capability constants
	 */
	getCapabilities() {
		return this.capabilities;
	}

	/**
	 * Check if this provider supports a specific capability.
	 *
	 * @param {string} capability Capability constant to check.
	 * @return {boolean} True if supported, false otherwise
	 */
	supportsCapability( capability ) {
		return this.getCapabilities().includes( capability );
	}

	/**
	 * Get the provider configuration.
	 *
	 * Returns the current configuration array for this provider.
	 *
	 * @return {Promise<Object>} Configuration object
	 */
	async getConfig() {
		if ( Object.keys( this.config ).length === 0 ) {
			this.config = await this.loadConfig();
		}

		/**
		 * Filter provider configuration after loading.
		 *
		 * Allows modification of configuration before returning to caller.
		 *
		 * @param {Object} config     Provider configuration.
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('aether.provider.config.get', 'my-plugin', (config, providerId) => {
		 *     if (providerId === 'my-provider') {
		 *         config.customField = 'modified value';
		 *     }
		 *     return config;
		 * });
		 */
		return applyFilters(
			'aether.provider.config.get',
			this.config,
			this.getId()
		);
	}

	/**
	 * Save the provider configuration.
	 *
	 * @param {Object} config Configuration object to save.
	 * @return {Promise<boolean>} True if saved successfully
	 */
	async saveConfig( config ) {
		/**
		 * Filter provider configuration before validation.
		 *
		 * Allows modification of config before validation and saving.
		 *
		 * @param {Object} config     Configuration to save.
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('aether.provider.config.before_save', 'my-plugin', (config, providerId) => {
		 *     if (providerId === 'my-provider') {
		 *         config.auto_generated_field = Date.now();
		 *     }
		 *     return config;
		 * });
		 */
		config = applyFilters(
			'aether.provider.config.before_save',
			config,
			this.getId()
		);

		// Validate configuration
		const errors = await this.validateConfig( config );
		if ( Object.keys( errors ).length > 0 ) {
			throw new Error(
				'Configuration validation failed: ' + JSON.stringify( errors )
			);
		}

		// Sanitize configuration
		const sanitized = await this.sanitizeConfig( config );

		// Save via config storage
		const storage = await this.getConfigStorage();
		const result = await storage.save( sanitized );

		if ( result ) {
			this.config = sanitized;

			/**
			 * Action fired after provider configuration is saved successfully.
			 *
			 * @param {Object} config     Saved configuration.
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.provider.config.saved', 'my-plugin', (config, providerId) => {
			 *     console.log(`Provider ${providerId} configuration saved`);
			 * });
			 */
			doAction( 'aether.provider.config.saved', sanitized, this.getId() );
		}

		return result;
	}

	/**
	 * Delete the provider configuration.
	 *
	 * @return {Promise<boolean>} True if deleted successfully
	 */
	async deleteConfig() {
		/**
		 * Action fired before provider configuration is deleted.
		 *
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addAction } from '@wordpress/hooks';
		 *
		 * addAction('aether.provider.config.before_delete', 'my-plugin', (providerId) => {
		 *     console.log(`Deleting configuration for ${providerId}`);
		 * });
		 */
		doAction( 'aether.provider.config.before_delete', this.getId() );

		const storage = await this.getConfigStorage();
		const result = await storage.delete();

		if ( result ) {
			this.config = {};

			/**
			 * Action fired after provider configuration is deleted.
			 *
			 * @param {string} providerId Provider ID.
			 *
			 * @example
			 * import { addAction } from '@wordpress/hooks';
			 *
			 * addAction('aether.provider.config.deleted', 'my-plugin', (providerId) => {
			 *     console.log(`Configuration deleted for ${providerId}`);
			 * });
			 */
			doAction( 'aether.provider.config.deleted', this.getId() );
		}

		return result;
	}

	/**
	 * Check if the provider is properly configured.
	 *
	 * @return {Promise<boolean>} True if configured
	 */
	async isConfigured() {
		const config = await this.getConfig();
		if ( Object.keys( config ).length === 0 ) {
			return false;
		}

		// Check that all required fields are present
		const fields = this.getConfigFields();
		for ( const field of fields ) {
			if ( field.required && ! config[ field.id ] ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Validate the provider configuration.
	 *
	 * @param {Object} config Configuration object to validate.
	 * @return {Promise<Object>} Validation errors object (empty if valid)
	 */
	async validateConfig( config ) {
		const errors = {};
		const fields = this.getConfigFields();

		for ( const field of fields ) {
			const fieldId = field.id;
			const value = config[ fieldId ];

			// Check required fields
			if ( field.required && ! value ) {
				errors[ fieldId ] = `${ field.label } is required.`;
				continue;
			}

			// Skip validation if field is empty and not required
			if ( ! value ) {
				continue;
			}

			// Type validation
			if ( field.validation ) {
				const validation = field.validation;

				// Pattern validation
				if ( validation.pattern ) {
					const regex = new RegExp( validation.pattern );
					if ( ! regex.test( value ) ) {
						errors[ fieldId ] =
							validation.message ||
							`${ field.label } format is invalid.`;
					}
				}

				// Min length validation
				if (
					validation.minLength !== undefined &&
					value.length < validation.minLength
				) {
					errors[
						fieldId
					] = `${ field.label } must be at least ${ validation.minLength } characters.`;
				}

				// Max length validation
				if (
					validation.maxLength !== undefined &&
					value.length > validation.maxLength
				) {
					errors[
						fieldId
					] = `${ field.label } must be no more than ${ validation.maxLength } characters.`;
				}

				// Custom validator callback
				if (
					validation.callback &&
					typeof validation.callback === 'function'
				) {
					const result = await validation.callback( value, config );
					if ( typeof result === 'string' ) {
						errors[ fieldId ] = result;
					}
				}
			}
		}

		/**
		 * Filter validation errors before returning.
		 *
		 * Allows adding or removing validation errors.
		 *
		 * @param {Object} errors     Validation errors object.
		 * @param {Object} config     Configuration being validated.
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('aether.provider.config.validate', 'my-plugin', (errors, config, providerId) => {
		 *     if (providerId === 'my-provider' && config.field1 === config.field2) {
		 *         errors.field2 = 'Field 2 must be different from Field 1';
		 *     }
		 *     return errors;
		 * });
		 */
		return applyFilters(
			'aether.provider.config.validate',
			errors,
			config,
			this.getId()
		);
	}

	/**
	 * Sanitize the provider configuration.
	 *
	 * @param {Object} config Configuration object to sanitize.
	 * @return {Promise<Object>} Sanitized configuration
	 */
	async sanitizeConfig( config ) {
		const sanitized = {};
		const fields = this.getConfigFields();

		for ( const field of fields ) {
			const fieldId = field.id;
			if ( ! ( fieldId in config ) ) {
				continue;
			}

			let value = config[ fieldId ];
			const type = field.type || 'text';

			// Sanitize based on type
			switch ( type ) {
				case 'password':
				case 'text':
				case 'textarea':
					value = String( value ).trim();
					break;

				case 'email':
					value = String( value ).trim().toLowerCase();
					break;

				case 'url':
					value = String( value ).trim();
					// Remove trailing slash
					value = value.replace( /\/$/, '' );
					break;

				case 'checkbox':
					value = Boolean( value );
					break;

				case 'number':
					value = Number( value ) || 0;
					break;

				case 'select':
					// Ensure value is in allowed options
					const options = ( field.options || [] ).map(
						( opt ) => opt.value
					);
					if ( options.includes( value ) ) {
						sanitized[ fieldId ] = value;
					}
					continue;

				default:
					value = String( value ).trim();
					break;
			}

			sanitized[ fieldId ] = value;

			// Note: Encryption of sensitive fields handled server-side via REST API
		}

		/**
		 * Filter sanitized configuration before returning.
		 *
		 * Allows custom sanitization logic for specific fields.
		 *
		 * @param {Object} sanitized  Sanitized configuration.
		 * @param {Object} config     Original configuration.
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('aether.provider.config.sanitize', 'my-plugin', (sanitized, config, providerId) => {
		 *     if (providerId === 'my-provider' && sanitized.url) {
		 *         // Ensure URL always ends with slash
		 *         sanitized.url = sanitized.url.replace(/\/?$/, '/');
		 *     }
		 *     return sanitized;
		 * });
		 */
		return applyFilters(
			'aether.provider.config.sanitize',
			sanitized,
			config,
			this.getId()
		);
	}

	/**
	 * Get configuration fields for this provider.
	 *
	 * Must be overridden by subclasses.
	 *
	 * @abstract
	 * @return {Array<Object>} Array of field definitions
	 */
	getConfigFields() {
		return [];
	}

	/**
	 * Deploy edge worker/function.
	 *
	 * Default implementation for non-edge providers.
	 * Edge-capable providers should override this.
	 *
	 * @return {Promise<Object>} Deployment result
	 */
	async deploy() {
		return {
			success: true,
			message: 'No deployment needed for this provider.',
		};
	}

	/**
	 * Get provider status.
	 *
	 * @return {Promise<Object>} Status object
	 */
	async getStatus() {
		const configured = await this.isConfigured();
		return {
			configured,
			healthy: configured, // Default: healthy if configured
		};
	}

	/**
	 * Get settings URL for this provider.
	 *
	 * @return {string} Settings URL
	 */
	getSettingsUrl() {
		return `admin.php?page=aether#/settings/provider/${ this.getId() }`;
	}

	/**
	 * Get documentation URL for this provider.
	 *
	 * @return {string} Documentation URL
	 */
	getDocumentationUrl() {
		return `https://docs.aether.dev/providers/${ this.getId() }`;
	}

	/**
	 * Get provider metadata.
	 *
	 * Returns all provider information for UI rendering.
	 *
	 * @return {Object} Metadata object
	 */
	getMetadata() {
		const metadata = {
			id: this.getId(),
			name: this.getName(),
			type: this.getType(),
			description: this.getDescription(),
			icon: this.getIcon(),
			capabilities: this.getCapabilities(),
			configFields: this.getConfigFields(),
			settingsUrl: this.getSettingsUrl(),
			documentationUrl: this.getDocumentationUrl(),
		};

		/**
		 * Filter provider metadata before returning.
		 *
		 * Allows modification of provider metadata for UI rendering.
		 *
		 * @param {Object} metadata   Provider metadata.
		 * @param {string} providerId Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('aether.provider.metadata', 'my-plugin', (metadata, providerId) => {
		 *     if (providerId === 'my-provider') {
		 *         metadata.customField = 'custom value';
		 *     }
		 *     return metadata;
		 * });
		 */
		return applyFilters(
			'aether.provider.metadata',
			metadata,
			this.getId()
		);
	}

	/**
	 * Get deployment URL for this provider.
	 *
	 * Default implementation checks common field names.
	 *
	 * @return {Promise<string>} Deployment URL or empty string
	 */
	async getDeploymentUrl() {
		const config = await this.getConfig();

		let deploymentUrl = '';

		// Check pages_url first (for providers with hosted pages)
		if ( config.pages_url ) {
			deploymentUrl = config.pages_url;
		}
		// Check worker_endpoint (R2, Spaces)
		else if ( config.worker_endpoint ) {
			deploymentUrl = config.worker_endpoint;
		}
		// Fallback to public_url (R2 custom domain)
		else if ( config.public_url ) {
			deploymentUrl = config.public_url;
		}

		/**
		 * Filter deployment URL for a provider.
		 *
		 * Allows customization of the deployment URL.
		 *
		 * @param {string} deploymentUrl Deployment URL.
		 * @param {Object} config        Provider configuration.
		 * @param {string} providerId    Provider ID.
		 *
		 * @example
		 * import { addFilter } from '@wordpress/hooks';
		 *
		 * addFilter('aether.provider.deployment_url', 'my-plugin', (url, config, providerId) => {
		 *     if (providerId === 'my-provider') {
		 *         return config.custom_url || url;
		 *     }
		 *     return url;
		 * });
		 */
		return applyFilters(
			'aether.provider.deployment_url',
			deploymentUrl,
			config,
			this.getId()
		);
	}

	/**
	 * Get the upload strategy for this provider.
	 *
	 * Determines how files should be uploaded to this provider.
	 * Providers should override this method to specify their upload strategy.
	 *
	 * @return {string} Upload strategy: 'git', 'storage', 'direct', or 'api'
	 *
	 * Strategies:
	 * - 'git': Uses Git-based upload
	 * - 'storage': Uses object storage upload (R2, S3, Spaces)
	 * - 'direct': Direct HTTP upload to provider API
	 * - 'api': Uses provider-specific API for uploads
	 */
	getUploadStrategy() {
		// Default: assume storage-based upload
		// Providers should override this method
		return 'storage';
	}

	/**
	 * Upload a file to the provider.
	 *
	 * Abstract method that providers must implement to upload files.
	 * For local providers, this might be a file copy operation.
	 * For remote providers, this would be an actual upload to the remote host.
	 *
	 * @abstract
	 * @param {string} sourcePath      Local file path to upload.
	 * @param {string} destinationPath Destination path/key where file should be stored.
	 * @param {Object} options         Optional upload options.
	 * @return {Promise<Object>} Upload result with success status and URL.
	 */
	async uploadFile( sourcePath, destinationPath, options = {} ) {
		// Options parameter kept for API consistency, but not used in abstract implementation
		// eslint-disable-next-line no-unused-vars
		const _unused = options;
		throw new Error(
			'AbstractProvider.uploadFile() must be implemented by subclass'
		);
	}

	/**
	 * Load configuration from storage.
	 *
	 * @protected
	 * @return {Promise<Object>} Configuration object
	 */
	async loadConfig() {
		const storage = await this.getConfigStorage();
		return storage.load();
	}

	/**
	 * Get config storage instance.
	 *
	 * Lazy-loads the ConfigStorage class.
	 *
	 * @protected
	 * @return {Promise<Object>} Config storage instance
	 */
	async getConfigStorage() {
		if ( ! this.configStorage ) {
			// Lazy load to avoid circular dependencies
			const { ConfigStorage } = await import( '../utils/configStorage' );
			this.configStorage = new ConfigStorage( this.getId() );
		}
		return this.configStorage;
	}

	/**
	 * Get a configuration value.
	 *
	 * @protected
	 * @param {string} key          Configuration key.
	 * @param {*}      defaultValue Default value if key doesn't exist.
	 * @return {Promise<*>} Configuration value
	 */
	async getConfigValue( key, defaultValue = null ) {
		const config = await this.getConfig();
		return config[ key ] !== undefined ? config[ key ] : defaultValue;
	}

	/**
	 * Check if a configuration value is set and not empty.
	 *
	 * @protected
	 * @param {string} key Configuration key.
	 * @return {Promise<boolean>} True if set and not empty
	 */
	async hasConfigValue( key ) {
		const config = await this.getConfig();
		return Boolean( config[ key ] );
	}

	/**
	 * Get specific config fields by IDs.
	 *
	 * Helper method to filter config fields by their IDs.
	 * Preserves order of fieldIds array.
	 *
	 * @protected
	 * @param {Array<string>} fieldIds Array of field IDs to retrieve.
	 * @return {Array<Object>} Filtered field definitions
	 */
	getFieldsById( fieldIds ) {
		const allFields = this.getConfigFields();
		const indexedFields = {};

		// Index fields by ID for quick lookup
		allFields.forEach( ( field ) => {
			const fieldKey = field.id || field.name || '';
			if ( fieldKey ) {
				indexedFields[ fieldKey ] = field;
			}
		} );

		// Build result in the order specified by fieldIds
		return fieldIds
			.filter( ( id ) => indexedFields[ id ] )
			.map( ( id ) => indexedFields[ id ] );
	}

	/**
	 * Render custom settings UI.
	 *
	 * Optional method that providers can override to render custom settings UI.
	 * If not overridden, the default ProviderSettings component will be used.
	 *
	 * @param {HTMLElement} container Container element to render into.
	 * @param {Function}    onSave    Callback to call after successful save.
	 * @return {void|null} Returns null to indicate no custom rendering (default behavior).
	 */
	// eslint-disable-next-line no-unused-vars
	renderSettings( container, onSave ) {
		// Default: return null to indicate no custom rendering
		// ProviderSettings component will be used instead
		return null;
	}

	/**
	 * Check if provider has custom settings rendering.
	 *
	 * @return {boolean} True if provider implements custom renderSettings
	 */
	hasCustomSettings() {
		// Check if renderSettings was overridden by subclass
		return (
			this.renderSettings !== AbstractProvider.prototype.renderSettings
		);
	}
}

export default AbstractProvider;
