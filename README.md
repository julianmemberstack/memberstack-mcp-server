# Memberstack MCP Server

Official Model Context Protocol (MCP) server providing Memberstack API documentation for Claude Code and other AI assistants.

## 🚀 Quick Install

### Claude Code CLI (Recommended)

Install directly using the Claude Code CLI:

```bash
claude mcp add memberstack -- npx -y memberstack-mcp-server
```

That's it! The server is now available in Claude Code.

### Alternative Installation Methods

#### NPX + Manual Configuration

```bash
npx -y @memberstack/mcp-server
```

Then add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "memberstack": {
      "command": "npx",
      "args": ["-y", "@memberstack/mcp-server"]
    }
  }
}
```

#### Local Installation

```bash
npm install -g memberstack-mcp-server
claude mcp add memberstack -- memberstack-mcp
```

## 📚 What's Included

This MCP server provides comprehensive Memberstack documentation:

- **DOM Package API** - Frontend authentication and member management
- **Admin Package API** - Server-side operations and webhooks
- **REST API** - HTTP endpoints for non-Node.js backends
- **Authentication Flows** - Complete auth implementation patterns
- **Integration Examples** - React, Vue, Next.js, SvelteKit, and more
- **Error Handling** - Production-ready error management
- **Quick Start Guide** - Get up and running in 10 minutes

## 🔗 Official Memberstack Resources

- **Official Documentation**: https://docs.memberstack.com/
- **Developer Portal**: https://developers.memberstack.com/
- **DOM Package**: https://developers.memberstack.com/dom-package
- **Admin Package**: https://developers.memberstack.com/admin-node-package
- **REST API**: https://developers.memberstack.com/admin-rest-api

## 🎯 Usage in Claude Code

Once installed, you can reference Memberstack documentation using:

```
@memberstack - Access all documentation
@memberstack:dom-api - DOM package reference
@memberstack:admin-api - Admin package reference
@memberstack:authentication - Auth flow examples
```

You can also use the built-in tools:
- `search_memberstack_docs` - Search for specific topics
- `list_memberstack_methods` - List all methods by package
- `get_documentation_info` - Get version and metadata information

## 🔧 Troubleshooting

### Installation Issues

**Claude Code CLI not found:**
```bash
# Update Claude Code to the latest version
claude --version
# Should be v0.5.0 or higher
```

**NPX installation fails:**
```bash
# Clear NPM cache and try again
npm cache clean --force
npx -y @memberstack/mcp-server
```

**Server not appearing in Claude Code:**
```bash
# Check if server is installed
claude mcp list

# Remove and reinstall if needed
claude mcp remove memberstack
claude mcp add memberstack -- npx -y memberstack-mcp-server
```

### Usage Issues

**"No documentation found" error:**
- Ensure the package was published with documentation files
- Try reinstalling: `npm uninstall -g @memberstack/mcp-server && npm install -g memberstack-mcp-server`

**Server connection timeout:**
- Check Node.js version (requires Node.js ≥18)
- Verify package permissions
- Try running manually: `npx memberstack-mcp-server`

### Getting Help

**Need assistance?**
- 📋 Check the [verification checklist](./VERIFICATION_CHECKLIST.md) for common issues
- 🐛 Report bugs on [GitHub Issues](https://github.com/julianmemberstack/memberstack-mcp-server/issues)
- 📚 Review [Memberstack's official docs](https://docs.memberstack.com/)
- 🔍 Run `npm run validate-docs` to verify documentation accuracy

## 🔄 Updating Documentation

### For Humans

1. Clone this repository
2. Update documentation files in the `docs/` directory
3. Run the update script:
   ```bash
   npm run update-docs
   ```
4. Commit and push changes
5. Release a new version:
   ```bash
   npm run release
   ```

### For AI Assistants

To update the documentation:

```bash
# 1. Update the source documentation files
# 2. Run the update script
npm run update-docs

# 3. Validate documentation accuracy
npm run validate-docs

# 4. The scripts will show you what to do next:
#    - Review changes: git diff
#    - Commit: git add docs && git commit -m "Update documentation"
#    - Release: npm run release
```

## 🛠️ Development

### Setup

```bash
# Clone the repository
git clone https://github.com/julianmemberstack/memberstack-mcp-server.git
cd memberstack-mcp-server

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Validate documentation
npm run validate-docs

# Test locally
npm run dev
```

### Project Structure

```
memberstack-mcp-server/
├── src/
│   └── index.ts                        # MCP server implementation
├── docs/                               # Memberstack documentation (auto-copied)
│   ├── dom-package/
│   ├── admin-package/
│   └── rest-api/
├── scripts/
│   ├── update-docs.js                  # Documentation update script
│   └── validate-documentation.js      # Validation and accuracy checking
├── INSTALLATION.md                     # Installation guide
├── VERIFICATION_CHECKLIST.md          # Manual verification checklist
├── ACCURACY_IMPROVEMENTS_SUMMARY.md   # Accuracy improvements report
├── validation-report.json             # Automated validation report
├── package.json
└── README.md
```

### Making Changes

1. **Update MCP Server Logic**: Edit `src/index.ts`
2. **Update Documentation**: Edit files in parent `docs/` directory, then run `npm run update-docs`
3. **Test Changes**: Run `npm run dev` to test locally
4. **Release**: Run `npm run release` to publish

## 🚚 Transferring to Official Memberstack GitHub

When ready to transfer this repository to the official Memberstack organization:

1. Go to Settings → General → Transfer ownership
2. Enter `memberstack` as the new owner
3. Update package.json URLs:
   ```json
   "homepage": "https://github.com/memberstack/mcp-server",
   "repository": {
     "url": "https://github.com/memberstack/mcp-server.git"
   }
   ```
4. Update git remote:
   ```bash
   git remote set-url origin https://github.com/memberstack/mcp-server.git
   ```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For AI assistants: When contributing, please:
1. Run `npm run update-docs` after documentation changes
2. Test your changes with `npm run dev`
3. Include clear commit messages
4. Update this README if adding new features