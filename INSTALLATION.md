# Installation Guide - Memberstack MCP Server

## Quick Start

The fastest way to get started is with the Claude Code CLI:

```bash
claude mcp add memberstack -- npx -y memberstack-mcp-server
```

That's it! The server is now available in Claude Code.

## Alternative Installation Methods

### Method 1: NPX (Recommended for NPM users)

```bash
npx -y memberstack-mcp-server
```

Then add to your Claude Code configuration manually:

```json
{
  "mcpServers": {
    "memberstack": {
      "command": "npx",
      "args": ["-y", "memberstack-mcp-server"]
    }
  }
}
```

### Method 2: Global Installation

```bash
npm install -g memberstack-mcp-server
claude mcp add memberstack -- memberstack-mcp
```

### Method 3: Manual Configuration

1. Install the package:
   ```bash
   npm install -g memberstack-mcp-server
   ```

2. Edit your Claude Code configuration file:
   ```json
   {
     "mcpServers": {
       "memberstack": {
         "command": "memberstack-mcp"
       }
     }
   }
   ```

3. Restart Claude Code

## Verification

After installation, verify the server is working:

1. Check that it appears in Claude Code:
   ```bash
   claude mcp list
   ```

2. Test the server directly:
   ```bash
   npx memberstack-mcp-server
   ```

3. In Claude Code, try:
   ```
   @memberstack
   ```

## System Requirements

- **Node.js**: Version 18 or higher
- **Claude Code**: Latest version (for CLI installation)
- **NPM**: Latest version recommended

## Package Information

- **Package Name**: `memberstack-mcp-server`
- **Current Version**: 1.0.0
- **License**: MIT
- **Documentation**: This package includes offline documentation

## Next Steps

Once installed, you can:

- Use `@memberstack` to access documentation
- Search with `search_memberstack_docs`
- List methods with `list_memberstack_methods`
- Get version info with `get_documentation_info`

## Need Help?

See the [troubleshooting section](./README.md#troubleshooting) in the main README.