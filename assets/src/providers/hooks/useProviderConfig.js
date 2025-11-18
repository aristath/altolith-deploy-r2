/**
 * useProviderConfig Hook
 *
 * React hook for managing provider configuration.
 * Handles loading, saving, validating, and deleting provider configs.
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { useProvider } from './useProvider';
import { debugError } from '../../utils/debug';

/**
 * Manage provider configuration.
 *
 * Provides config state, loading/saving functions, and validation.
 *
 * @param {string} providerId Provider ID.
 * @return {Object} Config state and management functions
 */
export function useProviderConfig( providerId ) {
	const {
		provider,
		isLoading: providerLoading,
		error: providerError,
	} = useProvider( providerId );

	const [ config, setConfig ] = useState( {} );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isConfigured, setIsConfigured ] = useState( false );
	const [ errors, setErrors ] = useState( {} );
	const [ saveError, setSaveError ] = useState( null );

	/**
	 * Load configuration from provider.
	 */
	const loadConfig = useCallback( async () => {
		if ( ! provider ) {
			return;
		}

		setIsLoading( true );
		setErrors( {} );

		try {
			const loadedConfig = await provider.getConfig();
			setConfig( loadedConfig );

			const configured = await provider.isConfigured();
			setIsConfigured( configured );
		} catch ( error ) {
			debugError( 'Failed to load provider config:', error );
			setConfig( {} );
			setIsConfigured( false );
		} finally {
			setIsLoading( false );
		}
	}, [ provider ] );

	/**
	 * Save configuration to provider.
	 *
	 * @param {Object} newConfig Configuration object to save.
	 * @return {Promise<boolean>} True if saved successfully
	 */
	const saveConfig = useCallback(
		async ( newConfig ) => {
			if ( ! provider ) {
				return false;
			}

			setIsSaving( true );
			setErrors( {} );
			setSaveError( null );

			try {
				// Validate configuration
				const validationErrors =
					await provider.validateConfig( newConfig );
				if ( Object.keys( validationErrors ).length > 0 ) {
					setErrors( validationErrors );
					return false;
				}

				// Save configuration
				const result = await provider.saveConfig( newConfig );

				if ( result ) {
					setConfig( newConfig );
					setIsConfigured( true );
				}

				return result;
			} catch ( error ) {
				debugError( 'Failed to save provider config:', error );
				setSaveError( error );
				return false;
			} finally {
				setIsSaving( false );
			}
		},
		[ provider ]
	);

	/**
	 * Update a single configuration value.
	 *
	 * Updates local state only - call saveConfig() to persist.
	 *
	 * @param {string} key   Configuration key.
	 * @param {*}      value Configuration value.
	 */
	const updateConfigValue = useCallback( ( key, value ) => {
		setConfig( ( prevConfig ) => ( {
			...prevConfig,
			[ key ]: value,
		} ) );

		// Clear error for this field
		setErrors( ( prevErrors ) => {
			const newErrors = { ...prevErrors };
			delete newErrors[ key ];
			return newErrors;
		} );
	}, [] );

	/**
	 * Validate current configuration without saving.
	 *
	 * @param {Object} configToValidate Optional config to validate (defaults to current config).
	 * @return {Promise<Object>} Validation errors object
	 */
	const validateConfig = useCallback(
		async ( configToValidate = null ) => {
			if ( ! provider ) {
				return {};
			}

			try {
				const validationErrors = await provider.validateConfig(
					configToValidate || config
				);
				setErrors( validationErrors );
				return validationErrors;
			} catch ( error ) {
				debugError( 'Failed to validate config:', error );
				return {};
			}
		},
		[ provider, config ]
	);

	/**
	 * Delete provider configuration.
	 *
	 * @return {Promise<boolean>} True if deleted successfully
	 */
	const deleteConfig = useCallback( async () => {
		if ( ! provider ) {
			return false;
		}

		setIsSaving( true );
		setSaveError( null );

		try {
			const result = await provider.deleteConfig();

			if ( result ) {
				setConfig( {} );
				setIsConfigured( false );
				setErrors( {} );
			}

			return result;
		} catch ( error ) {
			debugError( 'Failed to delete provider config:', error );
			setSaveError( error );
			return false;
		} finally {
			setIsSaving( false );
		}
	}, [ provider ] );

	/**
	 * Reset configuration to currently saved state.
	 */
	const resetConfig = useCallback( () => {
		loadConfig();
	}, [ loadConfig ] );

	// Load config when provider becomes available
	useEffect( () => {
		if ( provider ) {
			loadConfig();
		}
	}, [ provider, loadConfig ] );

	return {
		config,
		setConfig,
		isLoading: providerLoading || isLoading,
		isSaving,
		isConfigured,
		errors,
		saveError,
		providerError,
		saveConfig,
		updateConfigValue,
		validateConfig,
		deleteConfig,
		resetConfig,
		refresh: loadConfig,
	};
}

/**
 * Get a specific configuration value for a provider.
 *
 * @param {string} providerId   Provider ID.
 * @param {string} key          Configuration key.
 * @param {*}      defaultValue Default value if key doesn't exist.
 * @return {{value: *, isLoading: boolean}} Configuration value and loading state
 */
export function useProviderConfigValue( providerId, key, defaultValue = null ) {
	const { config, isLoading } = useProviderConfig( providerId );

	const value = config[ key ] !== undefined ? config[ key ] : defaultValue;

	return {
		value,
		isLoading,
	};
}

/**
 * Check if a provider is configured.
 *
 * @param {string} providerId Provider ID.
 * @return {{isConfigured: boolean, isLoading: boolean}} Configuration status and loading state
 */
export function useIsProviderConfigured( providerId ) {
	const { isConfigured, isLoading } = useProviderConfig( providerId );

	return {
		isConfigured,
		isLoading,
	};
}

export default useProviderConfig;
