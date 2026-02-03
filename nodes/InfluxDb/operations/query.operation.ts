import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { InfluxDB } from '@influxdata/influxdb-client';
import { IInfluxDbCredentials, IFormatOptions } from '../types';
import { InfluxDbValidator } from '../helpers/validators';
import { InfluxDbFormatter } from '../helpers/formatters';
import { getOrganization } from '../helpers/client';

/**
 * Executes a Flux query operation.
 *
 * Runs a custom Flux query against InfluxDB and returns the results formatted
 * for n8n workflows. Supports query parameters and various formatting options.
 *
 * @param this - n8n execution context providing access to parameters and credentials
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array of result items, one per row returned by the query
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeApiError} If the InfluxDB API call fails
 *
 * @example
 * const results = await executeFluxQuery.call(this, client, credentials, 0);
 * // Returns: [{ json: { _time: '...', _value: 42, ... } }, ...]
 */
export async function executeFluxQuery(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const query = this.getNodeParameter('query', itemIndex) as string;
	const timestampFormat = this.getNodeParameter(
		'timestampFormat',
		itemIndex,
		'iso'
	) as 'iso' | 'unix' | 'relative';
	const limit = this.getNodeParameter('limit', itemIndex, 0);

	// Validate query
	const queryValidation = InfluxDbValidator.validateFluxQuery(query);
	if (!queryValidation.valid) {
		throw new NodeOperationError(
			this.getNode(),
			queryValidation.error ?? 'Invalid Flux query',
			{ itemIndex }
		);
	}

	// Get organization
	const org = getOrganization(credentials);

	// Create query API
	const queryApi = client.getQueryApi(org);

	try {
		// Execute query and collect results
		const results: Record<string, unknown>[] = [];

		await new Promise<void>((resolve, reject) => {
			queryApi.queryRows(query, {
				next: (row: string[], tableMeta: { columns: Array<{ label: string }> }) => {
					// Convert row array to object
					const rowObject: Record<string, unknown> = {};
					tableMeta.columns.forEach((col, index) => {
						rowObject[col.label] = row[index];
					});
					results.push(rowObject);
				},
				error: (error: Error) => {
					reject(error);
				},
				complete: () => {
					resolve();
				},
			});
		});

		// Format results
		const formatOptions: IFormatOptions = {
			timestampFormat,
			limit: limit > 0 ? limit : undefined,
		};

		const formattedResults =
			InfluxDbFormatter.formatFluxResults(results, formatOptions);

		// Convert to n8n items
		return formattedResults.map((row) => ({
			json: row,
			pairedItem: { item: itemIndex },
		}));
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to execute Flux query: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a simple query operation.
 *
 * Provides a simplified interface for common queries without requiring Flux knowledge.
 * Auto-generates a Flux query from the provided parameters (bucket, measurement, time range, filters).
 *
 * @param this - n8n execution context providing access to parameters and credentials
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array of result items, one per row returned by the query
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeApiError} If the InfluxDB API call fails
 *
 * @example
 * const results = await executeSimpleQuery.call(this, client, credentials, 0);
 * // Returns: [{ json: { _time: '...', _value: 42, ... } }, ...]
 */
export async function executeSimpleQuery(
	this: IExecuteFunctions,
	client: InfluxDB,
	credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const bucket = this.getNodeParameter('bucket', itemIndex) as string;
	const measurement = this.getNodeParameter('measurement', itemIndex) as string;
	const start = this.getNodeParameter('start', itemIndex, '-1h') as string;
	const stop = this.getNodeParameter('stop', itemIndex, 'now()') as string;
	const field = this.getNodeParameter('field', itemIndex, '') as string;
	const timestampFormat = this.getNodeParameter(
		'timestampFormat',
		itemIndex,
		'iso'
	) as 'iso' | 'unix' | 'relative';
	const limit = this.getNodeParameter('limit', itemIndex, 0);

	// Validate bucket
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

	// Build Flux query
	let query = `from(bucket: "${bucket}")\n`;
	query += `  |> range(start: ${start}, stop: ${stop})\n`;
	query += `  |> filter(fn: (r) => r._measurement == "${measurement}")`;

	// Add field filter if specified
	if (field) {
		query += `\n  |> filter(fn: (r) => r._field == "${field}")`;
	}

	// Add limit if specified
	if (limit > 0) {
		query += `\n  |> limit(n: ${limit})`;
	}

	// Get organization
	const org = getOrganization(credentials);

	// Create query API
	const queryApi = client.getQueryApi(org);

	try {
		// Execute query and collect results
		const results: Record<string, unknown>[] = [];

		await new Promise<void>((resolve, reject) => {
			queryApi.queryRows(query, {
				next: (row: string[], tableMeta: { columns: Array<{ label: string }> }) => {
					// Convert row array to object
					const rowObject: Record<string, unknown> = {};
					tableMeta.columns.forEach((col, index) => {
						rowObject[col.label] = row[index];
					});
					results.push(rowObject);
				},
				error: (error: Error) => {
					reject(error);
				},
				complete: () => {
					resolve();
				},
			});
		});

		// Format results
		const formatOptions: IFormatOptions = {
			timestampFormat,
			limit: limit > 0 ? limit : undefined,
		};

		const formattedResults =
			InfluxDbFormatter.formatFluxResults(results, formatOptions);

		// Convert to n8n items
		return formattedResults.map((row) => ({
			json: row,
			pairedItem: { item: itemIndex },
		}));
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to execute simple query: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}
