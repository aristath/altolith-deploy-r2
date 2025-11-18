<?php

/**
 * REST API Helpers Trait
 *
 * Provides common functionality for REST controllers.
 *
 * @package Aether\SiteExporterProviders\REST
 */

namespace Aether\SiteExporterProviders\REST;

/**
 * Trait providing REST API helper methods.
 */
trait RESTHelpersTrait
{
	/**
	 * Permission check for REST endpoints.
	 *
	 * Requires manage_options capability.
	 *
	 * @return bool True if user has permission.
	 */
	public function permissionCheck(): bool
	{
		return \current_user_can('manage_options');
	}

	/**
	 * Get REST API namespace.
	 *
	 * @return string API namespace.
	 */
	public function getNamespace(): string
	{
		return 'aether/site-exporter/providers';
	}
}
