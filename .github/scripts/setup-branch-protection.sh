#!/bin/bash

# Branch Protection Setup Script for Bleda
# This script configures branch protection rules using the GitHub API

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-}"
BRANCH="main"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check if gh CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_status "error" "GitHub CLI (gh) is not installed"
        echo "Please install it from: https://cli.github.com/"
        exit 1
    fi
    print_status "success" "GitHub CLI is installed"
}

# Function to check authentication
check_auth() {
    if ! gh auth status &> /dev/null; then
        print_status "error" "Not authenticated with GitHub"
        echo "Please run: gh auth login"
        exit 1
    fi
    print_status "success" "Authenticated with GitHub"
}

# Function to get repository information
get_repo_info() {
    if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
        # Try to get from git remote
        local remote_url=$(git config --get remote.origin.url)
        if [[ $remote_url =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
            REPO_OWNER="${BASH_REMATCH[1]}"
            REPO_NAME="${BASH_REMATCH[2]}"
        else
            print_status "error" "Could not determine repository owner and name"
            echo "Please set GITHUB_REPOSITORY_OWNER and GITHUB_REPOSITORY_NAME environment variables"
            exit 1
        fi
    fi
    print_status "info" "Repository: $REPO_OWNER/$REPO_NAME"
}

# Function to create branch protection rules
setup_protection() {
    print_status "info" "Setting up branch protection for '$BRANCH' branch..."
    
    # Required status checks
    # Note: GitHub uses the job's display name (from 'name:' field) not the job ID
    local required_checks=(
        "Validate PR / Quick Validations"
        "Validate PR / Code Quality"
        "Validate PR / Build (Node 18.x)"
        "Validate PR / Build (Node 20.x)"
        "Validate PR / Build (Node 22.x)"
        "Validate PR / Performance Checks"
        "Validate PR / PR Status Report"
        "Build and Test / build (18.x)"
        "Build and Test / build (20.x)"
    )
    
    # Convert array to JSON array
    local checks_json=$(printf '%s\n' "${required_checks[@]}" | jq -R . | jq -s .)
    
    # Create the protection rules JSON
    local protection_json=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "checks": $(echo "$checks_json" | jq 'map({context: .})')
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": false
  },
  "restrictions": {
    "users": [],
    "teams": ["core"],
    "apps": []
  },
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF
)
    
    # Apply the protection rules
    if gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        "/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
        --input - <<< "$protection_json" > /dev/null 2>&1; then
        print_status "success" "Branch protection rules applied successfully"
    else
        print_status "warning" "Failed to apply some protection rules. This might be due to permissions or team names."
        echo "Attempting with basic protection rules..."
        
        # Try with basic rules
        local basic_protection_json=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "checks": $(echo "$checks_json" | jq 'map({context: .})')
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
)
        
        if gh api \
            --method PUT \
            -H "Accept: application/vnd.github+json" \
            "/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" \
            --input - <<< "$basic_protection_json" > /dev/null 2>&1; then
            print_status "success" "Basic branch protection rules applied"
            print_status "warning" "Note: Team restrictions could not be applied. Configure manually in GitHub settings."
        else
            print_status "error" "Failed to apply branch protection rules"
            echo "Please check your permissions and try again"
            exit 1
        fi
    fi
}

# Function to verify protection rules
verify_protection() {
    print_status "info" "Verifying branch protection rules..."
    
    local protection=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/branches/$BRANCH/protection" 2>/dev/null || echo "{}")
    
    if [ "$protection" = "{}" ]; then
        print_status "error" "No protection rules found for $BRANCH branch"
        return 1
    fi
    
    # Check various protection settings
    local checks_passed=0
    local total_checks=6
    
    # Check PR requirement
    if echo "$protection" | jq -e '.required_pull_request_reviews' > /dev/null; then
        print_status "success" "Pull request requirement: Enabled"
        ((checks_passed++))
    else
        print_status "error" "Pull request requirement: Disabled"
    fi
    
    # Check review count
    local review_count=$(echo "$protection" | jq -r '.required_pull_request_reviews.required_approving_review_count // 0')
    if [ "$review_count" -ge 1 ]; then
        print_status "success" "Required approvals: $review_count"
        ((checks_passed++))
    else
        print_status "error" "Required approvals: $review_count (should be at least 1)"
    fi
    
    # Check CODEOWNERS
    local codeowners=$(echo "$protection" | jq -r '.required_pull_request_reviews.require_code_owner_reviews // false')
    if [ "$codeowners" = "true" ]; then
        print_status "success" "CODEOWNERS requirement: Enabled"
        ((checks_passed++))
    else
        print_status "error" "CODEOWNERS requirement: Disabled"
    fi
    
    # Check status checks
    if echo "$protection" | jq -e '.required_status_checks' > /dev/null; then
        print_status "success" "Status checks requirement: Enabled"
        ((checks_passed++))
    else
        print_status "error" "Status checks requirement: Disabled"
    fi
    
    # Check stale PR dismissal
    local dismiss_stale=$(echo "$protection" | jq -r '.required_pull_request_reviews.dismiss_stale_reviews // false')
    if [ "$dismiss_stale" = "true" ]; then
        print_status "success" "Dismiss stale reviews: Enabled"
        ((checks_passed++))
    else
        print_status "error" "Dismiss stale reviews: Disabled"
    fi
    
    # Check admin enforcement
    local enforce_admins=$(echo "$protection" | jq -r '.enforce_admins.enabled // false')
    if [ "$enforce_admins" = "true" ]; then
        print_status "success" "Admin enforcement: Enabled"
        ((checks_passed++))
    else
        print_status "warning" "Admin enforcement: Disabled (recommended to enable)"
    fi
    
    echo ""
    print_status "info" "Protection verification: $checks_passed/$total_checks checks passed"
    
    if [ "$checks_passed" -eq "$total_checks" ]; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    echo "🛡️  Branch Protection Setup for Bleda"
    echo "===================================="
    echo ""
    
    # Check prerequisites
    check_gh_cli
    check_auth
    get_repo_info
    
    # Setup protection
    echo ""
    setup_protection
    
    # Verify protection
    echo ""
    if verify_protection; then
        echo ""
        print_status "success" "Branch protection setup completed successfully! 🎉"
    else
        echo ""
        print_status "warning" "Branch protection setup completed with some issues"
        echo "Please review the settings at: https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
    fi
}

# Run main function
main "$@"