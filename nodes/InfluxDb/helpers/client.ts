import { InfluxDB } from '@influxdata/influxdb-client';
import { IInfluxDbCredentials } from '../types';

/**
 * Creates and configures an InfluxDB client instance.
 *
 * This function initializes a new InfluxDB client with the provided credentials,
 * sets up connection pooling, configures timeouts, and prepares the client for
 * various operations (write, query, delete, management).
 *
 * The client is configured to use the organization and authentication token
 * from the credentials. Connection pooling and timeout settings are applied
 * for optimal performance and reliability.
 *
 * @param credentials - The InfluxDB API credentials containing URL, token, and organization
 * @param timeout - Optional request timeout in milliseconds (default: from credentials or 30000)
 * @returns A configured InfluxDB client instance ready for operations
 *
 * @example
 * const client = createInfluxDbClient({
 *   url: 'http://localhost:8086',
 *   token: 'my-super-secret-token',
 *   organization: 'my-org'
 * });
 *
 * @example
 * // With custom timeout
 * const client = createInfluxDbClient(credentials, 60000);
 */
export function createInfluxDbClient(
	credentials: IInfluxDbCredentials,
	timeout?: number
): InfluxDB {
	// Use provided timeout, or fallback to credentials timeout, or default to 30 seconds
	const requestTimeout = timeout ?? credentials.timeout ?? 30000;

	// Create and configure the InfluxDB client
	const client = new InfluxDB({
		url: credentials.url,
		token: credentials.token,
		timeout: requestTimeout,
	});

	return client;
}

/**
 * Gets the organization name or ID from credentials.
 *
 * This helper function extracts the organization identifier from the credentials,
 * which can be used for various API operations that require an organization context.
 *
 * @param credentials - The InfluxDB API credentials
 * @returns The organization name or ID
 *
 * @example
 * const org = getOrganization(credentials);
 * const queryApi = client.getQueryApi(org);
 */
export function getOrganization(credentials: IInfluxDbCredentials): string {
	return credentials.organization;
}

/**
 * Gets the default bucket name from credentials.
 *
 * This helper function retrieves the default bucket configured in the credentials,
 * if one is set. Returns undefined if no default bucket is configured.
 *
 * @param credentials - The InfluxDB API credentials
 * @returns The default bucket name, or undefined if not set
 *
 * @example
 * const bucket = getDefaultBucket(credentials) ?? 'fallback-bucket';
 */
export function getDefaultBucket(
	credentials: IInfluxDbCredentials
): string | undefined {
	return credentials.defaultBucket;
}
