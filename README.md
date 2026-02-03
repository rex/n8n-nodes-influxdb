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

## Comprehensive Usage Examples

### Write Operations

#### Example 1: Write Single Sensor Reading

**Workflow**: HTTP Request → Set → InfluxDB (Write Point)

**Set Node** (format incoming data):
```json
{
  "temperature": 23.5,
  "humidity": 45.2,
  "pressure": 1013.25,
  "location": "office",
  "sensor_id": "DHT22-001",
  "building": "HQ"
}
```

**InfluxDB Node Configuration**:
- **Resource**: Write
- **Operation**: Write Point
- **Bucket**: `sensors`
- **Measurement**: `environment`
- **Tags**:
  - Key: `location`, Value: `{{ $json.location }}`
  - Key: `sensor_id`, Value: `{{ $json.sensor_id }}`
  - Key: `building`, Value: `{{ $json.building }}`
- **Fields**:
  - Key: `temperature`, Value: `{{ $json.temperature }}`
  - Key: `humidity`, Value: `{{ $json.humidity }}`
  - Key: `pressure`, Value: `{{ $json.pressure }}`
- **Timestamp**: `{{ $json.timestamp }}` (or leave empty for current time)

**Result**: Single data point written to InfluxDB with proper tags and fields.

---

#### Example 2: Batch Write Multiple Metrics

**Workflow**: Schedule Trigger → Code → InfluxDB (Write Batch)

**Code Node** (generate multiple points):
```javascript
const points = [];
const measurements = ['cpu', 'memory', 'disk'];
const servers = ['web-1', 'web-2', 'db-1'];

for (const server of servers) {
  for (const metric of measurements) {
    points.push({
      measurement: metric,
      tags: {
        host: server,
        datacenter: 'us-west-1'
      },
      fields: {
        usage: Math.random() * 100,
        available: Math.random() * 1000
      }
    });
  }
}

return [{ json: { points } }];
```

**InfluxDB Node Configuration**:
- **Resource**: Write
- **Operation**: Write Batch
- **Bucket**: `metrics`
- **Points**: `{{ $json.points }}`
- **Batch Size**: `5000`

**Result**: 9 data points written efficiently in a single batch.

---

#### Example 3: Write Line Protocol from Legacy System

**Workflow**: HTTP Request → InfluxDB (Write Line Protocol)

**HTTP Request** returns:
```
cpu,host=server01,region=us-west value=64.5 1640000000000000000
cpu,host=server02,region=us-west value=72.1 1640000000000000000
memory,host=server01,region=us-west value=8589934592 1640000000000000000
```

**InfluxDB Node Configuration**:
- **Resource**: Write
- **Operation**: Write Line Protocol
- **Bucket**: `system_metrics`
- **Line Protocol**: `{{ $json.body }}`
- **Precision**: `ns` (nanoseconds)

**Result**: Legacy data format directly written to InfluxDB.

---

### Query Operations

#### Example 4: Basic Flux Query

**Workflow**: Manual Trigger → InfluxDB (Execute Flux Query) → Table

**InfluxDB Node Configuration**:
- **Resource**: Query
- **Operation**: Execute Flux Query
- **Query**:
```flux
from(bucket: "sensors")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "environment")
  |> filter(fn: (r) => r.location == "office")
  |> filter(fn: (r) => r._field == "temperature")
```
- **Timestamp Format**: ISO 8601
- **Limit**: 100

**Result**: Last hour of office temperature readings.

---

#### Example 5: Aggregated Query with Window

**Workflow**: Schedule Trigger → InfluxDB (Execute Flux Query) → Send Email

**InfluxDB Node Configuration**:
- **Resource**: Query
- **Operation**: Execute Flux Query
- **Query**:
```flux
from(bucket: "sensors")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "environment")
  |> filter(fn: (r) => r._field == "temperature")
  |> aggregateWindow(every: 1h, fn: mean)
  |> yield(name: "hourly_avg")
```

**Result**: Hourly average temperatures for the last 24 hours.

---

#### Example 6: Simple Query (No Flux Knowledge Needed)

**Workflow**: Webhook → InfluxDB (Simple Query) → HTTP Response

**InfluxDB Node Configuration**:
- **Resource**: Query
- **Operation**: Simple Query
- **Bucket**: `sensors`
- **Measurement**: `environment`
- **Start Time**: `-1h`
- **Stop Time**: `now()`
- **Field**: `temperature` (leave empty for all fields)
- **Timestamp Format**: Unix Milliseconds
- **Limit**: 50

**Result**: Auto-generated Flux query returns last hour of temperature data.

---

#### Example 7: Multi-Measurement Query with Join

**Workflow**: Manual Trigger → InfluxDB → Process

**InfluxDB Node Configuration**:
- **Resource**: Query
- **Operation**: Execute Flux Query
- **Query**:
```flux
temp = from(bucket: "sensors")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> mean()

humidity = from(bucket: "sensors")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "humidity")
  |> mean()

join(tables: {temp: temp, humidity: humidity}, on: ["_time"])
```

**Result**: Joined temperature and humidity data.

---

### Delete Operations

#### Example 8: Delete Old Test Data

**Workflow**: Schedule Trigger (Daily) → InfluxDB (Delete by Predicate)

**InfluxDB Node Configuration**:
- **Resource**: Delete
- **Operation**: Delete by Predicate
- **Bucket**: `test-data`
- **Start Time**: `2024-01-01T00:00:00Z`
- **Stop Time**: `2024-01-31T23:59:59Z`
- **Predicate**: `_measurement="test" AND environment="dev"`

**Result**: Deletes all test data from development environment in January 2024.

---

#### Example 9: Clean Up Specific Sensor Data

**Workflow**: Manual Trigger → InfluxDB → Slack Notification

**InfluxDB Node Configuration**:
- **Resource**: Delete
- **Operation**: Delete by Predicate
- **Bucket**: `sensors`
- **Start Time**: `-7d`
- **Stop Time**: `now()`
- **Predicate**: `sensor_id="faulty-sensor-123"`

**Result**: Removes all data from a faulty sensor over the last 7 days.

---

#### Example 10: Delete All Data in Range (Careful!)

**Workflow**: Manual Trigger → InfluxDB

**InfluxDB Node Configuration**:
- **Resource**: Delete
- **Operation**: Delete All in Range
- **Bucket**: `temp-data`
- **Start Time**: `2024-01-01T00:00:00Z`
- **Stop Time**: `2024-12-31T23:59:59Z`
- **Confirm Deletion**: ✅ (REQUIRED)

**Result**: Deletes ALL data from 2024 in temp-data bucket (use with extreme caution!).

---

### Bucket Management

#### Example 11: List All Buckets

**Workflow**: Manual Trigger → InfluxDB (List Buckets) → Table

**InfluxDB Node Configuration**:
- **Resource**: Bucket
- **Operation**: List

**Result**: Returns all buckets with names, retention periods, and metadata. Each bucket becomes a separate item.

---

#### Example 12: Get Bucket Details

**Workflow**: Manual Trigger → InfluxDB → Display

**InfluxDB Node Configuration**:
- **Resource**: Bucket
- **Operation**: Get
- **Bucket Name**: `sensors`

**Result**: Detailed information about the 'sensors' bucket including retention rules, timestamps, etc.

---

#### Example 13: Dynamically Create Project Buckets

**Workflow**: Webhook → Code → InfluxDB (Create Bucket)

**Code Node** (validate project name):
```javascript
const projectName = $json.project_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
return [{
  json: {
    bucketName: `project-${projectName}`,
    description: `Data for ${$json.project_name} (${$json.team})`
  }
}];
```

**InfluxDB Node Configuration**:
- **Resource**: Bucket
- **Operation**: Create
- **Bucket Name**: `{{ $json.bucketName }}`
- **Retention Period**: `90d`
- **Description**: `{{ $json.description }}`

**Result**: Creates a new bucket for each project with 90-day retention.

---

#### Example 14: Update Bucket Retention

**Workflow**: Manual Trigger → InfluxDB

**InfluxDB Node Configuration**:
- **Resource**: Bucket
- **Operation**: Update
- **Bucket Name**: `old-data`
- **Retention Period**: `7d` (changed from 30d)
- **Description**: `Short-term storage only`

**Result**: Updates retention policy to keep data for only 7 days.

---

#### Example 15: Clean Up Old Buckets

**Workflow**: Schedule Trigger → InfluxDB (List) → Filter → Loop → InfluxDB (Delete)

**Filter Node** (find old buckets):
```javascript
// Only keep buckets matching pattern and older than 6 months
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

return items.filter(item =>
  item.json.name.startsWith('temp-') &&
  new Date(item.json.createdAt) < sixMonthsAgo
);
```

**InfluxDB Node Configuration**:
- **Resource**: Bucket
- **Operation**: Delete
- **Bucket Name**: `{{ $json.name }}`
- **Confirm Deletion**: ✅

**Result**: Automatically deletes temporary buckets older than 6 months.

---

### Organization Management

#### Example 16: List Organizations

**Workflow**: Manual Trigger → InfluxDB → Table

**InfluxDB Node Configuration**:
- **Resource**: Organization
- **Operation**: List

**Result**: All organizations you have access to.

---

#### Example 17: Create Organization for New Client

**Workflow**: Webhook → InfluxDB (Create Org) → Create Bucket → Send Email

**InfluxDB Node Configuration**:
- **Resource**: Organization
- **Operation**: Create
- **Organization Name**: `client-{{ $json.client_id }}`
- **Description**: `Organization for {{ $json.client_name }}`

**Result**: New organization created, ready for client data.

---

### Advanced Workflows

#### Example 18: IoT Data Pipeline

**Complete Workflow**:
```
1. MQTT Trigger → Subscribe to sensor topics
2. Function → Parse and validate sensor data
3. Switch → Route by sensor type
   ├─ temperature → InfluxDB (Write Point to 'temperature' measurement)
   ├─ humidity → InfluxDB (Write Point to 'humidity' measurement)
   └─ pressure → InfluxDB (Write Point to 'pressure' measurement)
4. Merge → Combine all writes
5. IF → Check for anomalies
6. Slack → Alert if anomaly detected
```

---

#### Example 19: Automated Reporting

**Complete Workflow**:
```
1. Schedule Trigger → Daily at 8 AM
2. InfluxDB (Query) → Get yesterday's metrics
   Query: aggregateWindow(every: 1h, fn: mean)
3. Code → Format data for report
4. Google Sheets → Append to daily report
5. InfluxDB (Query) → Get weekly trend
6. Code → Generate summary
7. Email → Send weekly summary
```

---

#### Example 20: Data Migration

**Complete Workflow**:
```
1. Manual Trigger
2. InfluxDB (Query) → Read from old bucket
   Query: from(bucket: "old-data") |> range(start: -30d)
3. Function → Transform data format
4. InfluxDB (Write Batch) → Write to new bucket
5. InfluxDB (Query) → Verify data in new bucket
6. IF → Check counts match
7. InfluxDB (Delete) → Clean up old bucket (if verified)
```

---

#### Example 21: Multi-Region Aggregation

**Complete Workflow**:
```
1. Schedule Trigger → Every 15 minutes
2. InfluxDB (Query) → US West data
3. InfluxDB (Query) → US East data
4. InfluxDB (Query) → EU data
5. Merge → Combine all regions
6. Aggregate → Calculate global metrics
7. InfluxDB (Write Batch) → Write to global bucket
```

---

#### Example 22: Alerting with Thresholds

**Complete Workflow**:
```
1. Schedule Trigger → Every 5 minutes
2. InfluxDB (Simple Query) → Get latest values
   Measurement: temperature, Start: -5m
3. IF → temperature > 30
4. ✓ InfluxDB (Write Point) → Log alert event
5. ✓ PagerDuty → Create incident
6. ✓ Slack → Send notification
7. ✗ No action needed
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

## Future Enhancements

This node is production-ready, but here are planned enhancements for future versions:

### Performance Improvements
- **Query Result Caching**: Cache frequently-run queries to reduce load on InfluxDB
- **Streaming Large Results**: Stream very large query results to avoid memory issues
- **Connection Pooling Optimization**: Advanced connection pool management for high-throughput scenarios
- **Compression Support**: Enable gzip compression for write/query operations
- **Parallel Batch Processing**: Split large batches across multiple parallel writes

### User Experience
- **Dynamic Dropdowns**: Auto-populate bucket and measurement lists from InfluxDB
- **Query Builder UI**: Visual query builder for users unfamiliar with Flux
- **Query Validation**: Real-time Flux query syntax validation
- **Result Preview**: Preview query results before executing workflow
- **Field Type Inference**: Automatically detect and convert field types
- **Template Library**: Pre-built Flux query templates for common use cases

### Advanced Query Features
- **Parameterized Queries**: Named parameters in Flux queries for easier reuse
- **Query Result Transformation**: Built-in transformers (pivot, group, filter)
- **Multi-Query Execution**: Execute multiple queries in parallel
- **Query Performance Metrics**: Track query execution time and data scanned
- **Incremental Queries**: Only query new data since last execution

### Data Management
- **Data Export**: Export query results to CSV, JSON, or Parquet
- **Backup/Restore**: Backup buckets and restore from backups
- **Data Retention Policies**: Advanced retention rule management
- **Down-sampling**: Automatically downsample old data for storage efficiency
- **Continuous Queries**: Set up continuous queries (materialized views)

### Monitoring & Observability
- **Operation Metrics**: Track write/query/delete operation statistics
- **Error Analytics**: Detailed error tracking and analysis
- **Rate Limiting**: Built-in rate limiting to protect InfluxDB
- **Health Checks**: Periodic InfluxDB health monitoring
- **Usage Dashboard**: Built-in dashboard for node usage statistics

### Integration Features
- **InfluxDB Cloud Integration**: Enhanced support for InfluxDB Cloud features
- **Annotation Support**: Write/read annotations for graphing tools
- **Task Management**: Manage InfluxDB tasks from n8n
- **Alert Rule Management**: Create and manage InfluxDB alert rules
- **Notification Endpoints**: Configure InfluxDB notification endpoints

### Security & Compliance
- **Credential Rotation**: Automated API token rotation
- **Audit Logging**: Detailed audit logs for all operations
- **Data Encryption**: Encryption for data in transit and at rest
- **Access Control**: Fine-grained permission management
- **Compliance Reporting**: Generate compliance reports for data operations

### Developer Experience
- **Debug Mode**: Enhanced debugging with query plans and execution details
- **Dry Run Mode**: Preview operations without actually executing
- **Schema Validation**: Validate data against expected schemas
- **Migration Helpers**: Tools to migrate from InfluxDB 1.x
- **Webhook Support**: Receive InfluxDB webhooks for alerts

### Advanced Write Features
- **Write Strategies**: Configurable write strategies (batch, stream, buffered)
- **Conflict Resolution**: Handle write conflicts and duplicates
- **Schema Evolution**: Automatically handle schema changes
- **Data Validation**: Validate data before writing
- **Transform on Write**: Apply transformations during write operations

### Testing & Quality
- **Mock Mode**: Mock InfluxDB responses for workflow testing
- **Load Testing**: Built-in load testing for InfluxDB operations
- **Data Generation**: Generate test data for development
- **Regression Testing**: Automated regression test suite

### Community Features
- **Workflow Templates**: Share common InfluxDB workflows
- **Custom Functions**: User-defined Flux functions library
- **Plugin System**: Extensible plugin architecture
- **Community Queries**: Share and discover Flux queries

### InfluxDB 3.0 Support
- **Flight SQL**: Support for Apache Arrow Flight SQL protocol
- **Object Storage**: Direct integration with S3/GCS/Azure Blob
- **SQL Query Support**: Execute SQL queries alongside Flux
- **Catalog Management**: Manage InfluxDB 3.0 catalogs

Want a feature? [Open an issue](https://github.com/yourusername/n8n-nodes-influxdb/issues) or contribute!

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
