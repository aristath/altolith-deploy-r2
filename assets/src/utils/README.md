# Utilities

Shared utility functions and helpers for the Aether plugin.

## Overview

This directory contains pure utility functions that don't fit into hooks, components, or services. Utilities should be:

- **Pure functions** (no side effects)
- **Stateless** (don't manage state)
- **Reusable** (used in multiple places)
- **Well-tested** (easy to unit test)

## Key Utilities

### api.js

WordPress REST API wrapper with nonce handling.

**Exports:**
- `apiFetch` - Wrapper around `@wordpress/api-fetch` with proper configuration

**Usage:**
```javascript
import apiFetch from '../utils/api';

const response = await apiFetch({
    path: '/wp-json/aether/v1/endpoint',
    method: 'POST',
    data: { key: 'value' },
});
```

### steps.js (Publish)

**Location:** Actually in `../publish/utils/steps.js`

Step definitions and metadata for the export workflow. See [Publish README](../publish/README.md) for details.

### assetExtractor.js (Publish)

**Location:** `../publish/utils/assetExtractor.js`

Extract asset URLs from HTML content.

**Critical:** Must run BEFORE URL rewriting to avoid CORS/404 errors.

**Extracts:**
- CSS files (`<link rel="stylesheet">`)
- JavaScript files (`<script src>`)
- Images (`<img src>`, `<source>`, `<picture>`)
- Fonts (from CSS `@font-face`, `url()`)
- Background images (inline styles, CSS)

### urlRewriter.js (Publish)

**Location:** `../publish/utils/urlRewriter.js`

Rewrite URLs in HTML for static hosting.

**Features:**
- Convert WordPress URLs to relative paths
- Handle trailing slashes
- Preserve query parameters
- Support custom domains

**Usage:**
```javascript
import { rewriteUrls } from '../utils/urlRewriter';

const processedHtml = rewriteUrls(html, {
    baseUrl: 'https://example.com',
    customDomain: 'https://custom.com',
});
```

## Utility Categories

### String Utilities

Functions for string manipulation:

- URL parsing and manipulation
- Slug generation
- Path normalization
- String validation

**Example:**
```javascript
export function normalizeUrl(url) {
    return url.replace(/\/$/, '').toLowerCase();
}

export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
```

### Array Utilities

Functions for array operations:

- Deduplication
- Chunking
- Filtering
- Sorting

**Example:**
```javascript
export function deduplicate(array) {
    return [...new Set(array)];
}

export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
```

### Object Utilities

Functions for object manipulation:

- Deep cloning
- Merging
- Key filtering
- Value extraction

**Example:**
```javascript
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function filterKeys(obj, keys) {
    return Object.fromEntries(
        Object.entries(obj).filter(([key]) => keys.includes(key))
    );
}
```

### Async Utilities

Functions for async operations:

- Delays
- Retries
- Debouncing
- Throttling

**Example:**
```javascript
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry(fn, maxAttempts = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            await delay(delayMs * attempt);
        }
    }
}

export function debounce(fn, delayMs) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delayMs);
    };
}
```

## Utility Guidelines

### Pure Functions

Utilities should be pure functions with no side effects:

```javascript
// ✅ Pure function
export function calculateProgress(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

// ❌ Impure function (modifies external state)
let globalTotal = 0;
export function addToTotal(value) {
    globalTotal += value; // Side effect!
    return globalTotal;
}
```

### Single Responsibility

Each utility should do one thing well:

```javascript
// ✅ Single responsibility
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ Multiple responsibilities
export function validateAndSendEmail(email, message) {
    if (!isValidEmail(email)) return false;
    sendEmail(email, message); // Doing too much!
    return true;
}
```

### Type Safety with JSDoc

Add comprehensive JSDoc for type safety:

```javascript
/**
 * Calculate percentage with optional decimal places.
 *
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {number} Percentage (0-100)
 *
 * @example
 * calculatePercentage(5, 10) // returns 50
 * calculatePercentage(1, 3, 2) // returns 33.33
 */
export function calculatePercentage(value, total, decimals = 0) {
    if (total === 0) return 0;
    const percentage = (value / total) * 100;
    return Number(percentage.toFixed(decimals));
}
```

### Error Handling

Handle edge cases gracefully:

```javascript
/**
 * Safely parse JSON with fallback.
 *
 * @param {string} json - JSON string to parse
 * @param {*} [defaultValue=null] - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export function safeJsonParse(json, defaultValue = null) {
    try {
        return JSON.parse(json);
    } catch (error) {
        console.warn('Failed to parse JSON:', error);
        return defaultValue;
    }
}
```

## Testing Utilities

Utilities are perfect for unit testing:

```javascript
import { calculateProgress, retry, deduplicate } from '../utils';

describe('calculateProgress', () => {
    it('should calculate percentage correctly', () => {
        expect(calculateProgress(5, 10)).toBe(50);
        expect(calculateProgress(1, 3)).toBe(33);
    });

    it('should handle edge cases', () => {
        expect(calculateProgress(0, 0)).toBe(0);
        expect(calculateProgress(10, 10)).toBe(100);
    });
});

describe('retry', () => {
    it('should retry failed operations', async () => {
        let attempts = 0;
        const fn = () => {
            attempts++;
            if (attempts < 3) throw new Error('fail');
            return 'success';
        };

        const result = await retry(fn, 3, 10);
        expect(result).toBe('success');
        expect(attempts).toBe(3);
    });
});

describe('deduplicate', () => {
    it('should remove duplicates', () => {
        expect(deduplicate([1, 2, 2, 3])).toEqual([1, 2, 3]);
        expect(deduplicate(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });
});
```

## Organization

### Subdirectories (if needed)

For large codebases, organize utilities into subdirectories:

```
utils/
├── api.js              # API utilities
├── string/            # String utilities
│   ├── url.js
│   ├── slug.js
│   └── validation.js
├── array/             # Array utilities
│   ├── chunk.js
│   ├── deduplicate.js
│   └── sort.js
└── async/             # Async utilities
    ├── delay.js
    ├── retry.js
    └── debounce.js
```

### Index Files

Use index files for clean imports:

```javascript
// utils/index.js
export * from './string/url';
export * from './array/chunk';
export * from './async/delay';

// Usage
import { normalizeUrl, chunk, delay } from '../utils';
```

## Common Patterns

### Configuration Merging

```javascript
export function mergeConfig(defaults, overrides) {
    return {
        ...defaults,
        ...overrides,
        // Deep merge for nested objects if needed
    };
}
```

### Value Coercion

```javascript
export function toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
    }
    return Boolean(value);
}
```

### Range Validation

```javascript
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function isInRange(value, min, max) {
    return value >= min && value <= max;
}
```

## Anti-Patterns

### Don't Use Utilities for State

```javascript
// ❌ Utilities should not manage state
let cache = {};
export function cacheValue(key, value) {
    cache[key] = value;
}

// ✅ Use hooks or services for state
export function useCachedValue(key) {
    const [cache, setCache] = useState({});
    // ...
}
```

### Don't Mix Concerns

```javascript
// ❌ Mixing concerns
export function fetchAndProcessData(url) {
    return fetch(url)  // API concern
        .then(r => r.json())
        .then(data => processData(data));  // Business logic
}

// ✅ Separate concerns
export function fetchData(url) {
    return fetch(url).then(r => r.json());
}

export function processData(data) {
    // Processing logic
}
```

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Hooks README](../hooks/README.md) - For stateful logic
- [Publish README](../publish/README.md) - Publish-specific utilities
- [Constants README](../constants/README.md) - Use constants in utilities
