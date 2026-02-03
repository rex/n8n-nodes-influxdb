import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { InfluxDB } from '@influxdata/influxdb-client';
import { BucketsAPI, OrgsAPI } from '@influxdata/influxdb-client-apis';
import { IInfluxDbCredentials } from '../types';
import { InfluxDbValidator } from '../helpers/validators';
import { InfluxDbFormatter } from '../helpers/formatters';
import { getOrganization } from '../helpers/client';

/**
 * Executes a list buckets operation.
 *
 * Retrieves all buckets in the organization that the authenticated user has access to.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array of items, one per bucket
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeListBuckets(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get organization
	const orgName = getOrganization(credentials);

	// Create APIs
	const orgsAPI = new OrgsAPI(client);
	const bucketsAPI = new BucketsAPI(client);

	try {
		// Get organization ID
		const orgs = await orgsAPI.getOrgs({ org: orgName });
		if (!orgs.orgs || orgs.orgs.length === 0) {
			throw new Error(`Organization "${orgName}" not found`);
		}
		const orgID = orgs.orgs[0].id;

		// List buckets
		const response = await bucketsAPI.getBuckets({ orgID });

		if (!response.buckets || response.buckets.length === 0) {
			return [
				{
					json: { buckets: [], count: 0 },
					pairedItem: { item: itemIndex },
				},
			];
		}

		// Format buckets
		const formattedBuckets = response.buckets
			.filter((bucket) => bucket.id !== undefined)
			.map((bucket) =>
				InfluxDbFormatter.formatBucketInfo({
					id: bucket.id!,
					name: bucket.name,
					orgID: bucket.orgID!,
					retentionRules: bucket.retentionRules,
					description: bucket.description,
					createdAt: bucket.createdAt,
					updatedAt: bucket.updatedAt,
				})
			);

		// Return as separate items
		return formattedBuckets.map((bucket) => ({
			json: bucket,
			pairedItem: { item: itemIndex },
		}));
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to list buckets: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a get bucket operation.
 *
 * Retrieves detailed information about a specific bucket.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the bucket information
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeGetBucket(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const bucketName = this.getNodeParameter('bucketName', itemIndex) as string;

	// Validate bucket name
	const bucketValidation = InfluxDbValidator.validateBucketName(bucketName);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Create API
	const bucketsAPI = new BucketsAPI(client);

	try {
		// Get bucket
		const response = await bucketsAPI.getBuckets({ name: bucketName });

		if (!response.buckets || response.buckets.length === 0) {
			throw new Error(`Bucket "${bucketName}" not found`);
		}

		const bucket = response.buckets[0];

		// Format bucket info
		const formattedBucket = InfluxDbFormatter.formatBucketInfo({
			id: bucket.id!,
			name: bucket.name,
			orgID: bucket.orgID!,
			retentionRules: bucket.retentionRules,
			description: bucket.description,
			createdAt: bucket.createdAt,
			updatedAt: bucket.updatedAt,
		});

		return [
			{
				json: formattedBucket as Record<string, string | number | boolean>,
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to get bucket: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a create bucket operation.
 *
 * Creates a new bucket with the specified name and retention period.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the created bucket information
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeCreateBucket(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const name = this.getNodeParameter('bucketName', itemIndex) as string;
	const retentionPeriod = this.getNodeParameter(
		'retentionPeriod',
		itemIndex,
		'30d'
	) as string;
	const description = this.getNodeParameter(
		'description',
		itemIndex,
		''
	) as string;

	// Validate bucket name
	const bucketValidation = InfluxDbValidator.validateBucketName(name);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Validate retention period
	const retentionValidation =
		InfluxDbValidator.validateRetentionPeriod(retentionPeriod);
	if (!retentionValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			retentionValidation.error ?? 'Invalid retention period',
			{ itemIndex }
		);
	}

	// Get organization
	const orgName = getOrganization(credentials);

	// Create APIs
	const orgsAPI = new OrgsAPI(client);
	const bucketsAPI = new BucketsAPI(client);

	try {
		// Get organization ID
		const orgs = await orgsAPI.getOrgs({ org: orgName });
		if (!orgs.orgs || orgs.orgs.length === 0) {
			throw new Error(`Organization "${orgName}" not found`);
		}
		const orgID = orgs.orgs[0].id;

		// Parse retention period
		const retentionSeconds =
			InfluxDbFormatter.parseRetentionPeriod(retentionPeriod);

		// Create bucket
		const bucket = await bucketsAPI.postBuckets({
			body: {
				name,
				orgID: orgID!,
				description,
				retentionRules: retentionSeconds > 0 ? [{ everySeconds: retentionSeconds }] : [],
			},
		});

		// Format bucket info
		const formattedBucket = InfluxDbFormatter.formatBucketInfo({
			id: bucket.id!,
			name: bucket.name,
			orgID: bucket.orgID!,
			retentionRules: bucket.retentionRules,
			description: bucket.description,
			createdAt: bucket.createdAt,
			updatedAt: bucket.updatedAt,
		});

		return [
			{
				json: { ...(formattedBucket as Record<string, string | number | boolean>), created: true },
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to create bucket: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes an update bucket operation.
 *
 * Updates an existing bucket's retention period and/or description.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the updated bucket information
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeUpdateBucket(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const bucketName = this.getNodeParameter('bucketName', itemIndex) as string;
	const retentionPeriod = this.getNodeParameter(
		'retentionPeriod',
		itemIndex,
		''
	) as string;
	const description = this.getNodeParameter(
		'description',
		itemIndex,
		''
	) as string;

	// Validate bucket name
	const bucketValidation = InfluxDbValidator.validateBucketName(bucketName);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Validate retention period if provided
	if (retentionPeriod) {
		const retentionValidation =
			InfluxDbValidator.validateRetentionPeriod(retentionPeriod);
		if (!retentionValidation.valid) {
			throw new NodeOperationError(
				this.getNode(),
				retentionValidation.error ?? 'Invalid retention period',
				{ itemIndex }
			);
		}
	}

	// Create API
	const bucketsAPI = new BucketsAPI(client);

	try {
		// Get bucket to find ID
		const response = await bucketsAPI.getBuckets({ name: bucketName });

		if (!response.buckets || response.buckets.length === 0) {
			throw new Error(`Bucket "${bucketName}" not found`);
		}

		const existingBucket = response.buckets[0];
		const bucketID = existingBucket.id;

		// Prepare update body
		const updateBody: {
			name?: string;
			description?: string;
			retentionRules?: Array<{ everySeconds: number }>;
		} = {};

		if (description) {
			updateBody.description = description;
		}

		if (retentionPeriod) {
			const retentionSeconds =
				InfluxDbFormatter.parseRetentionPeriod(retentionPeriod);
			updateBody.retentionRules =
				retentionSeconds > 0 ? [{ everySeconds: retentionSeconds }] : [];
		}

		// Update bucket
		const updatedBucket = await bucketsAPI.patchBucketsID({
			bucketID: bucketID!,
			body: updateBody,
		});

		// Format bucket info
		const formattedBucket = InfluxDbFormatter.formatBucketInfo({
			id: updatedBucket.id!,
			name: updatedBucket.name,
			orgID: updatedBucket.orgID!,
			retentionRules: updatedBucket.retentionRules,
			description: updatedBucket.description,
			createdAt: updatedBucket.createdAt,
			updatedAt: updatedBucket.updatedAt,
		});

		return [
			{
				json: { ...(formattedBucket as Record<string, string | number | boolean>), updated: true },
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to update bucket: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a delete bucket operation.
 *
 * Deletes a bucket and all its data. This is a dangerous operation that
 * requires confirmation.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the result of the delete operation
 * @throws {NodeOperationError} If validation fails, confirmation not provided, or required parameters missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeDeleteBucket(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const bucketName = this.getNodeParameter('bucketName', itemIndex) as string;
	const confirm = this.getNodeParameter('confirm', itemIndex, false) as boolean;

	// Require confirmation for safety
	if (!confirm) {
		throw new NodeOperationError(
			this.getNode(),
			'Delete bucket operation requires confirmation. Please check the confirm checkbox.',
			{ itemIndex }
		);
	}

	// Validate bucket name
	const bucketValidation = InfluxDbValidator.validateBucketName(bucketName);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Create API
	const bucketsAPI = new BucketsAPI(client);

	try {
		// Get bucket to find ID
		const response = await bucketsAPI.getBuckets({ name: bucketName });

		if (!response.buckets || response.buckets.length === 0) {
			throw new Error(`Bucket "${bucketName}" not found`);
		}

		const bucketID = response.buckets[0].id!;

		// Delete bucket
		await bucketsAPI.deleteBucketsID({ bucketID });

		return [
			{
				json: {
					success: true,
					deleted: true,
					bucketName,
					bucketID,
				},
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to delete bucket: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}
