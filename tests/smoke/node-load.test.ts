/**
 * Smoke test to verify the node can be loaded.
 *
 * This test ensures that the node module exports are correct and
 * the node description is valid.
 */

import { InfluxDb } from '../../nodes/InfluxDb/InfluxDb.node';

describe('InfluxDb Node - Smoke Test', () => {
	it('should export InfluxDb class', () => {
		expect(InfluxDb).toBeDefined();
		expect(typeof InfluxDb).toBe('function');
	});

	it('should have valid node description', () => {
		const node = new InfluxDb();
		expect(node.description).toBeDefined();
		expect(node.description.displayName).toBe('InfluxDB');
		expect(node.description.name).toBe('influxDb');
		expect(node.description.version).toBe(1);
	});

	it('should have all required resources', () => {
		const node = new InfluxDb();
		const resourceProperty = node.description.properties.find(
			(p) => p.name === 'resource'
		);

		expect(resourceProperty).toBeDefined();
		expect(resourceProperty?.type).toBe('options');

		const options = (resourceProperty as { options?: Array<{ value: string }> })?.options;
		const resourceValues = options?.map((o) => o.value) || [];

		expect(resourceValues).toContain('write');
		expect(resourceValues).toContain('query');
		expect(resourceValues).toContain('delete');
		expect(resourceValues).toContain('bucket');
		expect(resourceValues).toContain('organization');
	});

	it('should have execute method', () => {
		const node = new InfluxDb();
		expect(node.execute).toBeDefined();
		expect(typeof node.execute).toBe('function');
	});

	it('should require influxDbApi credentials', () => {
		const node = new InfluxDb();
		expect(node.description.credentials).toBeDefined();
		expect(node.description.credentials).toHaveLength(1);
		expect(node.description.credentials?.[0].name).toBe('influxDbApi');
		expect(node.description.credentials?.[0].required).toBe(true);
	});
});
