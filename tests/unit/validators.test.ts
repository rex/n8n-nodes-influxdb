/**
 * Unit tests for InfluxDB validators.
 *
 * Tests all validation functions to ensure they correctly validate
 * or reject various input formats.
 */

import { InfluxDbValidator } from '../../nodes/InfluxDb/helpers/validators';
import { invalidData } from '../mocks/test-data';

describe('InfluxDbValidator', () => {
	describe('validateMeasurementName', () => {
		it('should accept valid alphanumeric names', () => {
			expect(InfluxDbValidator.validateMeasurementName('cpu').valid).toBe(true);
			expect(InfluxDbValidator.validateMeasurementName('temperature').valid).toBe(true);
			expect(InfluxDbValidator.validateMeasurementName('sensor123').valid).toBe(true);
		});

		it('should accept names with hyphens and underscores', () => {
			expect(InfluxDbValidator.validateMeasurementName('cpu-usage').valid).toBe(true);
			expect(InfluxDbValidator.validateMeasurementName('cpu_usage').valid).toBe(true);
			expect(InfluxDbValidator.validateMeasurementName('sensor_123-temp').valid).toBe(true);
		});

		it('should reject empty strings', () => {
			const result = InfluxDbValidator.validateMeasurementName('');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('required');
		});

		it('should reject names with spaces', () => {
			const result = InfluxDbValidator.validateMeasurementName('cpu usage');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('alphanumeric');
		});

		it('should reject names with special characters', () => {
			invalidData.invalidMeasurements.forEach((name) => {
				if (name) {
					// Skip empty string, already tested
					const result = InfluxDbValidator.validateMeasurementName(name);
					expect(result.valid).toBe(false);
				}
			});
		});

		it('should reject null and undefined', () => {
			expect(InfluxDbValidator.validateMeasurementName(null as unknown as string).valid).toBe(
				false
			);
			expect(
				InfluxDbValidator.validateMeasurementName(undefined as unknown as string).valid
			).toBe(false);
		});
	});

	describe('validateKeyName', () => {
		it('should accept valid key names', () => {
			expect(InfluxDbValidator.validateKeyName('location').valid).toBe(true);
			expect(InfluxDbValidator.validateKeyName('sensor-id').valid).toBe(true);
			expect(InfluxDbValidator.validateKeyName('value123').valid).toBe(true);
		});

		it('should reject keys starting with underscore', () => {
			const result = InfluxDbValidator.validateKeyName('_private');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('underscore');
			expect(result.error).toContain('reserved');
		});

		it('should reject keys with special characters', () => {
			const result = InfluxDbValidator.validateKeyName('key@value');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('alphanumeric');
		});

		it('should reject empty strings', () => {
			const result = InfluxDbValidator.validateKeyName('');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('required');
		});
	});

	describe('validateBucketName', () => {
		it('should accept valid bucket names', () => {
			expect(InfluxDbValidator.validateBucketName('test-bucket').valid).toBe(true);
			expect(InfluxDbValidator.validateBucketName('sensors').valid).toBe(true);
			expect(InfluxDbValidator.validateBucketName('data_2024').valid).toBe(true);
		});

		it('should reject names longer than 255 characters', () => {
			const longName = 'a'.repeat(256);
			const result = InfluxDbValidator.validateBucketName(longName);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('255');
		});

		it('should reject invalid bucket names', () => {
			invalidData.invalidBuckets.forEach((name) => {
				const result = InfluxDbValidator.validateBucketName(name);
				expect(result.valid).toBe(false);
			});
		});
	});

	describe('validateRetentionPeriod', () => {
		it('should accept valid retention periods with days', () => {
			expect(InfluxDbValidator.validateRetentionPeriod('1d').valid).toBe(true);
			expect(InfluxDbValidator.validateRetentionPeriod('30d').valid).toBe(true);
			expect(InfluxDbValidator.validateRetentionPeriod('365d').valid).toBe(true);
		});

		it('should accept valid retention periods with hours', () => {
			expect(InfluxDbValidator.validateRetentionPeriod('1h').valid).toBe(true);
			expect(InfluxDbValidator.validateRetentionPeriod('24h').valid).toBe(true);
		});

		it('should accept valid retention periods with minutes and seconds', () => {
			expect(InfluxDbValidator.validateRetentionPeriod('60m').valid).toBe(true);
			expect(InfluxDbValidator.validateRetentionPeriod('3600s').valid).toBe(true);
		});

		it('should accept "infinite" as a special value', () => {
			expect(InfluxDbValidator.validateRetentionPeriod('infinite').valid).toBe(true);
			expect(InfluxDbValidator.validateRetentionPeriod('INFINITE').valid).toBe(true);
			expect(InfluxDbValidator.validateRetentionPeriod('Infinite').valid).toBe(true);
		});

		it('should reject invalid retention periods', () => {
			invalidData.invalidRetentions.forEach((period) => {
				const result = InfluxDbValidator.validateRetentionPeriod(period);
				expect(result.valid).toBe(false);
			});
		});
	});

	describe('validateFluxQuery', () => {
		it('should accept valid Flux queries', () => {
			const validQuery = 'from(bucket: "test") |> range(start: -1h)';
			expect(InfluxDbValidator.validateFluxQuery(validQuery).valid).toBe(true);
		});

		it('should accept complex Flux queries', () => {
			const complexQuery = `
        from(bucket: "test")
          |> range(start: -1h)
          |> filter(fn: (r) => r._measurement == "temp")
          |> aggregateWindow(every: 5m, fn: mean)
      `;
			expect(InfluxDbValidator.validateFluxQuery(complexQuery).valid).toBe(true);
		});

		it('should reject empty queries', () => {
			const result = InfluxDbValidator.validateFluxQuery('');
			expect(result.valid).toBe(false);
			expect(result.error).toMatch(/required|empty/i);
		});

		it('should reject queries with unbalanced parentheses', () => {
			const query = 'from(bucket: "test"';
			const result = InfluxDbValidator.validateFluxQuery(query);
			expect(result.valid).toBe(false);
			expect(result.error).toMatch(/parentheses|balanced/i);
		});

		it('should reject queries with unbalanced brackets', () => {
			const query = 'filter(fn: (r) => r.tags[[location])';
			const result = InfluxDbValidator.validateFluxQuery(query);
			expect(result.valid).toBe(false);
			expect(result.error).toMatch(/brackets|balanced/i);
		});

		it('should reject whitespace-only queries', () => {
			const result = InfluxDbValidator.validateFluxQuery('   \n  \t  ');
			expect(result.valid).toBe(false);
			expect(result.error).toMatch(/empty|required/i);
		});
	});

	describe('validateTimestamp', () => {
		it('should accept Date objects', () => {
			const now = new Date();
			expect(InfluxDbValidator.validateTimestamp(now).valid).toBe(true);
		});

		it('should accept Unix timestamps (numbers)', () => {
			expect(InfluxDbValidator.validateTimestamp(1640000000000).valid).toBe(true);
			expect(InfluxDbValidator.validateTimestamp(0).valid).toBe(true);
		});

		it('should accept ISO 8601 strings', () => {
			expect(InfluxDbValidator.validateTimestamp('2024-01-01T00:00:00Z').valid).toBe(true);
			expect(InfluxDbValidator.validateTimestamp('2024-01-01T00:00:00.000Z').valid).toBe(
				true
			);
		});

		it('should reject invalid Date objects', () => {
			const invalidDate = new Date('invalid');
			const result = InfluxDbValidator.validateTimestamp(invalidDate);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid');
		});

		it('should reject negative numbers', () => {
			const result = InfluxDbValidator.validateTimestamp(-1);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('positive');
		});

		it('should reject Infinity and NaN', () => {
			expect(InfluxDbValidator.validateTimestamp(Infinity).valid).toBe(false);
			expect(InfluxDbValidator.validateTimestamp(NaN).valid).toBe(false);
		});

		it('should reject invalid timestamp strings', () => {
			invalidData.invalidTimestamps.forEach((ts) => {
				const result = InfluxDbValidator.validateTimestamp(ts);
				expect(result.valid).toBe(false);
			});
		});
	});

	describe('validateFieldValue', () => {
		it('should accept numbers', () => {
			expect(InfluxDbValidator.validateFieldValue(42).valid).toBe(true);
			expect(InfluxDbValidator.validateFieldValue(3.14).valid).toBe(true);
			expect(InfluxDbValidator.validateFieldValue(0).valid).toBe(true);
			expect(InfluxDbValidator.validateFieldValue(-10).valid).toBe(true);
		});

		it('should accept strings', () => {
			expect(InfluxDbValidator.validateFieldValue('hello').valid).toBe(true);
			expect(InfluxDbValidator.validateFieldValue('').valid).toBe(true);
			expect(InfluxDbValidator.validateFieldValue('123').valid).toBe(true);
		});

		it('should accept booleans', () => {
			expect(InfluxDbValidator.validateFieldValue(true).valid).toBe(true);
			expect(InfluxDbValidator.validateFieldValue(false).valid).toBe(true);
		});

		it('should reject Infinity and NaN', () => {
			expect(InfluxDbValidator.validateFieldValue(Infinity).valid).toBe(false);
			expect(InfluxDbValidator.validateFieldValue(-Infinity).valid).toBe(false);
			expect(InfluxDbValidator.validateFieldValue(NaN).valid).toBe(false);
		});

		it('should reject null and undefined', () => {
			expect(
				InfluxDbValidator.validateFieldValue(null as unknown as string).valid
			).toBe(false);
			expect(
				InfluxDbValidator.validateFieldValue(undefined as unknown as string).valid
			).toBe(false);
		});

		it('should reject objects and arrays', () => {
			expect(
				InfluxDbValidator.validateFieldValue({} as unknown as string).valid
			).toBe(false);
			expect(
				InfluxDbValidator.validateFieldValue([] as unknown as string).valid
			).toBe(false);
		});
	});
});
