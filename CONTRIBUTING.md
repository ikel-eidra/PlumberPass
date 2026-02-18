# Contributing to PlumberPass

First off, thank you for considering contributing to PlumberPass! 🎉

This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guides](#style-guides)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- Git

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/plumberpass.git
   cd plumberpass
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/plumberpass.git
   ```

4. **Run setup**:
   ```bash
   make setup
   # Or manually:
   # make backend-setup
   # make frontend-setup
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

When creating a bug report, include:

- **Use a clear descriptive title**
- **Describe the exact steps to reproduce**
- **Describe the behavior you observed**
- **Describe the expected behavior**
- **Include screenshots if applicable**
- **Include your environment details** (OS, browser, versions)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Include:

- **Use a clear descriptive title**
- **Provide a step-by-step description of the enhancement**
- **Provide specific examples**
- **Explain why this enhancement would be useful**

### Contributing Questions

We welcome contributions of new questions to the question bank!

Please ensure:
- Questions are accurate and verified
- Include proper source references
- Follow the JSON schema
- Are appropriate for the difficulty level

### Pull Requests

1. Follow the [development workflow](#development-workflow)
2. Ensure all tests pass
3. Update documentation as needed
4. Follow the [style guides](#style-guides)
5. Follow the [commit message conventions](#commit-messages)

---

## Development Workflow

### 1. Create a Branch

```bash
# Get latest changes
git checkout main
git pull upstream main

# Create your branch
git checkout -b type/description
```

Branch naming conventions:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes

### 2. Make Your Changes

- Write clear, commented code
- Follow the style guides
- Add/update tests as needed
- Update documentation

### 3. Test Your Changes

```bash
# Run all tests
make test

# Run specific test suites
make test-backend
make test-frontend

# Check code quality
make lint
make format
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "type(scope): description"
```

See [Commit Messages](#commit-messages) for conventions.

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

---

## Style Guides

### Python (Backend)

We use:
- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking

```bash
# Auto-format
make format

# Check
make lint
```

Guidelines:
- Follow PEP 8
- Use type hints
- Maximum line length: 88 characters (Black default)
- Docstrings in Google style

Example:
```python
def calculate_interval(ease_factor: float, interval: int) -> int:
    """Calculate the next review interval.

    Args:
        ease_factor: The card's ease factor (1.3 - 3.0)
        interval: Current interval in days

    Returns:
        The new interval in days
    """
    return int(interval * ease_factor)
```

### JavaScript (Frontend)

We use:
- **ESLint** for linting
- **Prettier** for formatting

Guidelines:
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use meaningful variable names
- Comment complex algorithms
- Maximum line length: 100 characters

Example:
```javascript
/**
 * Calculate the SRS interval based on performance rating
 * @param {number} easeFactor - Card's ease factor
 * @param {number} currentInterval - Current interval in ms
 * @param {number} rating - Answer quality (1-4)
 * @returns {number} New interval in ms
 */
function calculateInterval(easeFactor, currentInterval, rating) {
    // Implementation
}
```

### CSS

Guidelines:
- Use CSS custom properties (variables)
- BEM naming convention for classes
- Mobile-first responsive design
- AMOLED-optimized colors

Example:
```css
.quiz-card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
}

.quiz-card__title {
    font-size: var(--text-lg);
    color: var(--text-primary);
}
```

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Scopes

- **backend**: FastAPI application
- **frontend**: PWA/frontend code
- **srs**: Spaced repetition engine
- **audio**: Audio engine
- **quiz**: Quiz engine
- **ui**: User interface
- **docs**: Documentation
- **api**: API endpoints

### Examples

```
feat(srs): implement leech detection

Add automatic detection of cards that are difficult to learn.
Cards with 8+ consecutive failures are marked as leeches.

Closes #123
```

```
fix(audio): resolve wake lock not releasing on iOS

The wake lock was not being released when switching to another app.
Added cleanup in the page visibility change handler.

Fixes #456
```

```
docs(readme): update installation instructions

Add Docker setup instructions and troubleshooting section.
```

---

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure CI passes** (linting, tests, type checking)
4. **Request review** from maintainers
5. **Address review comments**
6. **Squash commits** if requested

### PR Template

When creating a PR, please fill out the template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

---

## Questions?

Feel free to:
- Open an issue for questions
- Join our discussions
- Contact maintainers

Thank you for contributing! 🚀
