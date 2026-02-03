# Quick Start Guide

## Installation

### In n8n (Recommended)

1. Go to **Settings > Community Nodes** in your n8n instance
2. Click **Install**
3. Enter `n8n-nodes-influxdb`
4. Click **Install**
5. Restart n8n

### Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-influxdb
```

Then restart your n8n instance.

## Initial Setup

### 1. Create InfluxDB Credentials

1. In n8n, go to **Credentials**
2. Click **Add Credential**
3. Search for "InfluxDB API"
4. Fill in the required fields:
   - **URL**: Your InfluxDB server URL (e.g., `http://localhost:8086`)
   - **API Token**: Your InfluxDB API token
   - **Organization**: Your organization name or ID
   - **Default Bucket** (optional): Default bucket for operations
   - **Timeout** (optional): Request timeout in milliseconds (default: 30000)

5. Click **Test** to verify the connection
6. Click **Save**

### 2. Add InfluxDB Node to Workflow

1. Create or open a workflow
2. Click the **+** button to add a node
3. Search for "InfluxDB"
4. Select the InfluxDB node
5. Select your credentials
6. Choose a **Resource** (Write, Query, Delete, Bucket, Organization)
7. Choose an **Operation**
8. Fill in the required parameters

## Common Use Cases

### Example 1: Write Sensor Data

**Scenario**: Store temperature sensor readings in InfluxDB

**Workflow**:
```
HTTP Request → InfluxDB (Write Point)
```

**InfluxDB Configuration**:
- Resource: **Write**
- Operation: **Write Point**
- Bucket: `sensors`
- Measurement: `temperature`
- Tags:
  - `location`: `{{ $json.location }}`
  - `sensor_id`: `{{ $json.sensor_id }}`
- Fields:
  - `value`: `{{ $json.temperature }}`
  - `humidity`: `{{ $json.humidity }}`

### Example 2: Query Recent Data

**Scenario**: Get the last hour of temperature data

**Workflow**:
```
Schedule Trigger → InfluxDB (Simple Query) → Process Data
```

**InfluxDB Configuration**:
- Resource: **Query**
- Operation: **Simple Query**
- Bucket: `sensors`
- Measurement: `temperature`
- Start Time: `-1h`
- Stop Time: `now()`
- Timestamp Format: **ISO 8601**

### Example 3: Custom Flux Query

**Scenario**: Calculate average temperature per room

**Workflow**:
```
Manual Trigger → InfluxDB (Execute Flux Query) → Display Results
```

**InfluxDB Configuration**:
- Resource: **Query**
- Operation: **Execute Flux Query**
- Query:
```flux
from(bucket: "sensors")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> group(by: ["location"])
  |> mean()
```

### Example 4: Delete Old Data

**Scenario**: Clean up test data older than 30 days

**Workflow**:
```
Schedule Trigger (Daily) → InfluxDB (Delete by Predicate)
```

**InfluxDB Configuration**:
- Resource: **Delete**
- Operation: **Delete by Predicate**
- Bucket: `test-data`
- Start Time: `2024-01-01T00:00:00Z`
- Stop Time: `-30d`
- Predicate: `_measurement="test"`

### Example 5: Create Buckets Dynamically

**Scenario**: Automatically create a bucket for each new project

**Workflow**:
```
Webhook → InfluxDB (Create Bucket)
```

**InfluxDB Configuration**:
- Resource: **Bucket**
- Operation: **Create**
- Bucket Name: `project_{{ $json.project_id }}`
- Retention Period: `90d`
- Description: `Data for {{ $json.project_name }}`

## Tips

### Writing Data

- **Use batch writes** for high-throughput scenarios (faster and more efficient)
- **Include appropriate tags** for efficient querying (tags are indexed)
- **Use fields for metrics** that you want to aggregate
- **Timestamp precision**: Default is nanoseconds

### Querying Data

- **Limit time ranges** to avoid scanning unnecessary data
- **Use appropriate filters** early in the Flux pipeline
- **Paginate large results** using the limit parameter
- **Test queries** in InfluxDB UI before using in n8n

### Performance

- **Connection pooling** is handled automatically
- **Batch operations** when possible
- **Adjust timeout** for long-running queries
- **Monitor InfluxDB metrics** to optimize performance

### Security

- **Use tokens** with minimal required permissions
- **Rotate tokens** regularly
- **Never commit** tokens to version control
- **Use n8n credentials** for token storage

## Troubleshooting

### "Invalid credentials" error
- Verify URL is correct (include `http://` or `https://`)
- Check token hasn't expired
- Ensure token has permissions for the operation
- Verify organization name matches exactly (case-sensitive)

### "Bucket not found" error
- Check bucket name spelling
- Verify bucket exists in the organization
- Ensure token has access to the bucket

### Write operation fails silently
- Check InfluxDB logs for detailed error messages
- Verify measurement names don't contain spaces
- Ensure field types are consistent

### Query returns empty results
- Verify time range includes data points
- Check filter predicates are correct
- Test query in InfluxDB UI

## Next Steps

- Read the [full README](README.md) for detailed documentation
- Check [example workflows](docs/examples/) for more use cases
- Review the [AGENTS.md](AGENTS.md) for development information
- Visit [InfluxDB documentation](https://docs.influxdata.com/influxdb/v2/) for Flux query help

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/n8n-nodes-influxdb/issues)
- **n8n Community**: [community.n8n.io](https://community.n8n.io/)
- **InfluxDB Docs**: [docs.influxdata.com](https://docs.influxdata.com/influxdb/v2/)
