<?php

/**
 * Worker Script REST Controller
 *
 * Handles REST API endpoints for serving Cloudflare Worker scripts.
 *
 * @package Aether\SiteExporterProviders\REST
 */

namespace Aether\SiteExporterProviders\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Handles REST API endpoints for worker scripts.
 */
class WorkerScriptController
{
	use RESTHelpersTrait;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Get worker script content.
		\register_rest_route(
			$this->getNamespace(),
			'/worker-scripts/(?P<worker_type>[a-z0-9_-]+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getWorkerScript' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'worker_type' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Worker script type (e.g., "r2")', 'aether-site-exporter-providers'),
						'sanitize_callback' => 'sanitize_key',
					],
				],
			]
		);

		// Deploy worker to Cloudflare.
		\register_rest_route(
			$this->getNamespace(),
			'/cloudflare/deploy-worker',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'deployWorker' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'worker_type' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Worker type (e.g., "r2")', 'aether-site-exporter-providers'),
						'sanitize_callback' => 'sanitize_key',
					],
					'worker_name' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Worker name', 'aether-site-exporter-providers'),
						'sanitize_callback' => 'sanitize_text_field',
					],
					'script' => [
						'required'          => false,
						'type'              => 'string',
						'description'       => \__('Worker script content (optional - will be loaded from file system if not provided)', 'aether-site-exporter-providers'),
					],
					'bindings' => [
						'required'          => false,
						'type'              => 'object',
						'description'       => \__('Worker bindings', 'aether-site-exporter-providers'),
						'default'           => [],
					],
					'account_id' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Cloudflare account ID', 'aether-site-exporter-providers'),
						'sanitize_callback' => 'sanitize_text_field',
					],
					'api_token' => [
						'required'          => true,
						'type'              => 'string',
						'description'       => \__('Cloudflare API token', 'aether-site-exporter-providers'),
					],
				],
			]
		);
	}

	/**
	 * Get worker script content.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response with worker script or error.
	 */
	public function getWorkerScript(WP_REST_Request $request)
	{
		$workerType = \sanitize_key($request->get_param('worker_type'));

		// Map worker types to script files.
		$workerScripts = [
			'r2' => 'CloudflareR2Worker.js',
		];

		if (! isset($workerScripts[ $workerType ])) {
			return new WP_Error(
				'invalid_worker_type',
				\sprintf(
					/* translators: %s: worker type */
					\__('Invalid worker type: %s', 'aether-site-exporter-providers'),
					$workerType
				),
				[ 'status' => 400 ]
			);
		}

		$scriptFile = $workerScripts[ $workerType ];
		$scriptPath = AETHER_SEP_PLUGIN_DIR . 'assets/workers/' . $scriptFile;

		if (! \file_exists($scriptPath)) {
			return new WP_Error(
				'worker_script_not_found',
				\sprintf(
					/* translators: %s: script file name */
					\__('Worker script not found: %s', 'aether-site-exporter-providers'),
					$scriptFile
				),
				[ 'status' => 404 ]
			);
		}

		$scriptContent = \file_get_contents($scriptPath);

		if ($scriptContent === false) {
			return new WP_Error(
				'failed_to_read_script',
				\__('Failed to read worker script', 'aether-site-exporter-providers'),
				[ 'status' => 500 ]
			);
		}

		// Return script as plain text.
		return new WP_REST_Response($scriptContent, 200, [
			'Content-Type' => 'text/javascript; charset=utf-8',
		]);
	}

	/**
	 * Deploy worker to Cloudflare.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response with deployment result or error.
	 */
	public function deployWorker(WP_REST_Request $request)
	{
		$workerType = \sanitize_key($request->get_param('worker_type'));
		$workerName = \sanitize_text_field($request->get_param('worker_name'));
		$script = $request->get_param('script');
		$bindings = $request->get_param('bindings') ?? [];
		$accountId = \sanitize_text_field($request->get_param('account_id'));
		$apiToken = $request->get_param('api_token');

		// Validate required parameters.
		if (empty($workerName) || empty($accountId) || empty($apiToken)) {
			return new WP_Error(
				'missing_parameters',
				\__('Missing required parameters: worker_name, account_id, and api_token are required.', 'aether-site-exporter-providers'),
				['status' => 400]
			);
		}

		// If script is not provided via parameter, load it directly from file system
		if (empty($script)) {
			$workerScripts = [
				'r2' => 'CloudflareR2Worker.js',
			];

			if (! isset($workerScripts[$workerType])) {
				return new WP_Error(
					'invalid_worker_type',
					\sprintf(
						/* translators: %s: worker type */
						\__('Invalid worker type: %s', 'aether-site-exporter-providers'),
						$workerType
					),
					[ 'status' => 400 ]
				);
			}

			$scriptFile = $workerScripts[$workerType];
			$scriptPath = AETHER_SEP_PLUGIN_DIR . 'assets/workers/' . $scriptFile;

			if (! \file_exists($scriptPath)) {
				return new WP_Error(
					'worker_script_not_found',
					\sprintf(
						/* translators: %s: script file name */
						\__('Worker script not found: %s', 'aether-site-exporter-providers'),
						$scriptFile
					),
					[ 'status' => 404 ]
				);
			}

			$script = \file_get_contents($scriptPath);

			if ($script === false) {
				return new WP_Error(
					'failed_to_read_script',
					\__('Failed to read worker script', 'aether-site-exporter-providers'),
					[ 'status' => 500 ]
				);
			}

			\error_log("Cloudflare Worker Deployment - Loaded script directly from file: " . $scriptPath);
		} else {
			\error_log("Cloudflare Worker Deployment - Using script from parameter");
		}

		// Validate script content - ensure it's not empty and has proper structure
		$script = \trim($script);
		if (empty($script)) {
			return new WP_Error(
				'invalid_script',
				\__('Worker script is empty.', 'aether-site-exporter-providers'),
				['status' => 400]
			);
		}

		// Ensure script has proper structure for Cloudflare Workers
		if (strpos($script, 'export default') === false || strpos($script, 'async fetch') === false) {
			return new WP_Error(
				'invalid_script_format',
				\__('Worker script must be a valid Cloudflare Worker with export default and async fetch.', 'aether-site-exporter-providers'),
				['status' => 400]
			);
		}

		// Build multipart/form-data body for Cloudflare Workers API.
		$boundary = '----WebKitFormBoundary' . \wp_generate_password(13, false);
		$body = '';

		// Debug logging
		\error_log("Cloudflare Worker Deployment - Script length: " . strlen($script));
		\error_log("Cloudflare Worker Deployment - Script starts with: " . substr($script, 0, 50));
		\error_log("Cloudflare Worker Deployment - First 200 chars of script: " . substr($script, 0, 200));
		\error_log("Cloudflare Worker Deployment - Script ends with: " . substr($script, -100));

		$body .= "--{$boundary}\r\n";
		$body .= 'Content-Disposition: form-data; name="worker.js"; filename="worker.js"' . "\r\n";
		$body .= "Content-Type: application/javascript+module\r\n\r\n";
		$body .= $script . "\r\n";

		$metadata = [
			'main_module' => 'worker.js',
		];

		if (!empty($bindings)) {
			// Convert bindings object to array format expected by Cloudflare API
			// Cloudflare expects: [{"type": "r2_bucket", "name": "R2_BUCKET", "bucket_name": "..."}]
			$bindingsArray = [];
			foreach ($bindings as $name => $binding) {
				if (\is_array($binding) && isset($binding['type'])) {
					// Ensure proper format: type, name, and type-specific fields
					$bindingEntry = [
						'type' => $binding['type'],
						'name' => $name,
					];

					// Add type-specific fields (e.g., bucket_name for r2_bucket)
					foreach ($binding as $key => $value) {
						if ($key !== 'type' && $key !== 'name') {
							$bindingEntry[$key] = $value;
						}
					}

					$bindingsArray[] = $bindingEntry;
				}
			}
			if (!empty($bindingsArray)) {
				$metadata['bindings'] = $bindingsArray;
			}
		}

		\error_log("Cloudflare Worker Deployment - Metadata: " . \wp_json_encode($metadata));
		\error_log("Cloudflare Worker Deployment - Boundary: " . $boundary);

		$body .= "--{$boundary}\r\n";
		$body .= 'Content-Disposition: form-data; name="metadata"' . "\r\n";
		$body .= "Content-Type: application/json\r\n\r\n";
		$body .= \wp_json_encode($metadata) . "\r\n";
		$body .= "--{$boundary}--\r\n";

		\error_log("Cloudflare Worker Deployment - Body length: " . strlen($body));
		\error_log("Cloudflare Worker Deployment - First 300 chars of body: " . substr($body, 0, 300));
		\error_log("Cloudflare Worker Deployment - Last 300 chars of body: " . substr($body, -300));

		// Deploy to Cloudflare API
		$url = 'https://api.cloudflare.com/client/v4/accounts/' . \urlencode($accountId) . '/workers/scripts/' . \urlencode($workerName);

		\error_log("Cloudflare Worker Deployment - Making request to: " . $url);
		\error_log("Cloudflare Worker Deployment - Content-Type: multipart/form-data; boundary={$boundary}");

		// Use curl directly to avoid WordPress interference with multipart data
		if (function_exists('curl_init')) {
			$ch = curl_init();

			curl_setopt($ch, CURLOPT_URL, $url);
			curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
			curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
			curl_setopt($ch, CURLOPT_HTTPHEADER, [
				'Authorization: Bearer ' . $apiToken,
				'Content-Type: multipart/form-data; boundary=' . $boundary,
				'Content-Length: ' . strlen($body),
			]);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_TIMEOUT, 60);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

			$responseBody = curl_exec($ch);
			$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
			$curlError = curl_error($ch);

			curl_close($ch);

			if ($curlError) {
				\error_log("Cloudflare Worker Deployment - Curl error: " . $curlError);
				return new WP_Error(
					'deployment_failed',
					\sprintf(
						/* translators: %s: error message */
						\__('Worker deployment failed: %s', 'aether-site-exporter-providers'),
						$curlError
					),
					['status' => 500]
				);
			}

			\error_log("Cloudflare Worker Deployment - HTTP response code: " . $httpCode);
			if (is_string($responseBody)) {
				\error_log("Cloudflare Worker Deployment - Response body length: " . strlen($responseBody));
			}

			if ($httpCode !== 200) {
				$errorData = is_string($responseBody) ? \json_decode($responseBody, true) : null;
				$errorMessage = \__('Worker deployment failed', 'aether-site-exporter-providers');
				if (isset($errorData['errors'][0]['message'])) {
					$errorMessage = $errorData['errors'][0]['message'];
				}

				\error_log("Cloudflare Worker Deployment - Error response: " . $responseBody);

				return new WP_Error(
					'deployment_failed',
					\sprintf(
						/* translators: %1$s: HTTP status code, %2$s: error message */
						\__('Worker deployment failed (HTTP %1$s): %2$s', 'aether-site-exporter-providers'),
						$httpCode,
						$errorMessage
					),
					['status' => $httpCode]
				);
			}

			$response = [
				'body' => $responseBody,
				'response' => ['code' => $httpCode]
			];
		} else {
			// Fallback to wp_remote_request if curl is not available
			\error_log("Cloudflare Worker Deployment - Using wp_remote_request (curl not available)");
			$response = \wp_remote_request($url, [
				'method' => 'PUT',
				'headers' => [
					'Authorization' => "Bearer {$apiToken}",
					'Content-Type' => "multipart/form-data; boundary={$boundary}",
					'Content-Length' => strlen($body),
				],
				'body' => $body,
				'timeout' => 60,
				'sslverify' => true,
			]);
		}

		if (\is_wp_error($response)) {
			return new WP_Error(
				'deployment_failed',
				\sprintf(
					/* translators: %s: error message */
					\__('Worker deployment failed: %s', 'aether-site-exporter-providers'),
					$response->get_error_message()
				),
				['status' => 500]
			);
		}

		// Handle both curl response format and wp_remote_request format
		$statusCode = 0;
		$responseBody = '';
		// Check if response has 'response' key with 'code' (curl format) vs wp_remote_request format
		// @phpstan-ignore-next-line - isset check needed to distinguish curl format from wp_remote_request format
		if (isset($response['response']['code'])) {
			// Curl response format - we know 'response' and 'code' exist from line 379
			$statusCode = $response['response']['code'];
			$responseBody = is_string($response['body']) ? $response['body'] : '';
		} else {
			// wp_remote_request format
			$statusCode = \wp_remote_retrieve_response_code($response);
			$responseBody = \wp_remote_retrieve_body($response);
		}

		if ($statusCode !== 200) {
			$errorData = \json_decode($responseBody, true);
			$errorMessage = \__('Worker deployment failed', 'aether-site-exporter-providers');
			if (isset($errorData['errors'][0]['message'])) {
				$errorMessage = $errorData['errors'][0]['message'];
			}

			\error_log("Cloudflare Worker Deployment - Final error: HTTP {$statusCode} - {$errorMessage}");

			return new WP_Error(
				'deployment_failed',
				\sprintf(
					/* translators: %1$s: HTTP status code, %2$s: error message */
					\__('Worker deployment failed (HTTP %1$s): %2$s', 'aether-site-exporter-providers'),
					$statusCode,
					$errorMessage
				),
				['status' => $statusCode]
			);
		}

		// After successful deployment, get account subdomain for proper URL construction
		$subdomainUrl = 'https://api.cloudflare.com/client/v4/accounts/' . \urlencode($accountId) . '/workers/subdomain';
		$subdomainResponse = \wp_remote_get(
			$subdomainUrl,
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $apiToken,
					'Content-Type'  => 'application/json',
				],
				'timeout' => 30,
			]
		);

		$accountSubdomain = '';
		if (!\is_wp_error($subdomainResponse)) {
			$subdomainBody = \wp_remote_retrieve_body($subdomainResponse);
			$subdomainData = \json_decode($subdomainBody, true);

			if (isset($subdomainData['result']['subdomain'])) {
				$accountSubdomain = $subdomainData['result']['subdomain'];
			}
		}

		// Enable worker on workers.dev subdomain
		$enableSubdomainUrl = 'https://api.cloudflare.com/client/v4/accounts/' . \urlencode($accountId) . '/workers/scripts/' . \urlencode($workerName) . '/subdomain';
		$enableRequestBody = \wp_json_encode(['enabled' => true]);
		$enableSubdomainResponse = \wp_remote_post(
			$enableSubdomainUrl,
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $apiToken,
					'Content-Type'  => 'application/json',
				],
				'body' => $enableRequestBody !== false ? $enableRequestBody : '{"enabled":true}',
				'timeout' => 30,
			]
		);

		// Note: We don't fail deployment if subdomain enabling fails
		// The worker is still deployed and accessible

		// Construct proper worker URL with account subdomain
		if (!empty($accountSubdomain)) {
			$workerUrl = 'https://' . $workerName . '.' . $accountSubdomain . '.workers.dev';
		} else {
			// Fallback to basic URL without subdomain (should not happen in normal cases)
			$workerUrl = 'https://' . $workerName . '.workers.dev';
		}

		return new WP_REST_Response([
			'success' => true,
			'worker_name' => $workerName,
			'worker_url' => $workerUrl,
		], 200);
	}
}
