# 🚀 CI/CD Pipeline Guide

## Overview

This project implements a comprehensive CI/CD pipeline using GitHub Actions to automate building, testing, releasing, and deploying the Cursor AI Workflow Automation extension.

## 📋 Pipeline Components

### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: Push to main/develop, Pull Requests, Release events
- **Jobs**:
  - **Test & Build**: Runs tests, builds extension, creates VSIX
  - **Security Scan**: Vulnerability scanning with npm audit and Snyk
  - **Quality Gate**: Coverage thresholds and quality checks

### 2. **Release Pipeline** (`.github/workflows/release.yml`)
- **Triggers**: Release published, Manual dispatch
- **Jobs**:
  - **Release Build**: Creates versioned VSIX packages
  - **Publish to Marketplace**: Publishes to VS Code Marketplace
  - **Create Release Tag**: Creates Git tags for releases

### 3. **Deployment Pipeline** (`.github/workflows/deploy.yml`)
- **Triggers**: Release completion, Manual dispatch
- **Jobs**:
  - **Pre-deployment Checks**: Security and validation
  - **Staging Deployment**: Deploy to staging environment
  - **Production Deployment**: Deploy to production environment
  - **Rollback**: Automatic rollback on failure

### 4. **Monitoring Pipeline** (`.github/workflows/monitor.yml`)
- **Triggers**: Scheduled (every 6 hours), Manual dispatch
- **Jobs**:
  - **Health Check**: System health monitoring
  - **Performance Check**: Performance metrics
  - **Alert**: Success/failure notifications

## 🔧 Configuration

### Environment Variables

Set these secrets in your GitHub repository:

```bash
# VS Code Marketplace Publishing
VSCE_PAT=your_vsce_personal_access_token

# Security Scanning
SNYK_TOKEN=your_snyk_token

# Notifications (Optional)
SLACK_WEBHOOK_URL=your_slack_webhook
DISCORD_WEBHOOK_URL=your_discord_webhook
```

### Quality Thresholds

Configured in `.github/ci-config.json`:

```json
{
  "quality": {
    "test_coverage_threshold": 80,
    "build_time_threshold": 30,
    "test_time_threshold": 60,
    "bundle_size_threshold": 5242880,
    "max_vulnerabilities": 0
  }
}
```

## 🚀 Usage

### Automatic Workflows

#### 1. **Continuous Integration**
- **Triggered by**: Every push to main/develop, Pull Requests
- **What it does**:
  - Runs full test suite
  - Performs security scans
  - Builds extension
  - Creates VSIX package
  - Uploads coverage reports

#### 2. **Release Management**
- **Triggered by**: GitHub Release published
- **What it does**:
  - Creates versioned VSIX package
  - Generates release notes
  - Uploads to GitHub releases
  - Creates Git tags
  - Optionally publishes to marketplace

#### 3. **Health Monitoring**
- **Triggered by**: Every 6 hours (scheduled)
- **What it does**:
  - Runs health checks
  - Monitors performance
  - Sends alerts on issues

### Manual Workflows

#### 1. **Manual Release**
```bash
# Go to Actions tab → Release & Publish → Run workflow
# Input:
# - Version: 1.0.0
# - Publish to Marketplace: true/false
```

#### 2. **Manual Deployment**
```bash
# Go to Actions tab → Deploy → Run workflow
# Input:
# - Environment: staging/production
# - Force: true/false
```

#### 3. **Manual Health Check**
```bash
# Go to Actions tab → Monitor & Alert → Run workflow
```

## 📊 Quality Gates

### Test Coverage
- **Threshold**: 80%
- **Enforcement**: Hard failure below threshold
- **Monitoring**: Continuous monitoring with alerts

### Security
- **npm audit**: Moderate level vulnerabilities
- **Snyk scan**: High severity vulnerabilities
- **Enforcement**: Hard failure on any high severity issues

### Performance
- **Build time**: < 30 seconds
- **Test time**: < 60 seconds
- **Bundle size**: < 5MB
- **Monitoring**: Warnings on threshold breaches

## 🔄 Release Process

### 1. **Version Management**
```bash
# Update version in package.json
npm version patch|minor|major

# Or manually update version
# Then create GitHub release
```

### 2. **Release Workflow**
1. **Create GitHub Release** with version tag
2. **Automatic triggers**:
   - Release build job
   - VSIX package creation
   - Release notes generation
   - Asset upload
3. **Optional**: Marketplace publishing

### 3. **Deployment**
1. **Staging**: Automatic deployment
2. **Production**: Manual approval required
3. **Rollback**: Automatic on failure

## 🛠️ Troubleshooting

### Common Issues

#### 1. **Build Failures**
```bash
# Check logs for:
- TypeScript compilation errors
- Missing dependencies
- Test failures
- Coverage threshold violations
```

#### 2. **Security Failures**
```bash
# Resolve by:
- Updating vulnerable dependencies
- Running: npm audit fix
- Checking Snyk dashboard
```

#### 3. **Performance Issues**
```bash
# Investigate:
- Build time increases
- Test execution time
- Bundle size growth
- Memory usage
```

#### 4. **Deployment Failures**
```bash
# Check:
- Environment configuration
- Secrets availability
- Network connectivity
- Resource limits
```

### Debug Commands

```bash
# Local testing
npm run test:ci
npm run compile
node create-vsix.js

# Security checks
npm audit
npm audit fix

# Performance testing
time npm run compile
time npm run test:unit

# Bundle analysis
ls -la cursor-ai-workflow-automation-*.vsix
```

## 📈 Metrics & Monitoring

### Key Metrics Tracked
- **Test Coverage**: Percentage of code covered
- **Build Time**: Time to compile and package
- **Test Time**: Time to run test suite
- **Bundle Size**: Extension package size
- **Security Issues**: Vulnerability count
- **Dependency Health**: Outdated packages

### Alerting
- **Success**: GitHub issue creation
- **Failure**: Immediate notification
- **Warnings**: Performance degradation alerts
- **Security**: Vulnerability detection

## 🔐 Security

### Security Measures
1. **Dependency Scanning**: npm audit + Snyk
2. **Code Quality**: ESLint + Prettier
3. **Access Control**: Environment protection
4. **Secret Management**: GitHub Secrets
5. **Vulnerability Monitoring**: Continuous scanning

### Best Practices
- Keep dependencies updated
- Monitor security advisories
- Use least privilege access
- Regular security audits
- Secure secret management

## 🚀 Advanced Features

### 1. **Parallel Execution**
- Jobs run in parallel where possible
- Optimized for speed and efficiency
- Resource-aware scheduling

### 2. **Caching**
- npm dependencies cached
- Build artifacts cached
- Reduces execution time

### 3. **Artifact Management**
- VSIX packages stored as artifacts
- Coverage reports preserved
- Logs archived for debugging

### 4. **Rollback Capability**
- Automatic rollback on failure
- Manual rollback triggers
- Version tagging for tracking

## 📝 Maintenance

### Regular Tasks
1. **Update Dependencies**: Monthly
2. **Review Security**: Weekly
3. **Monitor Performance**: Continuous
4. **Update Documentation**: As needed
5. **Review Alerts**: Daily

### Configuration Updates
- Modify `.github/ci-config.json` for thresholds
- Update workflow files for new requirements
- Add new security checks as needed
- Extend monitoring capabilities

## 🤝 Contributing

### Adding New Workflows
1. Create workflow file in `.github/workflows/`
2. Follow naming conventions
3. Add proper triggers and conditions
4. Include error handling
5. Update documentation

### Modifying Existing Workflows
1. Test changes locally first
2. Use feature branches
3. Update documentation
4. Notify team of changes
5. Monitor for issues

---

## 📞 Support

For issues with the CI/CD pipeline:
1. Check workflow logs
2. Review configuration
3. Test locally
4. Create GitHub issue
5. Contact maintainers

---

*This CI/CD pipeline ensures reliable, secure, and efficient delivery of the Cursor AI Workflow Automation extension.*
