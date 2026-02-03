/**
 * Test data fixtures for InfluxDB node testing.
 *
 * This module provides reusable test data for various scenarios.
 */

/**
 * Valid test data for write operations
 */
export const validWriteData = {
	measurement: 'temperature',
	tags: {
		location: 'office',
		sensor_id: 'sensor-001',
	},
	fields: {
		value: 23.5,
		humidity: 45.2,
	},
	timestamp: '2024-01-01T00:00:00Z',
};

/**
 * Batch write test data
 */
export const batchWriteData = {
	points: [
		{
			measurement: 'cpu',
			tags: { host: 'server-01' },
			fields: { usage: 64.5 },
		},
		{
			measurement: 'cpu',
			tags: { host: 'server-02' },
			fields: { usage: 72.1 },
		},
		{
			measurement: 'memory',
			tags: { host: 'server-01' },
			fields: { usage: 4096 },
		},
	],
};

/**
 * Valid line protocol test data
 */
export const validLineProtocol = `temperature,location=office,sensor_id=sensor-001 value=23.5,humidity=45.2 1640000000000000000
cpu,host=server-01 usage=64.5 1640000000000000000
memory,host=server-01 usage=4096 1640000000000000000`;

/**
 * Valid Flux query test data
 */
export const validFluxQuery = `from(bucket: "test-bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> filter(fn: (r) => r.location == "office")`;

/**
 * Simple query test data
 */
export const simpleQueryData = {
	bucket: 'test-bucket',
	measurement: 'temperature',
	start: '-1h',
	stop: 'now()',
	field: 'value',
};

/**
 * Delete predicate test data
 */
export const deletePredicateData = {
	bucket: 'test-bucket',
	start: '2024-01-01T00:00:00Z',
	stop: '2024-01-31T23:59:59Z',
	predicate: '_measurement="test" AND environment="dev"',
};

/**
 * Bucket creation test data
 */
export const createBucketData = {
	name: 'new-test-bucket',
	retentionPeriod: '30d',
	description: 'A test bucket for development',
};

/**
 * Organization creation test data
 */
export const createOrganizationData = {
	name: 'new-test-org',
	description: 'A test organization',
};

/**
 * Invalid test data (for error cases)
 */
export const invalidData = {
	// Invalid measurement names
	invalidMeasurements: [
		'',
		'measurement with spaces',
		'measurement@special',
		'measurement.dot',
	],

	// Invalid bucket names
	invalidBuckets: ['', 'bucket with spaces', 'bucket@special', 'a'.repeat(256)],

	// Invalid retention periods
	invalidRetentions: ['', '30', '30days', '1 year', 'forever', 'bad'],

	// Invalid Flux queries
	invalidQueries: [
		'',
		'from bucket: "test"', // Missing parentheses
		'from(bucket: "test"', // Unbalanced parentheses
		'from(bucket: "test"]', // Mismatched brackets
	],

	// Invalid timestamps
	invalidTimestamps: ['invalid-date', 'not a timestamp', '99999999999999999999'],

	// Invalid field values
	invalidFields: {
		null: null,
		undefined: undefined,
		nan: NaN,
		infinity: Infinity,
	},
};
