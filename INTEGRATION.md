# Integration with Aether Site Exporter

This document outlines the integration requirements between this plugin and the parent `aether-site-exporter` plugin.

## Current Status: ⚠️ Incomplete - Requires Parent Plugin Updates

The provider implementations in this plugin currently import abstractions from relative paths that assume the file structure of the original `aether` plugin. These imports need to be updated to reference the parent plugin's exposed SDK.

## Required Changes in aether-site-exporter

The parent plugin needs to expose the provider SDK globally so external provider plugins can use it.

### 1. Create Provider SDK Bundle

Create a new webpack entry point: `assets/src/provider-sdk/index.js`

```javascript
// assets/src/provider-sdk/index.js
export { AbstractProvider, CAP_EDGE, CAP_STORAGE, CAP_STATIC_SITE, CAP_MEDIA } from '../providers/base/AbstractProvider';
export { default as ProviderRegistry } from '../providers/registry/ProviderRegistry';
export { ConfigFieldBuilder } from '../providers/utils/configFieldBuilder';
export { default as apiFetch } from '../utils/api';
export { debug, debugWarn, debugError } from '../utils/debug';

// Re-export any other utilities providers might need
```

### 2. Update webpack.config.js

Add provider-sdk to entry points:

```javascript
entry: {
    'admin-settings': './assets/src/admin-settings/index.js',
    'admin-common': './assets/src/admin-common/index.js',
    'export': './assets/src/publish/index.js',
    'provider-sdk': './assets/src/provider-sdk/index.js', // NEW
},
```

### 3. Enqueue Provider SDK

In `includes/Plugin.php`, enqueue the provider SDK before any provider scripts:

```php
public function enqueueProviderSDK(): void
{
    $pluginUrl = AETHER_SITE_EXPORTER_PLUGIN_URL;
    $buildDir = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'assets/build/';
    $assetFile = $buildDir . 'provider-sdk.asset.php';

    if (! file_exists($assetFile)) {
        return;
    }

    $asset = require $assetFile;

    wp_enqueue_script(
        'aether-provider-sdk',
        $pluginUrl . 'assets/build/provider-sdk.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );

    // Expose SDK globally for external provider plugins
    wp_add_inline_script(
        'aether-provider-sdk',
        'window.AetherProviderSDK = window.AetherProviderSDK || {};',
        'before'
    );
}
```

Hook it early:

```php
add_action('admin_enqueue_scripts', [$this, 'enqueueProviderSDK'], 5);
```

### 4. Export SDK as UMD Library

Update webpack config to make provider-sdk a library:

```javascript
output: {
    ...defaultConfig.output,
    library: {
        name: 'AetherProviderSDK',
        type: 'window',
        export: 'default',
    },
},
```

## Required Changes in This Plugin

Once the parent plugin exposes the SDK, update provider imports:

### Before:
```javascript
import { AbstractProvider, CAP_EDGE } from '../base/AbstractProvider';
import { ConfigFieldBuilder } from '../utils/configFieldBuilder';
import { debug, debugWarn, debugError } from '../../utils/debug';
import apiFetch from '../../utils/api';
```

### After:
```javascript
const { AbstractProvider, CAP_EDGE, ConfigFieldBuilder, debug, debugWarn, debugError, apiFetch } = window.AetherProviderSDK;
```

## Temporary Workaround

Until the parent plugin exposes the SDK, we have two options:

### Option A: Copy Shared Code (Current)
Copy the base classes and utilities from aether-site-exporter to this plugin. This creates duplication but allows independent development.

```bash
# Copy provider base classes
cp -r ../aether-site-exporter/assets/src/providers/base ./assets/src/providers/
cp -r ../aether-site-exporter/assets/src/providers/utils ./assets/src/providers/
cp -r ../aether-site-exporter/assets/src/providers/components ./assets/src/providers/
```

### Option B: Symlinks (Development Only)
Create symlinks to the parent plugin's files during development:

```bash
ln -s ../../aether-site-exporter/assets/src/providers/base ./assets/src/providers/base
ln -s ../../aether-site-exporter/assets/src/utils ./assets/src/utils
```

⚠️ **Note**: Symlinks won't work for distribution and will break if the parent plugin's structure changes.

## Implementation Checklist

### In aether-site-exporter:
- [ ] Create `assets/src/provider-sdk/index.js`
- [ ] Add provider-sdk to webpack entry points
- [ ] Configure webpack to export as UMD library
- [ ] Add `enqueueProviderSDK()` method to Plugin class
- [ ] Hook SDK enqueuing at priority 5
- [ ] Test that SDK is available in `window.AetherProviderSDK`

### In aether-site-exporter-providers:
- [ ] Update all provider imports to use `window.AetherProviderSDK`
- [ ] Update webpack externals configuration
- [ ] Test provider registration still works
- [ ] Test provider deployment functionality
- [ ] Update documentation with SDK usage examples

## Alternative: Separate Package

If we want maximum flexibility, the provider SDK could be published as a separate npm package:

```json
{
  "name": "@aether/provider-sdk",
  "version": "1.0.0",
  "main": "dist/index.js",
  "peerDependencies": {
    "@wordpress/element": "^6.0.0",
    "@wordpress/hooks": "^4.0.0"
  }
}
```

Then providers can import it normally:

```javascript
import { AbstractProvider, CAP_EDGE } from '@aether/provider-sdk';
```

This approach:
- ✅ Provides proper dependency management
- ✅ Enables versioning of the SDK
- ✅ Works with standard build tools
- ❌ Requires publishing to npm
- ❌ More complex setup for contributors

## Recommended Approach

**For now**: Use Option A (copy shared code) to allow both plugins to be developed independently.

**Long term**: Implement the UMD library approach in the parent plugin once the provider API is stable.
