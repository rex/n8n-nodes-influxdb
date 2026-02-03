import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { IInfluxDbCredentials, IWritePointOptions } from '../types';
import { InfluxDbValidator } from '../helpers/validators';
import { getOrganization, getDefaultBucket } from '../helpers/client';

/**
 * Executes a write point operation.
 *
 * Writes a single data point to InfluxDB with the specified measurement,
 * tags, fields, and optional timestamp. Validates all inputs before writing.
 *
 * @param this - n8n execution context providing access to parameters and credentials
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the result of the write operation
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeApiError} If the InfluxDB API call fails
 *
 * @example
 * const result = await executeWritePoint.call(this, client, credentials, 0);
 * // Returns: [{ json: { success: true, pointsWritten: 1, ... } }]
 */
export async function executeWritePoint(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters from node configuration
	const measurement = this.getNodeParameter('measurement', itemIndex) as string;
	const tags = this.getNodeParameter('tags', itemIndex, {}) as Record<
		string,
		string
	>;
	const fields = this.getNodeParameter('fields', itemIndex, {}) as Record<
		string,
		string | number | boolean
	>;
	const timestamp = this.getNodeParameter(
		'timestamp',
		itemIndex,
		undefined
	) as string | number | undefined;
	const bucket =
		(this.getNodeParameter('bucket', itemIndex, '') as string) ||
		getDefaultBucket(credentials) ||
		'';

	// Validate bucket
	if (!bucket) {
		throw new NodeOperationError(
			this.getNode(),
			'Bucket name is required. Provide it as a parameter or set a default bucket in credentials.',
			{ itemIndex }
		);
	}

	const bucketValidation = InfluxDbValidator.validateBucketName(bucket);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Validate measurement
	const measurementValidation =
		InfluxDbValidator.validateMeasurementName(measurement);
	if (!measurementValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			measurementValidation.error ?? 'Invalid measurement name',
			{ itemIndex }
		);
	}

	// Validate tags
	for (const [key, value] of Object.entries(tags)) {
		const keyValidation = InfluxDbValidator.validateKeyName(key);
		if (!keyValidation.valid) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid tag key: ${keyValidation.error}`,
				{ itemIndex }
			);
		}

		if (typeof value !== 'string') {
			throw new NodeOperationError(
				this.getNode(),
				`Tag value for "${key}" must be a string, got ${typeof value}`,
				{ itemIndex }
			);
		}
	}

	// Validate fields
	if (!fields || Object.keys(fields).length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'At least one field is required',
			{ itemIndex }
		);
	}

	for (const [key, value] of Object.entries(fields)) {
		const keyValidation = InfluxDbValidator.validateKeyName(key);
		if (!keyValidation.valid) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid field key: ${keyValidation.error}`,
				{ itemIndex }
			);
		}

		const valueValidation = InfluxDbValidator.validateFieldValue(value);
		if (!valueValidation.valid) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid field value for "${key}": ${valueValidation.error}`,
				{ itemIndex }
			);
		}
	}

	// Validate timestamp if provided
	if (timestamp !== undefined) {
		const timestampValidation =
			InfluxDbValidator.validateTimestamp(timestamp);
		if (!timestampValidation.valid) {
			throw new NodeOperationError(
				this.getNode(),
				timestampValidation.error ?? 'Invalid timestamp',
				{ itemIndex }
			);
		}
	}

	// Create write API
	const org = getOrganization(credentials);
	const writeApi = client.getWriteApi(org, bucket, 'ns');

	try {
		// Create point
		const point = new Point(measurement);

		// Add tags
		for (const [key, value] of Object.entries(tags)) {
			point.tag(key, value);
		}

		// Add fields
		for (const [key, value] of Object.entries(fields)) {
			if (typeof value === 'number') {
				// Determine if integer or float
				if (Number.isInteger(value)) {
					point.intField(key, value);
				} else {
					point.floatField(key, value);
				}
			} else if (typeof value === 'string') {
				point.stringField(key, value);
			} else if (typeof value === 'boolean') {
				point.booleanField(key, value);
			}
		}

		// Add timestamp if provided
		if (timestamp !== undefined) {
			const timestampDate =
				typeof timestamp === 'number' || typeof timestamp === 'string'
					? new Date(timestamp)
					: timestamp;
			point.timestamp(timestampDate);
		}

		// Write point
		writeApi.writePoint(point);
		await writeApi.close();

		// Return success result
		return [
			{
				json: {
					success: true,
					pointsWritten: 1,
					measurement,
					bucket,
					timestamp: timestamp ?? new Date().toISOString(),
				},
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		// Ensure writeApi is closed on error
		try {
			await writeApi.close();
		} catch {
			// Ignore close errors
		}

		throw new NodeOperationError(
			this.getNode(),
			`Failed to write point to InfluxDB: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a batch write operation.
 *
 * Writes multiple data points to InfluxDB in a single request or in batches.
 * More efficient than writing points individually for high-throughput scenarios.
 *
 * @param this - n8n execution context providing access to parameters and credentials
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param items - All input items from the previous node
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the result of the batch write operation
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeApiError} If the InfluxDB API call fails
 *
 * @example
 * const result = await executeWriteBatch.call(this, client, credentials, items, 0);
 * // Returns: [{ json: { success: true, pointsWritten: 100, ... } }]
 */
export async function executeWriteBatch(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	_items: INodeExecutionData[],
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const pointsData = this.getNodeParameter('points', itemIndex, []) as Array<
		IWritePointOptions
	>;
	const batchSize = this.getNodeParameter('batchSize', itemIndex, 5000) as number;
	const bucket =
		(this.getNodeParameter('bucket', itemIndex, '') as string) ||
		getDefaultBucket(credentials) ||
		'';

	// Validate bucket
	if (!bucket) {
		throw new NodeOperationError(
			this.getNode(),
			'Bucket name is required. Provide it as a parameter or set a default bucket in credentials.',
			{ itemIndex }
		);
	}

	const bucketValidation = InfluxDbValidator.validateBucketName(bucket);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Validate points array
	if (!Array.isArray(pointsData) || pointsData.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Points array is required and must contain at least one point',
			{ itemIndex }
		);
	}

	// Create write API
	const org = getOrganization(credentials);
	const writeApi = client.getWriteApi(org, bucket, 'ns', { batchSize });

	try {
		let pointsWritten = 0;

		// Process each point
		for (const pointData of pointsData) {
			// Validate measurement
			const measurementValidation =
				InfluxDbValidator.validateMeasurementName(pointData.measurement);
			if (!measurementValidation.valid) {
				throw new NodeOperationError(
					this.getNode(),
					`Point ${pointsWritten}: ${measurementValidation.error}`,
					{ itemIndex }
				);
			}

			// Create point
			const point = new Point(pointData.measurement);

			// Add tags
			if (pointData.tags) {
				for (const [key, value] of Object.entries(pointData.tags)) {
					point.tag(key, value);
				}
			}

			// Add fields
			if (!pointData.fields || Object.keys(pointData.fields).length === 0) {
				throw new NodeOperationError(
					this.getNode(),
					`Point ${pointsWritten}: At least one field is required`,
					{ itemIndex }
				);
			}

			for (const [key, value] of Object.entries(pointData.fields)) {
				if (typeof value === 'number') {
					if (Number.isInteger(value)) {
						point.intField(key, value);
					} else {
						point.floatField(key, value);
					}
				} else if (typeof value === 'string') {
					point.stringField(key, value);
				} else if (typeof value === 'boolean') {
					point.booleanField(key, value);
				}
			}

			// Add timestamp if provided
			if (pointData.timestamp) {
				const timestampDate =
					typeof pointData.timestamp === 'number' ||
					typeof pointData.timestamp === 'string'
						? new Date(pointData.timestamp)
						: pointData.timestamp;
				point.timestamp(timestampDate);
			}

			// Write point
			writeApi.writePoint(point);
			pointsWritten++;
		}

		// Flush and close
		await writeApi.close();

		// Return success result
		return [
			{
				json: {
					success: true,
					pointsWritten,
					bucket,
					batchSize,
				},
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		// Ensure writeApi is closed on error
		try {
			await writeApi.close();
		} catch {
			// Ignore close errors
		}

		throw new NodeOperationError(
			this.getNode(),
			`Failed to write batch to InfluxDB: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a line protocol write operation.
 *
 * Writes data using raw InfluxDB line protocol format. Useful for advanced
 * users who want direct control over the data format or are migrating from
 * existing InfluxDB integrations.
 *
 * @param this - n8n execution context providing access to parameters and credentials
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the result of the write operation
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeApiError} If the InfluxDB API call fails
 *
 * @example
 * const result = await executeWriteLineProtocol.call(this, client, credentials, 0);
 * // Returns: [{ json: { success: true, linesWritten: 3, ... } }]
 */
export async function executeWriteLineProtocol(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const lineProtocol = this.getNodeParameter('lineProtocol', itemIndex) as string;
	const bucket =
		(this.getNodeParameter('bucket', itemIndex, '') as string) ||
		getDefaultBucket(credentials) ||
		'';
	const precision = this.getNodeParameter('precision', itemIndex, 'ns') as
		| 'ns'
		| 'us'
		| 'ms'
		| 's';

	// Validate bucket
	if (!bucket) {
		throw new NodeOperationError(
			this.getNode(),
			'Bucket name is required. Provide it as a parameter or set a default bucket in credentials.',
			{ itemIndex }
		);
	}

	const bucketValidation = InfluxDbValidator.validateBucketName(bucket);
	if (!bucketValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			bucketValidation.error ?? 'Invalid bucket name',
			{ itemIndex }
		);
	}

	// Validate line protocol
	if (!lineProtocol || typeof lineProtocol !== 'string') {
		throw new NodeOperationError(
			this.getNode(),
			'Line protocol is required and must be a string',
			{ itemIndex }
		);
	}

	const trimmedProtocol = lineProtocol.trim();
	if (trimmedProtocol.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Line protocol cannot be empty',
			{ itemIndex }
		);
	}

	// Count lines for reporting
	const lines = trimmedProtocol.split('\n').filter((line) => line.trim());
	const lineCount = lines.length;

	// Create write API
	const org = getOrganization(credentials);
	const writeApi = client.getWriteApi(org, bucket, precision);

	try {
		// Write line protocol
		writeApi.writeRecord(trimmedProtocol);
		await writeApi.close();

		// Return success result
		return [
			{
				json: {
					success: true,
					linesWritten: lineCount,
					bucket,
					precision,
				},
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		// Ensure writeApi is closed on error
		try {
			await writeApi.close();
		} catch {
			// Ignore close errors
		}

		throw new NodeOperationError(
			this.getNode(),
			`Failed to write line protocol to InfluxDB: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}
