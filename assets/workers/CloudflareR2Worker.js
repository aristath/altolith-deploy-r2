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
		'Content-Type, X-R2-Key, X-R2-Content-Type, X-R2-Cache-Control, X-API-Key, X-R2-Action, X-R2-Upload-Id, X-R2-Part-Number, X-CF-Action, X-CF-Image-Id, X-CF-Metadata',
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

		// Handle GET requests for serving static files or Git proxy
		if ( request.method === 'GET' ) {
			// Check if this is a Git proxy request (info/refs endpoint)
			const url = new URL( request.url );
			if ( url.pathname.endsWith( '/info/refs' ) && url.searchParams.has( 'service' ) ) {
				return handleGitProxy( request, env, debugInfo );
			}

			// Check if this is a WordPress.org check request
			if ( url.pathname.startsWith( '/check-wporg' ) ) {
				return handleWordPressOrgCheck( request, env, debugInfo );
			}

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

			// Check for Git proxy requests (git-upload-pack, git-receive-pack)
			const contentType = request.headers.get( 'content-type' );
			if (
				contentType === 'application/x-git-upload-pack-request' ||
				contentType === 'application/x-git-receive-pack-request'
			) {
				return handleGitProxy( request, env, debugInfo );
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
 * Serves static HTML files from R2
 * URL format: /sites/{project-name}/{filepath}
 * Maps to R2 key: sites/{project-name}/static/{filepath}
 * @param request
 * @param env
 * @param debugInfo
 */
async function handleStaticFileRequest( request, env, debugInfo ) {
	try {
		const url = new URL( request.url );
		const pathname = url.pathname;

		// Parse URL: /{site-key}/{filepath}
		// pathname = /7f1e0e8dff8818d1c2f579415daff8c7/about/index.html
		// parts = ['7f1e0e8dff8818d1c2f579415daff8c7', 'about', 'index.html']
		const parts = pathname.split( '/' ).filter( ( p ) => p );

		if ( parts.length < 1 ) {
			return new Response(
				'Invalid URL format. Use: /{site-key}/{filepath}',
				{
					status: 400,
					headers: {
						'Content-Type': 'text/plain',
					},
				}
			);
		}

		// parts[0] = site-key (MD5 hash)
		// parts[1+] = filepath
		const siteKey = parts[ 0 ];
		let filepath = parts.slice( 1 ).join( '/' );

		// Check if original pathname ended with slash (before filtering removed it)
		const endsWithSlash = pathname.endsWith( '/' );

		// If no filepath specified or ends with /, serve index.html
		if ( ! filepath || filepath === '' || endsWithSlash ) {
			filepath = filepath ? filepath + '/index.html' : 'index.html';
		}

		// Construct R2 key: {site-key}/static/{filepath}
		let r2Key = `${ siteKey }/static/${ filepath }`;

		// Fetch file from R2
		let object = await env.R2_BUCKET.get( r2Key );

		// If file not found and filepath has no extension (looks like a directory),
		// try fetching {filepath}/index.html
		if ( ! object && filepath && ! endsWithSlash ) {
			// Check if the last path segment has no file extension (no dot)
			const lastSegment = filepath.split( '/' ).pop();
			const hasExtension = lastSegment.includes( '.' );

			if ( ! hasExtension ) {
				// Try fetching as directory with index.html
				r2Key = `${ siteKey }/static/${ filepath }/index.html`;
				object = await env.R2_BUCKET.get( r2Key );

				// Update filepath for content type detection
				if ( object ) {
					filepath = `${ filepath }/index.html`;
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
				'ETag': object.etag,
				'Cache-Control':
					object.httpMetadata?.cacheControl ||
					'public, max-age=3600',
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
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
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
 * Handle Cloudflare Images API proxy
 * Routes requests to Cloudflare Images API to bypass WordPress Playground limitations
 * @param cfAction  - Action to perform
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
 */
async function handleCloudflareImagesProxy( // eslint-disable-line no-unused-vars
	cfAction,
	request,
	env,
	debugInfo,
	startTime
) {
	// Validate CF Images configuration
	if (
		! env.CF_ACCOUNT_ID ||
		! env.CF_IMAGES_TOKEN ||
		! env.CF_IMAGES_ACCOUNT_HASH
	) {
		return new Response(
			JSON.stringify( {
				success: false,
				error: 'Cloudflare Images not configured in worker environment',
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

	switch ( cfAction ) {
		case 'upload':
			return handleCFImagesUpload( request, env, debugInfo, startTime );
		case 'delete':
			return handleCFImagesDelete( request, env, debugInfo, startTime );
		case 'test':
			return handleCFImagesTest( request, env, debugInfo, startTime );
		default:
			return new Response(
				JSON.stringify( {
					success: false,
					error: `Unknown CF action: ${ cfAction }`,
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
}

/**
 * Upload image to Cloudflare Images via worker proxy
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
 */
async function handleCFImagesUpload( request, env, debugInfo, startTime ) {
	try {
		// Get JSON payload with base64-encoded image data
		const payload = await request.json();
		const { id: imageId, filename, image: imageBase64, metadata } = payload;

		if ( ! imageBase64 || ! imageId ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Missing image data or id in upload request',
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

		// Decode base64 image data
		const binaryString = atob( imageBase64 );
		const bytes = new Uint8Array( binaryString.length );
		for ( let i = 0; i < binaryString.length; i++ ) {
			bytes[ i ] = binaryString.charCodeAt( i );
		}

		// Infer content type from filename
		const actualFilename = filename || 'image.jpg';
		const ext = actualFilename.split( '.' ).pop().toLowerCase();

		// Cloudflare Images accepted content types (based on API error messages)
		// https://developers.cloudflare.com/images/cloudflare-images/upload-images/
		const mimeTypes = {
			// JPEG and variants
			jpg: 'image/jpeg',
			jpeg: 'image/jpeg',
			jpe: 'image/jpeg',
			jfif: 'image/jpeg',
			pjpeg: 'image/jpeg',
			pjp: 'image/jpeg',
			// PNG
			png: 'image/png',
			apng: 'image/png',
			// GIF (including animated)
			gif: 'image/gif',
			// WebP (including animated)
			webp: 'image/webp',
			// SVG
			svg: 'image/svg+xml',
			svgz: 'image/svg+xml',
		};
		const contentType = mimeTypes[ ext ] || 'image/jpeg';

		// Create Blob from decoded binary data with correct content type
		const imageBlob = new Blob( [ bytes ], { type: contentType } );

		// Create File object for FormData
		const imageFile = new File( [ imageBlob ], actualFilename, {
			type: contentType,
		} );

		// Prepare FormData for CF Images API
		const cfFormData = new FormData();
		cfFormData.append( 'file', imageFile );
		cfFormData.append( 'id', imageId );
		if ( metadata ) {
			// CF Images expects metadata as JSON string
			const metadataStr =
				typeof metadata === 'string'
					? metadata
					: JSON.stringify( metadata );
			cfFormData.append( 'metadata', metadataStr );
		}

		const uploadStartTime = Date.now();

		// Forward to Cloudflare Images API
		const cfResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${ env.CF_ACCOUNT_ID }/images/v1`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${ env.CF_IMAGES_TOKEN }`,
				},
				body: cfFormData,
			}
		);

		debugInfo.timing.cf_upload = Date.now() - uploadStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		const cfData = await cfResponse.json();

		if ( ! cfResponse.ok ) {
			console.error( '[Worker] CF Images upload failed:', cfData );
			return new Response(
				JSON.stringify( {
					success: false,
					error:
						cfData.errors?.[ 0 ]?.message ||
						'Cloudflare Images upload failed',
					cf_status: cfResponse.status,
					debug: debugInfo,
				} ),
				{
					status: cfResponse.status,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		// Return success with CF Images result
		return new Response(
			JSON.stringify( {
				success: true,
				result: cfData.result,
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

		console.error( '[Worker] CF Images upload error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'CF Images upload failed',
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
 * Delete image from Cloudflare Images via worker proxy
 * Worker can use DELETE method even though Playground PHP cannot
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
 */
async function handleCFImagesDelete( request, env, debugInfo, startTime ) {
	try {
		const body = await request.json();
		const { imageId } = body;

		if ( ! imageId ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Missing imageId in delete request',
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

		const deleteStartTime = Date.now();

		// Forward DELETE request to Cloudflare Images API
		const cfResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${ env.CF_ACCOUNT_ID }/images/v1/${ imageId }`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${ env.CF_IMAGES_TOKEN }`,
				},
			}
		);

		debugInfo.timing.cf_delete = Date.now() - deleteStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		const cfData = await cfResponse.json();

		if ( ! cfResponse.ok ) {
			console.error( '[Worker] CF Images delete failed:', cfData );
			return new Response(
				JSON.stringify( {
					success: false,
					error:
						cfData.errors?.[ 0 ]?.message ||
						'Cloudflare Images delete failed',
					cf_status: cfResponse.status,
					debug: debugInfo,
				} ),
				{
					status: cfResponse.status,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		return new Response(
			JSON.stringify( {
				success: true,
				message: 'Image deleted successfully',
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

		console.error( '[Worker] CF Images delete error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'CF Images delete failed',
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
 * Test connection to Cloudflare Images API
 * @param request
 * @param env
 * @param debugInfo
 * @param startTime
 */
async function handleCFImagesTest( request, env, debugInfo, startTime ) {
	try {
		const testStartTime = Date.now();

		// Test by listing images (limit 1 for quick test)
		const cfResponse = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${ env.CF_ACCOUNT_ID }/images/v1?per_page=1`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${ env.CF_IMAGES_TOKEN }`,
				},
			}
		);

		debugInfo.timing.cf_test = Date.now() - testStartTime;
		debugInfo.timing.total = Date.now() - startTime;

		const cfData = await cfResponse.json();

		if ( ! cfResponse.ok ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error:
						cfData.errors?.[ 0 ]?.message ||
						'Cloudflare Images connection test failed',
					cf_status: cfResponse.status,
					debug: debugInfo,
				} ),
				{
					status: cfResponse.status,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		return new Response(
			JSON.stringify( {
				success: true,
				message: 'Cloudflare Images connection successful',
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

		console.error( '[Worker] CF Images test error:', error );

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'CF Images test failed',
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
 * Handle WordPress.org plugin/theme check
 * Proxies HEAD requests to wordpress.org to bypass CORS restrictions
 * @param {Request} request Request object
 * @param {Object} env Worker environment variables
 * @param {Object} debugInfo Debug information object
 * @return {Promise<Response>} Response indicating if asset exists on WordPress.org
 */
async function handleWordPressOrgCheck( request, env, debugInfo ) {
	try {
		const url = new URL( request.url );
		const slug = url.searchParams.get( 'slug' );
		const type = url.searchParams.get( 'type' );

		if ( ! slug || ! type ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Missing slug or type parameter',
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

		// Validate type
		if ( type !== 'plugin' && type !== 'theme' ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Invalid type. Must be "plugin" or "theme"',
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

		// Make HEAD request to wordpress.org
		const wporgUrl = `https://wordpress.org/${ type }s/${ slug }/`;
		const wporgResponse = await fetch( wporgUrl, {
			method: 'HEAD',
			redirect: 'manual',
		} );

		// Check if asset exists (200 = exists, 30x redirect = doesn't exist)
		const exists = wporgResponse.status === 200;

		return new Response(
			JSON.stringify( {
				success: true,
				exists,
				slug,
				type,
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
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'WordPress.org check failed',
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

/**
 * Handle Git CORS proxy requests for isomorphic-git.
 * Proxies Git protocol requests to bypass CORS restrictions.
 * Based on: https://gist.github.com/tomlarkworthy/cf1d4ceabeabdb6d1628575ab3a83acf
 *
 * @param {Request} request Request object.
 * @param {Object} env Worker environment variables.
 * @param {Object} debugInfo Debug information object.
 * @return {Promise<Response>} Proxied Git response.
 */
async function handleGitProxy( request, env, debugInfo ) {
	try {
		const url = new URL( request.url );
		const pathname = url.pathname;

		// Security: Extract and validate hostname from pathname to prevent SSRF attacks.
		// Pathname format: /github.com/user/repo.git/info/refs
		// We need to extract the hostname (github.com) and validate it.
		const pathParts = pathname.split( '/' ).filter( ( part ) => part );
		if ( pathParts.length < 2 ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Invalid Git proxy request path',
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

		// Extract hostname from first path segment.
		const hostname = pathParts[ 0 ].toLowerCase();

		// Security: Only allow known Git hosting providers to prevent SSRF attacks.
		const allowedHosts = [
			'github.com',
			'www.github.com',
			'gitlab.com',
			'www.gitlab.com',
			'bitbucket.org',
			'www.bitbucket.org',
		];

		let isAllowedHost = false;
		for ( const allowedHost of allowedHosts ) {
			if ( hostname === allowedHost || hostname.endsWith( '.' + allowedHost ) ) {
				isAllowedHost = true;
				break;
			}
		}

		if ( ! isAllowedHost ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Git repository hostname is not allowed. Only GitHub, GitLab, and Bitbucket are supported.',
					debug: debugInfo,
				} ),
				{
					status: 403,
					headers: {
						...CORS_HEADERS,
						'Content-Type': 'application/json',
					},
				}
			);
		}

		// Extract Git repository URL from pathname.
		// Format: /{git-url-path}/info/refs or /{git-url-path}/git-upload-pack
		// Example: /github.com/user/repo.git/info/refs
		// We need to reconstruct the full Git URL.
		// The pathname contains the Git URL path (without https://)
		let gitUrl = '';
		if ( pathname.endsWith( '/info/refs' ) ) {
			gitUrl = 'https://' + pathname.slice( 1 ).replace( '/info/refs', '' ) + '/info/refs' + url.search;
		} else if ( pathname.endsWith( '/git-upload-pack' ) ) {
			gitUrl = 'https://' + pathname.slice( 1 );
		} else if ( pathname.endsWith( '/git-receive-pack' ) ) {
			gitUrl = 'https://' + pathname.slice( 1 );
		} else {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Invalid Git proxy request path',
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

		// Security: Validate that the constructed URL uses HTTPS and matches allowed host.
		try {
			const gitUrlObj = new URL( gitUrl );
			if ( gitUrlObj.protocol !== 'https:' ) {
				return new Response(
					JSON.stringify( {
						success: false,
						error: 'Git repository URL must use HTTPS protocol.',
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

			const gitHostname = gitUrlObj.hostname.toLowerCase();
			let gitHostAllowed = false;
			for ( const allowedHost of allowedHosts ) {
				if ( gitHostname === allowedHost || gitHostname.endsWith( '.' + allowedHost ) ) {
					gitHostAllowed = true;
					break;
				}
			}

			if ( ! gitHostAllowed ) {
				return new Response(
					JSON.stringify( {
						success: false,
						error: 'Git repository hostname is not allowed.',
						debug: debugInfo,
					} ),
					{
						status: 403,
						headers: {
							...CORS_HEADERS,
							'Content-Type': 'application/json',
						},
					}
				);
			}
		} catch ( urlError ) {
			return new Response(
				JSON.stringify( {
					success: false,
					error: 'Invalid Git repository URL.',
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

		// Handle OPTIONS preflight
		if ( request.method === 'OPTIONS' ) {
			return new Response( null, {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin':
						request.headers.get( 'Origin' ) || '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers':
						request.headers.get( 'Access-Control-Request-Headers' ) ||
						'*',
					'Vary': 'Origin',
				},
			} );
		}

		// Strip headers that shouldn't be forwarded to Git repository
		const headersToStrip = [ 'host', 'origin', 'referer', 'content-length' ];
		const forwardHeaders = new Headers( request.headers );
		headersToStrip.forEach( ( header ) => {
			forwardHeaders.delete( header );
		} );

		// Forward request to Git repository
		const gitResponse = await fetch( gitUrl, {
			method: request.method,
			headers: forwardHeaders,
			body: request.body,
			redirect: 'follow',
		} );

		// Merge CORS headers with Git response headers
		const corsHeaders = {
			'Access-Control-Allow-Origin':
				request.headers.get( 'Origin' ) || '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers':
				request.headers.get( 'Access-Control-Request-Headers' ) || '*',
			'Vary': 'Origin',
		};

		const responseHeaders = new Headers( gitResponse.headers );
		Object.entries( corsHeaders ).forEach( ( [ key, value ] ) => {
			responseHeaders.set( key, value );
		} );

		return new Response( gitResponse.body, {
			status: gitResponse.status,
			headers: responseHeaders,
		} );
	} catch ( error ) {
		debugInfo.error = {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};

		return new Response(
			JSON.stringify( {
				success: false,
				error: error.message || 'Git proxy failed',
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
