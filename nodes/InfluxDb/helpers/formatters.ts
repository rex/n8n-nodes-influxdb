import { IFormatOptions, IQueryResultRow } from '../types';

/**
 * Formatter utilities for InfluxDB responses.
 *
 * This class provides static methods for converting InfluxDB API responses
 * into n8n-friendly formats. It handles Flux query results, timestamp formatting,
 * and data structure transformations.
 *
 * @example
 * const formatted = InfluxDbFormatter.formatFluxResults(results, {
 *   timestampFormat: 'iso',
 *   flattenTables: true
 * });
 */
export class InfluxDbFormatter {
	/**
	 * Formats Flux query results into n8n JSON items.
	 *
	 * Converts the raw Flux query results from InfluxDB into an array of
	 * JSON objects suitable for n8n workflows. Handles timestamp formatting,
	 * table flattening, and row limiting.
	 *
	 * @param results - Raw Flux query results (array of row objects)
	 * @param options - Formatting options
	 * @returns Array of formatted result rows
	 *
	 * @example
	 * const items = formatFluxResults(results, {
	 *   timestampFormat: 'iso',
	 *   flattenTables: true,
	 *   limit: 1000
	 * });
	 */
	static formatFluxResults(
		results: Record<string, unknown>[],
		options?: IFormatOptions
	): IQueryResultRow[] {
		// Default formatting options
		const timestampFormat = options?.timestampFormat ?? 'iso';
		const limit = options?.limit ?? 0; // 0 means no limit

		// Convert results to formatted rows
		const formattedRows: IQueryResultRow[] = results.map((row) => {
			const formattedRow: IQueryResultRow = {};

			// Process each field in the row
			for (const [key, value] of Object.entries(row)) {
				// Format timestamp fields
				if (key === '_time' && value) {
					const formatted = this.formatTimestamp(
						value as string | Date,
						timestampFormat
					);
					formattedRow._time = typeof formatted === 'number' ? new Date(formatted) : formatted;
				}
				// Copy other standard fields
				else if (key === '_measurement' || key === '_field') {
					formattedRow[key] = value as string;
				} else if (key === '_value') {
					formattedRow[key] = value as string | number | boolean;
				}
				// Copy all other fields (tags, etc.)
				else if (key !== 'table' && key !== 'result') {
					// Filter out table metadata, keep actual data fields
					formattedRow[key] = value as string | number | boolean | Date;
				}
			}

			return formattedRow;
		});

		// Apply limit if specified
		if (limit > 0) {
			return formattedRows.slice(0, limit);
		}

		return formattedRows;
	}

	/**
	 * Formats a timestamp according to the specified format.
	 *
	 * Converts timestamps to ISO 8601 strings, Unix timestamps (milliseconds),
	 * or relative time descriptions.
	 *
	 * @param timestamp - The timestamp to format (Date object or ISO string)
	 * @param format - The desired output format
	 * @returns Formatted timestamp string or number
	 *
	 * @example
	 * formatTimestamp(new Date(), 'iso') // "2024-01-01T00:00:00.000Z"
	 * formatTimestamp(new Date(), 'unix') // 1640000000000
	 * formatTimestamp(new Date(), 'relative') // "2 hours ago"
	 */
	static formatTimestamp(
		timestamp: string | Date,
		format: 'iso' | 'unix' | 'relative'
	): string | number | Date {
		// Convert string to Date if needed
		const date =
			typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

		switch (format) {
			case 'iso':
				return date.toISOString();

			case 'unix':
				return date.getTime();

			case 'relative':
				return this.getRelativeTime(date);

			default:
				return date;
		}
	}

	/**
	 * Converts a timestamp to a relative time description.
	 *
	 * Generates human-readable relative time strings like "2 hours ago",
	 * "3 days ago", "in 5 minutes", etc.
	 *
	 * @param date - The date to convert
	 * @returns Relative time string
	 *
	 * @example
	 * getRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
	 * getRelativeTime(new Date(Date.now() - 86400000 * 3)) // "3 days ago"
	 */
	static getRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		// Future times
		if (diffMs < 0) {
			const absDiffSec = Math.abs(diffSec);
			const absDiffMin = Math.abs(diffMin);
			const absDiffHour = Math.abs(diffHour);
			const absDiffDay = Math.abs(diffDay);

			if (absDiffDay > 0) {
				return `in ${absDiffDay} day${absDiffDay > 1 ? 's' : ''}`;
			}
			if (absDiffHour > 0) {
				return `in ${absDiffHour} hour${absDiffHour > 1 ? 's' : ''}`;
			}
			if (absDiffMin > 0) {
				return `in ${absDiffMin} minute${absDiffMin > 1 ? 's' : ''}`;
			}
			return `in ${absDiffSec} second${absDiffSec > 1 ? 's' : ''}`;
		}

		// Past times
		if (diffDay > 0) {
			return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
		}
		if (diffHour > 0) {
			return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
		}
		if (diffMin > 0) {
			return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
		}
		if (diffSec > 0) {
			return `${diffSec} second${diffSec > 1 ? 's' : ''} ago`;
		}

		return 'just now';
	}

	/**
	 * Parses a retention period string to seconds.
	 *
	 * Converts human-readable retention periods like "30d", "1y", "12h"
	 * to the equivalent number of seconds. Returns 0 for "infinite".
	 *
	 * @param period - The retention period string
	 * @returns Number of seconds, or 0 for infinite
	 * @throws Error if the format is invalid
	 *
	 * @example
	 * parseRetentionPeriod('30d') // 2592000 (30 days in seconds)
	 * parseRetentionPeriod('1y') // 31536000 (365 days in seconds)
	 * parseRetentionPeriod('infinite') // 0
	 */
	static parseRetentionPeriod(period: string): number {
		const trimmed = period.trim().toLowerCase();

		// Handle infinite retention
		if (trimmed === 'infinite') {
			return 0;
		}

		// Parse numeric value and unit
		const match = trimmed.match(/^(\d+)([dhms])$/);
		if (!match) {
			throw new Error(
				`Invalid retention period format: "${period}". Must be like "30d", "1y", "12h", or "infinite".`
			);
		}

		const value = parseInt(match[1], 10);
		const unit = match[2];

		// Convert to seconds based on unit
		const multipliers: Record<string, number> = {
			s: 1,
			m: 60,
			h: 3600,
			d: 86400,
		};

		return value * multipliers[unit];
	}

	/**
	 * Formats retention period from seconds to human-readable string.
	 *
	 * Converts seconds to human-readable format. Automatically selects the
	 * most appropriate unit (days, hours, minutes, seconds).
	 *
	 * @param seconds - Number of seconds (0 = infinite)
	 * @returns Human-readable retention period string
	 *
	 * @example
	 * formatRetentionPeriod(0) // "infinite"
	 * formatRetentionPeriod(2592000) // "30d"
	 * formatRetentionPeriod(3600) // "1h"
	 */
	static formatRetentionPeriod(seconds: number): string {
		if (seconds === 0) {
			return 'infinite';
		}

		// Try to find the best unit
		if (seconds % 86400 === 0) {
			return `${seconds / 86400}d`;
		}
		if (seconds % 3600 === 0) {
			return `${seconds / 3600}h`;
		}
		if (seconds % 60 === 0) {
			return `${seconds / 60}m`;
		}

		return `${seconds}s`;
	}

	/**
	 * Formats bucket information for display.
	 *
	 * Converts bucket API response to a user-friendly format with
	 * readable retention periods and timestamps.
	 *
	 * @param bucket - Raw bucket information from API
	 * @returns Formatted bucket information
	 *
	 * @example
	 * const formatted = formatBucketInfo(bucketResponse);
	 * // { id: '...', name: 'my-bucket', retention: '30d', ... }
	 */
	static formatBucketInfo(bucket: {
		id: string;
		name: string;
		orgID: string;
		retentionRules?: Array<{ everySeconds: number }>;
		description?: string;
		createdAt?: string;
		updatedAt?: string;
	}): Record<string, string> {
		// Extract retention period
		const retentionSeconds =
			bucket.retentionRules?.[0]?.everySeconds ?? 0;
		const retention = this.formatRetentionPeriod(retentionSeconds);

		return {
			id: bucket.id,
			name: bucket.name,
			organizationId: bucket.orgID,
			retention,
			description: bucket.description ?? '',
			createdAt: bucket.createdAt ?? '',
			updatedAt: bucket.updatedAt ?? '',
		};
	}

	/**
	 * Formats organization information for display.
	 *
	 * Converts organization API response to a user-friendly format.
	 *
	 * @param org - Raw organization information from API
	 * @returns Formatted organization information
	 *
	 * @example
	 * const formatted = formatOrganizationInfo(orgResponse);
	 * // { id: '...', name: 'my-org', description: '...', ... }
	 */
	static formatOrganizationInfo(org: {
		id: string;
		name: string;
		description?: string;
		createdAt?: string;
		updatedAt?: string;
	}): Record<string, string> {
		return {
			id: org.id,
			name: org.name,
			description: org.description ?? '',
			createdAt: org.createdAt ?? '',
			updatedAt: org.updatedAt ?? '',
		};
	}
}
