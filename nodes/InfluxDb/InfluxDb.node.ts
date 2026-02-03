import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { InfluxDB } from '@influxdata/influxdb-client';
import { IInfluxDbCredentials } from './types';
import { createInfluxDbClient } from './helpers/client';
import {
	executeWritePoint,
	executeWriteBatch,
	executeWriteLineProtocol,
} from './operations/write.operation';
import { executeFluxQuery, executeSimpleQuery } from './operations/query.operation';
import { executeDeleteByPredicate, executeDeleteAll } from './operations/delete.operation';
import {
	executeListBuckets,
	executeGetBucket,
	executeCreateBucket,
	executeUpdateBucket,
	executeDeleteBucket,
} from './operations/bucket.operation';
import {
	executeListOrganizations,
	executeGetOrganization,
	executeCreateOrganization,
	executeUpdateOrganization,
	executeDeleteOrganization,
} from './operations/organization.operation';

/**
 * InfluxDB node for n8n.
 *
 * This node provides comprehensive integration with InfluxDB v2.x, supporting
 * write operations, Flux queries, data deletion, and bucket/organization management.
 */
export class InfluxDb implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'InfluxDB',
		name: 'influxDb',
		icon: 'file:influxdb.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Read and write data to InfluxDB v2.x',
		defaults: {
			name: 'InfluxDB',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'influxDbApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Write',
						value: 'write',
					},
					{
						name: 'Query',
						value: 'query',
					},
					{
						name: 'Delete',
						value: 'delete',
					},
					{
						name: 'Bucket',
						value: 'bucket',
					},
					{
						name: 'Organization',
						value: 'organization',
					},
				],
				default: 'write',
			},

			// Write Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['write'],
					},
				},
				options: [
					{
						name: 'Write Point',
						value: 'writePoint',
						description: 'Write a single data point',
						action: 'Write a single data point',
					},
					{
						name: 'Write Batch',
						value: 'writeBatch',
						description: 'Write multiple data points',
						action: 'Write multiple data points',
					},
					{
						name: 'Write Line Protocol',
						value: 'writeLineProtocol',
						description: 'Write raw line protocol',
						action: 'Write raw line protocol',
					},
				],
				default: 'writePoint',
			},

			// Query Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['query'],
					},
				},
				options: [
					{
						name: 'Execute Flux Query',
						value: 'fluxQuery',
						description: 'Execute a Flux query',
						action: 'Execute a flux query',
					},
					{
						name: 'Simple Query',
						value: 'simpleQuery',
						description: 'Execute a simple query with parameters',
						action: 'Execute a simple query',
					},
				],
				default: 'fluxQuery',
			},

			// Delete Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['delete'],
					},
				},
				options: [
					{
						name: 'Delete by Predicate',
						value: 'deleteByPredicate',
						description: 'Delete data matching a predicate',
						action: 'Delete data by predicate',
					},
					{
						name: 'Delete All in Range',
						value: 'deleteAll',
						description: 'Delete all data in a time range',
						action: 'Delete all data in range',
					},
				],
				default: 'deleteByPredicate',
			},

			// Bucket Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['bucket'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List all buckets',
						action: 'List all buckets',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a bucket',
						action: 'Get a bucket',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a bucket',
						action: 'Create a bucket',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a bucket',
						action: 'Update a bucket',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a bucket',
						action: 'Delete a bucket',
					},
				],
				default: 'list',
			},

			// Organization Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['organization'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						description: 'List all organizations',
						action: 'List all organizations',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an organization',
						action: 'Get an organization',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create an organization',
						action: 'Create an organization',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an organization',
						action: 'Update an organization',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an organization',
						action: 'Delete an organization',
					},
				],
				default: 'list',
			},

			// Write Point Parameters
			{
				displayName: 'Bucket',
				name: 'bucket',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writePoint', 'writeLineProtocol'],
					},
				},
				default: '',
				description: 'Bucket name (uses default from credentials if not specified)',
			},
			{
				displayName: 'Measurement',
				name: 'measurement',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writePoint'],
					},
				},
				default: '',
				required: true,
				description: 'Measurement name',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writePoint'],
					},
				},
				default: {},
				description: 'Tags to add to the data point',
				options: [
					{
						name: 'tag',
						displayName: 'Tag',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Tag key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Tag value',
							},
						],
					},
				],
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writePoint'],
					},
				},
				default: {},
				required: true,
				description: 'Fields to add to the data point',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
								description: 'Field key',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Field value (number, string, or boolean)',
							},
						],
					},
				],
			},
			{
				displayName: 'Timestamp',
				name: 'timestamp',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writePoint'],
					},
				},
				default: '',
				description: 'Timestamp (ISO 8601 or Unix milliseconds). Uses current time if not specified.',
			},

			// Write Batch Parameters
			{
				displayName: 'Bucket',
				name: 'bucket',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writeBatch'],
					},
				},
				default: '',
				description: 'Bucket name (uses default from credentials if not specified)',
			},
			{
				displayName: 'Points',
				name: 'points',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writeBatch'],
					},
				},
				default: '[]',
				required: true,
				description: 'Array of points to write. Each point should have measurement, tags, and fields properties.',
			},
			{
				displayName: 'Batch Size',
				name: 'batchSize',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writeBatch'],
					},
				},
				default: 5000,
				description: 'Maximum number of points per batch',
			},

			// Write Line Protocol Parameters
			{
				displayName: 'Line Protocol',
				name: 'lineProtocol',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writeLineProtocol'],
					},
				},
				default: '',
				required: true,
				description: 'Raw InfluxDB line protocol string',
			},
			{
				displayName: 'Precision',
				name: 'precision',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['write'],
						operation: ['writeLineProtocol'],
					},
				},
				options: [
					{ name: 'Nanoseconds', value: 'ns' },
					{ name: 'Microseconds', value: 'us' },
					{ name: 'Milliseconds', value: 'ms' },
					{ name: 'Seconds', value: 's' },
				],
				default: 'ns',
				description: 'Timestamp precision',
			},

			// Flux Query Parameters
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						resource: ['query'],
						operation: ['fluxQuery'],
					},
				},
				default: '',
				required: true,
				description: 'Flux query to execute',
			},
			{
				displayName: 'Timestamp Format',
				name: 'timestampFormat',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['query'],
					},
				},
				options: [
					{ name: 'ISO 8601', value: 'iso' },
					{ name: 'Unix Milliseconds', value: 'unix' },
					{ name: 'Relative (e.g. "2 hours ago")', value: 'relative' },
				],
				default: 'iso',
				description: 'Format for timestamp values in results',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['query'],
					},
				},
				default: 0,
				description: 'Maximum number of rows to return (0 = no limit)',
			},

			// Simple Query Parameters
			{
				displayName: 'Bucket',
				name: 'bucket',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['query'],
						operation: ['simpleQuery'],
					},
				},
				default: '',
				required: true,
				description: 'Bucket name',
			},
			{
				displayName: 'Measurement',
				name: 'measurement',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['query'],
						operation: ['simpleQuery'],
					},
				},
				default: '',
				required: true,
				description: 'Measurement name',
			},
			{
				displayName: 'Start Time',
				name: 'start',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['query'],
						operation: ['simpleQuery'],
					},
				},
				default: '-1h',
				description: 'Start time (e.g., -1h, -7d, 2024-01-01T00:00:00Z)',
			},
			{
				displayName: 'Stop Time',
				name: 'stop',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['query'],
						operation: ['simpleQuery'],
					},
				},
				default: 'now()',
				description: 'Stop time (e.g., now(), -1h, 2024-01-01T00:00:00Z)',
			},
			{
				displayName: 'Field',
				name: 'field',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['query'],
						operation: ['simpleQuery'],
					},
				},
				default: '',
				description: 'Field name to filter by (leave empty for all fields)',
			},

			// Delete Parameters
			{
				displayName: 'Bucket',
				name: 'bucket',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['delete'],
					},
				},
				default: '',
				required: true,
				description: 'Bucket name',
			},
			{
				displayName: 'Start Time',
				name: 'start',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['delete'],
					},
				},
				default: '',
				required: true,
				description: 'Start time (RFC3339 format, e.g., 2024-01-01T00:00:00Z)',
			},
			{
				displayName: 'Stop Time',
				name: 'stop',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['delete'],
					},
				},
				default: '',
				required: true,
				description: 'Stop time (RFC3339 format, e.g., 2024-01-01T23:59:59Z)',
			},
			{
				displayName: 'Predicate',
				name: 'predicate',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['delete'],
						operation: ['deleteByPredicate'],
					},
				},
				default: '',
				required: true,
				description: 'Delete predicate (e.g., _measurement="temperature" AND location="room1")',
			},
			{
				displayName: 'Confirm Deletion',
				name: 'confirm',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['delete'],
						operation: ['deleteAll'],
					},
				},
				default: false,
				description: 'Whether to confirm deletion of all data in the time range. This operation cannot be undone!',
			},

			// Bucket Parameters
			{
				displayName: 'Bucket Name',
				name: 'bucketName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['get', 'create', 'update', 'delete'],
					},
				},
				default: '',
				required: true,
				description: 'Bucket name',
			},
			{
				displayName: 'Retention Period',
				name: 'retentionPeriod',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['create', 'update'],
					},
				},
				default: '30d',
				description: 'Retention period (e.g., 30d, 1y, infinite)',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'Bucket description',
			},
			{
				displayName: 'Confirm Deletion',
				name: 'confirm',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['delete'],
					},
				},
				default: false,
				description: 'Whether to confirm bucket deletion. This will delete all data in the bucket!',
			},

			// Organization Parameters
			{
				displayName: 'Organization Name',
				name: 'organizationName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['organization'],
						operation: ['get', 'create', 'update', 'delete'],
					},
				},
				default: '',
				required: true,
				description: 'Organization name',
			},
			{
				displayName: 'New Name',
				name: 'newName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['organization'],
						operation: ['update'],
					},
				},
				default: '',
				description: 'New organization name',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['organization'],
						operation: ['create', 'update'],
					},
				},
				default: '',
				description: 'Organization description',
			},
			{
				displayName: 'Confirm Deletion',
				name: 'confirm',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['organization'],
						operation: ['delete'],
					},
				},
				default: false,
				description: 'Whether to confirm organization deletion. This will delete the organization and all its data!',
			},
		],
	};

	/**
	 * Executes the node logic.
	 *
	 * Routes execution to the appropriate operation handler based on the
	 * selected resource and operation.
	 *
	 * @param this - Execution context
	 * @returns Array of output items
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get credentials
		const credentials = (await this.getCredentials(
			'influxDbApi'
		)) as unknown as IInfluxDbCredentials;

		// Create InfluxDB client
		const client: InfluxDB = createInfluxDbClient(credentials);

		// Get resource and operation
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		// Process each item
		for (let i = 0; i < items.length; i++) {
			try {
				// Route to appropriate operation
				if (resource === 'write') {
					if (operation === 'writePoint') {
						// Convert fixed collection format to simple object
						const tagsCollection = this.getNodeParameter('tags', i, {}) as {
							tag?: Array<{ key: string; value: string }>;
						};
						const fieldsCollection = this.getNodeParameter('fields', i, {}) as {
							field?: Array<{ key: string; value: string }>;
						};

						// Convert to simple key-value objects
						const tags: Record<string, string> = {};
						if (tagsCollection.tag) {
							for (const tag of tagsCollection.tag) {
								tags[tag.key] = tag.value;
							}
						}

						const fields: Record<string, string | number | boolean> = {};
						if (fieldsCollection.field) {
							for (const field of fieldsCollection.field) {
								// Try to parse as number or boolean
								let value: string | number | boolean = field.value;
								if (field.value === 'true') value = true;
								else if (field.value === 'false') value = false;
								else if (!isNaN(Number(field.value)) && field.value !== '') {
									value = Number(field.value);
								}
								fields[field.key] = value;
							}
						}

						// Temporarily set converted values as parameters
						const originalGetNodeParameter = this.getNodeParameter.bind(this);
						this.getNodeParameter = ((name: string, itemIndex: number, defaultValue?: unknown): unknown => {
							if (name === 'tags') return tags;
							if (name === 'fields') return fields;
							return originalGetNodeParameter(name, itemIndex, defaultValue);
						}) as typeof this.getNodeParameter;

						const result = await executeWritePoint.call(this, client, credentials, i);
						returnData.push(...result);

						// Restore original method
						this.getNodeParameter = originalGetNodeParameter;
					} else if (operation === 'writeBatch') {
						const result = await executeWriteBatch.call(
							this,
							client,
							credentials,
							items,
							i
						);
						returnData.push(...result);
					} else if (operation === 'writeLineProtocol') {
						const result = await executeWriteLineProtocol.call(
							this,
							client,
							credentials,
							i
						);
						returnData.push(...result);
					}
				} else if (resource === 'query') {
					if (operation === 'fluxQuery') {
						const result = await executeFluxQuery.call(this, client, credentials, i);
						returnData.push(...result);
					} else if (operation === 'simpleQuery') {
						const result = await executeSimpleQuery.call(this, client, credentials, i);
						returnData.push(...result);
					}
				} else if (resource === 'delete') {
					if (operation === 'deleteByPredicate') {
						const result = await executeDeleteByPredicate.call(
							this,
							client,
							credentials,
							i
						);
						returnData.push(...result);
					} else if (operation === 'deleteAll') {
						const result = await executeDeleteAll.call(this, client, credentials, i);
						returnData.push(...result);
					}
				} else if (resource === 'bucket') {
					if (operation === 'list') {
						const result = await executeListBuckets.call(this, client, credentials, i);
						returnData.push(...result);
					} else if (operation === 'get') {
						const result = await executeGetBucket.call(this, client, credentials, i);
						returnData.push(...result);
					} else if (operation === 'create') {
						const result = await executeCreateBucket.call(this, client, credentials, i);
						returnData.push(...result);
					} else if (operation === 'update') {
						const result = await executeUpdateBucket.call(this, client, credentials, i);
						returnData.push(...result);
					} else if (operation === 'delete') {
						const result = await executeDeleteBucket.call(this, client, credentials, i);
						returnData.push(...result);
					}
				} else if (resource === 'organization') {
					if (operation === 'list') {
						const result = await executeListOrganizations.call(
							this,
							client,
							credentials,
							i
						);
						returnData.push(...result);
					} else if (operation === 'get') {
						const result = await executeGetOrganization.call(
							this,
							client,
							credentials,
							i
						);
						returnData.push(...result);
					} else if (operation === 'create') {
						const result = await executeCreateOrganization.call(
							this,
							client,
							credentials,
							i
						);
						returnData.push(...result);
					} else if (operation === 'update') {
						const result = await executeUpdateOrganization.call(
							this,
							client,
							credentials,
							i
						);
						returnData.push(...result);
					} else if (operation === 'delete') {
						const result = await executeDeleteOrganization.call(
							this,
							client,
							credentials,
							i
						);
						returnData.push(...result);
					}
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The resource "${resource}" is not supported`,
						{ itemIndex: i }
					);
				}
			} catch (error) {
				// Handle errors per item
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
