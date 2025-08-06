# 📚 Documentation Update Guide

This guide explains how to update the Memberstack documentation in this MCP server.

## 🤖 For AI Assistants

### Quick Update Process

```bash
# 1. Navigate to the MCP server directory
cd memberstack-mcp-server

# 2. Run the update script
npm run update-docs

# 3. Follow the script's output instructions
# The script will tell you exactly what commands to run next
```

### Detailed Steps

1. **Locate Documentation Files**
   - Source docs are in the parent directory: `../docs/`
   - MCP server docs are in: `./docs/`
   - The update script copies from source to MCP server

2. **Make Documentation Changes**
   - Edit files in the parent `../docs/` directory
   - Maintain the existing structure and formatting
   - Use clear markdown headers and code examples

3. **Update the MCP Server**
   ```bash
   npm run update-docs
   ```

4. **Verify Changes**
   ```bash
   git status
   git diff docs/
   ```

5. **Commit and Release**
   ```bash
   git add docs
   git commit -m "Update Memberstack documentation"
   npm run release
   ```

### Documentation Structure

```
docs/
├── dom-package/
│   ├── dom-api-reference.md      # DOM API methods
│   ├── dom-decision-trees.md     # Visual guides
│   └── dom-integration-patterns.md # Framework examples
├── admin-package/
│   └── admin-api-reference.md    # Server-side API
├── rest-api/
│   └── rest-api-reference.md     # HTTP endpoints
└── guides/
    ├── quick-start.md            # Getting started
    ├── authentication-flows.md   # Auth patterns
    └── error-handling-guide.md   # Error management
```

### Best Practices for AI Updates

1. **Preserve Formatting**: Keep the existing markdown structure
2. **Add Examples**: Include code examples for new features
3. **Update Tables**: Keep quick reference tables current
4. **Test Code**: Ensure code examples are valid
5. **Clear Commits**: Use descriptive commit messages

## 👤 For Humans

### Manual Update Process

1. **Clone the Repository**
   ```bash
   git clone https://github.com/julianmemberstack/memberstack-mcp-server.git
   cd memberstack-mcp-server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Update Documentation**
   - Edit markdown files in the parent `docs/` directory
   - Run `npm run update-docs` to copy changes

4. **Test Locally**
   ```bash
   npm run dev
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "Update documentation for [feature/fix]"
   git push
   ```

6. **Release New Version**
   ```bash
   npm run release
   ```
   This will:
   - Increment the version number
   - Create a git tag
   - Publish to npm

### Adding New Documentation

1. **Create New File**: Add `.md` file in appropriate directory
2. **Update Categories**: If needed, update `DOC_CATEGORIES` in `src/index.ts`
3. **Run Update Script**: `npm run update-docs`
4. **Test Search**: Ensure new docs are searchable

### Version Management

- **Patch Release** (1.0.x): Documentation updates, typo fixes
- **Minor Release** (1.x.0): New documentation sections, features
- **Major Release** (x.0.0): Breaking changes to MCP interface

## 🔍 Troubleshooting

### Common Issues

1. **Update script fails**
   - Ensure you're in the correct directory
   - Check that source docs exist in `../docs/`

2. **npm publish fails**
   - Login to npm: `npm login`
   - Check npm permissions

3. **Documentation not appearing**
   - Verify file is `.md` format
   - Check file path in `docs/` directory
   - Rebuild: `npm run build`

### Getting Help

- Open an issue on GitHub
- Check existing documentation structure
- Run `npm run dev` to test locally