import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * InfluxDB API credentials type definition.
 *
 * This credential type is used to authenticate with InfluxDB v2.x instances
 * using API tokens. It supports both self-hosted and InfluxDB Cloud instances.
 *
 * @implements {ICredentialType}
 */
export class InfluxDbApi implements ICredentialType {
	/** Unique identifier for this credential type */
	name = 'influxDbApi';

	/** Display name shown in n8n UI */
	displayName = 'InfluxDB API';

	/** URL to documentation for this credential type */
	documentationUrl = 'https://docs.influxdata.com/influxdb/v2/';

	/** Icon file name */
	icon = 'file:influxdb.svg' as const;

	/**
	 * Credential properties that users must provide.
	 * These fields are displayed in the n8n credentials configuration UI.
	 */
	properties: INodeProperties[] = [
		{
			displayName: 'URL',
			name: 'url',
			type: 'string',
			default: 'http://localhost:8086',
			description: 'The URL of your InfluxDB instance',
			placeholder: 'http://localhost:8086',
			required: true,
		},
		{
			displayName: 'API Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'InfluxDB API token with appropriate permissions',
			placeholder: 'Your InfluxDB API token',
			required: true,
		},
		{
			displayName: 'Organization',
			name: 'organization',
			type: 'string',
			default: '',
			description: 'Your InfluxDB organization name or ID',
			placeholder: 'my-org',
			required: true,
		},
		{
			displayName: 'Default Bucket',
			name: 'defaultBucket',
			type: 'string',
			default: '',
			description: 'Default bucket to use for operations (optional)',
			placeholder: 'my-bucket',
			required: false,
		},
		{
			displayName: 'Timeout',
			name: 'timeout',
			type: 'number',
			default: 30000,
			description: 'Request timeout in milliseconds',
			placeholder: '30000',
			required: false,
		},
	];

	/**
	 * Generic authentication configuration.
	 * This tells n8n how to add the token to API requests.
	 */
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Token {{$credentials.token}}',
			},
		},
	};

	/**
	 * Credential test configuration.
	 * This defines how to test if the credentials are valid.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url}}',
			url: '/health',
			method: 'GET',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'status',
					value: 'pass',
					message: 'Connection successful! InfluxDB is healthy.',
				},
			},
		],
	};
}
