# Budget Allocation App Scripts

This directory contains scripts to run the Budget Allocation app with both frontend and backend, using configuration-driven setup.

## 🚀 Quick Start

### Development (Default)
```bash
# From project root
bun run @z-examples:budget-allocation:dev-full

# Or directly
node scripts/app-examples/run-dev.js
```

### Production
```bash
# From project root
bun run @z-examples:budget-allocation:prod-full

# Or directly
node scripts/app-examples/run-prod.js
```

### Custom Environment
```bash
# Set environment and run
NODE_ENV=production node scripts/app-examples/budget-allocation.js
```

## ⚙️ Configuration

The script uses `config.json` to determine hosts, ports, and environment settings.

### Configuration Structure
```json
{
  "environments": {
    "development": {
      "frontend": {
        "host": "localhost",
        "port": 5173,
        "name": "Frontend (Vite)",
        "command": "bun run z-demos:budget-allocation:dev",
        "cwd": "apps-example/budget-allocation",
        "env": {
          "NODE_ENV": "development",
          "VITE_API_URL": "http://localhost:3000"
        }
      },
      "backend": {
        "host": "localhost", 
        "port": 3000,
        "name": "Backend (Fastify)",
        "command": "bun run start:dev",
        "cwd": "apps-example/budget-allocation-server",
        "env": {
          "NODE_ENV": "development",
          "PORT": "3000"
        }
      }
    }
  }
}
```

### Environment Variables

You can override the environment by setting `NODE_ENV`:
- `development` (default) - Uses Vite dev server and nodemon
- `production` - Uses Vite preview and production server

## 🎯 Available Scripts

| Script | Description | Environment |
|--------|-------------|--------------|
| `@z-examples:budget-allocation:dev-full` | Development with hot reload | development |
| `@z-examples:budget-allocation:prod-full` | Production build and serve | production |
| `@z-examples:budget-allocation:full` | Default (development) | development |

## 🔧 Customization

### Adding New Environments

1. Add a new environment to `config.json`:
```json
{
  "environments": {
    "staging": {
      "frontend": {
        "host": "0.0.0.0",
        "port": 4173,
        "name": "Frontend (Staging)",
        "command": "bun run z-demos:budget-allocation:preview",
        "cwd": "apps-example/budget-allocation",
        "env": {
          "NODE_ENV": "staging",
          "VITE_API_URL": "http://staging-api.example.com"
        }
      }
    }
  }
}
```

2. Create a runner script:
```javascript
// scripts/app-examples/run-staging.js
#!/usr/bin/env node
process.env.NODE_ENV = 'staging';
import('./budget-allocation.js');
```

3. Add to package.json:
```json
{
  "scripts": {
    "@z-examples:budget-allocation:staging-full": "node scripts/app-examples/run-staging.js"
  }
}
```

### Modifying Ports and Hosts

Edit `config.json` to change ports, hosts, or environment variables:

```json
{
  "environments": {
    "development": {
      "frontend": {
        "host": "0.0.0.0",  // Allow external access
        "port": 3001,       // Custom port
        "env": {
          "VITE_API_URL": "http://localhost:4000"  // Custom API URL
        }
      }
    }
  }
}
```

## 🛠️ Features

- ✅ **Environment-based Configuration**: Different settings for dev/prod
- ✅ **Customizable Ports & Hosts**: Easy to change via config
- ✅ **Environment Variables**: Pass custom env vars to processes
- ✅ **Hot Reload**: Both services support hot reloading
- ✅ **Graceful Shutdown**: Properly handles Ctrl+C
- ✅ **Error Handling**: Shows errors from both processes
- ✅ **Cross-Platform**: Works on Windows, macOS, and Linux

## 🐛 Troubleshooting

### Port Conflicts
- Check if ports are available: `lsof -i :5173` and `lsof -i :3000`
- Modify ports in `config.json`

### Permission Issues
- Make scripts executable: `chmod +x scripts/app-examples/*.js`

### Environment Not Found
- Ensure environment exists in `config.json`
- Check `NODE_ENV` value

### Dependencies
- Install dependencies: `bun install`
- Ensure both frontend and backend dependencies are installed