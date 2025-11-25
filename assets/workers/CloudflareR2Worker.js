/* eslint-disable no-console */
/**
 * Cloudflare Worker for WordPress Playground R2 Uploads
 *
 * No build step required - deploy directly to Cloudflare Workers
 */

// CORS headers for WordPress Playground
const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers':
		'Content-Type, X-R2-Key, X-R2-Content-Type, X-R2-Cache-Control, X-API-Key, X-R2-Action, X-R2-Upload-Id, X-R2-Part-Number',
	'Access-Control-Max-Age': '86400',
};

export default {
	async fetch( request, env ) {
		// Handle CORS preflight
		if ( request.method === 'OPTIONS' ) {
			return new Response( null, {
				status: 204,
				headers: CORS_HEADERS,
			} );
		}

		const debugInfo = {
			method: request.method,
			url: request.url,
			headers: {},
			timing: {},
		};

		// Capture request headers for debugging
		for ( const [ key, value ] of request.headers.entries() ) {
			// Don't log sensitive data like API keys
			if ( key.toLowerCase() === 'x-api-key' ) {
				debugInfo.headers[ key ] = '[REDACTED]';
			} else {
				debugInfo.headers[ key ] = value;
			}
		}

		// Handle GET requests for serving static files
		if ( request.method === 'GET' ) {
			return handleStaticFileRequest( request, env, debugInfo );
		}

		// Only allow POST requests beyond this point
		if ( request.method !== 'POST' ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Method not allowed',
					debug: debugInfo,
				} ),
				{
					status: 405,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		const startTime = Date.now();

		try {
			// Validate API key if configured
			if ( env.API_KEY ) {
				const apiKey = request.headers.get( 'X-API-Key' );
				debugInfo.timing.auth_check = Date.now() - startTime;
				if ( apiKey !== env.API_KEY ) {
					return new Response(
						JSON.stringify( {
							success: false,
							error: 'Unauthorized',
							debug: debugInfo,
						} ),
						{
							status: 401,
							headers: {
								...CORS_HEADERS,
								'Content-Type': 'application/json',
							},
						}
					);
				}
			}

			// Check for multipart upload actions
			const action = request.headers.get( 'X-R2-Action' );
			const uploadId = request.headers.get( 'X-R2-Upload-Id' );

			// Route to multipart handlers
			if ( action === 'initiate-multipart' ) {
				return handleInitiateMultipart(
					request,
					env,
					debugInfo,
					startTime
				);
			}

			if ( action === 'complete-multipart' ) {
				return handleCompleteMultipart(
					request,
					env,
					debugInfo,
					startTime
				);
			}

			if ( action === 'abort-multipart' ) {
				return handleAbortMultipart(
					request,
					env,
					debugInfo,
					startTime
				);
			}

			if ( action === 'delete' ) {
				return handleDelete( request, env, debugInfo, startTime );
			}

			if ( action === 'copy' ) {
				return handleCopy( request, env, debugInfo, startTime );
			}

			if ( action === 'batch-copy' ) {
				return handleBatchCopy( request, env, debugInfo, startTime );
			}

			if ( action === 'batch-delete' ) {
				return handleBatchDelete( request, env, debugInfo, startTime );
			}

			if ( action === 'list' ) {
				return handleList( request, env, debugInfo, startTime );
			}

			if ( action === 'download' ) {
				return handleDownload( request, env, debugInfo, startTime );
			}

			if ( uploadId ) {
				return handleChunkUpload( request, env, debugInfo, startTime );
			}

			// Fall through to single-file upload (legacy)

			// Get R2 key from header
			const r2Key = request.headers.get( 'X-R2-Key' );
			if ( ! r2Key ) {
				debugInfo.timing.validation = Date.now() - startTime;
				return new Response(
					JSON.stringify( {
						success: false,
						error: 'Missing X-R2-Key header',
						debug: debugInfo,
					} ),
					{
						status: 400,
						headers: {
							...CORS_HEADERS,
							'Content-Type': 'application/json',
						},
					}
				);
			}

			// Get content type for file upload (optional, defaults to application/octet-stream)
			const uploadContentType =
				request.headers.get( 'X-R2-Content-Type' ) ||
				'application/octet-stream';

			// Get file data directly from request body (binary upload)
			const readStartTime = Date.now();
			const arrayBuffer = await request.arrayBuffer();
			debugInfo.timing.read_body = Date.now() - readStartTime;

			const fileSize = arrayBuffer.byteLength;

			if ( fileSize === 0 ) {
				debugInfo.timing.validation = Date.now() - startTime;
				return new Response(
					JSON.stringify( {
						success: false,
						error: 'No file data received',
						debug: debugInfo,
					} ),
					{
						status: 400,
						headers: {
							...CORS_HEADERS,
							'Content-Type': 'application/json',
						},
					}
				);
			}

			// Check file size
			const maxSize = env.MAX_FILE_SIZE || 100 * 1024 * 1024; // 100MB default
			if ( fileSize > maxSize ) {
				debugInfo.timing.validation = Date.now() - startTime;
				return new Response(
					JSON.stringify( {
						success: false,
						error: `File too large. Maximum size: ${ maxSize } bytes`,
						debug: debugInfo,
					} ),
					{
						status: 413,
						headers: {
							...CORS_HEADERS,
							'Content-Type': 'application/json',
						},
					}
				);
			}

			// Upload to R2
			const uploadStartTime = Date.now();

			// Get cache control from header (defaults to 1 hour).
			const cacheControl =
				request.headers.get( 'X-R2-Cache-Control' ) ||
				'public, max-age=3600';

			await env.R2_BUCKET.put( r2Key, arrayBuffer, {
				httpMetadata: {
					contentType: uploadContentType,
					cacheControl,
				},
			} );

			debugInfo.timing.r2_upload = Date.now() - uploadStartTime;
			debugInfo.timing.total = Date.now() - startTime;

			return new Response(
				JSON.stringify( {
					success: true,
					key: r2Key,
					size: fileSize,
					debug: debugInfo,
				} ),
				{
					status: 200,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		} catch ( error ) {
			debugInfo.timing.total = Date.now() - startTime;
			debugInfo.error = {
				message: error.message,
				name: error.name,
				stack: error.stack,
			};

			console.error( '[Worker] Upload error:', error.message );
			console.error( '[Worker] Error details:', error );

			return new Response(
				JSON.stringify( {
					success: false,
					error: error.message || 'Upload failed',
					debug: debugInfo,
				} ),
				{
					status: 500,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}
	},
};

/**
 * Handle static file requests (GET)
 * Serves static files from R2
 * URL path maps directly to R2 key (e.g., /sample-page/ → sample-page/index.html)
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 */
async function handleStaticFileRequest( request, env, debugInfo ) {
	try {
		const url = new URL( request.url );
		const pathname = url.pathname;

		// Remove leading slash to get R2 key
		let filepath = pathname.startsWith( '/' )
			? pathname.slice( 1 )
			: pathname;

		// If empty or ends with /, append index.html
		if ( ! filepath || filepath.endsWith( '/' ) ) {
			filepath = filepath + 'index.html';
		}

		// Try to fetch from R2
		let object = await env.R2_BUCKET.get( filepath );

		// If not found and no extension, try as directory with /index.html
		if ( ! object ) {
			const lastSegment = filepath.split( '/' ).pop();
			if ( lastSegment && ! lastSegment.includes( '.' ) ) {
				const dirPath = filepath + '/index.html';
				object = await env.R2_BUCKET.get( dirPath );
				if ( object ) {
					filepath = dirPath;
				}
			}
		}

		if ( ! object ) {
			return new Response( `File not found: ${ filepath }`, {
				status: 404,
				headers: {
					'Content-Type': 'text/plain',
				},
			} );
		}

		// Get content type from R2 metadata or infer from file extension
		const contentType =
			object.httpMetadata?.contentType || getContentType( filepath );

		// Return file with appropriate headers (include CORS for fonts and other assets)
		return new Response( object.body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=3600',
				'Access-Control-Allow-Origin': '*',
				ETag: object.etag,
			},
		} );
	} catch ( error ) {
		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message,
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle R2 server-side copy operation
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleCopy( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { sourceKey, destKey } = body;

		if ( ! sourceKey || ! destKey ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Missing sourceKey or destKey',
					debug: debugInfo,
				} ),
				{
					status: 400,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		// Get source object
		const sourceObject = await env.R2_BUCKET.get( sourceKey );
		if ( ! sourceObject ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: `Source object not found: ${ sourceKey }`,
					debug: debugInfo,
				} ),
				{
					status: 404,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		// Copy object by reading and writing
		// R2 doesn't have native server-side copy, so we read and write
		await env.R2_BUCKET.put( destKey, sourceObject.body, {
			httpMetadata: sourceObject.httpMetadata,
			customMetadata: sourceObject.customMetadata,
		} );

		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				sourceKey,
				destKey,
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Copy error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to copy object',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle batch R2 server-side copy operations
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleBatchCopy( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { operations } = body;

		if ( ! operations || ! Array.isArray( operations ) ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Missing or invalid operations array',
					debug: debugInfo,
				} ),
				{
					status: 400,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		let copied = 0;
		let errors = 0;
		const results = [];

		// Process each copy operation
		for ( const op of operations ) {
			const { source, dest } = op;

			if ( ! source || ! dest ) {
				errors++;
				results.push( {
					source,
					dest,
					success: false,
					error: 'Missing source or dest',
				} );
				continue;
			}

			try {
				// Get source object
				const sourceObject = await env.R2_BUCKET.get( source );
				if ( ! sourceObject ) {
					errors++;
					results.push( {
						source,
						dest,
						success: false,
						error: 'Source not found',
					} );
					continue;
				}

				// Copy object
				await env.R2_BUCKET.put( dest, sourceObject.body, {
					httpMetadata: sourceObject.httpMetadata,
					customMetadata: sourceObject.customMetadata,
				} );

				copied++;
				results.push( {
					source,
					dest,
					success: true,
				} );
			} catch ( copyError ) {
				errors++;
				results.push( {
					source,
					dest,
					success: false,
					error: copyError.message,
				} );
			}
		}

		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				copied,
				errors,
				total: operations.length,
				results,
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Batch copy error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to batch copy objects',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle batch delete
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleBatchDelete( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { keys } = body;

		if ( ! keys || ! Array.isArray( keys ) ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Missing or invalid keys array',
					debug: debugInfo,
				} ),
				{
					status: 400,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		let deleted = 0;
		let errors = 0;
		const results = [];

		// Process each delete operation
		for ( const key of keys ) {
			if ( ! key ) {
				errors++;
				results.push( {
					key,
					success: false,
					error: 'Missing key',
				} );
				continue;
			}

			try {
				await env.R2_BUCKET.delete( key );

				deleted++;
				results.push( {
					key,
					success: true,
				} );
			} catch ( deleteError ) {
				errors++;
				results.push( {
					key,
					success: false,
					error: deleteError.message,
				} );
			}
		}

		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				deleted,
				errors,
				results,
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			stack: error.stack,
		};

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message,
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle list objects
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleList( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { prefix = '', limit = 1000 } = body;

		// List objects from R2
		const listStartTime = Date.now();
		const options = {};
		if ( prefix ) {
			options.prefix = prefix;
		}
		if ( limit ) {
			options.limit = limit;
		}

		const listed = await env.R2_BUCKET.list( options );
		debugInfo.timing.r2_list = Date.now() - listStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		// Format objects for response
		const objects = listed.objects.map( ( obj ) => ( {
			key: obj.key,
			size: obj.size,
			uploaded: obj.uploaded.toISOString(),
			etag: obj.etag,
		} ) );

		return new Response(
			JSON.stringify( {
				success: true,
				objects,
				truncated: listed.truncated,
				cursor: listed.cursor,
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] List objects error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to list objects',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle multipart upload initiation
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleInitiateMultipart( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { key, contentType, cacheControl } = body;

		// Create multipart upload
		const multipartUpload = await env.R2_BUCKET.createMultipartUpload(
			key,
			{
				httpMetadata: {
					contentType: contentType || 'application/octet-stream',
					cacheControl: cacheControl || 'public, max-age=3600',
				},
			}
		);

		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				uploadId: multipartUpload.uploadId,
				key: multipartUpload.key,
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Initiate multipart error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to initiate multipart upload',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle chunk upload
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleChunkUpload( request, env, debugInfo, startTime ) {
	try {
		const key = request.headers.get( 'X-R2-Key' );
		const uploadId = request.headers.get( 'X-R2-Upload-Id' );
		const partNumber = parseInt(
			request.headers.get( 'X-R2-Part-Number' ),
			10
		);

		// Resume the multipart upload
		const multipartUpload = env.R2_BUCKET.resumeMultipartUpload(
			key,
			uploadId
		);

		// Upload this part
		const uploadStartTime = Date.now();
		const uploadedPart = await multipartUpload.uploadPart(
			partNumber,
			request.body
		);
		debugInfo.timing.r2_upload = Date.now() - uploadStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				partNumber: uploadedPart.partNumber,
				etag: uploadedPart.etag,
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Chunk upload error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Chunk upload failed',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle multipart upload completion
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleCompleteMultipart( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { key, uploadId, parts } = body;

		// Resume the multipart upload
		const multipartUpload = env.R2_BUCKET.resumeMultipartUpload(
			key,
			uploadId
		);

		// Complete the upload
		const completeStartTime = Date.now();
		const object = await multipartUpload.complete( parts );
		debugInfo.timing.r2_complete = Date.now() - completeStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				key: object.key,
				size: object.size,
				etag: object.etag,
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Complete multipart error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to complete multipart upload',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle abort multipart upload
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleAbortMultipart( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { key, uploadId } = body;

		// Resume the multipart upload
		const multipartUpload = env.R2_BUCKET.resumeMultipartUpload(
			key,
			uploadId
		);

		// Abort the upload
		const abortStartTime = Date.now();
		await multipartUpload.abort();
		debugInfo.timing.r2_abort = Date.now() - abortStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				key,
				uploadId,
				message: 'Multipart upload aborted successfully',
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Abort multipart error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to abort multipart upload',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle download object
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleDownload( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { key } = body;

		if ( ! key ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Missing key in download request',
					debug: debugInfo,
				} ),
				{
					status: 400,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		// Get the object from R2
		const downloadStartTime = Date.now();
		const object = await env.R2_BUCKET.get( key );
		debugInfo.timing.r2_download = Date.now() - downloadStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		if ( ! object ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: `Object not found: ${ key }`,
					debug: debugInfo,
				} ),
				{
					status: 404,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		// Return the object with appropriate headers
		const contentType =
			object.httpMetadata?.contentType || 'application/octet-stream';

		return new Response( object.body, {
			status: 200,
			headers: {
				...CORS_HEADERS,
				'Content-Type': contentType,
				'Content-Length': object.size.toString(),
				ETag: object.etag,
				'Cache-Control':
					object.httpMetadata?.cacheControl || 'public, max-age=3600',
			},
		} );
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Download object error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to download object',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Handle delete object
 *
 * @param {Request} request   Request object
 * @param {Object}  env       Worker environment with R2_BUCKET binding
 * @param {Object}  debugInfo Debug information object
 * @param {number}  startTime Start time timestamp for performance tracking
 */
async function handleDelete( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { key } = body;

		// Delete the object from R2
		const deleteStartTime = Date.now();
		await env.R2_BUCKET.delete( key );
		debugInfo.timing.r2_delete = Date.now() - deleteStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		return new Response(
			JSON.stringify( {
				success: true,
				key,
				message: 'Object deleted successfully',
				debug: debugInfo,
			} ),
			{
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	} catch ( error ) {
		debugInfo.timing.total = Date.now() - startTime;
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		console.error( '[Worker] Delete object error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Failed to delete object',
				debug: debugInfo,
			} ),
			{
				status: 500,
				headers: {
					...CORS_HEADERS,
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

/**
 * Get content type for a file path
 * @param {string} path - File path
 * @return {string} Content type
 */
function getContentType( path ) {
	const ext = path.split( '.' ).pop().toLowerCase();
	const mimeTypes = {
		html: 'text/html',
		css: 'text/css',
		js: 'application/javascript',
		json: 'application/json',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		svg: 'image/svg+xml',
		webp: 'image/webp',
		woff: 'font/woff',
		woff2: 'font/woff2',
		ttf: 'font/ttf',
		eot: 'application/vnd.ms-fontobject',
	};
	return mimeTypes[ ext ] || 'application/octet-stream';
}
