// Makes @testing-library/jest-dom's custom matchers (toBeInTheDocument, etc.)
// visible to svelte-check. The runtime import lives in vitest-setup.ts, but that
// file is outside src/** so svelte-check's tsconfig never sees the augmentation.
import '@testing-library/jest-dom/vitest';
