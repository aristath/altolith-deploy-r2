# Custom React Hooks

Reusable React hooks for the Aether plugin.

## Overview

This directory contains custom hooks that encapsulate reusable logic. Hooks follow React conventions and should be prefixed with `use`.

**Current Status:** The codebase has **38 custom hooks**, some of which need refactoring (see Phase 5 in `REFACTORING_PLAN.md`).

## Key Hooks

### usePublishController

⚠️ **God Hook** - Needs refactoring (873 LOC, 7+ responsibilities)

**Location:** Used by export workflow

**Responsibilities (too many):**
- Step orchestration
- Status polling
- Error handling
- Progress calculation
- Job lifecycle management
- UI state management
- Provider coordination

**Planned Refactoring (Phase 5):**
- Split into smaller, focused hooks
- Extract business logic to service classes
- Use Context API for shared state
- Separate UI concerns from business logic

### usePublishAPI

Centralizes all export-related REST API calls.

**Location:** `usePublishAPI.js`

**Returns:**
```javascript
const {
    discoverAssets,      // Discover changed assets
    getAssetStatus,      // Get asset status
    markAssetChanged,    // Mark asset as changed
    startPublish,        // Start export job
    getJobStatus,        // Get job status
    executeStep,         // Execute workflow step
    markUploadsComplete, // Mark uploads complete
    updateJobStatus,     // Update job status
    getGitConfig,        // Get git configuration
} = usePublishAPI();
```

**Pattern:**
All API calls use constants from `constants/api.js`:

```javascript
const response = await apiFetch({
    path: ENDPOINTS.PUBLISH.START,
    method: HTTP_METHODS.POST,
    data: requestData,
});
```

### useMediaOffload

Handles media file upload to cloud provider.

**Returns:**
```javascript
const {
    uploadAttachment,  // Upload attachment to provider
    loading,          // Upload in progress
    error,            // Upload error
} = useMediaOffload();

// Usage
const result = await uploadAttachment(attachment);
```

**Features:**
- Automatic provider selection
- Progress tracking
- Error handling with retry
- Metadata updates

### useProviderRegistry

Access all registered providers.

**Returns:**
```javascript
const {
    providers,                   // All providers
    loading,                     // Loading state
    error,                       // Error state
    getProviderById,            // Get provider by ID
    getProvidersByCapability,   // Filter by capability
} = useProviderRegistry();
```

**Usage:**
```javascript
// Get all storage providers
const storageProviders = getProvidersByCapability('storage');

// Get specific provider
const localProvider = getProviderById('local-filesystem');
```

### useProvider

Work with a specific provider instance.

**Parameters:**
- `providerId` - Provider ID to load

**Returns:**
```javascript
const {
    provider,          // Provider instance
    config,           // Provider configuration
    loading,          // Loading state
    error,            // Error state
    saveConfig,       // Save configuration
    testConnection,   // Test provider connection
    deploy,           // Deploy to provider
    getStatus,        // Get deployment status
} = useProvider('local-filesystem');
```

### useProviderConfig

Manage provider configuration (separate from provider logic).

**Returns:**
```javascript
const {
    config,         // Current configuration
    loading,        // Loading state
    error,          // Error state
    loadConfig,     // Load from storage
    saveConfig,     // Save to storage
    deleteConfig,   // Delete configuration
} = useProviderConfig('local-filesystem');
```

## Hook Patterns

### Standard Hook Structure

```javascript
/**
 * Hook Name
 *
 * Description of what this hook does and when to use it.
 *
 * @param {string} param - Parameter description
 * @returns {Object} Object with hook values and functions
 */
export function useCustomHook( param ) {
    // State
    const [value, setValue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Effects
    useEffect(() => {
        // Side effects here
    }, [dependencies]);

    // Callbacks
    const doSomething = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Logic here
            setValue(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dependencies]);

    // Return API
    return {
        value,
        loading,
        error,
        doSomething,
    };
}
```

### Common Return Pattern

Hooks typically return an object with:

1. **Values**: Current state values
2. **Loading**: Boolean indicating async operation
3. **Error**: Error message if operation failed
4. **Functions**: Callbacks to trigger operations

```javascript
const { value, loading, error, doAction } = useCustomHook();
```

### Error Handling

```javascript
const doSomething = useCallback(async () => {
    try {
        const result = await apiCall();
        return { success: true, data: result };
    } catch (err) {
        setError(err.message || 'Operation failed');
        return { success: false, error: err.message };
    }
}, []);
```

## Hook Guidelines

### When to Create a Hook

Create a custom hook when:

1. **Logic is reused** in 2+ components
2. **State management is complex** and should be encapsulated
3. **Side effects need management** (API calls, subscriptions, etc.)
4. **Testing benefits** from isolated logic

### Hook Naming

- **Prefix with `use`**: `usePublishAPI`, `useMediaOffload`
- **Descriptive names**: Explain what the hook does
- **Noun or verb phrase**: `useProvider` (noun), `usePublishController` (noun + verb)

### Hook Dependencies

Be explicit about dependencies in `useEffect`, `useCallback`, `useMemo`:

```javascript
// ✅ Explicit dependencies
useEffect(() => {
    fetchData(id);
}, [id]);

// ❌ Missing dependencies (ESLint will warn)
useEffect(() => {
    fetchData(id);
}, []); // Missing 'id' dependency

// ✅ Disable warning only if intentional
useEffect(() => {
    fetchOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Intentionally empty
```

### Avoid God Hooks

Don't create hooks with too many responsibilities:

```javascript
// ❌ God Hook (too many responsibilities)
function useEverything() {
    // Manages 7+ different concerns
    // 873 lines of code
    // Hard to test, understand, modify
}

// ✅ Focused Hooks
function usePublishJob() { /* Job management */ }
function usePublishSteps() { /* Step execution */ }
function usePublishProgress() { /* Progress tracking */ }
```

## Hook Composition

Hooks can use other hooks:

```javascript
export function usePublishWorkflow() {
    const api = usePublishAPI();
    const { provider } = useProvider(providerId);
    const { uploadAttachment } = useMediaOffload();

    const startWorkflow = useCallback(async () => {
        const job = await api.startPublish(assets);
        // Use provider and uploadAttachment...
    }, [api, provider, uploadAttachment]);

    return { startWorkflow };
}
```

## Testing Hooks

### Using @testing-library/react-hooks

```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useCustomHook } from '../useCustomHook';

describe('useCustomHook', () => {
    it('should load data', async () => {
        const { result, waitForNextUpdate } = renderHook(() =>
            useCustomHook('param')
        );

        expect(result.current.loading).toBe(true);

        await waitForNextUpdate();

        expect(result.current.loading).toBe(false);
        expect(result.current.value).toBeDefined();
    });

    it('should handle errors', async () => {
        const { result, waitForNextUpdate } = renderHook(() =>
            useCustomHook('invalid')
        );

        await waitForNextUpdate();

        expect(result.current.error).toBeTruthy();
    });
});
```

## Anti-Patterns to Avoid

### 1. Hooks Wrapping Hooks Wrapping Hooks

```javascript
// ❌ Over-abstraction
function useA() { return useState(0); }
function useB() { return useA(); }
function useC() { return useB(); }

// ✅ Direct usage
function useCounter() { return useState(0); }
```

### 2. Business Logic in Hooks

```javascript
// ❌ Complex business logic in hook
function useBusinessLogic() {
    // 500 lines of business logic
}

// ✅ Extract to service class
class BusinessService {
    processData() { /* logic */ }
}

function useBusinessService() {
    const service = useMemo(() => new BusinessService(), []);
    return service;
}
```

### 3. Side Effects Without Cleanup

```javascript
// ❌ No cleanup
useEffect(() => {
    const interval = setInterval(poll, 1000);
}, []);

// ✅ Cleanup
useEffect(() => {
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
}, [poll]);
```

## Future Improvements (Phase 5)

### Planned Refactorings

1. **Split usePublishController** - Break into 5-7 focused hooks
2. **Extract Business Logic** - Move to service classes
3. **Add Context API** - Reduce prop drilling
4. **Standardize Error Handling** - Consistent error pattern
5. **Improve Type Safety** - Add JSDoc types for all hooks
6. **Add Unit Tests** - Test all hooks in isolation

See `REFACTORING_PLAN.md` Phase 5 for details.

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Providers README](../providers/README.md) - Provider hooks
- [Publish README](../publish/README.md) - Publish workflow hooks
- [Components README](../components/README.md) - Component integration
