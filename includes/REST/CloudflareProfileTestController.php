<?php

/**
 * Cloudflare Profile Test Controller
 *
 * Handles testing of Cloudflare credentials profiles.
 * Verifies that the account_id and api_token are valid.
 *
 * @package Altolith\DeployR2\REST
 */

namespace Altolith\DeployR2\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Cloudflare Profile Test Controller.
 */
class CloudflareProfileTestController
{
	use RESTHelpersTrait;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Test Cloudflare credentials profile.
		\register_rest_route(
			$this->getNamespace(),
			'/profiles/cloudflare/test',
			[
				'methods' => 'POST',
				'callback' => [$this, 'testCredentials'],
				'permission_callback' => [$this, 'permissionCheck'],
				'args' => [
					'account_id' => [
						'required' => true,
						'type' => 'string',
					],
					'api_token' => [
						'required' => true,
						'type' => 'string',
					],
				],
			]
		);
	}

	/**
	 * Get REST API namespace.
	 *
	 * @return string API namespace.
	 */
	public function getNamespace(): string
	{
		return 'altolith/deploy-r2';
	}

	/**
	 * Test Cloudflare credentials.
	 *
	 * Verifies the account_id and api_token by calling the Cloudflare API.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function testCredentials(WP_REST_Request $request)
	{
		$accountId = $request->get_param('account_id');
		$apiToken = $request->get_param('api_token');

		// Validate account_id format (32-character hex string).
		if (!\preg_match('/^[a-f0-9]{32}$/i', $accountId)) {
			// Return 200 even for validation errors - success field indicates result.
			return new WP_REST_Response(
				[
					'success' => false,
					'message' => \__('Invalid Account ID format. Must be a 32-character hexadecimal string.', 'altolith-deploy-r2'),
				],
				200
			);
		}

		// Test credentials by calling Cloudflare API.
		$testResult = $this->verifyCloudflareCredentials($accountId, $apiToken);

		// Always return 200 for valid test responses.
		// The 'success' field indicates test pass/fail, not HTTP status.
		return new WP_REST_Response(
			[
				'success' => $testResult['success'],
				'message' => $testResult['message'],
				'details' => $testResult['details'] ?? null,
			],
			200
		);
	}

	/**
	 * Verify Cloudflare credentials by calling the API.
	 *
	 * @param string $accountId Cloudflare Account ID.
	 * @param string $apiToken  Cloudflare API Token.
	 * @return array{success: bool, message: string, details?: array<string, mixed>} Test result.
	 */
	private function verifyCloudflareCredentials(string $accountId, string $apiToken): array
	{
		// Call Cloudflare API to verify token.
		// Using the "verify token" endpoint which returns token details if valid.
		$response = \wp_remote_get(
			'https://api.cloudflare.com/client/v4/user/tokens/verify',
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $apiToken,
					'Content-Type' => 'application/json',
				],
				'timeout' => 15,
			]
		);

		if (\is_wp_error($response)) {
			return [
				'success' => false,
				'message' => \sprintf(
					/* translators: %s: Error message */
					\__('Failed to connect to Cloudflare API: %s', 'altolith-deploy-r2'),
					$response->get_error_message()
				),
			];
		}

		$statusCode = \wp_remote_retrieve_response_code($response);
		$body = \wp_remote_retrieve_body($response);
		$data = \json_decode($body, true);

		// Check if the token is valid.
		if ($statusCode === 200 && isset($data['success']) && $data['success'] === true) {
			// Token is valid, now verify it has access to the account.
			$accountVerification = $this->verifyAccountAccess($accountId, $apiToken);

			if (! $accountVerification['success']) {
				return $accountVerification;
			}

			return [
				'success' => true,
				'message' => \__('Cloudflare credentials are valid.', 'altolith-deploy-r2'),
				'details' => [
					'token_status' => $data['result']['status'] ?? 'active',
					'account_verified' => true,
				],
			];
		}

		// Token is invalid.
		$errorMessages = [];
		if (isset($data['errors']) && \is_array($data['errors'])) {
			foreach ($data['errors'] as $error) {
				$errorMessages[] = $error['message'] ?? 'Unknown error';
			}
		}

		return [
			'success' => false,
			'message' => \sprintf(
				/* translators: %s: Error details */
				\__('Invalid API Token: %s', 'altolith-deploy-r2'),
				!empty($errorMessages) ? \implode(', ', $errorMessages) : 'Authentication failed'
			),
		];
	}

	/**
	 * Verify the token has access to the specified account.
	 *
	 * @param string $accountId Cloudflare Account ID.
	 * @param string $apiToken  Cloudflare API Token.
	 * @return array{success: bool, message: string} Verification result.
	 */
	private function verifyAccountAccess(string $accountId, string $apiToken): array
	{
		// Try to get account details to verify access.
		$response = \wp_remote_get(
			'https://api.cloudflare.com/client/v4/accounts/' . $accountId,
			[
				'headers' => [
					'Authorization' => 'Bearer ' . $apiToken,
					'Content-Type' => 'application/json',
				],
				'timeout' => 15,
			]
		);

		if (\is_wp_error($response)) {
			return [
				'success' => false,
				'message' => \sprintf(
					/* translators: %s: Error message */
					\__('Failed to verify account access: %s', 'altolith-deploy-r2'),
					$response->get_error_message()
				),
			];
		}

		$statusCode = \wp_remote_retrieve_response_code($response);
		$body = \wp_remote_retrieve_body($response);
		$data = \json_decode($body, true);

		if ($statusCode === 200 && isset($data['success']) && $data['success'] === true) {
			return [
				'success' => true,
				'message' => \__('Account access verified.', 'altolith-deploy-r2'),
			];
		}

		// Account access failed.
		if ($statusCode === 403) {
			return [
				'success' => false,
				'message' => \__('API Token does not have access to this account. Please verify the Account ID and token permissions.', 'altolith-deploy-r2'),
			];
		}

		if ($statusCode === 404) {
			return [
				'success' => false,
				'message' => \__('Account not found. Please verify the Account ID.', 'altolith-deploy-r2'),
			];
		}

		$errorMessages = [];
		if (isset($data['errors']) && \is_array($data['errors'])) {
			foreach ($data['errors'] as $error) {
				$errorMessages[] = $error['message'] ?? 'Unknown error';
			}
		}

		return [
			'success' => false,
			'message' => \sprintf(
				/* translators: %s: Error details */
				\__('Failed to verify account access: %s', 'altolith-deploy-r2'),
				!empty($errorMessages) ? \implode(', ', $errorMessages) : 'Unknown error'
			),
		];
	}
}
