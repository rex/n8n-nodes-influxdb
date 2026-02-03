import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { InfluxDB } from '@influxdata/influxdb-client';
import { OrgsAPI } from '@influxdata/influxdb-client-apis';
import { IInfluxDbCredentials } from '../types';
import { InfluxDbFormatter } from '../helpers/formatters';

/**
 * Executes a list organizations operation.
 *
 * Retrieves all organizations that the authenticated user has access to.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array of items, one per organization
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeListOrganizations(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Create API
	const orgsAPI = new OrgsAPI(client);

	try {
		// List organizations
		const response = await orgsAPI.getOrgs();

		if (!response.orgs || response.orgs.length === 0) {
			return [
				{
					json: { organizations: [], count: 0 },
					pairedItem: { item: itemIndex },
				},
			];
		}

		// Format organizations
		const formattedOrgs = response.orgs
			.filter((org) => org.id !== undefined)
			.map((org) =>
				InfluxDbFormatter.formatOrganizationInfo({
					id: org.id!,
					name: org.name,
					description: org.description,
					createdAt: org.createdAt,
					updatedAt: org.updatedAt,
				})
			);

		// Return as separate items
		return formattedOrgs.map((org) => ({
			json: org,
			pairedItem: { item: itemIndex },
		}));
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to list organizations: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a get organization operation.
 *
 * Retrieves detailed information about a specific organization.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the organization information
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeGetOrganization(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const orgName = this.getNodeParameter('organizationName', itemIndex) as string;

	// Validate organization name
	if (!orgName || typeof orgName !== 'string') {
		throw new NodeOperationError(
			this.getNode(),
			'Organization name is required and must be a string',
			{ itemIndex }
		);
	}

	// Create API
	const orgsAPI = new OrgsAPI(client);

	try {
		// Get organization
		const response = await orgsAPI.getOrgs({ org: orgName });

		if (!response.orgs || response.orgs.length === 0) {
			throw new Error(`Organization "${orgName}" not found`);
		}

		const org = response.orgs[0];

		// Format organization info
		const formattedOrg = InfluxDbFormatter.formatOrganizationInfo({
			id: org.id!,
			name: org.name,
			description: org.description,
			createdAt: org.createdAt,
			updatedAt: org.updatedAt,
		});

		return [
			{
				json: formattedOrg as Record<string, string | number | boolean>,
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to get organization: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a create organization operation.
 *
 * Creates a new organization with the specified name and optional description.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the created organization information
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeCreateOrganization(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const name = this.getNodeParameter('organizationName', itemIndex) as string;
	const description = this.getNodeParameter(
		'description',
		itemIndex,
		''
	) as string;

	// Validate organization name
	if (!name || typeof name !== 'string') {
		throw new NodeOperationError(
			this.getNode(),
			'Organization name is required and must be a string',
			{ itemIndex }
		);
	}

	// Create API
	const orgsAPI = new OrgsAPI(client);

	try {
		// Create organization
		const org = await orgsAPI.postOrgs({
			body: {
				name,
				description,
			},
		});

		// Format organization info
		const formattedOrg = InfluxDbFormatter.formatOrganizationInfo({
			id: org.id!,
			name: org.name,
			description: org.description,
			createdAt: org.createdAt,
			updatedAt: org.updatedAt,
		});

		return [
			{
				json: { ...(formattedOrg as Record<string, string | number | boolean>), created: true },
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to create organization: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes an update organization operation.
 *
 * Updates an existing organization's name and/or description.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the updated organization information
 * @throws {NodeOperationError} If validation fails or required parameters are missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeUpdateOrganization(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const orgName = this.getNodeParameter('organizationName', itemIndex) as string;
	const newName = this.getNodeParameter('newName', itemIndex, '') as string;
	const description = this.getNodeParameter(
		'description',
		itemIndex,
		''
	) as string;

	// Validate organization name
	if (!orgName || typeof orgName !== 'string') {
		throw new NodeOperationError(
			this.getNode(),
			'Organization name is required and must be a string',
			{ itemIndex }
		);
	}

	// Create API
	const orgsAPI = new OrgsAPI(client);

	try {
		// Get organization to find ID
		const response = await orgsAPI.getOrgs({ org: orgName });

		if (!response.orgs || response.orgs.length === 0) {
			throw new Error(`Organization "${orgName}" not found`);
		}

		const existingOrg = response.orgs[0];
		const orgID = existingOrg.id!;

		// Prepare update body
		const updateBody: {
			name?: string;
			description?: string;
		} = {};

		if (newName) {
			updateBody.name = newName;
		}

		if (description) {
			updateBody.description = description;
		}

		// Update organization
		const updatedOrg = await orgsAPI.patchOrgsID({
			orgID,
			body: updateBody,
		});

		// Format organization info
		const formattedOrg = InfluxDbFormatter.formatOrganizationInfo({
			id: updatedOrg.id!,
			name: updatedOrg.name,
			description: updatedOrg.description,
			createdAt: updatedOrg.createdAt,
			updatedAt: updatedOrg.updatedAt,
		});

		return [
			{
				json: { ...(formattedOrg as Record<string, string | number | boolean>), updated: true },
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to update organization: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}

/**
 * Executes a delete organization operation.
 *
 * Deletes an organization and all its associated data. This is a dangerous
 * operation that requires confirmation.
 *
 * @param this - n8n execution context
 * @param client - Configured InfluxDB client instance
 * @param credentials - InfluxDB API credentials
 * @param itemIndex - Index of the current item being processed
 * @returns Array containing the result of the delete operation
 * @throws {NodeOperationError} If validation fails, confirmation not provided, or required parameters missing
 * @throws {NodeOperationError} If the InfluxDB API call fails
 */
export async function executeDeleteOrganization(
	this: IExecuteFunctions,
	client: InfluxDB,
	_credentials: IInfluxDbCredentials,
	itemIndex: number
): Promise<INodeExecutionData[]> {
	// Get parameters
	const orgName = this.getNodeParameter('organizationName', itemIndex) as string;
	const confirm = this.getNodeParameter('confirm', itemIndex, false) as boolean;

	// Require confirmation for safety
	if (!confirm) {
		throw new NodeOperationError(
			this.getNode(),
			'Delete organization operation requires confirmation. Please check the confirm checkbox.',
			{ itemIndex }
		);
	}

	// Validate organization name
	if (!orgName || typeof orgName !== 'string') {
		throw new NodeOperationError(
			this.getNode(),
			'Organization name is required and must be a string',
			{ itemIndex }
		);
	}

	// Create API
	const orgsAPI = new OrgsAPI(client);

	try {
		// Get organization to find ID
		const response = await orgsAPI.getOrgs({ org: orgName });

		if (!response.orgs || response.orgs.length === 0) {
			throw new Error(`Organization "${orgName}" not found`);
		}

		const orgID = response.orgs[0].id!;

		// Delete organization
		await orgsAPI.deleteOrgsID({ orgID });

		return [
			{
				json: {
					success: true,
					deleted: true,
					organizationName: orgName,
					organizationID: orgID,
				},
				pairedItem: { item: itemIndex },
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to delete organization: ${error instanceof Error ? error.message : String(error)}`,
			{ itemIndex }
		);
	}
}
