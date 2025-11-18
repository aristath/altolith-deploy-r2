# Components

Shared React components used across the Aether plugin.

## Overview

This directory contains reusable React components that are used by multiple features. Components should be extracted here when they:

1. Are used by 2+ different features
2. Have clear, well-defined responsibilities
3. Accept props for configuration (not hardcoded)
4. Have comprehensive JSDoc documentation

## Components

No shared components are currently defined. Components will be extracted here as part of the refactoring plan.

## Component Guidelines

### File Structure

```javascript
/**
 * Component Name
 *
 * Brief description of component purpose and behavior.
 *
 * @package Aether
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Component Name
 *
 * Detailed description with usage examples.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Prop description
 * @param {Function} props.onAction - Callback description
 * @returns {JSX.Element} Rendered component
 */
export function ComponentName( { title, onAction } ) {
    // Component implementation
    return (
        <div>
            <h2>{title}</h2>
            <button onClick={onAction}>
                {__('Action', 'aether')}
            </button>
        </div>
    );
}
```

### Naming Conventions

- **PascalCase** for component files: `ComponentName.js`
- **Named exports** for components: `export function ComponentName`
- **Descriptive names** that explain purpose: `ComponentName` not `Modal`

### Props

- Use **object destructuring** for props
- Add **JSDoc** for all props
- Define **default values** when appropriate
- Use **PropTypes** (coming in Phase 1 task)

### Internationalization

Always use `@wordpress/i18n` for user-facing text:

```javascript
import { __ } from '@wordpress/i18n';

// Translate strings
const label = __('Save Changes', 'aether');

// Translate with placeholders
const message = sprintf(
    __('Uploaded %d files', 'aether'),
    fileCount
);
```

### Styling

Components use **inline styles exclusively** with design tokens from `utils/styles.js`:

```javascript
import { Modal, Button, ProgressBar } from '@wordpress/components';
import { colors, spacing, fontSize, fontWeight } from '../utils/styles';

const containerStyle = {
    padding: spacing.lg,
    background: colors.white,
};

<Modal title={__('Title', 'aether')}>
    <div className="aether-component" style={ containerStyle }>
        <ProgressBar value={50} />
        <Button isPrimary>
            {__('Save', 'aether')}
        </Button>
    </div>
</Modal>
```

**Key Points:**
- All styling via `style` prop using design tokens
- BEM class names via `className` prop for semantic identification
- No CSS files - everything is JavaScript-based
- See `CLAUDE.md` for complete styling architecture documentation

## Component Extraction

### When to Extract

Extract a component when:

1. **Reusability**: Used in 2+ places
2. **Complexity**: More than 50 lines
3. **Testability**: Needs isolated testing
4. **Clarity**: Improves parent component readability

### Extraction Process

1. **Identify** component in source file
2. **Create** new file in `components/`
3. **Add JSDoc** with comprehensive documentation
4. **Define props** with types
5. **Import** in original location
6. **Test** to ensure functionality unchanged
7. **Commit** with descriptive message

### Example: Before Extraction

```javascript
// media-offload/index.js (500+ LOC)

function MediaOffloadHandler() {
    const [showModal, setShowModal] = useState(false);
    const [totalFiles, setTotalFiles] = useState(0);
    const [completedFiles, setCompletedFiles] = useState(0);

    return (
        <>
            {/* 200 lines of handler logic */}

            {showModal && (
                <Modal title="Offloading">
                    <ProgressBar value={(completedFiles / totalFiles) * 100} />
                    <p>{completedFiles} / {totalFiles} files</p>
                </Modal>
            )}
        </>
    );
}
```

### Example: After Extraction

```javascript
// components/ExampleComponent.js
export function ExampleComponent({ title, onAction }) {
    return (
        <Modal title={title}>
            <Button onClick={onAction}>
                {__('Action', 'aether')}
            </Button>
        </Modal>
    );
}

// feature/index.js (reduced from 500+ LOC)
import { ExampleComponent } from '../components/ExampleComponent';

function FeatureHandler() {
    return (
        <>
            {/* handler logic */}
            <ExampleComponent
                title={title}
                onAction={handleAction}
            />
        </>
    );
}
```

## Testing Components

### Unit Tests

```bash
# Test all components
npm run test:js -- components

# Test specific component
npm run test:js -- components/ExampleComponent
```

### Test Structure

```javascript
import { render, screen } from '@testing-library/react';
import { ExampleComponent } from '../ExampleComponent';

describe('ExampleComponent', () => {
    it('should render correctly', () => {
        render(
            <ExampleComponent
                title="Test Title"
                onAction={() => {}}
            />
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
});
```

## Future Components (Planned)

As part of the refactoring plan, these components will be extracted:

### Phase 4: Component Refactoring

- **ProviderSettings** - Provider configuration UI
- **ConfigurationSummary** - Display provider config summary
- **PublishStepProgress** - Individual step progress display
- **ErrorBoundary** - React error boundary for graceful failures
- **LoadingState** - Consistent loading indicator
- **EmptyState** - Consistent empty state UI

See `REFACTORING_PLAN.md` for details.

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Publish Components](../publish/README.md) - Publish-specific components
- [Admin Settings](../admin-settings/README.md) - Settings page components
