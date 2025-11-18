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
}
