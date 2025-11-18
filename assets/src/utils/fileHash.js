/**
 * File Hash Utility
 *
 * Utility functions for calculating SHA-256 hashes of files and blobs.
 * Uses Web Crypto API for hardware-accelerated hashing.
 *
 * @package
 */

import { debug, debugError } from './debug';

/**
 * Calculate SHA-256 hash for a File or Blob object.
 *
 * Converts the file/blob to ArrayBuffer and calculates SHA-256 hash
 * using Web Crypto API. Works with all Blob types including images
 * (WebP, PNG, JPG), CSS, JS, HTML, and other binary files.
 *
 * @param {File|Blob} file File or Blob object to hash.
 * @return {Promise<string>} Hex-encoded hash string (64 characters).
 */
export async function calculateFileHash( file ) {
	if ( ! ( file instanceof File || file instanceof Blob ) ) {
		throw new Error( 'File must be a File or Blob object' );
	}

	try {
		// Convert Blob/File to ArrayBuffer for hashing.
		const arrayBuffer = await file.arrayBuffer();

		// Calculate SHA-256 hash using Web Crypto API.
		const hashBuffer = await crypto.subtle.digest( 'SHA-256', arrayBuffer );

		// Convert ArrayBuffer to hex string.
		const hashArray = Array.from( new Uint8Array( hashBuffer ) );
		const hashHex = hashArray
			.map( ( b ) => b.toString( 16 ).padStart( 2, '0' ) )
			.join( '' );

		debug( 'calculateFileHash:', {
			fileSize: file.size,
			hashLength: hashHex.length,
		} );

		return hashHex;
	} catch ( error ) {
		debugError( 'Failed to calculate file hash:', error );
		throw new Error( `Hash calculation failed: ${ error.message }` );
	}
}
