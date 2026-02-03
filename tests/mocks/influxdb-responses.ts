/**
 * Mock InfluxDB API responses for testing.
 *
 * This module provides realistic mock responses that match the actual
 * InfluxDB v2 API responses for various operations.
 */

/**
 * Mock response for successful health check
 */
export const mockHealthResponse = {
	status: 'pass',
	message: 'ready for queries and writes',
	checks: [],
	version: '2.7.0',
	commit: 'abc123',
};

/**
 * Mock Flux query results
 */
export const mockFluxQueryResults = [
	{
		_time: '2024-01-01T00:00:00Z',
		_measurement: 'temperature',
		_field: 'value',
		_value: 23.5,
		location: 'office',
		sensor_id: 'sensor-001',
	},
	{
		_time: '2024-01-01T00:01:00Z',
		_measurement: 'temperature',
		_field: 'value',
		_value: 23.7,
		location: 'office',
		sensor_id: 'sensor-001',
	},
	{
		_time: '2024-01-01T00:02:00Z',
		_measurement: 'temperature',
		_field: 'value',
		_value: 23.6,
		location: 'office',
		sensor_id: 'sensor-001',
	},
];

/**
 * Mock empty query results
 */
export const mockEmptyQueryResults: unknown[] = [];

/**
 * Mock bucket list response
 */
export const mockBucketsResponse = {
	buckets: [
		{
			id: 'bucket-001',
			name: 'test-bucket',
			orgID: 'org-001',
			retentionRules: [{ everySeconds: 2592000 }], // 30 days
			description: 'Test bucket for development',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
		{
			id: 'bucket-002',
			name: 'sensors',
			orgID: 'org-001',
			retentionRules: [{ everySeconds: 7776000 }], // 90 days
			description: 'Sensor data storage',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
		{
			id: 'bucket-003',
			name: 'long-term',
			orgID: 'org-001',
			retentionRules: [], // infinite
			description: 'Long-term data storage',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
	],
};

/**
 * Mock single bucket response
 */
export const mockSingleBucket = {
	id: 'bucket-001',
	name: 'test-bucket',
	orgID: 'org-001',
	retentionRules: [{ everySeconds: 2592000 }],
	description: 'Test bucket',
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Mock organization list response
 */
export const mockOrganizationsResponse = {
	orgs: [
		{
			id: 'org-001',
			name: 'test-org',
			description: 'Test organization',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
		{
			id: 'org-002',
			name: 'prod-org',
			description: 'Production organization',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
	],
};

/**
 * Mock single organization response
 */
export const mockSingleOrganization = {
	id: 'org-001',
	name: 'test-org',
	description: 'Test organization',
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Mock error responses
 */
export const mockErrors = {
	invalidCredentials: {
		statusCode: 401,
		message: 'unauthorized access',
		code: 'unauthorized',
	},
	bucketNotFound: {
		statusCode: 404,
		message: 'bucket not found',
		code: 'not found',
	},
	invalidQuery: {
		statusCode: 400,
		message: 'invalid flux query syntax',
		code: 'invalid',
	},
	serverError: {
		statusCode: 500,
		message: 'internal server error',
		code: 'internal error',
	},
	timeout: {
		statusCode: 408,
		message: 'request timeout',
		code: 'timeout',
	},
};

/**
 * Mock write success response (204 No Content)
 */
export const mockWriteSuccess = {
	statusCode: 204,
	body: '',
};

/**
 * Mock delete success response (204 No Content)
 */
export const mockDeleteSuccess = {
	statusCode: 204,
	body: '',
};
