import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { InfluxDB } from '@influxdata/influxdb-client';
import { DeleteAPI } from '@influxdata/influxdb-client-apis';
import { IInfluxDbCredentials } from '../types';
import { InfluxDbValidator } from '../helpers/validators';
import { getOrganization } from '../helpers/client';

/**
 * Executes a delete by predicate operation.
 *
 * Deletes data from InfluxDB matching a specified predicate within a time range.
 * The predicate uses InfluxDB delete predicate syntax to selectively delete data.
 *
 * @param this - n8n execution context providing access to parameters and credentials
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the result of the delete operation
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 *
 * @example
 * const result = await executeDeleteByPredicate.call(this, client, credentials, 0);
 * // Returns: [{ json: { success: true, bucket: 'my-bucket', ... } }]
 */
export async function executeDeleteByPredicate(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const bucket = this.getNodeParameter('bucket', itemIndex) as string;
	const start = this.getNodeParameter('start', itemIndex) as string;
	const stop = this.getNodeParameter('stop', itemIndex) as string;
	const predicate = this.getNodeParameter('predicate', itemIndex) as string;

	// Validate bucket
	const bucketValidation = InfluxDbValidator.validateBucketName(bucket);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Validate time range
	if (!start || !stop) {
		throw new NodeOperationError(
			this.getNode(),
			'Both start and stop times are required',
			{ itemIndex }
		);
	}

	// Validate predicate
	if (!predicate || typeof predicate !== 'string' || predicate.trim().length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Predicate is required and must be a non-empty string',
			{ itemIndex }
		);
	}

	// Get organization
	const org = getOrganization(credentials);

	// Create delete API
	const deleteAPI = new DeleteAPI(client);

	try {
		// Execute delete
		await deleteAPI.postDelete({
			org,
			bucket,
			body: {
				start,
				stop,
				predicate,
			},
		});

		// Return success result
		return [
			{
				json: {
					success: true,
					bucket,
					start,
					stop,
					predicate,
				},
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to delete data from InfluxDB: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a delete all in range operation.
 *
 * Deletes all data in a specified time range from a bucket. This is a dangerous
 * operation that should be used with caution and requires confirmation.
 *
 * @param this - n8n execution context providing access to parameters and credentials
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the result of the delete operation
 * @throws {NodeOperationError} If validation fails, confirmation not provided, or required parameters missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 *
 * @example
 * const result = await executeDeleteAll.call(this, client, credentials, 0);
 * // Returns: [{ json: { success: true, bucket: 'my-bucket', ... } }]
 */
export async function executeDeleteAll(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const bucket = this.getNodeParameter('bucket', itemIndex) as string;
	const start = this.getNodeParameter('start', itemIndex) as string;
	const stop = this.getNodeParameter('stop', itemIndex) as string;
	const confirm = this.getNodeParameter('confirm', itemIndex, false) as boolean;

	// Require confirmation for safety
	if (!confirm) {
		throw new NodeOperationError(
			this.getNode(),
			'Delete all operation requires confirmation. Please check the confirm checkbox.',
			{ itemIndex }
		);
	}

	// Validate bucket
	const bucketValidation = InfluxDbValidator.validateBucketName(bucket);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Validate time range
	if (!start || !stop) {
		throw new NodeOperationError(
			this.getNode(),
			'Both start and stop times are required',
			{ itemIndex }
		);
	}

	// Get organization
	const org = getOrganization(credentials);

	// Create delete API
	const deleteAPI = new DeleteAPI(client);

	try {
		// Execute delete with empty predicate (deletes all)
		await deleteAPI.postDelete({
			org,
			bucket,
			body: {
				start,
				stop,
			},
		});

		// Return success result
		return [
			{
				json: {
					success: true,
					bucket,
					start,
					stop,
					deletedAll: true,
				},
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to delete all data from InfluxDB: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}
