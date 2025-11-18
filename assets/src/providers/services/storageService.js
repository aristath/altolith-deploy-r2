/**
 * Storage Service (React)
 *
 * React implementation of storage service for Cloudflare R2.
 * Replaces R2StorageService.php logic.
 * All operations go through Worker endpoint.
 *
 * @package
 */

import {
	uploadFile,
	deleteFile,
	copyFile,
	listObjects as listObjectsFromWorker,
	batchCopy as batchCopyFromWorker,
	batchDelete as batchDeleteFromWorker,
	getObjectUrl,
	downloadFile as downloadFileFromWorker,
} from '../../utils/workerEndpointClient';

/**
 * Storage Service class.
 */
export class StorageService {
	/**
	 * Constructor.
	 *
	 * @param {string} workerEndpoint Worker endpoint URL.
	 * @param {string} bucketName     Bucket name.
	 * @param {Object} config         Optional configuration.
	 */
	constructor( workerEndpoint, bucketName, config = {} ) {
		this.workerEndpoint = workerEndpoint;
		this.bucketName = bucketName;
		this.config = config;
	}

	/**
	 * Upload a file to storage.
	 *
	 * @param {string}    key      Object key/path in storage.
	 * @param {File|Blob} file     File to upload.
	 * @param {Object}    metadata Optional metadata (contentType, cacheControl, onProgress).
	 * @return {Promise<Object>} Result array with 'success' and optional 'url', 'error'.
	 */
	async upload( key, file, metadata = {} ) {
		if ( ! ( file instanceof File || file instanceof Blob ) ) {
			return {
				success: false,
				error: 'File must be a File or Blob object',
			};
		}

		const options = {
			contentType: metadata.contentType || file.type,
			cacheControl: metadata.cacheControl || '',
			onProgress: metadata.onProgress || null,
		};

		const result = await uploadFile(
			this.workerEndpoint,
			key,
			file,
			options
		);

		if ( ! result.success ) {
			return result;
		}

		// Build public URL.
		const url = this.getUrl( key );

		return {
			success: true,
			url,
		};
	}

	/**
	 * Delete a file from storage.
	 *
	 * @param {string} key Object key/path.
	 * @return {Promise<Object>} Result array with 'success' and optional 'error'.
	 */
	async delete( key ) {
		return deleteFile( this.workerEndpoint, key );
	}

	/**
	 * Copy an object from source to destination within storage.
	 *
	 * @param {string} sourceKey Source object key.
	 * @param {string} destKey   Destination object key.
	 * @return {Promise<Object>} Result array with 'success' and optional 'error'.
	 */
	async copy( sourceKey, destKey ) {
		return copyFile( this.workerEndpoint, sourceKey, destKey );
	}

	/**
	 * Check if a file exists in storage.
	 *
	 * @param {string} key Object key/path.
	 * @return {Promise<boolean>} True if exists, false otherwise.
	 */
	async exists( key ) {
		// List objects with prefix matching the exact key.
		const result = await listObjectsFromWorker(
			this.workerEndpoint,
			key,
			1
		);

		if ( ! result.success ) {
			return false;
		}

		const objects = result.objects || [];
		return objects.some( ( obj ) => obj.key === key );
	}

	/**
	 * List objects in storage.
	 *
	 * @param {string} prefix Optional prefix to filter objects.
	 * @param {number} limit  Maximum number of objects to return.
	 * @return {Promise<Object>} Result array with 'success', 'objects' array, and optional 'error'.
	 */
	async listObjects( prefix = '', limit = 1000 ) {
		return listObjectsFromWorker( this.workerEndpoint, prefix, limit );
	}

	/**
	 * Get public URL for an object.
	 *
	 * @param {string} key Object key/path.
	 * @return {string} Public URL.
	 */
	getUrl( key ) {
		// Use public_url if available (e.g., custom domain)
		if ( this.config.public_url ) {
			const baseUrl = this.config.public_url.replace( /\/$/, '' );
			return `${ baseUrl }/${ key }`;
		}
		// Fallback to worker endpoint URL
		return getObjectUrl( this.workerEndpoint, this.bucketName, key );
	}

	/**
	 * Batch copy multiple objects in storage.
	 *
	 * @param {Array} operations Array of {source, dest} objects.
	 * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
	 */
	async batchCopy( operations ) {
		return batchCopyFromWorker( this.workerEndpoint, operations );
	}

	/**
	 * Batch delete multiple objects from storage.
	 *
	 * @param {Array} keys Array of object keys to delete.
	 * @return {Promise<Object>} Result with success and optional error.
	 */
	async batchDelete( keys ) {
		return batchDeleteFromWorker( this.workerEndpoint, keys );
	}

	/**
	 * Download manifest file from storage.
	 *
	 * @param {string} siteKey Site key for manifest path.
	 * @return {Promise<Blob|null>} Manifest blob or null if not found.
	 */
	async downloadManifest( siteKey ) {
		const manifestKey = `${ siteKey }/file-manifest.json`;

		try {
			const blob = await downloadFileFromWorker(
				this.workerEndpoint,
				manifestKey
			);
			return blob;
		} catch ( error ) {
			// Return null if file doesn't exist (404) or other error.
			return null;
		}
	}

	/**
	 * Upload manifest file to storage.
	 *
	 * @param {string} siteKey Site key for manifest path.
	 * @param {Blob}   blob    Manifest blob to upload.
	 * @return {Promise<Object>} Result with success and optional error.
	 */
	async uploadManifest( siteKey, blob ) {
		const manifestKey = `${ siteKey }/file-manifest.json`;

		const result = await this.upload( manifestKey, blob, {
			contentType: 'application/json',
		} );

		return result;
	}

	/**
	 * Test connection to storage service.
	 *
	 * @return {Promise<Object>} Result array with 'success' and optional 'message', 'error'.
	 */
	async testConnection() {
		// Try to list objects (max 1) to verify connection.
		const result = await this.listObjects( '', 1 );

		if ( ! result.success ) {
			return {
				success: false,
				error: result.error || 'Failed to list objects',
			};
		}

		return {
			success: true,
			message: 'Successfully connected to Cloudflare R2.',
		};
	}
}
