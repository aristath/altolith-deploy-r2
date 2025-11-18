/**
 * Filesystem Adapter
 *
 * Adapter for local filesystem storage operations via REST API.
 * Replaces workerEndpointClient.js for local storage.
 *
 * @package
 */

import apiFetch from './api';
import { debug } from './debug';
import { createSuccessResponse, createErrorResponse } from './standardResponse';

/**
 * Upload a file to local filesystem via REST API.
 *
 * @param {string}    staticPath Base path for static files.
 * @param {string}    key        File path/key relative to static path.
 * @param {File|Blob} file       File to upload.
 * @param {Object}    options    Optional options (contentType, cacheControl, onProgress, jobId).
 * @return {Promise<Object>} Upload result with success and optional url/error.
 */
export async function uploadFile( staticPath, key, file, options = {} ) {
	try {
		// Validate key parameter
		if ( ! key || key === '' ) {
			const error = new Error(
				`Upload key is empty. File: ${
					file?.name || 'unknown'
				}, staticPath: ${ staticPath }`
			);
			return createErrorResponse( error.message );
		}

		// Create FormData for file upload
		const formData = new FormData();
		formData.append( 'file', file );
		formData.append( 'key', key );
		formData.append( 'static_path', staticPath );
		formData.append( 'job_id', options.jobId || '' );

		if ( options.contentType ) {
			formData.append( 'content_type', options.contentType );
		}

		const response = await apiFetch( {
			path: '/aether/site-exporter/local-storage/upload',
			method: 'POST',
			body: formData,
		} );

		if ( ! response.success ) {
			return createErrorResponse( response.error || 'Upload failed' );
		}

		// Call progress callback if provided (100% since we don't have chunked upload yet)
		if ( options.onProgress ) {
			options.onProgress( file.size, file.size, 100 );
		}

		return createSuccessResponse();
	} catch ( error ) {
		debug( 'filesystemAdapter.uploadFile error:', error );
		return createErrorResponse( error.message || 'Upload failed' );
	}
}

/**
 * Delete a file from local filesystem.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to delete.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Object>} Delete result.
 */
export async function deleteFile( staticPath, key, options = {} ) {
	debug( 'filesystemAdapter.deleteFile:', { staticPath, key } );

	try {
		const response = await apiFetch( {
			path: '/aether/site-exporter/local-storage/delete',
			method: 'DELETE',
			data: {
				key,
				static_path: staticPath,
				job_id: options.jobId || '',
			},
		} );

		if ( ! response.success ) {
			return createErrorResponse( response.error || 'Delete failed' );
		}

		return createSuccessResponse();
	} catch ( error ) {
		debug( 'filesystemAdapter.deleteFile error:', error );
		return createErrorResponse( error.message || 'Delete failed' );
	}
}

/**
 * Copy a file (not needed for local filesystem - files are uploaded directly).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} sourceKey  Source file path/key.
 * @param {string} destKey    Destination file path/key.
 * @return {Promise<Object>} Copy result.
 */
export async function copyFile( staticPath, sourceKey, destKey ) {
	// Parameters kept for API consistency, but not used for local filesystem
	// eslint-disable-next-line no-unused-vars
	const _unused = { staticPath, sourceKey, destKey };
	// Not implemented for local filesystem
	// Files are uploaded directly to their final location
	debug(
		'filesystemAdapter.copyFile: Not implemented (not needed for local storage)'
	);
	return createSuccessResponse();
}

/**
 * List objects in a directory (not needed for static site generation).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} prefix     Directory prefix to list.
 * @param {number} limit      Maximum number of objects to return.
 * @return {Promise<Object>} List result.
 */
export async function listObjects( staticPath, prefix = '', limit = 1000 ) {
	// Parameters kept for API consistency, but not used for local filesystem
	// eslint-disable-next-line no-unused-vars
	const _unused = { staticPath, prefix, limit };
	// Not implemented - not needed for static site generation
	// Static site generator doesn't need to list existing files
	debug(
		'filesystemAdapter.listObjects: Not implemented (not needed for static site generation)'
	);
	return createSuccessResponse( { objects: [] } );
}

/**
 * Batch copy files (not needed for local filesystem).
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  operations Array of {source, dest} operations.
 * @return {Promise<Object>} Batch copy result.
 */
export async function batchCopy( staticPath, operations ) {
	// Parameters kept for API consistency, but not used for local filesystem
	// eslint-disable-next-line no-unused-vars
	const _unused = { staticPath, operations };
	// Not implemented for local filesystem
	debug(
		'filesystemAdapter.batchCopy: Not implemented (not needed for local storage)'
	);
	return createSuccessResponse();
}

/**
 * Batch delete files.
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  keys       Array of file paths/keys to delete.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Object>} Batch delete result.
 */
export async function batchDelete( staticPath, keys, options = {} ) {
	debug( 'filesystemAdapter.batchDelete:', {
		staticPath,
		count: keys.length,
	} );

	try {
		const response = await apiFetch( {
			path: '/aether/site-exporter/local-storage/batch-delete',
			method: 'DELETE',
			data: {
				keys,
				static_path: staticPath,
				job_id: options.jobId || '',
			},
		} );

		if ( ! response.success ) {
			return createErrorResponse(
				response.error || 'Batch delete failed'
			);
		}

		return createSuccessResponse();
	} catch ( error ) {
		debug( 'filesystemAdapter.batchDelete error:', error );
		return createErrorResponse( error.message || 'Batch delete failed' );
	}
}

/**
 * Download a file (manifest).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to download.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Blob|null>} File blob or null if not found.
 */
export async function downloadFile( staticPath, key, options = {} ) {
	debug( 'filesystemAdapter.downloadFile:', { staticPath, key } );

	try {
		const response = await apiFetch( {
			path: `/aether/site-exporter/local-storage/download?key=${ encodeURIComponent(
				key
			) }&static_path=${ encodeURIComponent( staticPath ) }&job_id=${
				options.jobId || ''
			}`,
			method: 'GET',
			parse: false, // Get raw response
		} );

		if ( ! response.ok ) {
			return null;
		}

		return await response.blob();
	} catch ( error ) {
		debug( 'filesystemAdapter.downloadFile error:', error );
		return null;
	}
}

/**
 * Get public URL for a file.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} baseUrl    Base URL for static files.
 * @param {string} key        File path/key.
 * @return {string} Public URL.
 */
export function getObjectUrl( staticPath, baseUrl, key ) {
	// For local filesystem, construct URL from baseUrl and key
	// Remove any trailing slash from baseUrl
	const cleanBaseUrl = baseUrl.replace( /\/$/, '' );

	// Remove leading slash from key if present
	const cleanKey = key.replace( /^\//, '' );

	return `${ cleanBaseUrl }/${ cleanKey }`;
}
