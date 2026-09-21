/**
 * Central index for all golden test fixtures.
 * Re-exports new fixtures and wraps existing test-data.ts fixtures.
 */
export { RESIDENTIAL_LEASE } from './residential-lease';
export { NDA } from './nda';
export { SERVICE_AGREEMENT } from './service-agreement';
export { PRIVACY_POLICY } from './privacy-policy';
export { EDGE_CASE_SHORT } from './edge-case-short';
export { INJECTION_TRAP } from './injection-trap';
export { COMPARE_V1, COMPARE_V2 } from './compare-pair';

// Re-export existing fixtures from src/lib/test-data.ts
// We import them lazily in the runner since they use a different path.
