/**
 * File Hash Tests
 *
 * Comprehensive tests for SHA-256 file hashing functionality, covering:
 * - Hash calculation for different file types
 * - Hash consistency (same input → same hash)
 * - Hash uniqueness (different input → different hash)
 * - Error handling for invalid inputs
 * - Browser API compatibility (Web Crypto API)
 *
 * @package
 */

import { calculateFileHash } from '../fileHash';

describe( 'calculateFileHash', () => {
	// Setup Web Crypto API mock
	beforeAll( () => {
		// Mock crypto.subtle.digest
		if ( ! global.crypto ) {
			global.crypto = {};
		}
		if ( ! global.crypto.subtle ) {
			global.crypto.subtle = {};
		}

		// Mock SHA-256 implementation
		global.crypto.subtle.digest = jest.fn( async ( algorithm, data ) => {
			if ( algorithm !== 'SHA-256' ) {
				throw new Error( 'Unsupported algorithm' );
			}

			// Convert ArrayBuffer to Uint8Array
			const bytes = new Uint8Array( data );

			// Simple mock hash: sum of bytes modulo 256 repeated 32 times
			// This is NOT a real hash, just for testing
			const sum = Array.from( bytes ).reduce(
				( acc, byte ) => acc + byte,
				0
			);
			const mockHash = new Uint8Array( 32 );
			for ( let i = 0; i < 32; i++ ) {
				mockHash[ i ] = ( sum + i ) % 256;
			}

			return mockHash.buffer;
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Basic Functionality', () => {
		test( 'calculates hash for File object', async () => {
			const content = 'Hello, World!';
			const file = new File( [ content ], 'test.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toBeDefined();
			expect( typeof hash ).toBe( 'string' );
			expect( hash ).toHaveLength( 64 ); // SHA-256 produces 64 hex characters
			expect( hash ).toMatch( /^[0-9a-f]+$/ ); // Hex string
		} );

		test( 'calculates hash for Blob object', async () => {
			const content = 'Hello, Blob!';
			const blob = new Blob( [ content ], { type: 'text/plain' } );

			const hash = await calculateFileHash( blob );

			expect( hash ).toBeDefined();
			expect( typeof hash ).toBe( 'string' );
			expect( hash ).toHaveLength( 64 );
			expect( hash ).toMatch( /^[0-9a-f]+$/ );
		} );

		test( 'calculates hash for binary file', async () => {
			// Create a mock binary file (PNG header)
			const binaryData = new Uint8Array( [
				137, 80, 78, 71, 13, 10, 26, 10,
			] );
			const file = new File( [ binaryData.buffer ], 'image.png', {
				type: 'image/png',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toBeDefined();
			expect( hash ).toHaveLength( 64 );
			expect( hash ).toMatch( /^[0-9a-f]+$/ );
		} );

		test( 'calculates hash for empty file', async () => {
			const file = new File( [], 'empty.txt', { type: 'text/plain' } );

			const hash = await calculateFileHash( file );

			expect( hash ).toBeDefined();
			expect( hash ).toHaveLength( 64 );
			expect( hash ).toMatch( /^[0-9a-f]+$/ );
		} );
	} );

	describe( 'Hash Consistency', () => {
		test( 'produces same hash for identical content', async () => {
			const content = 'Consistent content';
			const file1 = new File( [ content ], 'file1.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ content ], 'file2.txt', {
				type: 'text/plain',
			} );

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).toBe( hash2 );
		} );

		test( 'produces same hash for same file calculated twice', async () => {
			const content = 'Same file content';
			const file = new File( [ content ], 'test.txt', {
				type: 'text/plain',
			} );

			const hash1 = await calculateFileHash( file );
			const hash2 = await calculateFileHash( file );

			expect( hash1 ).toBe( hash2 );
		} );

		test( 'produces same hash regardless of filename', async () => {
			const content = 'File content';
			const file1 = new File( [ content ], 'name1.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ content ], 'name2.txt', {
				type: 'text/plain',
			} );

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).toBe( hash2 );
		} );

		test( 'produces same hash regardless of mime type', async () => {
			const content = 'Same bytes';
			const file1 = new File( [ content ], 'test.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ content ], 'test.html', {
				type: 'text/html',
			} );

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).toBe( hash2 );
		} );
	} );

	describe( 'Hash Uniqueness', () => {
		test( 'produces different hash for different content', async () => {
			const file1 = new File( [ 'Content A' ], 'test.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ 'Content B' ], 'test.txt', {
				type: 'text/plain',
			} );

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).not.toBe( hash2 );
		} );

		test( 'produces different hash for different sizes', async () => {
			const file1 = new File( [ 'Short' ], 'test.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ 'Much longer content' ], 'test.txt', {
				type: 'text/plain',
			} );

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).not.toBe( hash2 );
		} );

		test( 'produces different hash for slightly different content', async () => {
			const file1 = new File( [ 'Hello World' ], 'test.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ 'Hello world' ], 'test.txt', {
				type: 'text/plain',
			} ); // Different case

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).not.toBe( hash2 );
		} );

		test( 'produces different hash for content with extra whitespace', async () => {
			const file1 = new File( [ 'Hello World' ], 'test.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ 'Hello World ' ], 'test.txt', {
				type: 'text/plain',
			} ); // Trailing space

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).not.toBe( hash2 );
		} );
	} );

	describe( 'File Types', () => {
		test( 'calculates hash for text file', async () => {
			const file = new File( [ 'Plain text content' ], 'file.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'calculates hash for HTML file', async () => {
			const file = new File(
				[ '<html><body>Hello</body></html>' ],
				'page.html',
				{ type: 'text/html' }
			);

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'calculates hash for CSS file', async () => {
			const file = new File(
				[ 'body { background: red; }' ],
				'style.css',
				{ type: 'text/css' }
			);

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'calculates hash for JavaScript file', async () => {
			const file = new File( [ 'console.log("Hello");' ], 'script.js', {
				type: 'application/javascript',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'calculates hash for JSON file', async () => {
			const file = new File( [ '{"key": "value"}' ], 'data.json', {
				type: 'application/json',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'calculates hash for image file (simulated)', async () => {
			// Simulate WebP image header
			const imageData = new Uint8Array( [
				82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80,
			] );
			const file = new File( [ imageData.buffer ], 'image.webp', {
				type: 'image/webp',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );
	} );

	describe( 'Large Files', () => {
		test( 'calculates hash for 1KB file', async () => {
			const content = 'x'.repeat( 1024 ); // 1KB
			const file = new File( [ content ], 'large.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'calculates hash for 100KB file', async () => {
			const content = 'x'.repeat( 100 * 1024 ); // 100KB
			const file = new File( [ content ], 'larger.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'produces different hashes for large files with small differences', async () => {
			const content1 = 'x'.repeat( 10000 ) + 'a';
			const content2 = 'x'.repeat( 10000 ) + 'b';
			const file1 = new File( [ content1 ], 'file1.txt', {
				type: 'text/plain',
			} );
			const file2 = new File( [ content2 ], 'file2.txt', {
				type: 'text/plain',
			} );

			const hash1 = await calculateFileHash( file1 );
			const hash2 = await calculateFileHash( file2 );

			expect( hash1 ).not.toBe( hash2 );
		} );
	} );

	describe( 'Error Handling', () => {
		test( 'throws error for non-File/Blob input', async () => {
			await expect( calculateFileHash( 'not a file' ) ).rejects.toThrow(
				'File must be a File or Blob object'
			);
		} );

		test( 'throws error for null input', async () => {
			await expect( calculateFileHash( null ) ).rejects.toThrow(
				'File must be a File or Blob object'
			);
		} );

		test( 'throws error for undefined input', async () => {
			await expect( calculateFileHash( undefined ) ).rejects.toThrow(
				'File must be a File or Blob object'
			);
		} );

		test( 'throws error for number input', async () => {
			await expect( calculateFileHash( 123 ) ).rejects.toThrow(
				'File must be a File or Blob object'
			);
		} );

		test( 'throws error for object input', async () => {
			await expect( calculateFileHash( {} ) ).rejects.toThrow(
				'File must be a File or Blob object'
			);
		} );

		test( 'throws error for array input', async () => {
			await expect( calculateFileHash( [] ) ).rejects.toThrow(
				'File must be a File or Blob object'
			);
		} );

		test( 'handles crypto API failure gracefully', async () => {
			const file = new File( [ 'test' ], 'test.txt', {
				type: 'text/plain',
			} );

			// Mock crypto.subtle.digest to throw error
			const originalDigest = global.crypto.subtle.digest;
			global.crypto.subtle.digest = jest.fn( () => {
				throw new Error( 'Crypto API failure' );
			} );

			await expect( calculateFileHash( file ) ).rejects.toThrow(
				'Hash calculation failed'
			);

			// Restore original mock
			global.crypto.subtle.digest = originalDigest;
		} );

		test( 'handles blob conversion failure', async () => {
			// Create a mock file that fails on arrayBuffer()
			const mockFile = {
				arrayBuffer: jest.fn( () => {
					throw new Error( 'ArrayBuffer conversion failed' );
				} ),
			};

			// Make it pass instanceof check
			Object.setPrototypeOf( mockFile, File.prototype );

			await expect( calculateFileHash( mockFile ) ).rejects.toThrow(
				'Hash calculation failed'
			);
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'handles file with only null bytes', async () => {
			const nullBytes = new Uint8Array( 100 ).fill( 0 );
			const file = new File( [ nullBytes.buffer ], 'nulls.bin', {
				type: 'application/octet-stream',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'handles file with all 255 bytes', async () => {
			const maxBytes = new Uint8Array( 100 ).fill( 255 );
			const file = new File( [ maxBytes.buffer ], 'max.bin', {
				type: 'application/octet-stream',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'handles file with unicode characters', async () => {
			const content = 'Hello 世界 🌍 مرحبا мир';
			const file = new File( [ content ], 'unicode.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'handles file with newlines', async () => {
			const content = 'Line 1\nLine 2\r\nLine 3\rLine 4';
			const file = new File( [ content ], 'lines.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'handles file with special characters', async () => {
			const content = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
			const file = new File( [ content ], 'special.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );
	} );

	describe( 'Web Crypto API Integration', () => {
		test( 'calls crypto.subtle.digest with correct parameters', async () => {
			const content = 'Test content';
			const file = new File( [ content ], 'test.txt', {
				type: 'text/plain',
			} );

			await calculateFileHash( file );

			expect( global.crypto.subtle.digest ).toHaveBeenCalledWith(
				'SHA-256',
				expect.any( ArrayBuffer )
			);
		} );

		test( 'uses arrayBuffer() to convert file', async () => {
			const content = 'Test content';
			const file = new File( [ content ], 'test.txt', {
				type: 'text/plain',
			} );

			// Spy on arrayBuffer method
			const arrayBufferSpy = jest.spyOn( file, 'arrayBuffer' );

			await calculateFileHash( file );

			expect( arrayBufferSpy ).toHaveBeenCalled();

			arrayBufferSpy.mockRestore();
		} );
	} );

	describe( 'Hash Format', () => {
		test( 'produces lowercase hexadecimal string', async () => {
			const file = new File( [ 'test' ], 'test.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toMatch( /^[0-9a-f]+$/ );
			expect( hash ).not.toMatch( /[A-F]/ ); // No uppercase
		} );

		test( 'produces 64-character string (256 bits / 4 bits per hex char)', async () => {
			const file = new File( [ 'test' ], 'test.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			expect( hash ).toHaveLength( 64 );
		} );

		test( 'pads hex values correctly (no leading zeros dropped)', async () => {
			const file = new File( [ 'test' ], 'test.txt', {
				type: 'text/plain',
			} );

			const hash = await calculateFileHash( file );

			// Every byte should be represented by exactly 2 hex characters
			expect( hash ).toHaveLength( 64 );
			expect( hash ).toMatch( /^([0-9a-f]{2}){32}$/ );
		} );
	} );
} );
