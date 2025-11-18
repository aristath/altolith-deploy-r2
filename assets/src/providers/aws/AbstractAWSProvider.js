/**
 * Abstract AWS Provider Base Class
 *
 * Base class for all AWS S3-compatible storage providers (Cloudflare R2, AWS S3, DigitalOcean Spaces, etc.).
 * Provides common S3-compatible storage operations and functionality.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import {
	AbstractProvider,
	CAP_STORAGE,
	CAP_MEDIA,
} from '../base/AbstractProvider';
import { ConfigFieldBuilder } from '../utils/configFieldBuilder';
import { StorageService } from '../services/storageService';

/**
 * AbstractAWSProvider class
 *
 * Abstract base class for AWS S3-compatible storage providers.
 * Subclasses must implement provider-specific methods.
 */
export class AbstractAWSProvider extends AbstractProvider {
	/**
	 * Provider capabilities.
	 *
	 * @type {Array<string>}
	 */
	capabilities = [ CAP_STORAGE, CAP_MEDIA ];

	/**
	 * Storage service instance.
	 *
	 * @type {StorageService|null}
	 */
	storageService = null;

	/**
	 * Get the provider type.
	 *
	 * @return {string} Provider type
	 */
	getType() {
		return 'cloud-storage';
	}

	/**
	 * Get configuration fields for this provider.
	 *
	 * Defines common S3-compatible fields shared by all AWS providers.
	 * Subclasses should override and call super.getConfigFields() to add provider-specific fields.
	 *
	 * @return {Array<Object>} Array of field definitions
	 */
	getConfigFields() {
		return ConfigFieldBuilder.buildAll( [
			ConfigFieldBuilder.text( 'access_key_id' )
				.label( __( 'Access Key ID', 'aether' ) )
				.description(
					__( 'S3-compatible API access key ID', 'aether' )
				)
				.required()
				.min( 16 )
				.max( 128 ),

			ConfigFieldBuilder.password( 'secret_access_key' )
				.label( __( 'Secret Access Key', 'aether' ) )
				.description(
					__(
						'S3-compatible API secret access key (encrypted)',
						'aether'
					)
				)
				.required()
				.sensitive()
				.min( 32 )
				.max( 128 ),

			ConfigFieldBuilder.text( 'bucket_name' )
				.label( __( 'Bucket Name', 'aether' ) )
				.description( __( 'Bucket name for file storage', 'aether' ) )
				.required()
				.pattern(
					'^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$',
					__(
						'Bucket name must be 3-63 characters, lowercase, start/end with alphanumeric',
						'aether'
					)
				)
				.min( 3 )
				.max( 63 ),

			ConfigFieldBuilder.text( 'region' )
				.label( __( 'Region (Optional)', 'aether' ) )
				.description(
					__( 'Storage region (e.g., us-east-1, auto)', 'aether' )
				),

			ConfigFieldBuilder.url( 'endpoint' )
				.label( __( 'Endpoint URL (Optional)', 'aether' ) )
				.description(
					__(
						'Custom endpoint URL for S3-compatible storage',
						'aether'
					)
				),
		] );
	}

	/**
	 * Get storage service instance (lazy-loaded).
	 *
	 * Uses provider-specific endpoint and configuration.
	 *
	 * @protected
	 * @return {Promise<StorageService|null>} Storage service instance
	 */
	async getStorageService() {
		if ( this.storageService ) {
			return this.storageService;
		}

		const endpoint = await this.getStorageEndpoint();
		const config = await this.getStorageServiceConfig();

		if ( ! endpoint || ! config.bucket_name ) {
			return null;
		}

		this.storageService = new StorageService(
			endpoint,
			config.bucket_name,
			config
		);

		return this.storageService;
	}

	/**
	 * Get the storage endpoint URL.
	 *
	 * Must be implemented by subclasses to return provider-specific endpoint.
	 * Can be Worker endpoint (for browser-based access) or direct API endpoint.
	 *
	 * @abstract
	 * @return {Promise<string>} Storage endpoint URL
	 */
	async getStorageEndpoint() {
		throw new Error(
			'AbstractAWSProvider.getStorageEndpoint() must be implemented by subclass'
		);
	}

	/**
	 * Get storage service configuration.
	 *
	 * Must be implemented by subclasses to return provider-specific config.
	 *
	 * @abstract
	 * @return {Promise<Object>} Storage service configuration object
	 */
	async getStorageServiceConfig() {
		throw new Error(
			'AbstractAWSProvider.getStorageServiceConfig() must be implemented by subclass'
		);
	}

	/**
	 * Test connection to storage provider.
	 *
	 * Must be implemented by subclasses to test provider-specific connection.
	 *
	 * @abstract
	 * @return {Promise<Object>} Connection test result
	 */
	async testConnection() {
		throw new Error(
			'AbstractAWSProvider.testConnection() must be implemented by subclass'
		);
	}

	/**
	 * Get public URL for an object.
	 *
	 * Must be implemented by subclasses to construct provider-specific public URL.
	 *
	 * @abstract
	 * @param {string} key Object key/path.
	 * @return {string} Public URL
	 */
	getPublicUrl( key ) {
		// Abstract method - key parameter required for interface consistency
		// eslint-disable-next-line no-unused-vars
		void key;
		throw new Error(
			'AbstractAWSProvider.getPublicUrl() must be implemented by subclass'
		);
	}
}

export { CAP_STORAGE, CAP_MEDIA };
export default AbstractAWSProvider;
