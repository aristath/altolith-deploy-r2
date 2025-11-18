/**
 * Provider Settings Form Hook
 *
 * Shared hook for provider settings form logic.
 * Extracts common patterns from provider Settings components to reduce duplication.
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';
import apiFetch from '../utils/api';
import {
	getProviderSettings,
	updateProviderSettings,
} from '../utils/settingsHelpers';
import { useSuccessTimeout } from './useSuccessTimeout';

/**
 * Hook for provider settings form management.
 *
 * @param {string} providerId Provider ID.
 * @return {Object} Form state and handlers.
 */
export function useProviderSettingsForm( providerId ) {
	const [ settings, setSettings ] = useState( {} );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ success, setSuccess ] = useState( false );
	const { showSuccess, clearSuccess } = useSuccessTimeout();

	// Load existing settings
	useEffect( () => {
		const loadSettings = async () => {
			try {
				setLoading( true );
				const response = await apiFetch( {
					path: '/aether/site-exporter/settings',
				} );

				if ( response?.success && response?.settings ) {
					const providerSettings = getProviderSettings(
						response.settings,
						providerId
					);
					setSettings( ( prev ) => ( {
						...prev,
						...providerSettings,
					} ) );
				}
			} catch ( err ) {
				setError( err.message || 'Failed to load settings' );
			} finally {
				setLoading( false );
			}
		};

		if ( providerId ) {
			loadSettings();
		}
	}, [ providerId ] );

	const handleChange = useCallback(
		( key, value ) => {
			setSettings( ( prev ) => ( {
				...prev,
				[ key ]: value,
			} ) );
			setError( null );
			clearSuccess();
			setSuccess( false );
		},
		[ clearSuccess ]
	);

	const handleSubmit = useCallback(
		async ( e ) => {
			e.preventDefault();

			setSaving( true );
			setError( null );
			setSuccess( false );

			try {
				const allSettingsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings',
				} );

				if ( ! allSettingsResponse?.success ) {
					throw new Error( 'Failed to fetch settings' );
				}

				const allSettings = allSettingsResponse.settings || {};
				const updatedSettings = updateProviderSettings(
					allSettings,
					providerId,
					settings
				);

				// Use the save key and value from updateProviderSettings
				// All providers are now saved to settings.providers[providerId]
				const saveKey = updatedSettings._saveKey || 'providers';
				const saveValue =
					updatedSettings._saveValue || updatedSettings.providers;

				await apiFetch( {
					path: '/aether/site-exporter/settings',
					method: 'POST',
					data: {
						key: saveKey,
						value: saveValue,
					},
				} );

				setSuccess( true );
				showSuccess( () => setSuccess( false ) );

				doAction( 'aether.admin.provider.settings.saved', providerId );
			} catch ( err ) {
				setError( err.message || 'Failed to save settings' );
			} finally {
				setSaving( false );
			}
		},
		[ providerId, settings, showSuccess ]
	);

	return {
		settings,
		loading,
		saving,
		error,
		success,
		handleChange,
		handleSubmit,
	};
}
