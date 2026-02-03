# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Support for InfluxDB v3 when available
- Custom aggregation functions in Simple Query
- Data export functionality
- Visualization helpers for common chart types

## [0.1.0] - 2024-02-02

### Added
- Initial release of n8n-nodes-influxdb
- InfluxDB v2.x API credential configuration with connection testing
- Write operations:
  - Write single data point
  - Write batch of data points
  - Write raw line protocol
- Query operations:
  - Execute custom Flux queries
  - Simple query builder for common use cases
- Delete operations:
  - Delete data by predicate expression
  - Delete all data in time range
- Bucket management:
  - List all buckets
  - Get bucket details
  - Create new buckets with retention policies
  - Update existing buckets
  - Delete buckets
- Organization management:
  - List all organizations
  - Get organization details
  - Create new organizations
  - Update existing organizations
  - Delete organizations
- Comprehensive test suite with >90% coverage
- Full TypeScript support with strict mode
- Detailed documentation and usage examples
- Agent development guide (AGENTS.md)

### Security
- Token-based authentication
- Secure credential storage through n8n
- Input validation to prevent injection attacks
- Timeout configuration to prevent resource exhaustion

---

## Version History

### Versioning Scheme

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

### Release Schedule

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Every 1-2 months with new features
- **Major releases**: When breaking changes are necessary

### Support Policy

- **Latest version**: Full support with bug fixes and new features
- **Previous minor version**: Critical bug fixes and security patches for 3 months
- **Older versions**: No active support (please upgrade)

### Migration Guides

When upgrading between major versions, refer to the migration guides in the [docs/migrations/](docs/migrations/) directory.

---

[Unreleased]: https://github.com/yourusername/n8n-nodes-influxdb/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/n8n-nodes-influxdb/releases/tag/v0.1.0
