/**
 * Mock n8n execution context for testing.
 *
 * This module provides mock implementations of n8n's execution functions
 * and context objects for unit testing.
 */

import { IExecuteFunctions, INode, INodeExecutionData } from 'n8n-workflow';

/**
 * Creates a mock IExecuteFunctions context for testing.
 *
 * @param parameters - Parameter values to return from getNodeParameter
 * @param credentials - Credential values to return from getCredentials
 * @returns Mock execution context
 */
export function createMockExecuteFunction(
	parameters: Record<string, unknown> = {},
	credentials: Record<string, unknown> = {}
): IExecuteFunctions {
	const mockNode: INode = {
		id: 'test-node-id',
		name: 'InfluxDB Test Node',
		type: 'n8n-nodes-base.influxDb',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	};

	return {
		getNode: () => mockNode,
		getNodeParameter: (parameterName: string, itemIndex: number, defaultValue?: unknown) => {
			const key = `${parameterName}_${itemIndex}`;
			if (key in parameters) {
				return parameters[key];
			}
			if (parameterName in parameters) {
				return parameters[parameterName];
			}
			return defaultValue;
		},
		getCredentials: async (credentialType: string) => {
			return credentials[credentialType] || credentials;
		},
		getInputData: () => [],
		continueOnFail: () => false,
		helpers: {
			returnJsonArray: (items: unknown[]) => items as INodeExecutionData[],
		},
	} as unknown as IExecuteFunctions;
}

/**
 * Creates mock input items for testing.
 *
 * @param count - Number of items to create
 * @param data - Data for each item
 * @returns Array of mock items
 */
export function createMockItems(
	count: number,
	data: Record<string, unknown> = {}
): INodeExecutionData[] {
	const items: INodeExecutionData[] = [];
	for (let i = 0; i < count; i++) {
		items.push({
			json: { ...data, index: i },
		});
	}
	return items;
}

/**
 * Mock credentials for InfluxDB
 */
export const mockCredentials = {
	url: 'http://localhost:8086',
	token: 'test-token-123',
	organization: 'test-org',
	defaultBucket: 'test-bucket',
	timeout: 30000,
};
