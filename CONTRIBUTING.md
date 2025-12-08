# Contributing to AgentGatePay SDKs

Thank you for your interest in contributing to AgentGatePay SDKs! This document provides guidelines for contributing to both the JavaScript/TypeScript and Python SDKs.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### JavaScript SDK

```bash
# Clone and setup
git clone https://github.com/AgentGatePay/agentgatepay-sdks.git
cd agentgatepay-sdks/javascript
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

### Python SDK

```bash
# Clone and setup
git clone https://github.com/AgentGatePay/agentgatepay-sdks.git
cd agentgatepay-sdks/python
pip install -e ".[dev]"

# Run tests
pytest

# Type checking
mypy agentgatepay_sdk/

# Linting
pylint agentgatepay_sdk/

# Format
black agentgatepay_sdk/
```

## Development Workflow

1. **Fork the repository** and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** with clear commit messages:
   ```bash
   git commit -m "feat: add new payment method support"
   ```

5. **Push to your fork** and submit a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(payments): add support for Optimism chain
fix(mandates): resolve token expiration bug
docs(readme): update installation instructions
```

## Coding Standards

### JavaScript/TypeScript

- Use TypeScript for all new code
- Follow existing code style (enforced by ESLint + Prettier)
- Add JSDoc comments for public APIs
- Write unit tests for new features
- Ensure `npm run build` succeeds
- Ensure `npm run lint` passes

### Python

- Follow PEP 8 style guide
- Use type hints for function signatures
- Add docstrings for all public methods
- Write unit tests with pytest
- Ensure `black` formatting passes
- Ensure `mypy` type checking passes
- Ensure `pylint` linting passes

## Testing

### JavaScript SDK

```bash
cd javascript
npm test
```

Tests should cover:
- All public API methods
- Error handling
- Edge cases

### Python SDK

```bash
cd python
pytest
pytest --cov=agentgatepay_sdk  # With coverage
```

Tests should cover:
- All public API methods
- Error handling
- Edge cases

## Documentation

- Update README.md if adding new features
- Add inline code comments for complex logic
- Update examples if API changes
- Keep documentation clear and concise

## Pull Request Process

1. **Update documentation** for any changed functionality
2. **Add tests** for new features
3. **Ensure all tests pass** locally
4. **Update CHANGELOG** (if applicable)
5. **Request review** from maintainers

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New code has tests
- [ ] Documentation updated
- [ ] Commit messages follow conventional format
- [ ] No breaking changes (or clearly documented)

## Release Process

Releases are automated via GitHub Actions:

### JavaScript SDK

```bash
# Update version in package.json
npm version patch|minor|major

# Create tag
git tag js-v1.1.1
git push origin js-v1.1.1

# GitHub Actions will publish to npm automatically
```

### Python SDK

```bash
# Update version in setup.py

# Create tag
git tag py-v1.1.1
git push origin py-v1.1.1

# GitHub Actions will publish to PyPI automatically
```

## Need Help?

- **GitHub Issues**: [AgentGatePay/agentgatepay-sdks](https://github.com/AgentGatePay/agentgatepay-sdks/issues)
- **Examples Repository**: [AgentGatePay/agentgatepay-examples](https://github.com/AgentGatePay/agentgatepay-examples)
- **Email**: support@agentgatepay.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AgentGatePay! 🚀
