/**
 * StorageService Test Suite
 *
 * Comprehensive tests for StorageService class.
 * Tests all storage operations: upload, delete, copy, list, exists, batch operations, and connection testing.
 *
 * @package
 */

import { StorageService } from '../storageService';
import {
	uploadFile,
	deleteFile,
	copyFile,
	listObjects as listObjectsFromWorker,
	batchCopy as batchCopyFromWorker,
	batchDelete as batchDeleteFromWorker,
	getObjectUrl,
} from '../../../utils/workerEndpointClient';

// Mock worker endpoint client
jest.mock( '../../../utils/workerEndpointClient', () => ( {
	uploadFile: jest.fn(),
	deleteFile: jest.fn(),
	copyFile: jest.fn(),
	listObjects: jest.fn(),
	batchCopy: jest.fn(),
	batchDelete: jest.fn(),
	getObjectUrl: jest.fn(),
} ) );

describe( 'StorageService', () => {
	let service;
	const mockWorkerEndpoint = 'https://worker.example.com';
	const mockBucketName = 'test-bucket';
	const mockConfig = {
		custom_domain: 'https://cdn.example.com',
	};

	beforeEach( () => {
		service = new StorageService(
			mockWorkerEndpoint,
			mockBucketName,
			mockConfig
		);
		jest.clearAllMocks();
	} );

	describe( 'Constructor', () => {
		test( 'should initialize with worker endpoint and bucket name', () => {
			expect( service.workerEndpoint ).toBe( mockWorkerEndpoint );
			expect( service.bucketName ).toBe( mockBucketName );
			expect( service.config ).toEqual( mockConfig );
		} );
	} );

	describe( 'upload', () => {
		test( 'should upload file successfully', async () => {
			const file = new Blob( [ 'test content' ], { type: 'text/plain' } );
			const key = 'test/file.txt';

			uploadFile.mockResolvedValue( {
				success: true,
			} );
			getObjectUrl.mockReturnValue(
				'https://cdn.example.com/test/file.txt'
			);

			const result = await service.upload( key, file );

			expect( uploadFile ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				key,
				file,
				expect.objectContaining( {
					contentType: 'text/plain',
					cacheControl: '',
					onProgress: null,
				} )
			);
			expect( result.success ).toBe( true );
			expect( result.url ).toBe(
				'https://cdn.example.com/test/file.txt'
			);
		} );

		test( 'should handle upload failure', async () => {
			const file = new Blob( [ 'test' ], { type: 'text/plain' } );
			const key = 'test/file.txt';

			uploadFile.mockResolvedValue( {
				success: false,
				error: 'Upload failed',
			} );

			const result = await service.upload( key, file );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Upload failed' );
		} );

		test( 'should reject non-File/Blob objects', async () => {
			const invalidFile = 'not a file';
			const key = 'test/file.txt';

			const result = await service.upload( key, invalidFile );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'File must be a File or Blob object' );
			expect( uploadFile ).not.toHaveBeenCalled();
		} );

		test( 'should pass metadata options', async () => {
			const file = new Blob( [ 'test' ], { type: 'image/jpeg' } );
			const key = 'test/image.jpg';
			const metadata = {
				contentType: 'image/jpeg',
				cacheControl: 'max-age=3600',
				onProgress: jest.fn(),
			};

			uploadFile.mockResolvedValue( { success: true } );
			getObjectUrl.mockReturnValue(
				'https://cdn.example.com/test/image.jpg'
			);

			await service.upload( key, file, metadata );

			expect( uploadFile ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				key,
				file,
				expect.objectContaining( {
					contentType: 'image/jpeg',
					cacheControl: 'max-age=3600',
					onProgress: metadata.onProgress,
				} )
			);
		} );
	} );

	describe( 'delete', () => {
		test( 'should delete file successfully', async () => {
			const key = 'test/file.txt';

			deleteFile.mockResolvedValue( {
				success: true,
			} );

			const result = await service.delete( key );

			expect( deleteFile ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				key
			);
			expect( result.success ).toBe( true );
		} );

		test( 'should handle delete failure', async () => {
			const key = 'test/file.txt';

			deleteFile.mockResolvedValue( {
				success: false,
				error: 'Delete failed',
			} );

			const result = await service.delete( key );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Delete failed' );
		} );
	} );

	describe( 'copy', () => {
		test( 'should copy file successfully', async () => {
			const sourceKey = 'source/file.txt';
			const destKey = 'dest/file.txt';

			copyFile.mockResolvedValue( {
				success: true,
			} );

			const result = await service.copy( sourceKey, destKey );

			expect( copyFile ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				sourceKey,
				destKey
			);
			expect( result.success ).toBe( true );
		} );

		test( 'should handle copy failure', async () => {
			const sourceKey = 'source/file.txt';
			const destKey = 'dest/file.txt';

			copyFile.mockResolvedValue( {
				success: false,
				error: 'Copy failed',
			} );

			const result = await service.copy( sourceKey, destKey );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Copy failed' );
		} );
	} );

	describe( 'exists', () => {
		test( 'should return true when file exists', async () => {
			const key = 'test/file.txt';

			listObjectsFromWorker.mockResolvedValue( {
				success: true,
				objects: [ { key: 'test/file.txt' } ],
			} );

			const exists = await service.exists( key );

			expect( listObjectsFromWorker ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				key,
				1
			);
			expect( exists ).toBe( true );
		} );

		test( 'should return false when file does not exist', async () => {
			const key = 'test/file.txt';

			listObjectsFromWorker.mockResolvedValue( {
				success: true,
				objects: [ { key: 'other/file.txt' } ],
			} );

			const exists = await service.exists( key );

			expect( exists ).toBe( false );
		} );

		test( 'should return false when list fails', async () => {
			const key = 'test/file.txt';

			listObjectsFromWorker.mockResolvedValue( {
				success: false,
				error: 'List failed',
			} );

			const exists = await service.exists( key );

			expect( exists ).toBe( false );
		} );
	} );

	describe( 'listObjects', () => {
		test( 'should list objects successfully', async () => {
			const prefix = 'test/';
			const limit = 10;

			listObjectsFromWorker.mockResolvedValue( {
				success: true,
				objects: [
					{ key: 'test/file1.txt' },
					{ key: 'test/file2.txt' },
				],
			} );

			const result = await service.listObjects( prefix, limit );

			expect( listObjectsFromWorker ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				prefix,
				limit
			);
			expect( result.success ).toBe( true );
			expect( result.objects ).toHaveLength( 2 );
		} );

		test( 'should use default prefix and limit', async () => {
			listObjectsFromWorker.mockResolvedValue( {
				success: true,
				objects: [],
			} );

			await service.listObjects();

			expect( listObjectsFromWorker ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				'',
				1000
			);
		} );
	} );

	describe( 'getUrl', () => {
		test( 'should return public URL', () => {
			const key = 'test/file.txt';
			const expectedUrl = 'https://cdn.example.com/test/file.txt';

			getObjectUrl.mockReturnValue( expectedUrl );

			const url = service.getUrl( key );

			expect( getObjectUrl ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				mockBucketName,
				key
			);
			expect( url ).toBe( expectedUrl );
		} );
	} );

	describe( 'batchCopy', () => {
		test( 'should batch copy files successfully', async () => {
			const operations = [
				{ source: 'source1.txt', dest: 'dest1.txt' },
				{ source: 'source2.txt', dest: 'dest2.txt' },
			];

			batchCopyFromWorker.mockResolvedValue( {
				success: true,
				copied: 2,
				errors: 0,
				results: [],
			} );

			const result = await service.batchCopy( operations );

			expect( batchCopyFromWorker ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				operations
			);
			expect( result.success ).toBe( true );
			expect( result.copied ).toBe( 2 );
		} );
	} );

	describe( 'batchDelete', () => {
		test( 'should batch delete files successfully', async () => {
			const keys = [ 'file1.txt', 'file2.txt', 'file3.txt' ];

			batchDeleteFromWorker.mockResolvedValue( {
				success: true,
			} );

			const result = await service.batchDelete( keys );

			expect( batchDeleteFromWorker ).toHaveBeenCalledWith(
				mockWorkerEndpoint,
				keys
			);
			expect( result.success ).toBe( true );
		} );
	} );

	describe( 'testConnection', () => {
		test( 'should return success when connection works', async () => {
			listObjectsFromWorker.mockResolvedValue( {
				success: true,
				objects: [],
			} );

			const result = await service.testConnection();

			expect( result.success ).toBe( true );
			expect( result.message ).toBe(
				'Successfully connected to Cloudflare R2.'
			);
		} );

		test( 'should return failure when connection fails', async () => {
			listObjectsFromWorker.mockResolvedValue( {
				success: false,
				error: 'Connection error',
			} );

			const result = await service.testConnection();

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Connection error' );
		} );

		test( 'should return failure with default message when error not provided', async () => {
			listObjectsFromWorker.mockResolvedValue( {
				success: false,
			} );

			const result = await service.testConnection();

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Failed to list objects' );
		} );
	} );
} );
