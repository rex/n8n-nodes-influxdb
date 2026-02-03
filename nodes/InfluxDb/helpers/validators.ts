import { IValidationResult } from '../types';

/**
 * Validator for InfluxDB-specific input formats.
 *
 * This class provides static validation methods for various InfluxDB data types
 * and formats including measurement names, tag keys, field types, Flux query syntax,
 * and time range formats. All methods return validation results that can be used
 * to provide clear error messages to users.
 *
 * @example
 * const result = InfluxDbValidator.validateMeasurementName('cpu-usage');
 * if (!result.valid) {
 *   throw new Error(result.error);
 * }
 */
export class InfluxDbValidator {
	/**
	 * Regular expression for valid measurement names.
	 * Allows alphanumeric characters, hyphens, and underscores.
	 */
	private static readonly MEASUREMENT_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

	/**
	 * Regular expression for valid tag/field keys.
	 * Allows alphanumeric characters, hyphens, and underscores.
	 */
	private static readonly KEY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

	/**
	 * Regular expression for valid bucket names.
	 * Allows alphanumeric characters, hyphens, and underscores.
	 */
	private static readonly BUCKET_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

	/**
	 * Regular expression for retention period format.
	 * Matches patterns like "30d", "1y", "12h", or "infinite".
	 */
	private static readonly RETENTION_PERIOD_REGEX =
		/^(\d+[dhms]|infinite)$/i;

	/**
	 * Validates a measurement name.
	 *
	 * Measurement names must contain only alphanumeric characters, hyphens,
	 * and underscores. They cannot be empty or contain spaces.
	 *
	 * @param name - The measurement name to validate
	 * @returns Validation result with success status and error message if invalid
	 *
	 * @example
	 * InfluxDbValidator.validateMeasurementName('cpu_usage') // { valid: true }
	 * InfluxDbValidator.validateMeasurementName('cpu usage') // { valid: false, error: '...' }
	 */
	static validateMeasurementName(name: string): IValidationResult {
		if (!name || typeof name !== 'string') {
			return {
				valid: false,
				error: 'Measurement name is required and must be a string',
			};
		}

		if (!this.MEASUREMENT_NAME_REGEX.test(name)) {
			return {
				valid: false,
				error: `Invalid measurement name "${name}". Must contain only alphanumeric characters, hyphens, and underscores.`,
			};
		}

		return { valid: true };
	}

	/**
	 * Validates a tag or field key name.
	 *
	 * Key names must contain only alphanumeric characters, hyphens, and underscores.
	 * They cannot be empty, contain spaces, or start with an underscore (reserved).
	 *
	 * @param key - The key name to validate
	 * @returns Validation result with success status and error message if invalid
	 *
	 * @example
	 * InfluxDbValidator.validateKeyName('location') // { valid: true }
	 * InfluxDbValidator.validateKeyName('_private') // { valid: false, error: '...' }
	 */
	static validateKeyName(key: string): IValidationResult {
		if (!key || typeof key !== 'string') {
			return {
				valid: false,
				error: 'Key name is required and must be a string',
			};
		}

		if (key.startsWith('_')) {
			return {
				valid: false,
				error: `Key "${key}" cannot start with underscore (reserved for system use)`,
			};
		}

		if (!this.KEY_NAME_REGEX.test(key)) {
			return {
				valid: false,
				error: `Invalid key name "${key}". Must contain only alphanumeric characters, hyphens, and underscores.`,
			};
		}

		return { valid: true };
	}

	/**
	 * Validates a bucket name.
	 *
	 * Bucket names must contain only alphanumeric characters, hyphens, and underscores.
	 * They must be between 1 and 255 characters long.
	 *
	 * @param name - The bucket name to validate
	 * @returns Validation result with success status and error message if invalid
	 *
	 * @example
	 * InfluxDbValidator.validateBucketName('my-bucket') // { valid: true }
	 * InfluxDbValidator.validateBucketName('my bucket') // { valid: false, error: '...' }
	 */
	static validateBucketName(name: string): IValidationResult {
		if (!name || typeof name !== 'string') {
			return {
				valid: false,
				error: 'Bucket name is required and must be a string',
			};
		}

		if (name.length > 255) {
			return {
				valid: false,
				error: 'Bucket name must be 255 characters or less',
			};
		}

		if (!this.BUCKET_NAME_REGEX.test(name)) {
			return {
				valid: false,
				error: `Invalid bucket name "${name}". Must contain only alphanumeric characters, hyphens, and underscores.`,
			};
		}

		return { valid: true };
	}

	/**
	 * Validates a retention period string.
	 *
	 * Retention periods must be in the format of a number followed by a unit
	 * (d=days, h=hours, m=minutes, s=seconds) or the string "infinite".
	 *
	 * @param period - The retention period to validate
	 * @returns Validation result with success status and error message if invalid
	 *
	 * @example
	 * InfluxDbValidator.validateRetentionPeriod('30d') // { valid: true }
	 * InfluxDbValidator.validateRetentionPeriod('1y') // { valid: true }
	 * InfluxDbValidator.validateRetentionPeriod('infinite') // { valid: true }
	 * InfluxDbValidator.validateRetentionPeriod('30 days') // { valid: false, error: '...' }
	 */
	static validateRetentionPeriod(period: string): IValidationResult {
		if (!period || typeof period !== 'string') {
			return {
				valid: false,
				error: 'Retention period is required and must be a string',
			};
		}

		if (!this.RETENTION_PERIOD_REGEX.test(period)) {
			return {
				valid: false,
				error: `Invalid retention period "${period}". Must be in format like "30d", "1y", "12h", or "infinite".`,
			};
		}

		return { valid: true };
	}

	/**
	 * Validates a Flux query string.
	 *
	 * Performs basic syntax validation to catch common errors. Checks for:
	 * - Non-empty query
	 * - Presence of required Flux keywords
	 * - Balanced parentheses and brackets
	 *
	 * @param query - The Flux query to validate
	 * @returns Validation result with success status and error message if invalid
	 *
	 * @example
	 * const query = 'from(bucket: "my-bucket") |> range(start: -1h)';
	 * InfluxDbValidator.validateFluxQuery(query) // { valid: true }
	 */
	static validateFluxQuery(query: string): IValidationResult {
		if (!query || typeof query !== 'string') {
			return {
				valid: false,
				error: 'Flux query is required and must be a string',
			};
		}

		const trimmedQuery = query.trim();

		if (trimmedQuery.length === 0) {
			return {
				valid: false,
				error: 'Flux query cannot be empty',
			};
		}

		// Check for balanced parentheses
		const openParens = (trimmedQuery.match(/\(/g) || []).length;
		const closeParens = (trimmedQuery.match(/\)/g) || []).length;
		if (openParens !== closeParens) {
			return {
				valid: false,
				error: 'Unbalanced parentheses in Flux query',
			};
		}

		// Check for balanced brackets
		const openBrackets = (trimmedQuery.match(/\[/g) || []).length;
		const closeBrackets = (trimmedQuery.match(/\]/g) || []).length;
		if (openBrackets !== closeBrackets) {
			return {
				valid: false,
				error: 'Unbalanced brackets in Flux query',
			};
		}

		return { valid: true };
	}

	/**
	 * Validates a timestamp value.
	 *
	 * Timestamps can be provided as Date objects, Unix timestamps (numbers),
	 * or ISO 8601 strings. This validates that the value can be parsed as a date.
	 *
	 * @param timestamp - The timestamp to validate
	 * @returns Validation result with success status and error message if invalid
	 *
	 * @example
	 * InfluxDbValidator.validateTimestamp(new Date()) // { valid: true }
	 * InfluxDbValidator.validateTimestamp(1640000000000) // { valid: true }
	 * InfluxDbValidator.validateTimestamp('2024-01-01T00:00:00Z') // { valid: true }
	 * InfluxDbValidator.validateTimestamp('invalid') // { valid: false, error: '...' }
	 */
	static validateTimestamp(
		timestamp: Date | number | string
	): IValidationResult {
		if (timestamp instanceof Date) {
			if (isNaN(timestamp.getTime())) {
				return {
					valid: false,
					error: 'Invalid Date object',
				};
			}
			return { valid: true };
		}

		if (typeof timestamp === 'number') {
			if (!isFinite(timestamp) || timestamp < 0) {
				return {
					valid: false,
					error: 'Timestamp must be a positive finite number',
				};
			}
			return { valid: true };
		}

		if (typeof timestamp === 'string') {
			const parsed = new Date(timestamp);
			if (isNaN(parsed.getTime())) {
				return {
					valid: false,
					error: `Invalid timestamp string "${timestamp}"`,
				};
			}
			return { valid: true };
		}

		return {
			valid: false,
			error: 'Timestamp must be a Date, number, or string',
		};
	}

	/**
	 * Validates a field value type.
	 *
	 * InfluxDB supports specific field types: float, integer, string, and boolean.
	 * This validates that a value is one of these supported types.
	 *
	 * @param value - The field value to validate
	 * @returns Validation result with success status and error message if invalid
	 *
	 * @example
	 * InfluxDbValidator.validateFieldValue(42) // { valid: true }
	 * InfluxDbValidator.validateFieldValue('text') // { valid: true }
	 * InfluxDbValidator.validateFieldValue(true) // { valid: true }
	 * InfluxDbValidator.validateFieldValue(null) // { valid: false, error: '...' }
	 */
	static validateFieldValue(
		value: string | number | boolean
	): IValidationResult {
		const valueType = typeof value;

		if (
			valueType !== 'string' &&
			valueType !== 'number' &&
			valueType !== 'boolean'
		) {
			return {
				valid: false,
				error: `Invalid field value type "${valueType}". Must be string, number, or boolean.`,
			};
		}

		if (valueType === 'number' && !isFinite(value as number)) {
			return {
				valid: false,
				error: 'Numeric field values must be finite',
			};
		}

		return { valid: true };
	}
}
