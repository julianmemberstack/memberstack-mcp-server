# Contributing to Memberstack MCP Server

Thank you for your interest in contributing! This guide is designed for both human developers and AI assistants.

## 🤖 For AI Assistants

### Before Contributing

1. **Check Existing Issues**: Search for similar issues/PRs before creating new ones
2. **Test Your Changes**: Always run `npm run dev` to test locally
3. **Follow Conventions**: Match existing code style and documentation format

### Making Code Changes

```bash
# 1. Make your changes to src/index.ts
# 2. Build the project
npm run build

# 3. Test your changes
npm run dev

# 4. Commit with clear message
git add .
git commit -m "feat: add support for [feature]"
```

### Updating Documentation

```bash
# 1. Edit documentation in ../docs/
# 2. Update the MCP server docs
npm run update-docs

# 3. Verify the updates
git diff docs/

# 4. Commit documentation changes
git add docs
git commit -m "docs: update [section] documentation"
```

### Commit Message Format

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

### Pull Request Checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] Tests pass (when available)
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventions
- [ ] PR description explains the changes

## 👤 For Human Contributors

### Getting Started

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/memberstack-mcp-server.git
   cd memberstack-mcp-server
   npm install
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Edit code in `src/`
   - Update docs in `docs/`
   - Add tests if applicable

4. **Test Thoroughly**
   ```bash
   npm run build
   npm run dev
   ```

5. **Submit PR**
   - Push to your fork
   - Create PR with clear description
   - Link related issues

### Development Guidelines

#### Code Style
- Use TypeScript strict mode
- Follow existing patterns
- Comment complex logic
- Use meaningful variable names

#### Documentation Style
- Clear, concise explanations
- Include code examples
- Update relevant sections
- Maintain consistent formatting

#### Testing
- Test all new features
- Verify error handling
- Check edge cases
- Test with Claude Code

### Areas for Contribution

1. **New Features**
   - Additional search capabilities
   - More tool functions
   - Enhanced documentation parsing

2. **Improvements**
   - Performance optimizations
   - Better error messages
   - Code refactoring

3. **Documentation**
   - Fix typos/errors
   - Add examples
   - Improve clarity
   - Translate to other languages

4. **Testing**
   - Add unit tests
   - Integration tests
   - Example usage scripts

## 🔄 Release Process

Only maintainers can release new versions:

1. **Update Version**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Push Changes**
   ```bash
   git push origin main --tags
   ```

3. **Publish to npm**
   ```bash
   npm publish
   ```

## 📋 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what's best for the community

## 🙋 Getting Help

- Open an issue for bugs/features
- Join discussions in issues/PRs
- Ask questions - we're here to help!

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.