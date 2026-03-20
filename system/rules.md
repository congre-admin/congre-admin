# Congre-Admin AI Agent - Rules and Constraints (Hardened)

**Version:** 2.0.0  
**Last Updated:** 2026-03-20

---

## Rule Language Specification

All rules in this system use RFC 2119 directive keywords:

| Keyword | Meaning | Enforceability |
|---------|---------|----------------|
| **MUST** | Mandatory requirement | Non-compliance blocks delivery |
| **MUST NOT** | Forbidden behavior | Non-compliance blocks delivery |
| **SHOULD** | Recommended practice | Non-compliance requires justification |
| **SHOULD NOT** | Discouraged practice | Non-compliance requires justification |

---

## Category 1: Security Rules (CRITICAL - BLOCKER)

### SEC-01: Encrypted Field Exposure
**Rule:** MUST NOT expose fields with `enc_` prefix in public views.  
**Test:** `grep -r "enc_" src/modules/*/views/*Public*` returns no field accesses.  
**Rationale:** Zero-Knowledge architecture requirement.

### SEC-02: Session Validation
**Rule:** MUST validate `sessionToken` before any protected operation.  
**Test:** All protected routes include session check.  
**Rationale:** Prevents unauthorized access.

### SEC-03: Encryption Algorithm
**Rule:** MUST use AES-GCM for all field-level encryption.  
**Test:** No XXTEA or other encryption in codebase.  
**Rationale:** Specification requirement (`Tecnologia.md`).

### SEC-04: IV Uniqueness
**Rule:** MUST generate unique 12-byte IV for each encryption operation.  
**Test:** `crypto.getRandomValues()` called before each `encrypt()` call.  
**Rationale:** Prevents cryptographic attacks.

### SEC-05: Key Derivation
**Rule:** MUST derive keys using PBKDF2-HMAC-SHA256 with 600,000 iterations.  
**Test:** `pbkdf2` call includes `iterations: 600000`.  
**Rationale:** OWASP compliance.

### SEC-06: Sensitive Data Logging
**Rule:** MUST NOT log passwords, keys, or PII.  
**Test:** No `console.log` contains `password`, `key`, `token`, or `enc_`.  
**Rationale:** Security best practice.

### SEC-07: Input Sanitization
**Rule:** MUST sanitize all user inputs before storage.  
**Test:** All form inputs pass through sanitizer function.  
**Rationale:** Prevents XSS and injection attacks.

### SEC-08: CORS Validation
**Rule:** MUST implement CORS validation on backend.  
**Test:** Backend includes `Access-Control-Allow-Origin` validation.  
**Rationale:** Prevents CSRF attacks.

### SEC-09: Master Key Storage
**Rule:** MUST NOT store Master Key in localStorage.  
**Test:** No `localStorage.setItem` contains `masterKey` or `mk`.  
**Rationale:** Security risk - use memory or secure enclave.

### SEC-10: Credential Transmission
**Rule:** MUST NOT transmit credentials in plain text.  
**Test:** All auth requests use HTTPS and encrypted payloads.  
**Rationale:** Security best practice.

### SEC-11: TypeScript Strict Mode
**Rule:** MUST NOT disable TypeScript strict mode.  
**Test:** `tsconfig.json` has `"strict": true`.  
**Rationale:** Type safety is a security feature.

### SEC-12: Eval Usage
**Rule:** MUST NOT use `eval()` or `Function()` constructors.  
**Test:** `grep -r "eval\|new Function" src/` returns no results.  
**Rationale:** Code injection risk.

### SEC-13: Rate Limiting
**Rule:** SHOULD implement rate limiting on auth endpoints.  
**Test:** Auth endpoints include request throttling.  
**Rationale:** Prevents brute force attacks.

### SEC-14: Content Security Policy
**Rule:** SHOULD use Content Security Policy headers.  
**Test:** HTTP headers include `Content-Security-Policy`.  
**Rationale:** Defense in depth.

### SEC-15: JSONata Validation
**Rule:** SHOULD validate JSONata expressions before execution.  
**Test:** JSONata strings pass validation before `evaluate()` call.  
**Rationale:** Prevents injection attacks.

---

## Category 2: Architecture Rules (HIGH - BLOCKER)

### ARC-01: DataService Routing
**Rule:** MUST route all data operations through Core DataService.  
**Test:** No direct `fetch` calls in modules - all use `dataService.*`.  
**Rationale:** Ensures encryption transparency.

### ARC-02: Module Isolation
**Rule:** MUST NOT import directly between modules.  
**Test:** No `import` statements cross `src/modules/*/` boundaries.  
**Rationale:** Maintains module isolation.

### ARC-03: Dynamic Imports
**Rule:** MUST use dynamic imports for plugin loading.  
**Test:** Plugin routes use `React.lazy(() => import(...))`.  
**Rationale:** Enables lazy loading.

### ARC-04: Core/Plugin Pattern
**Rule:** MUST follow Core/Plugin architecture from `Arquitectura.md`.  
**Test:** Modules register via manifest.json, Core provides services.  
**Rationale:** System design requirement.

### ARC-05: Manifest Registration
**Rule:** MUST use manifest.json for plugin registration.  
**Test:** Each module has `manifest.json` with required fields.  
**Rationale:** Enables dynamic discovery.

### ARC-06: Soft Delete
**Rule:** MUST implement soft delete with `_deleted` field.  
**Test:** Delete operations set `_deleted: true`, not physical delete.  
**Rationale:** Data integrity requirement.

### ARC-07: Versioning
**Rule:** MUST include `_v` and `_ts` fields in all records.  
**Test:** All data schemas include `_v: number` and `_ts: string`.  
**Rationale:** Enables conflict resolution.

### ARC-08: Primary Key
**Rule:** MUST use `id` as primary key for all tables.  
**Test:** All data access uses `id` field as unique identifier.  
**Rationale:** API protocol requirement.

### ARC-09: Circular Dependencies
**Rule:** MUST NOT create circular dependencies.  
**Test:** Build completes without circular dependency warnings.  
**Rationale:** Prevents build and runtime issues.

### ARC-10: Global CSS
**Rule:** MUST NOT use global CSS in modules.  
**Test:** Modules use Tailwind or CSS Modules only.  
**Rationale:** Prevents style collisions.

### ARC-11: Sync Queue
**Rule:** MUST NOT bypass Sync Queue for offline operations.  
**Test:** Offline writes use IndexedDB queue, not direct storage.  
**Rationale:** Data consistency requirement.

### ARC-12: Hardcoded IDs
**Rule:** MUST NOT hardcode spreadsheet IDs.  
**Test:** No hardcoded `ssId` values - all from config.  
**Rationale:** Environment portability.

### ARC-13: Test Co-location
**Rule:** SHOULD co-locate tests with source files.  
**Test:** Test files adjacent to source (`.test.tsx`).  
**Rationale:** Improves maintainability.

### ARC-14: Component Reuse
**Rule:** SHOULD use existing components from `CongreAdmin-UI`.  
**Test:** No duplicate component implementations.  
**Rationale:** Consistency and reusability.

### ARC-15: Dashboard Widgets
**Rule:** SHOULD implement widgets for dashboard summaries.  
**Test:** Dashboard includes module widgets with queries.  
**Rationale:** User experience requirement.

---

## Category 3: Code Quality Rules (HIGH - BLOCKER)

### COD-01: TypeScript Strict
**Rule:** MUST use TypeScript strict mode.  
**Test:** `tsconfig.json` has `"strict": true`.  
**Rationale:** Type safety.

### COD-02: Any Type
**Rule:** MUST NOT use `any` type without explicit justification.  
**Test:** No `: any` without `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.  
**Rationale:** Type safety.

### COD-03: Return Types
**Rule:** MUST define explicit return types for public functions.  
**Test:** All `export function` have `: ReturnType`.  
**Rationale:** API clarity.

### COD-04: Promise Rejection
**Rule:** MUST handle all Promise rejections.  
**Test:** All `async/await` have try-catch or `.catch()`.  
**Rationale:** Prevents unhandled errors.

### COD-05: External Input
**Rule:** MUST validate all external inputs.  
**Test:** API responses validated before use.  
**Rationale:** Data integrity.

### COD-06: ESLint
**Rule:** MUST use ESLint without disabling rules.  
**Test:** `npm run lint` passes with no warnings.  
**Rationale:** Code quality.

### COD-07: Test Passage
**Rule:** MUST pass all tests before marking task complete.  
**Test:** `npm test` returns 100% pass rate.  
**Rationale:** Quality gate.

### COD-08: Console Logs
**Rule:** MUST NOT leave `console.log()` in production code.  
**Test:** `grep -r "console.log" src/` returns no results.  
**Rationale:** Clean logs.

### COD-09: Deprecated APIs
**Rule:** MUST NOT use deprecated APIs.  
**Test:** No TypeScript deprecation warnings.  
**Rationale:** Future compatibility.

### COD-10: TypeScript Errors
**Rule:** MUST NOT commit code with TypeScript errors.  
**Test:** `tsc --noEmit` passes.  
**Rationale:** Build integrity.

### COD-11: Var Usage
**Rule:** MUST NOT use `var` - use `const` or `let`.  
**Test:** `grep -r "\\bvar\\b" src/` returns no results.  
**Rationale:** Modern JavaScript.

### COD-12: Parameter Mutation
**Rule:** MUST NOT mutate function parameters.  
**Test:** No reassignment of parameter values.  
**Rationale:** Predictable behavior.

### COD-13: Functional Patterns
**Rule:** SHOULD use functional programming patterns.  
**Test:** Pure functions, no side effects.  
**Rationale:** Predictability and testability.

### COD-14: Function Length
**Rule:** SHOULD keep functions under 50 lines.  
**Test:** Function length < 50 lines.  
**Rationale:** Readability.

### COD-15: Variable Names
**Rule:** SHOULD use descriptive variable names.  
**Test:** Variable names are self-documenting.  
**Rationale:** Code clarity.

### COD-16: JSDoc
**Rule:** SHOULD add JSDoc for public APIs.  
**Test:** Exported functions have JSDoc comments.  
**Rationale:** Documentation.

### COD-17: Immutability
**Rule:** SHOULD prefer immutability (spread operator, `Object.freeze`).  
**Test:** No direct object mutations.  
**Rationale:** Predictable state.

---

## Category 4: UI/UX Rules (MEDIUM - DEFERRABLE)

### UI-01: Hardcoded Strings
**Rule:** MUST NOT hardcode strings - use i18n keys.  
**Test:** No string literals in JSX - all use `t('key')`.  
**Rationale:** Per `Localizacion.md`.

### UI-02: M3 Components
**Rule:** MUST use Material Design 3 components.  
**Test:** UI uses `@mui/material` components.  
**Rationale:** Design system requirement.

### UI-03: Responsive Layouts
**Rule:** MUST implement mobile-first responsive layouts.  
**Test:** Components work on mobile (<600px) and desktop.  
**Rationale:** User accessibility.

### UI-04: Loading States
**Rule:** MUST show loading states (skeletons) for async operations.  
**Test:** Async components show skeleton during load.  
**Rationale:** User feedback.

### UI-05: Error Messages
**Rule:** MUST display error messages in user's language.  
**Test:** Errors use i18n keys.  
**Rationale:** User experience.

### UI-06: Admin Icon
**Rule:** MUST use `shield_lock` icon for admin-only sections.  
**Test:** Admin menu items include `shield_lock` icon.  
**Rationale:** Visual consistency.

### UI-07: Offline Indicators
**Rule:** MUST implement offline indicators.  
**Test:** UI shows offline status when disconnected.  
**Rationale:** Transparency.

### UI-08: Font Fallbacks
**Rule:** MUST NOT use custom fonts without fallbacks.  
**Test:** Font stacks include system fallbacks.  
**Rationale:** Accessibility.

### UI-09: Mobile Zoom
**Rule:** MUST NOT disable zoom on mobile.  
**Test:** No `user-scalable=no` in viewport meta.  
**Rationale:** Accessibility.

### UI-10: Color Communication
**Rule:** MUST NOT use color as the only means of communication.  
**Test:** Color indicators have text/icon alternatives.  
**Rationale:** Accessibility.

### UI-11: Tailwind CSS
**Rule:** SHOULD use Tailwind CSS for custom styling.  
**Test:** Custom styles use Tailwind classes.  
**Rationale:** Consistency.

### UI-12: Dark Mode
**Rule:** SHOULD implement dark mode support.  
**Test:** Components respect `prefers-color-scheme`.  
**Rationale:** User preference.

### UI-13: Animations
**Rule:** SHOULD use framer-motion for animations.  
**Test:** Animations use framer-motion library.  
**Rationale:** Polish.

### UI-14: Optimistic UI
**Rule:** SHOULD show optimistic UI updates.  
**Test:** UI updates before server confirmation.  
**Rationale:** Perceived performance.

### UI-15: Snackbars
**Rule:** SHOULD use snackbars for success messages.  
**Test:** Success messages use MUI Snackbar.  
**Rationale:** M3 pattern.

---

## Category 5: Data Rules (HIGH - BLOCKER)

### DAT-01: JSONata Transformations
**Rule:** MUST use JSONata for data transformations.  
**Test:** Data transformations use `jsonata.evaluate()`.  
**Rationale:** Per `Tecnologia.md`.

### DAT-02: Schema Validation
**Rule:** MUST validate data against schema before save.  
**Test:** Save operations include schema validation.  
**Rationale:** Data integrity.

### DAT-03: Public View Sanitization
**Rule:** MUST sanitize data for public views (remove `enc_` fields).  
**Test:** Public views filter `enc_` fields.  
**Rationale:** Security.

### DAT-04: Date Format
**Rule:** MUST use ISO 8601 format for all dates.  
**Test:** All dates are `YYYY-MM-DD` or ISO strings.  
**Rationale:** Consistency.

### DAT-05: UUID for IDs
**Rule:** MUST use UUID for all record IDs.  
**Test:** IDs are UUID format (not sequential).  
**Rationale:** Collision prevention.

### DAT-06: Batch Operations
**Rule:** MUST implement batch operations for bulk data.  
**Test:** Bulk operations use `batchGetData`/`batchSaveData`.  
**Rationale:** Performance.

### DAT-07: PII Storage
**Rule:** MUST NOT store unencrypted PII in localStorage.  
**Test:** localStorage contains no PII fields.  
**Rationale:** Security.

### DAT-08: Cell Limit
**Rule:** MUST NOT exceed Google Sheets 10M cell limit.  
**Test:** Sheet size monitored, archival triggered at 8M.  
**Rationale:** Platform constraint.

### DAT-09: Physical Delete
**Rule:** MUST NOT delete records physically (use soft delete).  
**Test:** Delete sets `_deleted: true`.  
**Rationale:** Audit trail.

### DAT-10: Pagination
**Rule:** SHOULD implement data pagination.  
**Test:** Large lists use pagination.  
**Rationale:** Performance.

### DAT-11: Caching
**Rule:** SHOULD cache frequently accessed data.  
**Test:** Config/schema data cached.  
**Rationale:** Performance.

### DAT-12: Data Export
**Rule:** SHOULD implement data export (JSON, CSV, PDF).  
**Test:** Export functions available for key entities.  
**Rationale:** User utility.

---

## Category 6: Testing Rules (HIGH - BLOCKER)

### TST-01: New Feature Tests
**Rule:** MUST write tests for all new features.  
**Test:** New files have `.test.tsx` companions.  
**Rationale:** Quality assurance.

### TST-02: Crypto Coverage
**Rule:** MUST achieve 100% coverage on crypto functions.  
**Test:** Crypto tests cover all branches.  
**Rationale:** Security critical.

### TST-03: Core Coverage
**Rule:** MUST achieve 80% coverage on Core modules.  
**Test:** Coverage report shows ≥80%.  
**Rationale:** Quality gate.

### TST-04: Auth Flow Tests
**Rule:** MUST test authentication flows end-to-end.  
**Test:** E2E tests cover login/logout/session.  
**Rationale:** Security validation.

### TST-05: Offline Sync Tests
**Rule:** MUST test offline sync scenarios.  
**Test:** Tests cover offline→online transition.  
**Rationale:** Reliability.

### TST-06: Test Skipping
**Rule:** MUST NOT skip tests due to time constraints.  
**Test:** No `.skip()` in test files.  
**Rationale:** Quality gate.

### TST-07: Crypto Mocking
**Rule:** MUST NOT mock cryptographic functions in integration tests.  
**Test:** Integration tests use real crypto.  
**Rationale:** Security validation.

### TST-08: Test Co-location
**Rule:** SHOULD co-locate test files with source.  
**Test:** Tests adjacent to source files.  
**Rationale:** Maintainability.

### TST-09: Test Names
**Rule:** SHOULD use descriptive test names.  
**Test:** Test names describe behavior (`it('should...')`).  
**Rationale:** Clarity.

### TST-10: Edge Cases
**Rule:** SHOULD test edge cases and error conditions.  
**Test:** Tests cover null, empty, error states.  
**Rationale:** Robustness.

---

## Category 7: Documentation Rules (MEDIUM - DEFERRABLE)

### DOC-01: CHANGELOG Updates
**Rule:** MUST update CHANGELOG.md for all changes.  
**Test:** CHANGELOG.md includes current date entry.  
**Rationale:** Traceability.

### DOC-02: Public API Documentation
**Rule:** MUST document all public APIs with JSDoc.  
**Test:** Exported functions have JSDoc.  
**Rationale:** API clarity.

### DOC-03: Security Code Documentation
**Rule:** MUST document security-sensitive code.  
**Test:** Crypto/auth code has inline comments.  
**Rationale:** Audit trail.

### DOC-04: Module Documentation
**Rule:** MUST follow `Guia_Documentacion.md` for module specs.  
**Test:** Module docs follow standard structure.  
**Rationale:** Consistency.

### DOC-05: Documentation Examples
**Rule:** SHOULD include examples in documentation.  
**Test:** Docs include usage examples.  
**Rationale:** Usability.

### DOC-06: README Maintenance
**Rule:** SHOULD keep README.md up to date.  
**Test:** README reflects current state.  
**Rationale:** Project clarity.

### DOC-07: Assumption Documentation
**Rule:** SHOULD document assumptions in code comments.  
**Test:** Assumptions noted in comments.  
**Rationale:** Clarity.

---

## Category 8: Operational Optimization Rules (SHOULD - NON-BLOCKER)

### Cost-Awareness

| ID | Rule | Rationale |
|----|------|-----------|
| **COST-01** | SHOULD prefer simplest solution that satisfies all requirements | Prevents over-engineering |
| **COST-02** | MUST avoid unnecessary abstractions, layers, or components | Minimizes complexity |
| **COST-03** | SHOULD minimize total implementation size when possible | Efficiency |
| **COST-04** | SHOULD reuse existing components before creating new ones | Reusability |
| **COST-05** | MUST NOT add dependencies without justification | Dependency control |

### Convergence Optimization

| ID | Rule | Rationale |
|----|------|-----------|
| **CONV-01** | SHOULD prioritize fixes that resolve multiple issues simultaneously | Iteration efficiency |
| **CONV-02** | SHOULD minimize number of iterations to reach compliance | Speed |
| **CONV-03** | SHOULD group related issues to enable efficient correction | Reviewer efficiency |
| **CONV-04** | SHOULD fix cascading issues in single iteration | Cascade prevention |

### Controlled Determinism

| ID | Rule | Rationale |
|----|------|-----------|
| **DET-01** | SHOULD prefer consistent reasoning paths over alternative valid approaches | Reproducibility |
| **DET-02** | SHOULD avoid unnecessary creativity when standard solution exists | Pattern consistency |
| **DET-03** | MUST prioritize reproducibility across runs | Determinism |
| **DET-04** | SHOULD follow established patterns from `/docs/` and `/src/` | Consistency |
| **DET-05** | MUST NOT introduce novel solutions when existing patterns suffice | Pattern adherence |

### Convergence Safety

| ID | Rule | Rationale |
|----|------|-----------|
| **SAFE-01** | MUST escalate if iteration count unchanged 2x | Stall prevention |
| **SAFE-02** | MUST escalate if fix scope expanding | Scope control |
| **SAFE-03** | MUST escalate if root cause unclear | Root-cause focus |
| **SAFE-04** | SHOULD prioritize root-cause fixes over superficial corrections | Effective fixes |

---

## Rule Violation Handling

### Critical Violations (SEC-*, ARC-*)
**Action:** MUST fix before any output.  
**Reporting:** Must explicitly call out in validation section.  
**Consequence:** Output blocked until resolved.

### High Violations (COD-*, DAT-*, TST-*)
**Action:** MUST fix before output, unless documented as technical debt.  
**Reporting:** Must list in validation section with remediation plan.  
**Consequence:** Output blocked unless deferral justified.

### Medium Violations (UI-*, DOC-*)
**Action:** SHOULD fix, but can defer with documentation.  
**Reporting:** Should note in output for future resolution.  
**Consequence:** Output allowed with deferral log.

---

## Rule Index Summary

| Category | MUST | MUST NOT | SHOULD | Total | Priority |
|----------|------|----------|--------|-------|----------|
| Security (SEC) | 8 | 4 | 3 | 15 | CRITICAL |
| Architecture (ARC) | 8 | 4 | 3 | 15 | HIGH |
| Code Quality (COD) | 7 | 5 | 5 | 17 | HIGH |
| UI/UX (UI) | 7 | 3 | 5 | 15 | MEDIUM |
| Data (DAT) | 6 | 3 | 3 | 12 | HIGH |
| Testing (TST) | 5 | 2 | 3 | 10 | HIGH |
| Documentation (DOC) | 4 | 0 | 3 | 7 | MEDIUM |
| **TOTAL** | **45** | **21** | **25** | **91** | |

---

## Testability Requirement

**Every rule MUST be testable.** A rule is testable if:
1. Compliance can be verified via automated check (grep, lint, test)
2. Compliance can be verified via manual code review
3. Non-compliance produces observable evidence

Rules that fail testability MUST be rewritten or removed.
