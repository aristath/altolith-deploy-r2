# Changelog

All notable changes to Aether Site Exporter - Providers will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-11-18

### Added

#### Core Plugin
- Initial plugin release
- PSR-4 autoloader for PHP classes
- Main `Plugin` class for initialization and orchestration
- Dependency check requiring `aether-site-exporter` parent plugin
- Plugin activation hook with parent plugin validation
- Admin notice when parent plugin is missing

#### REST API
- `WorkerScriptController` for serving Cloudflare worker scripts
- REST endpoint: `GET /wp-json/aether/site-exporter/providers/worker-scripts/{type}`
- Support for R2 worker script delivery
- `RESTHelpersTrait` with namespace `aether/site-exporter/providers`
- Permission checks requiring `manage_options` capability

#### Provider Implementations
- **Cloudflare Workers** edge computing provider (170KB bundle)
  - Edge function deployment to 200+ global locations
  - Custom domain management
  - Worker script deployment via Cloudflare API
  - Connection testing and status checking

- **Cloudflare R2** object storage provider (178KB bundle)
  - S3-compatible object storage
  - Worker-based upload proxy
  - Bucket management
  - Public/private access control

- **GitLab** git repository provider (157KB bundle)
  - Git-based deployment workflow
  - Personal access token authentication
  - Repository management
  - Branch operations

- **GitLab Pages** static site hosting (163KB bundle)
  - Automated static site deployment
  - GitLab Pages integration
  - Custom domain support
  - SSL/TLS certificate management

#### Provider SDK
- `AbstractProvider` base class with common functionality
- `AbstractGitProvider` for git-based providers
- `AbstractAWSProvider` for S3-compatible providers
- `ProviderRegistry` for auto-discovery and management
- `ConfigFieldBuilder` for dynamic form generation
- Provider UI components (`ProviderField`, `ProviderForm`, `ProviderActions`, `SecretField`)
- Provider hooks (`useProvider`, `useProviderConfig`, `useEdgeService`, `useStorageService`)

#### Utilities
- API utilities with retry logic (`api.js`, `fetchWithRetry.js`)
- Error handling (`errorParser.js`, `standardResponse.js`)
- Debugging utilities (`debug.js`)
- Credential management (`credentialManager.js`)
- IndexedDB helpers for browser storage (`indexedDB.js`)
- Cache management (`manifestCache.js`, `wporgCache.js`, etc.)
- Data transformation and validation utilities
- Cloudflare Workers API client (`cloudflareWorkersApi.js`)
- Worker endpoint client (`workerEndpointClient.js`)

#### Components
- React components for provider configuration
- Error boundary for graceful error handling
- Loading states and UI feedback
- Secret field with show/hide toggle
- Provider actions (test, save, delete)
- Settings forms with validation

#### Build System
- Webpack configuration with separate provider bundles
- Development and production build modes
- Minification control via `MINIFY` environment variable
- Externalized WordPress and React dependencies
- Source map removal for production builds
- Asset file generation for WordPress dependency management

#### Code Quality
- **PHP**:
  - PHPCS configuration (PSR-12 + WordPress standards)
  - PHPStan Level 8 static analysis
  - PHP-CS-Fixer for automated code formatting
  - Composer scripts for linting and fixing

- **JavaScript**:
  - Jest test framework setup
  - ESLint configuration (WordPress standards)
  - Test coverage reporting
  - Watch mode for continuous testing

#### Documentation
- **README.md**: Complete user guide
  - Installation instructions
  - Provider configuration guides (all 4 providers)
  - REST API endpoint documentation
  - Architecture overview
  - Contributing guidelines

- **DEVELOPMENT.md**: Comprehensive development guide
  - Quick start instructions
  - Project structure overview
  - Build process documentation
  - Code quality tools and commands
  - Testing guidelines
  - Debugging tips
  - Common issues and solutions
  - Git workflow
  - Release process

- **INTEGRATION.md**: Integration strategy
  - Current integration approach (copied SDK)
  - Required changes for proper SDK exposure
  - Long-term integration plans
  - Implementation checklist for both plugins

- **INSTALL.md**: Installation guide
  - Prerequisites and system requirements
  - Quick install for end users
  - Development install with build process
  - Comprehensive troubleshooting
  - Verification steps
  - Uninstallation guide

#### Cloudflare Workers
- `CloudflareR2Worker.js`: R2 upload proxy worker
  - PUT request support for R2 uploads
  - CORS configuration
  - Authentication handling
  - Error responses

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Server-side encryption for sensitive provider credentials
- Nonce verification for all REST API endpoints
- Capability checks (`manage_options`) for admin operations
- Input sanitization and output escaping
- CORS headers with origin whitelisting

## Development Notes

### Build Information
- **PHP Version**: 7.4+ (tested with 8.1)
- **WordPress Version**: 6.4+
- **Node Version**: 18+
- **Build Tool**: @wordpress/scripts 28.0.0
- **Bundle Sizes** (development mode):
  - provider-cloudflare.js: 170KB
  - provider-cloudflare-r2.js: 178KB
  - provider-gitlab.js: 157KB
  - provider-gitlab-pages.js: 163KB

### Technical Decisions
1. **SDK Duplication**: Temporarily copying abstractions from parent plugin to allow independent development. Long-term plan: parent plugin should expose SDK as UMD library.

2. **Namespace Convention**:
   - PHP: `Aether\SiteExporterProviders\`
   - REST API: `aether/site-exporter/providers`
   - WordPress hooks: `aether.providers.*`

3. **Build Strategy**: Separate bundles per provider, no code splitting, all dependencies in single files for reliability.

4. **Code Standards**: PSR-12 for PHP, WordPress JavaScript standards, PHPStan Level 8, no backwards compatibility requirements.

### Known Issues
- None reported

### Migration Notes
- N/A (initial release)

## Links
- [GitHub Repository](https://github.com/aristath/aether-site-exporter-providers)
- [Parent Plugin](https://github.com/aristath/aether-site-exporter)
- [Issue Tracker](https://github.com/aristath/aether-site-exporter-providers/issues)

---

**Legend:**
- 🆕 `Added` for new features
- ✏️ `Changed` for changes in existing functionality
- ⚠️ `Deprecated` for soon-to-be removed features
- ❌ `Removed` for now removed features
- 🐛 `Fixed` for any bug fixes
- 🔒 `Security` in case of vulnerabilities
