/**
 * Standard Response Format Utility
 *
 * Provides standardized response object format for all API operations.
 * Eliminates inconsistent response structures across the codebase.
 *
 * Standard format:
 * {
 *   success: boolean,
 *   data?: any,           // Success data
 *   error?: string,       // Single error message
 *   errors?: string[]     // Multiple errors (optional)
 * }
 *
 * @package
 */

/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
export function createSuccessResponse( data = null, message = null ) {
	const response = {
		success: true,
		data,
	};

	// Add message to data if provided
	if ( message && typeof data === 'object' && data !== null ) {
		response.data = { ...data, message };
	} else if ( message ) {
		response.data = { message };
	}

	return response;
}

/**
 * Create an error response.
 *
 * @param {string|Error} error  Error message or Error object.
 * @param {Array}        errors Optional array of multiple errors.
 * @return {Object} Standardized error response.
 */
export function createErrorResponse( error, errors = null ) {
	const errorMessage =
		typeof error === 'string' ? error : error?.message || 'Unknown error';

	const response = {
		success: false,
		error: errorMessage,
	};

	if ( errors && Array.isArray( errors ) && errors.length > 0 ) {
		response.errors = errors;
	}

	return response;
}

/**
 * Normalize a response to standard format.
 *
 * Takes various response formats and converts to standard format.
 *
 * @param {Object} response Response to normalize.
 * @return {Object} Normalized response in standard format.
 */
export function normalizeResponse( response ) {
	// Already in standard format
	if (
		response &&
		typeof response.success === 'boolean' &&
		( response.data !== undefined || response.error !== undefined )
	) {
		return response;
	}

	// Format with error field
	if ( response && response.error ) {
		return createErrorResponse( response.error, response.errors );
	}

	// Format with success=true but no data field
	if ( response && response.success === true ) {
		// Extract data from non-standard fields
		const { success, error, errors, ...data } = response;
		return createSuccessResponse( data );
	}

	// Format with success=false
	if ( response && response.success === false ) {
		return createErrorResponse(
			response.message || response.error || 'Operation failed',
			response.errors
		);
	}

	// Fallback for unknown format
	return response;
}

/**
 * Check if response indicates success.
 *
 * @param {Object} response Response object.
 * @return {boolean} True if successful.
 */
export function isSuccessResponse( response ) {
	return response?.success === true;
}

/**
 * Check if response indicates error.
 *
 * @param {Object} response Response object.
 * @return {boolean} True if error.
 */
export function isErrorResponse( response ) {
	return response?.success === false;
}

/**
 * Get data from response.
 *
 * @param {Object} response Response object.
 * @param {*}      fallback Fallback value if no data.
 * @return {*} Response data or fallback.
 */
export function getResponseData( response, fallback = null ) {
	if ( isSuccessResponse( response ) ) {
		// Return data even if it's null (null is valid data)
		return 'data' in response ? response.data : fallback;
	}
	return fallback;
}

/**
 * Get error from response.
 *
 * @param {Object} response     Response object.
 * @param {string} defaultError Default error message.
 * @return {string} Error message.
 */
export function getResponseError( response, defaultError = 'Unknown error' ) {
	if ( isErrorResponse( response ) ) {
		return response.error || defaultError;
	}
	return defaultError;
}

/**
 * Get all errors from response.
 *
 * @param {Object} response Response object.
 * @return {Array<string>} Array of error messages.
 */
export function getResponseErrors( response ) {
	if ( isErrorResponse( response ) ) {
		const errors = [];
		if ( response.error ) {
			errors.push( response.error );
		}
		if ( response.errors && Array.isArray( response.errors ) ) {
			errors.push( ...response.errors );
		}
		return errors;
	}
	return [];
}
