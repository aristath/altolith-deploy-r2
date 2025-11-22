# Implementation Notes - Remaining Workflow Updates

## Current Status: 70% Complete

### ✅ Completed Foundation:
- Deployment types system in place
- AbstractProvider updated
- ConfigFieldBuilder updated
- LocalFilesystem provider updated
- ProviderRegistry updated
- Provider SDK created
- Webpack configured for SDK
- filterWorkflowByExportTypes deprecated

### ⏳ Remaining Critical Updates:

---

## 1. Update usePublishController.js

**File:** `/assets/src/publish/hooks/usePublishController.js`

**Current Code Pattern:**
```javascript
// OLD: Gets single providerId from settings
const storageProviderId = providerTypes.storage || '';

const workflowContext = {
  providerId: storageProviderId,
  // ...
};
```

**New Code Pattern:**
```javascript
import { DEPLOYMENT_TYPES } from '../../constants/deploymentTypes';
import { ProviderRegistry } from '../../providers/registry/ProviderRegistry';

// Helper function to get providers for a deployment type
const getProvidersForDeploymentType = (deploymentType) => {
  const registry = ProviderRegistry.getInstance();
  const allProviders = registry.getAllIds();

  return allProviders.filter(providerId => {
    const provider = registry.get(providerId);
    if (!provider) return false;

    // Check if provider supports AND has enabled this deployment type
    return provider.supportsDeploymentType(deploymentType) &&
           provider.isDeploymentTypeEnabled(deploymentType);
  });
};

// Build context with provider arrays
const workflowContext = {
  staticSiteProviders: getProvidersForDeploymentType(DEPLOYMENT_TYPES.STATIC_SITE),
  blueprintBundleProviders: getProvidersForDeploymentType(DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE),
  edgeFunctionProviders: getProvidersForDeploymentType(DEPLOYMENT_TYPES.EDGE_FUNCTIONS),
  registry: ProviderRegistry.getInstance(),
  // Keep providerId for backwards compat (use first provider)
  providerId: getProvidersForDeploymentType(DEPLOYMENT_TYPES.STATIC_SITE)[0] || 'local-filesystem',
  // ... other context
};
```

---

## 2. Update uploadStaticSiteFilesStep.js

**File:** `/assets/src/publish/steps/uploadStaticSiteFilesStep.js`

**Changes Needed:**

```javascript
export async function uploadStaticSiteFilesHandler( context ) {
  const {
    staticSiteProviders = [], // NEW: Array of provider IDs
    providerId, // LEGACY: Keep for backwards compat
    registry,
    processStaticSiteUrls,
    urls,
    staticSiteUrl,
    blueprintData,
    siteUrl,
    setStatusMessage,
    removeMessage,
  } = context;

  // Use staticSiteProviders if available, fallback to single providerId
  const providers = staticSiteProviders.length > 0
    ? staticSiteProviders
    : (providerId ? [providerId] : []);

  if (providers.length === 0) {
    setStatusMessage(
      'No providers enabled for static site deployment',
      'warning',
      'uploadStaticSiteFiles'
    );
    return { skipped: true, reason: 'no_providers' };
  }

  setStatusMessage(
    `Uploading static site to ${providers.length} provider(s)...`,
    'progress',
    'uploadStaticSiteFiles'
  );

  // Filter URLs
  const filteredUrls = applyFilters(
    'aether.publish.step.uploadStaticSiteFiles.urls',
    urls,
    providers // Pass array instead of single ID
  );

  // Upload to ALL providers in parallel
  const uploadPromises = providers.map(async (providerIdItem) => {
    try {
      const result = await processStaticSiteUrls(
        filteredUrls,
        staticSiteUrl,
        providerIdItem,
        siteUrl,
        setStatusMessage,
        blueprintData,
        removeMessage
      );

      return {
        providerId: providerIdItem,
        success: true,
        filesUploaded: result.filesUploaded || 0,
        uploadedFiles: result.uploadedFiles || [],
      };
    } catch (error) {
      return {
        providerId: providerIdItem,
        success: false,
        error: error.message,
      };
    }
  });

  const results = await Promise.allSettled(uploadPromises);

  // Aggregate results
  const successfulUploads = results.filter(r =>
    r.status === 'fulfilled' && r.value.success
  );
  const failedUploads = results.filter(r =>
    r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  );

  if (successfulUploads.length > 0) {
    setStatusMessage(
      `Uploaded static site to ${successfulUploads.length}/${providers.length} provider(s)`,
      failedUploads.length > 0 ? 'warning' : 'success',
      'uploadStaticSiteFiles'
    );
  }

  if (failedUploads.length === providers.length) {
    throw new Error('Failed to upload static site to any provider');
  }

  return applyFilters(
    'aether.publish.step.uploadStaticSiteFiles.result',
    {
      providers,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason),
      successCount: successfulUploads.length,
      failureCount: failedUploads.length,
    },
    providers
  );
}
```

---

## 3. Update uploadSiteArchiveStep.js

**File:** `/assets/src/publish/steps/uploadSiteArchiveStep.js`

**Changes Needed:**

```javascript
export async function uploadSiteArchiveHandler( context ) {
  const {
    blueprintBundleProviders = [], // NEW: Array of provider IDs
    providerId, // LEGACY: Keep for backwards compat
    registry,
    handleSiteArchiveUpload,
    blueprintBundle,
    setStatusMessage,
  } = context;

  // Use blueprintBundleProviders if available, fallback to single providerId
  const providers = blueprintBundleProviders.length > 0
    ? blueprintBundleProviders
    : (providerId ? [providerId] : []);

  if (providers.length === 0) {
    setStatusMessage(
      'No providers enabled for blueprint bundle',
      'warning',
      'uploadSiteArchive'
    );
    return { skipped: true, reason: 'no_providers' };
  }

  setStatusMessage(
    `Uploading blueprint bundle to ${providers.length} provider(s)...`,
    'progress',
    'uploadSiteArchive'
  );

  // Upload to ALL providers in parallel
  const uploadPromises = providers.map(async (providerIdItem) => {
    try {
      await handleSiteArchiveUpload(providerIdItem, {
        ...context,
        providerId: providerIdItem,
      });

      return {
        providerId: providerIdItem,
        success: true,
      };
    } catch (error) {
      return {
        providerId: providerIdItem,
        success: false,
        error: error.message,
      };
    }
  });

  const results = await Promise.allSettled(uploadPromises);

  // Aggregate results
  const successfulUploads = results.filter(r =>
    r.status === 'fulfilled' && r.value.success
  );
  const failedUploads = results.filter(r =>
    r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  );

  if (successfulUploads.length > 0) {
    setStatusMessage(
      `Uploaded blueprint bundle to ${successfulUploads.length}/${providers.length} provider(s)`,
      failedUploads.length > 0 ? 'warning' : 'success',
      'uploadSiteArchive'
    );
  }

  if (failedUploads.length === providers.length) {
    throw new Error('Failed to upload blueprint bundle to any provider');
  }

  return {
    providers,
    results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason),
    successCount: successfulUploads.length,
    failureCount: failedUploads.length,
  };
}
```

---

## 4. Remove provider_types from Settings

### PHP Side:

**File:** `/includes/REST/SettingsController.php`

**Remove:**
- `provider_types` key handling
- Storage/static_site/edge/media provider selection

**Keep:**
- `providers` key with structure: `{ 'provider-id': { deployment_types: [...], config: {...} } }`

### JavaScript Side:

**File:** `/assets/src/contexts/SettingsContext.js`

**Remove:**
- `provider_types` state
- `setProviderType()` method
- Any code referencing `settings.provider_types`

**Keep:**
- `providers` state
- `saveProviderConfig(providerId, config)` method
- `getProviderConfig(providerId)` method

---

## 5. Update UI - ProviderSettings.js

**File:** `/assets/src/admin-settings/ProviderSettings.js`

**Current:** Hardcoded local-filesystem display

**New Implementation:**

```javascript
import { useState, useEffect } from '@wordpress/element';
import { Card, CardBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ProviderRegistry } from '../providers/registry/ProviderRegistry';
import ProviderForm from '../components/ProviderForm';

export default function ProviderSettings() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const registry = ProviderRegistry.getInstance();
    const allProviderIds = registry.getAllIds();

    // Get metadata for all providers
    const providerMetadata = allProviderIds.map(id => {
      const provider = registry.get(id);
      return provider.getMetadata();
    });

    setProviders(providerMetadata);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading providers...</div>;
  }

  return (
    <div className="aether-provider-settings">
      <h2>{__('Provider Settings', 'aether-site-exporter')}</h2>
      <p>{__('Configure which providers to use for deployment.', 'aether-site-exporter')}</p>

      {providers.map(provider => (
        <Card key={provider.id} className="aether-provider-card">
          <CardBody>
            <div className="provider-header">
              <span className="provider-icon">{provider.icon}</span>
              <h3>{provider.name}</h3>
            </div>
            <p className="provider-description">{provider.description}</p>

            {/* Display supported deployment types as badges */}
            {provider.supportedDeploymentTypes && provider.supportedDeploymentTypes.length > 0 && (
              <div className="deployment-types-info">
                <strong>{__('Supports:', 'aether-site-exporter')}</strong>
                {provider.supportedDeploymentTypes.map(type => (
                  <span key={type} className="deployment-type-badge">{type}</span>
                ))}
              </div>
            )}

            {/* Provider configuration form */}
            <ProviderForm
              providerId={provider.id}
              fields={provider.configFields}
            />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
```

---

## 6. Enqueue Provider SDK

**File:** `/includes/admin/Pages/SettingsPage.php`

**Add to enqueueScripts() method:**

```php
public function enqueueScripts( string $hook ): void {
    // Existing script enqueues...

    // Enqueue Provider SDK first (priority 5)
    $sdkAssetFile = AETHER_PLUGIN_DIR . 'assets/build/provider-sdk.asset.php';
    if ( file_exists( $sdkAssetFile ) ) {
        $sdkAsset = require $sdkAssetFile;

        wp_enqueue_script(
            'aether-provider-sdk',
            AETHER_PLUGIN_URL . 'assets/build/provider-sdk.js',
            $sdkAsset['dependencies'],
            $sdkAsset['version'],
            true
        );
    }

    // Then enqueue other scripts...
}
```

---

## Testing Checklist

After implementing all changes:

1. **Build parent plugin:** `npm run build`
2. **Verify SDK bundle:** Check `assets/build/provider-sdk.js` exists
3. **Activate plugin:** No errors
4. **Settings page:** Shows all providers with deployment type checkboxes
5. **Configure providers:**
   - Local Filesystem: [✓] Static Site, [✓] Blueprint Bundle
   - Save settings successfully
6. **Publish workflow:**
   - Click Publish
   - Workflow runs without errors
   - Files uploaded to all enabled providers
7. **Check results:** Verify files in expected locations

---

## Key Architecture Points

### Provider Selection Flow:
1. User enables deployment types in each provider's settings
2. During publish, workflow queries all providers for each deployment type
3. Upload steps receive arrays of provider IDs
4. Each upload runs in parallel to all enabled providers

### Backwards Compatibility:
- `filterWorkflowByExportTypes()` still exists (returns workflow unchanged)
- Upload steps check for both new arrays and legacy single providerId
- Settings migration path: old provider_types ignored, deployment_types used

### Error Handling:
- If all providers fail: throw error (publish fails)
- If some providers fail: show warning (publish succeeds with partial uploads)
- If no providers enabled: show warning, skip step

---

*Generated: 2025-11-18*
*Progress: 70% - Foundation complete, workflow integration remaining*
