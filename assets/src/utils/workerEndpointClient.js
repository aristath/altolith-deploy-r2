/**
 * Worker Endpoint Client
 *
 * Client for Worker endpoint operations (upload, delete, copy, list, etc.).
 * All operations go through the Worker endpoint for WordPress Playground compatibility.
 *
 * @package
 */

import { debug } from './debug';
import { parseErrorResponse } from './errorParser';
import { createSuccessResponse, createErrorResponse } from './standardResponse';
// Timeout for very long operations (5 minutes)
const TIMEOUT_VERY_LONG = 300000;

/**
 * Multipart upload threshold (20MB).
 * Files larger than this will use multipart upload.
 */
const MULTIPART_THRESHOLD_BYTES = 20 * 1024 * 1024;

/**
 * Multipart chunk size (5MB).
 * Chunk size for multipart uploads (above S3's 5MB minimum).
 */
const MULTIPART_CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * Upload a file to storage via Worker endpoint.
 *
 * @param {string}    workerEndpoint Worker endpoint URL.
 * @param {string}    key            Object key/path in storage.
 * @param {File|Blob} file           File to upload.
 * @param {Object}    options        Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result with success and optional url/error.
 */
export async function uploadFile( workerEndpoint, key, file, options = {} ) {
	const fileSize = file.size;
	debug( 'uploadFile called:', {
		key,
		fileSize,
		useMultipart: fileSize > MULTIPART_THRESHOLD_BYTES,
		hasOnProgress: !! options.onProgress,
	} );

	// Use multipart upload for large files.
	if ( fileSize > MULTIPART_THRESHOLD_BYTES ) {
		return uploadMultipart( workerEndpoint, key, file, options );
	}

	// Single-file upload with progress tracking using XMLHttpRequest.
	return uploadSingleWithProgress( workerEndpoint, key, file, options );
}

/**
 * Upload a single file with progress tracking using XMLHttpRequest.
 *
 * @param {string}    workerEndpoint Worker endpoint URL.
 * @param {string}    key            Object key/path in storage.
 * @param {File|Blob} file           File to upload.
 * @param {Object}    options        Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result.
 */
async function uploadSingleWithProgress(
	workerEndpoint,
	key,
	file,
	options = {}
) {
	const contentType =
		options.contentType || file.type || 'application/octet-stream';
	const cacheControl = options.cacheControl || '';
	const onProgress = options.onProgress || null;

	return new Promise( ( resolve, reject ) => {
		const xhr = new XMLHttpRequest();

		// Set timeout for large file uploads (60 seconds)
		xhr.timeout = TIMEOUT_VERY_LONG;

		// Track upload progress.
		if ( onProgress ) {
			xhr.upload.addEventListener( 'progress', ( event ) => {
				if ( event.lengthComputable ) {
					const percent = Math.round(
						( event.loaded / event.total ) * 100
					);
					debug( '[Aether] uploadSingleWithProgress progress:', {
						loaded: event.loaded,
						total: event.total,
						percent,
					} );
					onProgress( event.loaded, event.total, percent );
				}
			} );
		}

		// Handle timeout.
		xhr.addEventListener( 'timeout', () => {
			reject(
				new Error( `Upload timed out after ${ TIMEOUT_VERY_LONG }ms` )
			);
		} );

		// Handle completion.
		xhr.addEventListener( 'load', () => {
			if ( xhr.status >= 200 && xhr.status < 300 ) {
				resolve( createSuccessResponse() );
				return;
			}

			let errorMessage = `Upload failed: ${ xhr.status }`;
			errorMessage = parseErrorResponse( xhr.responseText, errorMessage );
			resolve( createErrorResponse( errorMessage ) );
		} );

		// Handle errors.
		xhr.addEventListener( 'error', () => {
			reject( new Error( 'Upload failed: network error' ) );
		} );

		// Handle abort.
		xhr.addEventListener( 'abort', () => {
			reject( new Error( 'Upload aborted' ) );
		} );

		// Open and send request.
		xhr.open( 'POST', workerEndpoint );
		xhr.setRequestHeader( 'Content-Type', 'application/octet-stream' );
		xhr.setRequestHeader( 'X-R2-Key', key );
		xhr.setRequestHeader( 'X-R2-Content-Type', contentType );
		if ( cacheControl ) {
			xhr.setRequestHeader( 'X-R2-Cache-Control', cacheControl );
		}

		xhr.send( file );
	} );
}

/**
 * Upload a large file using multipart upload via Worker endpoint.
 *
 * @param {string}    workerEndpoint Worker endpoint URL.
 * @param {string}    key            Object key/path in storage.
 * @param {File|Blob} file           File to upload.
 * @param {Object}    options        Optional options (contentType, cacheControl, onProgress).
 * @return {Promise<Object>} Upload result.
 */
async function uploadMultipart( workerEndpoint, key, file, options = {} ) {
	const fileSize = file.size;
	const contentType =
		options.contentType || file.type || 'application/octet-stream';
	const cacheControl = options.cacheControl || '';

	// Step 1: Initiate multipart upload.
	const uploadId = await initiateMultipartUpload(
		workerEndpoint,
		key,
		contentType,
		cacheControl
	);
	if ( ! uploadId ) {
		return createErrorResponse( 'Failed to initiate multipart upload' );
	}

	// Step 2: Upload parts sequentially.
	const parts = [];
	const numParts = Math.ceil( fileSize / MULTIPART_CHUNK_SIZE ); // Calculate after early return
	const onProgress = options.onProgress || null; // Assign just before use
	for ( let partNumber = 1; partNumber <= numParts; partNumber++ ) {
		const start = ( partNumber - 1 ) * MULTIPART_CHUNK_SIZE;
		const end = Math.min( start + MULTIPART_CHUNK_SIZE, fileSize );
		const chunk = file.slice( start, end );

		const chunkBuffer = await chunk.arrayBuffer();
		const etag = await uploadPart(
			workerEndpoint,
			key,
			uploadId,
			partNumber,
			chunkBuffer
		);

		if ( ! etag ) {
			// Abort on error.
			await abortMultipartUpload( workerEndpoint, key, uploadId );
			return createErrorResponse(
				`Failed to upload part ${ partNumber }`
			);
		}

		parts.push( {
			partNumber,
			etag,
		} );

		// Report progress for this part.
		if ( onProgress ) {
			const uploadedBytes = partNumber * MULTIPART_CHUNK_SIZE;
			const progressBytes = Math.min( uploadedBytes, fileSize );
			const percent = Math.round( ( progressBytes / fileSize ) * 100 );
			debug( 'uploadMultipart progress:', {
				partNumber,
				numParts,
				uploadedBytes,
				progressBytes,
				fileSize,
				percent,
			} );
			onProgress( progressBytes, fileSize, null );
		}
	}

	// Step 3: Complete multipart upload.
	const completeResult = await completeMultipartUpload(
		workerEndpoint,
		key,
		uploadId,
		parts
	);

	if ( ! completeResult ) {
		await abortMultipartUpload( workerEndpoint, key, uploadId );
		return createErrorResponse( 'Failed to complete multipart upload' );
	}

	return createSuccessResponse();
}

/**
 * Initiate a multipart upload via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @param {string} contentType    MIME type.
 * @param {string} cacheControl   Cache control header.
 * @return {Promise<string|null>} Upload ID or null on failure.
 */
async function initiateMultipartUpload(
	workerEndpoint,
	key,
	contentType,
	cacheControl
) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'initiate-multipart',
		},
		body: JSON.stringify( {
			key,
			contentType,
			cacheControl,
		} ),
	} );

	if ( ! response.ok ) {
		return null;
	}

	const data = await response.json();
	return data.uploadId || null;
}

/**
 * Upload a single part via Worker endpoint.
 *
 * @param {string}      workerEndpoint Worker endpoint URL.
 * @param {string}      key            Object key/path.
 * @param {string}      uploadId       Upload ID.
 * @param {number}      partNumber     Part number (1-based).
 * @param {ArrayBuffer} chunk          Data chunk.
 * @return {Promise<string|null>} ETag or null on failure.
 */
async function uploadPart( workerEndpoint, key, uploadId, partNumber, chunk ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/octet-stream',
			'X-R2-Key': key,
			'X-R2-Upload-Id': uploadId,
			'X-R2-Part-Number': String( partNumber ),
		},
		body: chunk,
	} );

	if ( ! response.ok ) {
		return null;
	}

	const data = await response.json();
	return data.etag || null;
}

/**
 * Complete a multipart upload via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @param {string} uploadId       Upload ID.
 * @param {Array}  parts          Array of {partNumber, etag} objects.
 * @return {Promise<boolean>} True on success.
 */
async function completeMultipartUpload( workerEndpoint, key, uploadId, parts ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'complete-multipart',
		},
		body: JSON.stringify( {
			key,
			uploadId,
			parts,
		} ),
	} );

	return response.ok;
}

/**
 * Abort a multipart upload via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @param {string} uploadId       Upload ID.
 * @return {Promise<boolean>} True on success.
 */
async function abortMultipartUpload( workerEndpoint, key, uploadId ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'abort-multipart',
		},
		body: JSON.stringify( {
			key,
			uploadId,
		} ),
	} );

	return response.ok;
}

/**
 * Delete a file from storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @return {Promise<Object>} Delete result with success and optional error.
 */
export async function deleteFile( workerEndpoint, key ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'delete',
		},
		body: JSON.stringify( { key } ),
	} );

	if ( ! response.ok ) {
		const errorText = await response.text();
		const errorMessage = parseErrorResponse(
			errorText,
			`Delete failed: ${ response.status }`
		);
		return createErrorResponse( errorMessage );
	}

	return createSuccessResponse();
}

/**
 * Copy a file within storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} sourceKey      Source object key.
 * @param {string} destKey        Destination object key.
 * @return {Promise<Object>} Copy result with success and optional error.
 */
export async function copyFile( workerEndpoint, sourceKey, destKey ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'copy',
		},
		body: JSON.stringify( {
			sourceKey,
			destKey,
		} ),
	} );

	if ( ! response.ok ) {
		const errorText = await response.text();
		const errorMessage = parseErrorResponse(
			errorText,
			`Copy failed: ${ response.status }`
		);
		return createErrorResponse( errorMessage );
	}

	return createSuccessResponse();
}

/**
 * List objects in storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} prefix         Optional prefix to filter objects.
 * @param {number} limit          Maximum number of objects to return.
 * @return {Promise<Object>} List result with success, objects array, and optional error.
 */
export async function listObjects( workerEndpoint, prefix = '', limit = 1000 ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'list',
		},
		body: JSON.stringify( {
			prefix,
			limit,
		} ),
	} );

	if ( ! response.ok ) {
		const errorText = await response.text();
		const errorMessage = parseErrorResponse(
			errorText,
			`List failed: ${ response.status }`
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( { objects: data.objects || [] } );
}

/**
 * Batch copy multiple objects in storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {Array}  operations     Array of {source, dest} objects.
 * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
 */
export async function batchCopy( workerEndpoint, operations ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'batch-copy',
		},
		body: JSON.stringify( { operations } ),
	} );

	if ( ! response.ok ) {
		const errorText = await response.text();
		const errorMessage = parseErrorResponse(
			errorText,
			`Batch copy failed: ${ response.status }`
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( {
		copied: data.copied || 0,
		errors: data.errors || 0,
		results: data.results || [],
	} );
}

/**
 * Batch delete multiple objects from storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {Array}  keys           Array of object keys to delete.
 * @return {Promise<Object>} Result with success and optional error.
 */
export async function batchDelete( workerEndpoint, keys ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'batch-delete',
		},
		body: JSON.stringify( { keys } ),
	} );

	if ( ! response.ok ) {
		const errorText = await response.text();
		const errorMessage = parseErrorResponse(
			errorText,
			`Batch delete failed: ${ response.status }`
		);
		return createErrorResponse( errorMessage );
	}

	return createSuccessResponse();
}

/**
 * Download a file from storage via Worker endpoint.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} key            Object key/path.
 * @return {Promise<Blob|null>} File blob or null on failure.
 */
export async function downloadFile( workerEndpoint, key ) {
	const response = await fetch( workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-R2-Action': 'download',
		},
		body: JSON.stringify( { key } ),
	} );

	if ( ! response.ok ) {
		if ( response.status === 404 ) {
			return null;
		}
		const errorText = await response.text();
		throw new Error(
			`Download failed: ${ response.status } - ${ errorText }`
		);
	}

	return response.blob();
}

/**
 * Get public URL for an object.
 * This constructs the URL based on worker endpoint and key.
 *
 * @param {string} workerEndpoint Worker endpoint URL.
 * @param {string} bucketName     Bucket name.
 * @param {string} key            Object key/path.
 * @return {string} Public URL.
 */
export function getObjectUrl( workerEndpoint, bucketName, key ) {
	const baseUrl = workerEndpoint.replace( /\/$/, '' );
	return `${ baseUrl }/${ bucketName }/${ key }`;
}
