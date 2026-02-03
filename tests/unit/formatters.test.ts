/**
 * Unit tests for InfluxDB formatters.
 *
 * Tests all formatting functions to ensure they correctly transform
 * InfluxDB responses into n8n-friendly formats.
 */

import { InfluxDbFormatter } from '../../nodes/InfluxDb/helpers/formatters';
import { mockFluxQueryResults } from '../mocks/influxdb-responses';

describe('InfluxDbFormatter', () => {
	describe('formatFluxResults', () => {
		it('should format Flux query results with ISO timestamps', () => {
			const results = InfluxDbFormatter.formatFluxResults(mockFluxQueryResults, {
				timestampFormat: 'iso',
			});

			expect(results).toHaveLength(3);
			expect(results[0]._time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
			expect(results[0]._measurement).toBe('temperature');
			expect(results[0]._value).toBe(23.5);
		});

		it('should format timestamps as Unix milliseconds', () => {
			const results = InfluxDbFormatter.formatFluxResults(mockFluxQueryResults, {
				timestampFormat: 'unix',
			});

			expect(typeof results[0]._time).toBe('object'); // Date object
			expect(results[0]._measurement).toBe('temperature');
		});

		it('should format timestamps as relative time', () => {
			const now = new Date();
			const results = InfluxDbFormatter.formatFluxResults(
				[{ ...mockFluxQueryResults[0], _time: now }],
				{ timestampFormat: 'relative' }
			);

			expect(results[0]._time).toMatch(/ago|just now/);
		});

		it('should apply limit to results', () => {
			const results = InfluxDbFormatter.formatFluxResults(mockFluxQueryResults, {
				limit: 2,
			});

			expect(results).toHaveLength(2);
		});

		it('should handle empty results', () => {
			const results = InfluxDbFormatter.formatFluxResults([]);
			expect(results).toHaveLength(0);
		});

		it('should preserve custom fields', () => {
			const results = InfluxDbFormatter.formatFluxResults(mockFluxQueryResults);

			expect(results[0].location).toBe('office');
			expect(results[0].sensor_id).toBe('sensor-001');
		});
	});

	describe('formatTimestamp', () => {
		const testDate = new Date('2024-01-01T12:00:00.000Z');

		it('should format as ISO 8601', () => {
			const result = InfluxDbFormatter.formatTimestamp(testDate, 'iso');
			expect(result).toBe('2024-01-01T12:00:00.000Z');
		});

		it('should format as Unix milliseconds', () => {
			const result = InfluxDbFormatter.formatTimestamp(testDate, 'unix');
			expect(typeof result).toBe('number');
			expect(result).toBe(testDate.getTime());
		});

		it('should format as relative time', () => {
			const now = new Date();
			const result = InfluxDbFormatter.formatTimestamp(now, 'relative');
			expect(result).toBe('just now');
		});

		it('should handle string timestamps', () => {
			const result = InfluxDbFormatter.formatTimestamp('2024-01-01T12:00:00.000Z', 'iso');
			expect(result).toBe('2024-01-01T12:00:00.000Z');
		});
	});

	describe('getRelativeTime', () => {
		const now = new Date();

		it('should return "just now" for current time', () => {
			const result = InfluxDbFormatter.getRelativeTime(now);
			expect(result).toBe('just now');
		});

		it('should format seconds ago', () => {
			const past = new Date(now.getTime() - 30000); // 30 seconds ago
			const result = InfluxDbFormatter.getRelativeTime(past);
			expect(result).toMatch(/\d+ seconds? ago/);
		});

		it('should format minutes ago', () => {
			const past = new Date(now.getTime() - 300000); // 5 minutes ago
			const result = InfluxDbFormatter.getRelativeTime(past);
			expect(result).toMatch(/\d+ minutes? ago/);
		});

		it('should format hours ago', () => {
			const past = new Date(now.getTime() - 7200000); // 2 hours ago
			const result = InfluxDbFormatter.getRelativeTime(past);
			expect(result).toMatch(/\d+ hours? ago/);
		});

		it('should format days ago', () => {
			const past = new Date(now.getTime() - 172800000); // 2 days ago
			const result = InfluxDbFormatter.getRelativeTime(past);
			expect(result).toMatch(/\d+ days? ago/);
		});

		it('should format future times', () => {
			const future = new Date(now.getTime() + 1800000); // 30 minutes from now
			const result = InfluxDbFormatter.getRelativeTime(future);
			expect(result).toMatch(/in \d+ (minutes?|hours?|days?)/);
		});
	});

	describe('parseRetentionPeriod', () => {
		it('should parse days to seconds', () => {
			expect(InfluxDbFormatter.parseRetentionPeriod('1d')).toBe(86400);
			expect(InfluxDbFormatter.parseRetentionPeriod('30d')).toBe(2592000);
		});

		it('should parse hours to seconds', () => {
			expect(InfluxDbFormatter.parseRetentionPeriod('1h')).toBe(3600);
			expect(InfluxDbFormatter.parseRetentionPeriod('24h')).toBe(86400);
		});

		it('should parse minutes to seconds', () => {
			expect(InfluxDbFormatter.parseRetentionPeriod('1m')).toBe(60);
			expect(InfluxDbFormatter.parseRetentionPeriod('60m')).toBe(3600);
		});

		it('should parse seconds', () => {
			expect(InfluxDbFormatter.parseRetentionPeriod('1s')).toBe(1);
			expect(InfluxDbFormatter.parseRetentionPeriod('3600s')).toBe(3600);
		});

		it('should return 0 for infinite', () => {
			expect(InfluxDbFormatter.parseRetentionPeriod('infinite')).toBe(0);
			expect(InfluxDbFormatter.parseRetentionPeriod('INFINITE')).toBe(0);
		});

		it('should throw error for invalid format', () => {
			expect(() => InfluxDbFormatter.parseRetentionPeriod('30days')).toThrow();
			expect(() => InfluxDbFormatter.parseRetentionPeriod('bad')).toThrow();
		});
	});

	describe('formatRetentionPeriod', () => {
		it('should format days', () => {
			expect(InfluxDbFormatter.formatRetentionPeriod(86400)).toBe('1d');
			expect(InfluxDbFormatter.formatRetentionPeriod(2592000)).toBe('30d');
		});

		it('should format hours', () => {
			expect(InfluxDbFormatter.formatRetentionPeriod(3600)).toBe('1h');
			expect(InfluxDbFormatter.formatRetentionPeriod(7200)).toBe('2h');
		});

		it('should format minutes', () => {
			expect(InfluxDbFormatter.formatRetentionPeriod(60)).toBe('1m');
			expect(InfluxDbFormatter.formatRetentionPeriod(300)).toBe('5m');
		});

		it('should format seconds', () => {
			expect(InfluxDbFormatter.formatRetentionPeriod(45)).toBe('45s');
		});

		it('should format infinite as "infinite"', () => {
			expect(InfluxDbFormatter.formatRetentionPeriod(0)).toBe('infinite');
		});

		it('should use largest applicable unit', () => {
			expect(InfluxDbFormatter.formatRetentionPeriod(86400)).toBe('1d');
			expect(InfluxDbFormatter.formatRetentionPeriod(86401)).toBe('86401s');
		});
	});

	describe('formatBucketInfo', () => {
		it('should format bucket information', () => {
			const bucket = {
				id: 'bucket-001',
				name: 'test-bucket',
				orgID: 'org-001',
				retentionRules: [{ everySeconds: 2592000 }],
				description: 'Test bucket',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			};

			const result = InfluxDbFormatter.formatBucketInfo(bucket);

			expect(result.id).toBe('bucket-001');
			expect(result.name).toBe('test-bucket');
			expect(result.organizationId).toBe('org-001');
			expect(result.retention).toBe('30d');
			expect(result.description).toBe('Test bucket');
		});

		it('should handle infinite retention', () => {
			const bucket = {
				id: 'bucket-001',
				name: 'test-bucket',
				orgID: 'org-001',
				retentionRules: [],
			};

			const result = InfluxDbFormatter.formatBucketInfo(bucket);
			expect(result.retention).toBe('infinite');
		});

		it('should handle missing optional fields', () => {
			const bucket = {
				id: 'bucket-001',
				name: 'test-bucket',
				orgID: 'org-001',
			};

			const result = InfluxDbFormatter.formatBucketInfo(bucket);
			expect(result.description).toBe('');
			expect(result.createdAt).toBe('');
		});
	});

	describe('formatOrganizationInfo', () => {
		it('should format organization information', () => {
			const org = {
				id: 'org-001',
				name: 'test-org',
				description: 'Test organization',
				createdAt: '2024-01-01T00:00:00Z',
				updatedAt: '2024-01-01T00:00:00Z',
			};

			const result = InfluxDbFormatter.formatOrganizationInfo(org);

			expect(result.id).toBe('org-001');
			expect(result.name).toBe('test-org');
			expect(result.description).toBe('Test organization');
			expect(result.createdAt).toBe('2024-01-01T00:00:00Z');
		});

		it('should handle missing optional fields', () => {
			const org = {
				id: 'org-001',
				name: 'test-org',
			};

			const result = InfluxDbFormatter.formatOrganizationInfo(org);
			expect(result.description).toBe('');
			expect(result.createdAt).toBe('');
		});
	});
});
