/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from the meta tag or returns a default.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
 * @package
 */

/**
 * Get REST API URL from meta tag or default.
 *
 * @return {string} REST API base URL.
 */
export function getRestUrl() {
	const metaTag = document.querySelector( 'meta[name="aether-rest-url"]' );
	if ( metaTag ) {
		return (
			metaTag.getAttribute( 'content' ) ||
			'/wp-json/aether/site-exporter/'
		);
	}
	return '/wp-json/aether/site-exporter/';
}
