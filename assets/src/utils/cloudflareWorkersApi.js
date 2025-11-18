/**
 * Cloudflare Workers API Client
 *
 * Client for Cloudflare Workers API (v4).
 * Handles worker deployment, retrieval, and management.
 *
 * @package
 */

import { parseErrorResponseWithStatus } from './errorParser';
import { createAuthHeaders } from './api';
import { createSuccessResponse, createErrorResponse } from './standardResponse';

/**
 * Cloudflare API base URL.
 */
const API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Deploy a worker to Cloudflare.
 *
 * @param {string} accountId  Cloudflare account ID.
 * @param {string} apiToken   Cloudflare API token.
 * @param {string} workerName Worker name.
 * @param {string} script     Worker script content.
 * @param {Object} bindings   Optional worker bindings (storage buckets, KV namespaces, etc.).
 * @return {Promise<Object>} Deployment result with success, workerName, workerUrl, and optional error.
 */
export async function deployWorker(
	accountId,
	apiToken,
	workerName,
	script,
	bindings = {}
) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts/${ workerName }`;

	// Create multipart/form-data body for ES module upload.
	const boundary = generateBoundary();
	const body = buildMultipartBody( script, bindings, boundary );

	const authHeaders = createAuthHeaders( apiToken );
	const response = await fetch( url, {
		method: 'PUT',
		headers: {
			...authHeaders,
			'Content-Type': `multipart/form-data; boundary=${ boundary }`,
		},
		body,
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'Worker deployment'
		);
		return createErrorResponse( errorMessage );
	}

	const workerUrl = `https://${ workerName }.workers.dev`;

	return createSuccessResponse( { workerName, workerUrl } );
}

/**
 * Get worker information.
 *
 * @param {string} accountId  Cloudflare account ID.
 * @param {string} apiToken   Cloudflare API token.
 * @param {string} workerName Worker name.
 * @return {Promise<Object>} Worker info or error.
 */
export async function getWorker( accountId, apiToken, workerName ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts/${ workerName }`;

	const response = await fetch( url, {
		method: 'GET',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'Get worker'
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( { worker: data.result || data } );
}

/**
 * List workers for an account.
 *
 * @param {string} accountId Cloudflare account ID.
 * @param {string} apiToken  Cloudflare API token.
 * @return {Promise<Object>} List of workers or error.
 */
export async function listWorkers( accountId, apiToken ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts`;

	const response = await fetch( url, {
		method: 'GET',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'List workers'
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( { workers: data.result || [] } );
}

/**
 * Test API token permissions.
 *
 * NOTE: In WordPress Playground (browser environment), we cannot make direct
 * API calls to Cloudflare due to CORS restrictions. This function validates
 * credentials format only. Actual connection will be tested during deployment.
 *
 * @param {string} accountId Cloudflare account ID.
 * @param {string} apiToken  Cloudflare API token.
 * @return {Promise<Object>} Test result with success and optional error/message.
 */
export async function testTokenPermissions( accountId, apiToken ) {
	// Validate credentials are provided
	if ( ! accountId || ! apiToken ) {
		return createErrorResponse( 'Account ID and API token are required' );
	}

	// Validate account ID format (32 character hex)
	if ( ! /^[a-f0-9]{32}$/i.test( accountId ) ) {
		return createErrorResponse(
			'Invalid account ID format (expected 32 character hex string)'
		);
	}

	// Validate API token format (40 character alphanumeric)
	if ( apiToken.length < 20 ) {
		return createErrorResponse(
			'API token appears too short (expected at least 20 characters)'
		);
	}

	// In browser environment (WordPress Playground), we cannot test the actual
	// connection due to CORS. Return success after validation.
	// The connection will be validated during actual worker deployment.
	return createSuccessResponse(
		null,
		'Credentials validated. Connection will be tested during deployment.'
	);
}

/**
 * Delete a worker.
 *
 * @param {string} accountId  Cloudflare account ID.
 * @param {string} apiToken   Cloudflare API token.
 * @param {string} workerName Worker name.
 * @return {Promise<Object>} Delete result with success and optional error/message.
 */
export async function deleteWorker( accountId, apiToken, workerName ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/scripts/${ workerName }`;

	const response = await fetch( url, {
		method: 'DELETE',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( response.status === 200 || response.status === 404 ) {
		// 404 means worker already deleted, which is success.
		return {
			success: true,
			message: `Worker ${ workerName } deleted successfully`,
		};
	}

	const responseBody = await response.text();
	const errorMessage = parseErrorResponseWithStatus(
		responseBody,
		response.status,
		'Worker deletion'
	);
	return createErrorResponse( errorMessage );
}

/**
 * List all custom domains for workers.
 *
 * @param {string} accountId Cloudflare account ID.
 * @param {string} apiToken  Cloudflare API token.
 * @return {Promise<Object>} List of custom domains or error.
 */
export async function listCustomDomains( accountId, apiToken ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/domains`;

	const response = await fetch( url, {
		method: 'GET',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'List custom domains'
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( { domains: data.result || [] } );
}

/**
 * Attach a custom domain to a worker.
 *
 * @param {string} accountId  Cloudflare account ID.
 * @param {string} apiToken   Cloudflare API token.
 * @param {string} workerName Worker name (service).
 * @param {string} hostname   Domain hostname (e.g., "s12y.org").
 * @param {string} zoneId     Cloudflare zone ID for the domain.
 * @return {Promise<Object>} Attachment result with success and optional error.
 */
export async function attachCustomDomain(
	accountId,
	apiToken,
	workerName,
	hostname,
	zoneId
) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/domains`;

	// Clean hostname (remove protocol and paths)
	const cleanHostname = hostname
		.replace( /^https?:\/\//, '' )
		.replace( /\/.*$/, '' );

	const body = JSON.stringify( {
		environment: 'production',
		hostname: cleanHostname,
		service: workerName,
		zone_id: zoneId,
	} );

	const response = await fetch( url, {
		method: 'PUT',
		headers: createAuthHeaders( apiToken ),
		body,
	} );

	if ( ! response.ok ) {
		const responseBody = await response.text();
		const errorMessage = parseErrorResponseWithStatus(
			responseBody,
			response.status,
			'Attach custom domain'
		);
		return createErrorResponse( errorMessage );
	}

	const data = await response.json();
	return createSuccessResponse( { domain: data.result || data } );
}

/**
 * Remove a custom domain from a worker.
 *
 * @param {string} accountId Cloudflare account ID.
 * @param {string} apiToken  Cloudflare API token.
 * @param {string} domainId  Domain ID (from list domains response).
 * @return {Promise<Object>} Removal result with success and optional error.
 */
export async function removeCustomDomain( accountId, apiToken, domainId ) {
	const url = `${ API_BASE }/accounts/${ accountId }/workers/domains/${ domainId }`;

	const response = await fetch( url, {
		method: 'DELETE',
		headers: createAuthHeaders( apiToken ),
	} );

	if ( response.status === 200 || response.status === 404 ) {
		// 404 means domain already removed, which is success.
		return {
			success: true,
			message: `Custom domain ${ domainId } removed successfully`,
		};
	}

	const responseBody = await response.text();
	const errorMessage = parseErrorResponseWithStatus(
		responseBody,
		response.status,
		'Custom domain removal'
	);
	return createErrorResponse( errorMessage );
}

/**
 * Generate a random boundary string for multipart/form-data.
 *
 * @return {string} Boundary string.
 */
function generateBoundary() {
	return `----WebKitFormBoundary${ Math.random()
		.toString( 36 )
		.substring( 2, 15 ) }`;
}

/**
 * Build multipart/form-data body for worker deployment.
 *
 * @param {string} script   Worker script content.
 * @param {Object} bindings Worker bindings.
 * @param {string} boundary Boundary string.
 * @return {string} Multipart body.
 */
function buildMultipartBody( script, bindings, boundary ) {
	let body = '';

	// Add the worker script as a file part.
	body += `--${ boundary }\r\n`;
	body +=
		'Content-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n';
	body += 'Content-Type: application/javascript+module\r\n\r\n';
	body += script + '\r\n';

	// Add metadata to indicate ES module format.
	const metadata = {
		main_module: 'worker.js', // Cloudflare API requires snake_case
	};

	// Add bindings if provided.
	if ( Object.keys( bindings ).length > 0 ) {
		metadata.bindings = bindings;
	}

	body += `--${ boundary }\r\n`;
	body += 'Content-Disposition: form-data; name="metadata"\r\n';
	body += 'Content-Type: application/json\r\n\r\n';
	body += JSON.stringify( metadata ) + '\r\n';

	body += `--${ boundary }--\r\n`;

	return body;
}
