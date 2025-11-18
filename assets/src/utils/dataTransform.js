/**
 * Data Transformation Utilities
 *
 * Utilities for transforming data structures in React.
 * Uses lodash (available globally in WordPress) for data manipulation.
 *
 * @package
 */

/**
 * Flatten nested settings object for form compatibility.
 *
 * @param {Object} settings Nested settings object.
 * @return {Object} Flattened settings object.
 */
export function flattenSettings( settings ) {
	const flattened = {};

	// Flatten storage provider configuration.
	if ( settings.activeProvider ) {
		flattened.storageProvider = settings.activeProvider;

		if (
			settings.providers &&
			settings.providers[ settings.activeProvider ]
		) {
			const providerConfig =
				settings.providers[ settings.activeProvider ];
			Object.keys( providerConfig ).forEach( ( key ) => {
				const value = providerConfig[ key ];
				// Skip encrypted values.
				if (
					typeof value === 'string' &&
					value.startsWith( 'encrypted:' )
				) {
					return;
				}
				flattened[ key ] = value;
			} );
		}
	}

	// Flatten edge provider configuration from provider_types.
	const providerTypes = settings.provider_types || {};
	if ( providerTypes.edge && settings.providers?.[ providerTypes.edge ] ) {
		flattened.edgeProvider = providerTypes.edge;
		const edgeConfig = settings.providers[ providerTypes.edge ];
		Object.keys( edgeConfig ).forEach( ( key ) => {
			const value = edgeConfig[ key ];
			// Skip encrypted values.
			if (
				typeof value === 'string' &&
				value.startsWith( 'encrypted:' )
			) {
				return;
			}
			flattened[ key ] = value;
		} );
	}

	// Flatten media offloading configuration.
	if ( settings.media && typeof settings.media === 'object' ) {
		Object.keys( settings.media ).forEach( ( key ) => {
			const value = settings.media[ key ];
			// Skip encrypted values.
			if (
				typeof value === 'string' &&
				value.startsWith( 'encrypted:' )
			) {
				return;
			}
			// Prefix media config keys to avoid collisions.
			// Convert key to camelCase prefix: enabled -> mediaEnabled, provider -> mediaProvider
			flattened[
				'media' + key.charAt( 0 ).toUpperCase() + key.slice( 1 )
			] = value;
		} );
	}

	return flattened;
}

/**
 * Unflatten settings object back to nested structure.
 *
 * @param {Object} flattened Flattened settings object.
 * @return {Object} Nested settings object.
 */
export function unflattenSettings( flattened ) {
	const settings = {
		providers: {},
		media: {},
		usage: {},
		provider_types: {},
	};

	// Unflatten edge provider.
	if ( flattened.edgeProvider ) {
		settings.provider_types.edge = flattened.edgeProvider;
		const edgeConfig = {};
		[ 'account_id', 'api_token', 'team_id' ].forEach( ( key ) => {
			if ( flattened[ key ] !== undefined ) {
				edgeConfig[ key ] = flattened[ key ];
			}
		} );
		if ( Object.keys( edgeConfig ).length > 0 ) {
			settings.providers[ flattened.edgeProvider ] = edgeConfig;
		}
	}

	// Unflatten storage provider.
	if ( flattened.storageProvider ) {
		settings.activeProvider = flattened.storageProvider;
		settings.usage.blueprintProvider = flattened.storageProvider;

		const providerConfig = {};
		// Get all keys that belong to this provider (not prefixed with media).
		Object.keys( flattened ).forEach( ( key ) => {
			// Skip media-prefixed keys (mediaEnabled, mediaProvider, etc.)
			const isMediaPrefixed =
				key.startsWith( 'media' ) &&
				key.length > 5 &&
				key.charAt( 5 ) === key.charAt( 5 ).toUpperCase();

			if (
				! isMediaPrefixed &&
				key !== 'edgeProvider' &&
				key !== 'storageProvider' &&
				key !== 'account_id' &&
				key !== 'api_token' &&
				key !== 'team_id'
			) {
				providerConfig[ key ] = flattened[ key ];
			}
		} );

		if ( Object.keys( providerConfig ).length > 0 ) {
			settings.providers[ flattened.storageProvider ] = providerConfig;
		}
	}

	// Unflatten media configuration.
	Object.keys( flattened ).forEach( ( key ) => {
		if (
			key.startsWith( 'media' ) &&
			key.length > 5 &&
			key.charAt( 5 ) === key.charAt( 5 ).toUpperCase()
		) {
			// Extract the media key: mediaEnabled -> enabled, mediaProvider -> provider
			const mediaKey =
				key.slice( 5 ).charAt( 0 ).toLowerCase() +
				key.slice( 5 ).slice( 1 );
			settings.media[ mediaKey ] = flattened[ key ];
		}
	} );

	return settings;
}
