/**
 * Type definitions for InfluxDB node operations.
 *
 * This module contains all TypeScript interfaces and types used throughout
 * the InfluxDB node implementation.
 */

/**
 * InfluxDB API credential interface.
 * Represents the credentials needed to connect to an InfluxDB instance.
 */
export interface IInfluxDbCredentials {
	/** The URL of the InfluxDB instance (e.g., http://localhost:8086) */
	url: string;

	/** API token for authentication */
	token: string;

	/** Organization name or ID */
	organization: string;

	/** Optional default bucket name */
	defaultBucket?: string;

	/** Optional request timeout in milliseconds */
	timeout?: number;
}

/**
 * Options for writing a single data point.
 */
export interface IWritePointOptions {
	/** The measurement name (e.g., "temperature", "cpu_usage") */
	measurement: string;

	/** Tags as key-value pairs (indexed dimensions) */
	tags?: Record<string, string>;

	/** Fields as key-value pairs (metrics to store) */
	fields: Record<string, string | number | boolean>;

	/** Optional timestamp (defaults to current time if not provided) */
	timestamp?: Date | number | string;

	/** Target bucket name (uses default if not specified) */
	bucket?: string;
}

/**
 * Options for batch write operations.
 */
export interface IWriteBatchOptions {
	/** Array of points to write */
	points: IWritePointOptions[];

	/** Maximum number of points per batch (default: 5000) */
	batchSize?: number;

	/** Target bucket name (uses default if not specified) */
	bucket?: string;
}

/**
 * Options for writing line protocol directly.
 */
export interface IWriteLineProtocolOptions {
	/** Raw line protocol string */
	lineProtocol: string;

	/** Target bucket name (uses default if not specified) */
	bucket?: string;

	/** Precision for timestamps (ns, us, ms, s) */
	precision?: 'ns' | 'us' | 'ms' | 's';
}

/**
 * Options for executing Flux queries.
 */
export interface IFluxQueryOptions {
	/** The Flux query string to execute */
	query: string;

	/** Optional query parameters for variable substitution */
	params?: Record<string, unknown>;

	/** Organization to query (uses credential org if not specified) */
	org?: string;
}

/**
 * Options for simple query builder.
 */
export interface ISimpleQueryOptions {
	/** Target bucket name */
	bucket: string;

	/** Measurement name to query */
	measurement: string;

	/** Start time for the query range */
	start: string | Date | number;

	/** Stop time for the query range (defaults to now) */
	stop?: string | Date | number;

	/** Optional filter conditions */
	filters?: IQueryFilter[];

	/** Optional fields to include (includes all if not specified) */
	fields?: string[];

	/** Optional aggregation function (mean, sum, count, etc.) */
	aggregation?: string;

	/** Optional aggregation window (e.g., "1h", "5m") */
	window?: string;
}

/**
 * Query filter condition.
 */
export interface IQueryFilter {
	/** Field or tag name to filter on */
	key: string;

	/** Filter operator (==, !=, <, >, <=, >=, =~) */
	operator: '==' | '!=' | '<' | '>' | '<=' | '>=' | '=~';

	/** Value to compare against */
	value: string | number | boolean;
}

/**
 * Options for delete operations.
 */
export interface IDeleteOptions {
	/** Target bucket name */
	bucket: string;

	/** Start time for deletion range */
	start: string | Date | number;

	/** Stop time for deletion range */
	stop: string | Date | number;

	/** Optional predicate for selective deletion */
	predicate?: string;
}

/**
 * Options for bucket creation.
 */
export interface ICreateBucketOptions {
	/** Bucket name */
	name: string;

	/** Retention period (e.g., "30d", "1y", "infinite") */
	retentionPeriod: string;

	/** Optional description */
	description?: string;

	/** Organization ID (uses credential org if not specified) */
	orgID?: string;
}

/**
 * Options for bucket updates.
 */
export interface IUpdateBucketOptions {
	/** Bucket ID to update */
	bucketId: string;

	/** Optional new retention period */
	retentionPeriod?: string;

	/** Optional new description */
	description?: string;
}

/**
 * Options for organization creation.
 */
export interface ICreateOrganizationOptions {
	/** Organization name */
	name: string;

	/** Optional description */
	description?: string;
}

/**
 * Options for organization updates.
 */
export interface IUpdateOrganizationOptions {
	/** Organization ID to update */
	orgId: string;

	/** Optional new name */
	name?: string;

	/** Optional new description */
	description?: string;
}

/**
 * Result from a write operation.
 */
export interface IWriteResult {
	/** Whether the write was successful */
	success: boolean;

	/** Number of points written */
	pointsWritten: number;

	/** Measurement name */
	measurement?: string;

	/** Bucket name */
	bucket?: string;

	/** Error message if write failed */
	error?: string;
}

/**
 * Formatted query result row.
 */
export interface IQueryResultRow {
	/** Timestamp of the data point */
	_time?: string | Date;

	/** Measurement name */
	_measurement?: string;

	/** Field name */
	_field?: string;

	/** Field value */
	_value?: string | number | boolean;

	/** Additional tags and fields */
	[key: string]: string | number | boolean | Date | undefined;
}

/**
 * Bucket information.
 */
export interface IBucketInfo {
	/** Bucket ID */
	id: string;

	/** Bucket name */
	name: string;

	/** Organization ID */
	orgID: string;

	/** Retention period in seconds (0 = infinite) */
	retentionRules?: Array<{ everySeconds: number }>;

	/** Description */
	description?: string;

	/** Creation timestamp */
	createdAt?: string;

	/** Last update timestamp */
	updatedAt?: string;
}

/**
 * Organization information.
 */
export interface IOrganizationInfo {
	/** Organization ID */
	id: string;

	/** Organization name */
	name: string;

	/** Description */
	description?: string;

	/** Creation timestamp */
	createdAt?: string;

	/** Last update timestamp */
	updatedAt?: string;
}

/**
 * Validation result for input validation.
 */
export interface IValidationResult {
	/** Whether validation passed */
	valid: boolean;

	/** Error message if validation failed */
	error?: string;
}

/**
 * Options for formatting query results.
 */
export interface IFormatOptions {
	/** Format for timestamps (iso, unix, or relative) */
	timestampFormat?: 'iso' | 'unix' | 'relative';

	/** Whether to flatten multiple tables into a single array */
	flattenTables?: boolean;

	/** Maximum number of rows to return */
	limit?: number;
}
