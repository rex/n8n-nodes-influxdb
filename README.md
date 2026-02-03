# n8n-nodes-influxdb

This is an n8n community node for **InfluxDB v2.x**. It enables you to interact with InfluxDB time-series databases directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[InfluxDB](https://www.influxdata.com/) is an open-source time series database optimized for fast, high-availability storage and retrieval of time series data.

## Features

- ✅ **Write Data**: Write single points, batch points, or raw line protocol
- 🔍 **Query Data**: Execute Flux queries or use simplified query builder
- 🗑️ **Delete Data**: Delete data by predicate or time range
- 📦 **Bucket Management**: Create, list, update, and delete buckets
- 🏢 **Organization Management**: Manage InfluxDB organizations
- 🔒 **Secure**: Token-based authentication with credential testing
- ⚡ **Fast**: Optimized for performance with connection pooling
- 🧪 **Tested**: Comprehensive test coverage (>90%)

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-influxdb` in the **Enter npm package name** field
4. Click **Install**

### Manual Installation

To install manually in your n8n installation:

```bash
cd ~/.n8n/custom
npm install n8n-nodes-influxdb
```

Then restart your n8n instance.

## Prerequisites

- n8n version 1.0.0 or higher
- InfluxDB v2.x instance (cloud or self-hosted)
- InfluxDB API token with appropriate permissions

## Credentials

To use this node, you need to configure InfluxDB API credentials:

1. **URL**: Your InfluxDB server URL (e.g., `http://localhost:8086` or `https://us-west-2-1.aws.cloud2.influxdata.com`)
2. **Token**: InfluxDB API token (generate in InfluxDB UI under Settings → Tokens)
3. **Organization**: Your organization name or ID
4. **Default Bucket** (optional): Default bucket to use for operations
5. **Timeout** (optional): Request timeout in milliseconds (default: 30000)

### Creating an InfluxDB Token

1. Log into your InfluxDB instance
2. Go to **Settings → Tokens**
3. Click **Generate Token → Read/Write Token**
4. Select the buckets you want to grant access to
5. Copy the token (you won't be able to see it again!)

## Operations

### Write Operations

#### Write Point
Write a single data point to InfluxDB.

**Parameters:**
- **Measurement**: Name of the measurement
- **Tags**: Key-value pairs for tags (dimensions)
- **Fields**: Key-value pairs for fields (metrics)
- **Timestamp** (optional): Point timestamp (default: current time)

**Example:**
```json
{
  "measurement": "temperature",
  "tags": {
    "location": "living_room",
    "sensor": "DHT22"
  },
  "fields": {
    "value": 23.5,
    "humidity": 45
  }
}
```

#### Write Batch
Write multiple data points in a single request.

**Parameters:**
- **Points**: Array of point objects
- **Batch Size** (optional): Maximum points per batch (default: 5000)

#### Write Line Protocol
Write data using raw InfluxDB line protocol format.

**Parameters:**
- **Line Protocol**: Raw line protocol string

**Example:**
```
temperature,location=living_room,sensor=DHT22 value=23.5,humidity=45 1640000000000000000
```

### Query Operations

#### Execute Flux Query
Run a custom Flux query against InfluxDB.

**Parameters:**
- **Flux Query**: Flux query language script
- **Parameters** (optional): Query parameters for variable substitution

**Example:**
```flux
from(bucket: "my-bucket")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> filter(fn: (r) => r.location == "living_room")
  |> mean()
```

#### Simple Query
Build a query using a simplified interface (auto-generates Flux).

**Parameters:**
- **Bucket**: Bucket name
- **Measurement**: Measurement name
- **Time Range**: Start and stop times
- **Filters** (optional): Additional filter conditions

### Delete Operations

#### Delete by Predicate
Delete data matching a predicate expression.

**Parameters:**
- **Bucket**: Bucket name
- **Start Time**: Beginning of time range
- **Stop Time**: End of time range
- **Predicate**: Delete predicate (e.g., `_measurement="temperature" AND location="room1"`)

#### Delete All in Range
Delete all data in a time range (use with caution!).

**Parameters:**
- **Bucket**: Bucket name
- **Start Time**: Beginning of time range
- **Stop Time**: End of time range
- **Confirm**: Safety confirmation checkbox

### Bucket Operations

#### List Buckets
Get all buckets in the organization.

#### Get Bucket
Retrieve details about a specific bucket.

**Parameters:**
- **Bucket**: Bucket name or ID

#### Create Bucket
Create a new bucket.

**Parameters:**
- **Name**: Bucket name
- **Retention Period**: How long to keep data (e.g., `30d`, `1y`, `infinite`)
- **Description** (optional): Bucket description

#### Update Bucket
Modify an existing bucket.

**Parameters:**
- **Bucket ID**: ID of bucket to update
- **Retention Period**: New retention period
- **Description**: New description

#### Delete Bucket
Delete a bucket and all its data.

**Parameters:**
- **Bucket**: Bucket name or ID
- **Confirm**: Safety confirmation checkbox

### Organization Operations

#### List Organizations
Get all organizations accessible with your credentials.

#### Get Organization
Retrieve details about a specific organization.

**Parameters:**
- **Organization**: Organization name or ID

#### Create Organization
Create a new organization.

**Parameters:**
- **Name**: Organization name
- **Description** (optional): Organization description

#### Update Organization
Modify an existing organization.

**Parameters:**
- **Organization ID**: ID of organization to update
- **Name**: New organization name
- **Description**: New description

#### Delete Organization
Delete an organization.

**Parameters:**
- **Organization ID**: ID of organization to delete
- **Confirm**: Safety confirmation checkbox

## Usage Examples

### Example 1: Write Sensor Data

Write temperature sensor readings to InfluxDB:

```
1. HTTP Request node → Fetch sensor data from IoT device
2. InfluxDB node:
   - Resource: Write
   - Operation: Write Point
   - Measurement: temperature
   - Tags: {{ $json.location }}
   - Fields: { value: {{ $json.temperature }} }
```

### Example 2: Query and Alert

Query recent data and send alerts:

```
1. Cron node → Trigger every 5 minutes
2. InfluxDB node:
   - Resource: Query
   - Operation: Execute Flux Query
   - Query: |
     from(bucket: "sensors")
       |> range(start: -5m)
       |> filter(fn: (r) => r._measurement == "temperature")
       |> mean()
3. IF node → Check if temperature > 30
4. Slack node → Send alert if true
```

### Example 3: Data Cleanup

Delete old test data:

```
1. Schedule Trigger node → Daily at 2 AM
2. InfluxDB node:
   - Resource: Delete
   - Operation: Delete by Predicate
   - Bucket: test-data
   - Start: -30d
   - Stop: now()
   - Predicate: _measurement="test"
```

### Example 4: Bucket Provisioning

Automatically create buckets for new projects:

```
1. Webhook node → Receive new project data
2. InfluxDB node:
   - Resource: Bucket
   - Operation: Create Bucket
   - Name: project_{{ $json.project_id }}
   - Retention: 90d
   - Description: Data for {{ $json.project_name }}
```

## Tips and Best Practices

### Writing Data

- **Use batch writes** for high-throughput scenarios (faster and more efficient)
- **Include appropriate tags** for efficient querying (indexed)
- **Use fields for metrics** that you want to aggregate
- **Timestamp precision**: Default is nanoseconds, adjust if needed
- **Validate data** before writing to avoid schema conflicts

### Querying Data

- **Limit time ranges** to avoid scanning unnecessary data
- **Use appropriate filters** early in the Flux pipeline
- **Paginate large results** using `limit()` and `offset()`
- **Cache common queries** to reduce load on InfluxDB
- **Test queries** in InfluxDB UI before using in n8n

### Performance

- **Connection pooling** is handled automatically by the client
- **Batch operations** when possible (especially writes)
- **Adjust timeout** for long-running queries
- **Monitor InfluxDB metrics** to optimize performance

### Security

- **Use tokens** with minimal required permissions
- **Rotate tokens** regularly
- **Never commit** tokens to version control
- **Use environment variables** or n8n credentials for tokens

## Troubleshooting

### Common Issues

#### "Invalid credentials" error
- Verify URL is correct (include protocol: `http://` or `https://`)
- Check token hasn't expired
- Ensure token has permissions for the operation
- Verify organization name matches exactly (case-sensitive)

#### "Bucket not found" error
- Check bucket name spelling
- Verify bucket exists in the organization
- Ensure token has access to the bucket

#### Write operation fails silently
- Check InfluxDB logs for detailed error messages
- Verify measurement names don't contain spaces or special characters
- Ensure field types are consistent (can't change int to string)

#### Query returns empty results
- Verify time range includes data points
- Check filter predicates are correct
- Test query in InfluxDB UI to validate syntax

#### Timeout errors
- Increase timeout in credentials configuration
- Optimize query to reduce execution time
- Check InfluxDB server performance

### Getting Help

- **Documentation**: See `docs/examples/` for detailed usage examples
- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/n8n-nodes-influxdb/issues)
- **n8n Community**: [Ask questions on the forum](https://community.n8n.io/)
- **InfluxDB Docs**: [Official InfluxDB documentation](https://docs.influxdata.com/influxdb/v2/)

## Development

See [AGENTS.md](AGENTS.md) for comprehensive development guide including:
- Setting up development environment
- Coding standards and best practices
- Testing requirements
- How to add new operations
- Troubleshooting development issues

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/n8n-nodes-influxdb.git
cd n8n-nodes-influxdb

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Compatibility

- **n8n version**: 1.0.0 or higher
- **InfluxDB version**: 2.0 or higher (not compatible with InfluxDB 1.x)
- **Node.js version**: 20.x or higher

## License

[MIT](LICENSE)

## Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## Acknowledgments

- Built with [n8n](https://n8n.io/)
- Uses [InfluxDB JavaScript Client](https://github.com/influxdata/influxdb-client-js)
- Inspired by the n8n community

## Support

If you find this node helpful, please:
- ⭐ Star the repository on GitHub
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📖 Contribute to documentation
- 🔀 Submit pull requests

---

Made with ❤️ for the n8n community
