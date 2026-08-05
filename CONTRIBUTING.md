# Contributing to VendAI

First off, thank you for considering contributing to **VendAI**! Projects like this thrive on open-source community contributions.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainer.

---

## How Can I Contribute?

### 1. Reporting Bugs
- Check existing issues before opening a new one.
- Use the **Bug Report Template** (`.github/ISSUE_TEMPLATE/bug_report.md`).
- Provide steps to reproduce, expected behavior, actual behavior, and environment logs.

### 2. Suggesting Enhancements
- Check existing feature requests.
- Use the **Feature Request Template** (`.github/ISSUE_TEMPLATE/feature_request.md`).
- Clearly explain the problem the feature solves and potential implementation details.

### 3. Pull Requests Process
1. **Fork** the repository and create your feature branch:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
2. **Make your changes** following PEP 8 style guide for Python code.
3. **Run existing tests** to ensure no regressions:
   ```bash
   python backend/test_api.py
   python backend/test_supabase.py
   ```
4. **Commit your changes** with descriptive commit messages (following conventional commits):
   - `feat: add exponential smoothing forecasting model`
   - `fix: resolve CSV date parsing bug in inventory uploader`
   - `docs: update setup steps in README`
5. **Push to your fork** and submit a **Pull Request** against the `main` branch.

---

## Coding Guidelines

- **Python Style Guide**: Follow PEP 8 guidelines. Use standard docstrings for functions.
- **Environment Variables**: Never commit credentials, private keys, or passwords. Always use `.env`.
- **Database Rules**: Respect Supabase Row Level Security (RLS) when writing new endpoints.

Thank you for helping make VendAI better! 🚀
