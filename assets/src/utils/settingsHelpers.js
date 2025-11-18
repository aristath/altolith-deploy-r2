/**
 * Settings Helper Utilities
 *
 * Utilities for working with settings API (no dot notation).
 *
 * @package
 */

/**
 * Get provider settings from full settings object.
 *
 * Providers are stored in settings.providers[providerId].
 *
 * @param {Object} settings   Full settings object from API.
 * @param {string} providerId Provider ID.
 * @return {Object} Provider settings object.
 */
export function getProviderSettings( settings, providerId ) {
	// All providers are stored in settings.providers[providerId]
	return settings?.providers?.[ providerId ] || {};
}

/**
 * Update provider settings in full settings object.
 *
 * Providers are saved to settings.providers[providerId].
 *
 * @param {Object} allSettings      Full settings object.
 * @param {string} providerId       Provider ID.
 * @param {Object} providerSettings Provider settings to update.
 * @return {Object} Updated full settings object with saveKey and saveValue.
 */
export function updateProviderSettings(
	allSettings,
	providerId,
	providerSettings
) {
	// All providers: save to settings.providers[providerId]
	return {
		...allSettings,
		providers: {
			...( allSettings.providers || {} ),
			[ providerId ]: providerSettings,
		},
		_saveKey: 'providers',
		_saveValue: {
			...( allSettings.providers || {} ),
			[ providerId ]: providerSettings,
		},
	};
}
