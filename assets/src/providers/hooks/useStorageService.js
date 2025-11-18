/**
 * Storage Service Hook
 *
 * React hook for storage operations (upload, download, delete, etc.).
 * Uses StorageService class that calls Worker endpoint directly.
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import { StorageService } from '../services/storageService';
import { getCredentials } from '../../utils/credentialManager';

/**
 * Hook for storage service operations.
 *
 * @param {string} providerId Provider ID (e.g., 'cloudflare-r2').
 * @return {Object} Storage service methods.
 */
export function useStorageService( providerId ) {
	/**
	 * Get storage service instance.
	 *
	 * @return {Promise<StorageService>} Storage service instance.
	 */
	const getStorageService = useCallback( async () => {
		// Fetch credentials.
		const credentials = await getCredentials( providerId );

		// Get worker endpoint and bucket name.
		const workerEndpoint = credentials.worker_endpoint || '';
		const bucketName = credentials.bucket_name || '';

		if ( ! workerEndpoint || ! bucketName ) {
			throw new Error(
				'Worker endpoint and bucket name are required for storage operations'
			);
		}

		return new StorageService( workerEndpoint, bucketName, credentials );
	}, [ providerId ] );

	/**
	 * Upload a file to storage.
	 *
	 * @param {string}    key      Object key/path in storage.
	 * @param {File|Blob} file     File to upload (must be File or Blob object).
	 * @param {Object}    metadata Optional metadata.
	 * @return {Promise<Object>} Upload result.
	 */
	const upload = useCallback(
		async ( key, file, metadata = {} ) => {
			const service = await getStorageService();
			return service.upload( key, file, metadata );
		},
		[ getStorageService ]
	);

	/**
	 * Download a file from storage.
	 * Note: Download is not directly supported via Worker endpoint.
	 * Files should be accessed via public URL.
	 *
	 * @param {string} key Object key/path in storage.
	 * @return {Promise<Object>} Download result with URL.
	 */
	const download = useCallback(
		async ( key ) => {
			const service = await getStorageService();
			const url = service.getUrl( key );
			return {
				success: true,
				url,
			};
		},
		[ getStorageService ]
	);

	/**
	 * Delete a file from storage.
	 *
	 * @param {string} key Object key/path in storage.
	 * @return {Promise<Object>} Delete result.
	 */
	const deleteFile = useCallback(
		async ( key ) => {
			const service = await getStorageService();
			return service.delete( key );
		},
		[ getStorageService ]
	);

	/**
	 * Check if a file exists in storage.
	 *
	 * @param {string} key Object key/path in storage.
	 * @return {Promise<boolean>} True if exists, false otherwise.
	 */
	const exists = useCallback(
		async ( key ) => {
			const service = await getStorageService();
			return service.exists( key );
		},
		[ getStorageService ]
	);

	/**
	 * List objects in storage.
	 *
	 * @param {string} prefix Optional prefix to filter objects.
	 * @param {number} limit  Maximum number of objects to return.
	 * @return {Promise<Object>} List result with objects array.
	 */
	const list = useCallback(
		async ( prefix = '', limit = 1000 ) => {
			const service = await getStorageService();
			return service.listObjects( prefix, limit );
		},
		[ getStorageService ]
	);

	/**
	 * Delete multiple objects in batch.
	 *
	 * React handles batching by calling individual delete operations in parallel.
	 *
	 * @param {Array<string>} keys Array of object keys to delete.
	 * @return {Promise<Object>} Batch delete result with success count and errors.
	 */
	const batchDelete = useCallback(
		async ( keys ) => {
			if ( ! Array.isArray( keys ) || keys.length === 0 ) {
				return {
					success: true,
					deleted: 0,
					errors: 0,
				};
			}

			const service = await getStorageService();

			// Call individual delete operations in parallel.
			const results = await Promise.allSettled(
				keys.map( ( key ) => service.delete( key ) )
			);

			let deleted = 0;
			let errors = 0;
			const errorMessages = [];

			results.forEach( ( result, index ) => {
				if ( result.status === 'fulfilled' && result.value.success ) {
					deleted++;
				} else {
					errors++;
					const error =
						result.status === 'rejected'
							? result.reason?.message || 'Unknown error'
							: result.value?.error || 'Delete failed';
					errorMessages.push( {
						key: keys[ index ],
						error,
					} );
				}
			} );

			return {
				success: errors === 0,
				deleted,
				errors,
				errorMessages,
			};
		},
		[ getStorageService ]
	);

	/**
	 * Copy multiple objects in batch.
	 *
	 * @param {Array<Object>} copyOperations Array of {source, dest} operations.
	 * @return {Promise<Object>} Batch copy result with copied count and errors.
	 */
	const batchCopy = useCallback(
		async ( copyOperations ) => {
			if (
				! Array.isArray( copyOperations ) ||
				copyOperations.length === 0
			) {
				return {
					success: true,
					copied: 0,
					errors: 0,
				};
			}

			const service = await getStorageService();

			// Call individual copy operations in parallel.
			const results = await Promise.allSettled(
				copyOperations.map( ( op ) =>
					service.copy( op.source, op.dest )
				)
			);

			let copied = 0;
			let errors = 0;
			const errorMessages = [];

			results.forEach( ( result, index ) => {
				if ( result.status === 'fulfilled' && result.value.success ) {
					copied++;
				} else {
					errors++;
					const error =
						result.status === 'rejected'
							? result.reason?.message || 'Unknown error'
							: result.value?.error || 'Copy failed';
					errorMessages.push( {
						operation: copyOperations[ index ],
						error,
					} );
				}
			} );

			return {
				success: errors === 0,
				copied,
				errors,
				errorMessages,
			};
		},
		[ getStorageService ]
	);

	/**
	 * Get public URL for an object.
	 *
	 * @param {string} key Object key/path in storage.
	 * @return {Promise<string>} Public URL or empty string.
	 */
	const getUrl = useCallback(
		async ( key ) => {
			const service = await getStorageService();
			return service.getUrl( key );
		},
		[ getStorageService ]
	);

	return {
		upload,
		download,
		delete: deleteFile,
		exists,
		list,
		batchDelete,
		batchCopy,
		getUrl,
	};
}
