# Branch Protection Rules for Bleda

This document outlines the branch protection rules for the main branch and provides instructions for setting them up.

## Required Protection Rules

| Rule | Description | Status |
|------|-------------|--------|
| ✅ Require a pull request before merging | All changes must come through PR | Required |
| ✅ Require approvals | At least 1 review required | Required |
| ✅ Require review from CODEOWNERS | Team approval matching CODEOWNERS required | Required |
| ✅ Require status checks to pass | CI tests must pass before merge | Required |
| ✅ Dismiss stale pull request approvals | Approval invalidated when code is updated | Required |
| 🔒 Restrict who can push to matching branches | Only core team can push directly to main | Required |

## Required Status Checks

The following GitHub Actions workflows must pass before merging:

### From `validate-pr.yml`:
- `quick-checks` - PR title and commit message validation
- `code-quality` - TypeScript type checking and security audit
- `build-matrix (18.x)` - Build verification on Node 18
- `build-matrix (20.x)` - Build verification on Node 20
- `build-matrix (22.x)` - Build verification on Node 22
- `performance` - Bundle size comparison
- `pr-status-report` - Overall PR validation summary

### From `build.yml`:
- `build (18.x)` - Build and test on Node 18
- `build (20.x)` - Build and test on Node 20

## Setting Up Branch Protection

### Using GitHub Web Interface

1. Navigate to Settings → Branches
2. Add rule for `main` branch
3. Configure the following:

#### Basic Settings
- [x] Require a pull request before merging
  - [x] Required approving reviews: 1
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from CODEOWNERS
  - [ ] Restrict who can dismiss pull request reviews

#### Status Checks
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - `quick-checks`
    - `code-quality`
    - `build-matrix (18.x)`
    - `build-matrix (20.x)`
    - `build-matrix (22.x)`
    - `performance`
    - `pr-status-report`
    - `build (18.x)`
    - `build (20.x)`

#### Push Restrictions
- [x] Restrict who can push to matching branches
  - Add teams/users: `@zopiolabs/core`

#### Additional Settings
- [x] Include administrators
- [ ] Allow force pushes
- [ ] Allow deletions

### Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# brew install gh (macOS)
# https://cli.github.com/ (other platforms)

# Authenticate with GitHub
gh auth login

# Run the protection setup script
bash .github/scripts/setup-branch-protection.sh
```

### Using GitHub API

See `.github/scripts/setup-branch-protection.sh` for the automated setup script.

## Verifying Protection Rules

Run the verification workflow to ensure all rules are properly configured:

```bash
gh workflow run verify-protection.yml
```

Or check manually:

```bash
gh api repos/:owner/:repo/branches/main/protection
```

## Core Team Members

The following users/teams have direct push access to the main branch:

- `@zopiolabs/core` - Core infrastructure team

See `.github/CODEOWNERS` for detailed code ownership assignments.

## Exceptions and Emergency Procedures

### Bypassing Protection (Emergency Only)

In case of critical production issues:

1. Create a hotfix branch from main
2. Apply the fix
3. Create an emergency PR with `[HOTFIX]` prefix
4. Request expedited review from core team
5. Merge with admin override if absolutely necessary

### Temporary Rule Modifications

For special releases or maintenance:

1. Document the reason in an issue
2. Temporarily modify rules via Settings
3. Restore original rules immediately after
4. Update this document if permanent changes are needed

## Monitoring and Compliance

- Weekly automated audit of protection rules (see `.github/workflows/audit-protection.yml`)
- Notifications sent to core team for any rule modifications
- Monthly review of CODEOWNERS assignments

## Related Documentation

- [CODEOWNERS](.github/CODEOWNERS) - Code ownership assignments
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community standards