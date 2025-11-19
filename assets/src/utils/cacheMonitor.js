/* eslint-disable no-console */
/**
 * Cache Monitor - Utility for monitoring and managing all IndexedDB caches
 *
 * Provides a unified interface to inspect, clear, and monitor all caches
 * used by the Aether Site Exporter. Useful for debugging, troubleshooting,
 * and performance analysis.
 *
 * Usage in browser console:
 * ```javascript
 * import { CacheMonitor } from './utils/cacheMonitor';
 * const monitor = new CacheMonitor();
 *
 * // Get overview of all caches
 * await monitor.getAllStats();
 *
 * // Clear all caches
 * await monitor.clearAll();
 * ```
 *
 * @package
 */

import { getWpOrgCache } from './wporgCache';
import { getManifestCache } from './manifestCache';
import { getUploadProgressCache } from './uploadProgressCache';
import { getArchiveProgressCache } from './archiveProgressCache';
import { deleteDatabase, isIndexedDBAvailable } from './indexedDB';

/**
 * Cache Monitor
 *
 * Unified interface for managing all IndexedDB caches
 */
export class CacheMonitor {
	/**
	 * Constructor
	 */
	constructor() {
		this.caches = {
			wporg: getWpOrgCache(),
			manifest: getManifestCache(),
			uploadProgress: getUploadProgressCache(),
			archiveProgress: getArchiveProgressCache(),
		};
	}

	/**
	 * Check if IndexedDB is available
	 *
	 * @return {boolean} True if IndexedDB is supported
	 */
	isAvailable() {
		return isIndexedDBAvailable();
	}

	/**
	 * Get statistics for all caches
	 *
	 * @return {Promise<Object>} Statistics for all caches
	 */
	async getAllStats() {
		const stats = {};

		try {
			stats.wporg = await this.caches.wporg.getStats();
			stats.manifest = await this.caches.manifest.getStats();
			stats.uploadProgress = await this.caches.uploadProgress.getStats();
			// Archive progress cache doesn't have getStats, skip for now

			// Calculate totals
			stats.total = {
				totalEntries:
					( stats.wporg.totalCached || 0 ) +
					( stats.manifest.totalCached || 0 ) +
					( stats.uploadProgress.totalSessions || 0 ),
				memoryCached: stats.wporg.memoryCached || 0,
				resumableSessions: stats.uploadProgress.resumableSessions || 0,
			};

			// Get storage estimate
			if ( navigator.storage && navigator.storage.estimate ) {
				const estimate = await navigator.storage.estimate();
				stats.storage = {
					quota: estimate.quota,
					usage: estimate.usage,
					percentUsed:
						estimate.quota > 0
							? (
									( estimate.usage / estimate.quota ) *
									100
							  ).toFixed( 2 )
							: 0,
					quotaFormatted: this.formatBytes( estimate.quota ),
					usageFormatted: this.formatBytes( estimate.usage ),
				};
			}
		} catch ( error ) {
			console.error( '[CacheMonitor] Error getting stats:', error );
		}

		return stats;
	}

	/**
	 * Get detailed statistics formatted for console output
	 *
	 * @return {Promise<string>} Formatted statistics
	 */
	async getFormattedStats() {
		const stats = await this.getAllStats();

		let output = '\n=== Aether Cache Monitor ===\n\n';

		output += 'WordPress.org API Cache:\n';
		output += `  Total cached: ${ stats.wporg.totalCached || 0 }\n`;
		output += `  Memory cached: ${ stats.wporg.memoryCached || 0 }\n\n`;

		output += 'Manifest Cache:\n';
		output += `  Total cached: ${ stats.manifest.totalCached || 0 }\n\n`;

		output += 'Upload Progress Cache:\n';
		output += `  Total sessions: ${
			stats.uploadProgress.totalSessions || 0
		}\n`;
		output += `  Resumable: ${
			stats.uploadProgress.resumableSessions || 0
		}\n`;
		if ( stats.uploadProgress.statusBreakdown ) {
			output += `  In progress: ${
				stats.uploadProgress.statusBreakdown.in_progress || 0
			}\n`;
			output += `  Paused: ${
				stats.uploadProgress.statusBreakdown.paused || 0
			}\n`;
			output += `  Completed: ${
				stats.uploadProgress.statusBreakdown.completed || 0
			}\n`;
			output += `  Failed: ${
				stats.uploadProgress.statusBreakdown.failed || 0
			}\n`;
		}

		output += '\n';
		output += 'Total:\n';
		output += `  Total entries: ${ stats.total.totalEntries }\n`;
		output += `  Memory entries: ${ stats.total.memoryCached }\n`;
		output += `  Resumable sessions: ${ stats.total.resumableSessions }\n`;

		if ( stats.storage ) {
			output += '\n';
			output += 'Storage:\n';
			output += `  Quota: ${ stats.storage.quotaFormatted }\n`;
			output += `  Usage: ${ stats.storage.usageFormatted }\n`;
			output += `  Percent: ${ stats.storage.percentUsed }%\n`;
		}

		output += '\n===========================\n';

		return output;
	}

	/**
	 * Print formatted statistics to console
	 *
	 * @return {Promise<void>}
	 */
	async printStats() {
		const formatted = await this.getFormattedStats();
		console.log( formatted );
	}

	/**
	 * Clear all caches
	 *
	 * @return {Promise<Object>} Results of clearing each cache
	 */
	async clearAll() {
		const results = {
			wporg: false,
			manifest: false,
			uploadProgress: false,
			archiveProgress: false,
		};

		try {
			results.wporg = await this.caches.wporg.clear();
			results.manifest = await this.caches.manifest.clear();
			results.uploadProgress = await this.caches.uploadProgress.clear();
			results.archiveProgress =
				await this.caches.archiveProgress.clearAll();

			console.log( '[CacheMonitor] All caches cleared:', results );
		} catch ( error ) {
			console.error( '[CacheMonitor] Error clearing caches:', error );
		}

		return results;
	}

	/**
	 * Clear specific cache
	 *
	 * @param {string} cacheName Cache name (wporg, manifest, uploadProgress, archiveProgress)
	 * @return {Promise<boolean>} True if cleared successfully
	 */
	async clearCache( cacheName ) {
		if ( ! this.caches[ cacheName ] ) {
			console.error( `[CacheMonitor] Unknown cache: ${ cacheName }` );
			return false;
		}

		try {
			// Archive progress cache uses clearAll() instead of clear()
			const clearMethod =
				cacheName === 'archiveProgress' ? 'clearAll' : 'clear';
			const result = await this.caches[ cacheName ][ clearMethod ]();
			console.log(
				`[CacheMonitor] Cleared ${ cacheName } cache:`,
				result
			);
			return result;
		} catch ( error ) {
			console.error(
				`[CacheMonitor] Error clearing ${ cacheName } cache:`,
				error
			);
			return false;
		}
	}

	/**
	 * Delete all IndexedDB databases
	 *
	 * Nuclear option - completely removes all cache databases
	 *
	 * @return {Promise<Object>} Results of deleting each database
	 */
	async deleteAllDatabases() {
		const results = {
			wporg: false,
			manifest: false,
			providerConfigs: false,
			uploadProgress: false,
			archiveProgress: false,
		};

		try {
			results.wporg = await deleteDatabase( 'aether-wporg-cache' );
			results.manifest = await deleteDatabase( 'aether-manifest-cache' );
			results.providerConfigs = await deleteDatabase(
				'aether-provider-configs'
			);
			results.uploadProgress = await deleteDatabase(
				'aether-upload-progress'
			);
			results.archiveProgress = await deleteDatabase(
				'aether-archive-progress'
			);

			console.log( '[CacheMonitor] All databases deleted:', results );
		} catch ( error ) {
			console.error( '[CacheMonitor] Error deleting databases:', error );
		}

		return results;
	}

	/**
	 * Run cleanup on all caches
	 *
	 * @return {Promise<Object>} Number of entries cleaned up per cache
	 */
	async cleanupAll() {
		const results = {
			wporg: 0,
			manifest: 0,
			uploadProgress: 0,
			archiveProgress: 0,
		};

		try {
			results.wporg = await this.caches.wporg.cleanup();
			results.manifest = await this.caches.manifest.cleanup();
			results.uploadProgress = await this.caches.uploadProgress.cleanup();
			results.archiveProgress =
				await this.caches.archiveProgress.cleanup();

			const total =
				results.wporg +
				results.manifest +
				results.uploadProgress +
				results.archiveProgress;

			console.log(
				`[CacheMonitor] Cleanup complete: ${ total } entries removed`,
				results
			);
		} catch ( error ) {
			console.error( '[CacheMonitor] Error during cleanup:', error );
		}

		return results;
	}

	/**
	 * Get resumable upload sessions
	 *
	 * @return {Promise<Array>} Array of resumable sessions
	 */
	async getResumableSessions() {
		try {
			return await this.caches.uploadProgress.getResumableSessions();
		} catch ( error ) {
			console.error(
				'[CacheMonitor] Error getting resumable sessions:',
				error
			);
			return [];
		}
	}

	/**
	 * Format bytes to human-readable string
	 *
	 * @private
	 * @param {number} bytes Bytes to format
	 * @return {string} Formatted string (e.g., "1.5 MB")
	 */
	formatBytes( bytes ) {
		if ( bytes === 0 ) {
			return '0 Bytes';
		}
		if ( ! bytes ) {
			return 'Unknown';
		}

		const k = 1024;
		const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
		const i = Math.floor( Math.log( bytes ) / Math.log( k ) );

		return (
			parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( 2 ) ) +
			' ' +
			sizes[ i ]
		);
	}

	/**
	 * Export cache statistics to JSON
	 *
	 * @return {Promise<string>} JSON string of all stats
	 */
	async exportStats() {
		const stats = await this.getAllStats();
		return JSON.stringify( stats, null, 2 );
	}
}

/**
 * Create and expose global cache monitor for console access
 *
 * Usage in browser console:
 * ```javascript
 * window.aetherCacheMonitor.printStats()
 * window.aetherCacheMonitor.clearAll()
 * ```
 */
if ( typeof window !== 'undefined' ) {
	window.aetherCacheMonitor = new CacheMonitor();
}

export default CacheMonitor;
