# Budget Allocation Server

A NestJS + TypeScript backend server for the budget allocation application.

## Features

- **In-memory storage**: All data is stored in memory and lost when the server shuts down
- **REST API**: Implements the same endpoints as the original fake API
- **CORS enabled**: Configured to work with the React frontend
- **TypeScript**: Fully typed with interfaces for all data structures
- **Fake delays**: Configurable response delays (1-3 seconds) to simulate real network conditions

## API Endpoints

- `GET /v1/channels` - Get all channels
- `GET /v1/channels/:key` - Get specific channel
- `POST /v1/channels/:key` - Create or update channel
- `PUT /v1/channels/:key` - Update channel
- `DELETE /v1/channels/:key` - Delete channel

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run start:dev

# Build for production
bun run build

# Start production server
bun run start:prod
```

## Default Data

The server initializes with two default channels:
- Free Reviews
- Paid Reviews

## Server Configuration

- **Port**: 3002
- **CORS**: Enabled for localhost:3000 and localhost:5173
- **Base URL**: http://localhost:3002

## Fake Delays

The server includes configurable fake delays to simulate real network conditions:

- **Default range**: 1-3 seconds per request
- **Per-endpoint configuration**: Different delay ranges for different operations
- **Environment control**: Set `FAKE_DELAYS=false` to disable delays
- **Random timing**: Each request gets a random delay within the configured range

### Delay Configuration

- GET /channels: 1-2.5 seconds
- GET /channels/:key: 1-2 seconds  
- POST /channels/:key: 1.2-2.8 seconds
- PUT /channels/:key: 1.1-2.6 seconds
- DELETE /channels/:key: 1-2.2 seconds
- POST /channels/list: 1.5-3 seconds
- POST /channels/reset: 1.2-2.5 seconds