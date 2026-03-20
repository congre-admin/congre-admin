# Congre-Admin AI Agent - Rules and Constraints

This document defines all behavioral rules for the AI agent using RFC 2119 keywords:
- **MUST** - Mandatory requirement
- **MUST NOT** - Forbidden behavior
- **SHOULD** - Recommended practice
- **SHOULD NOT** - Discouraged practice

---

## Category 1: Security Rules (CRITICAL)

### MUST Rules

| ID | Rule | Rationale |
|----|------|-----------|
| SEC-01 | MUST NOT expose `enc_` prefixed fields in public views | Zero-Knowledge architecture requirement |
| SEC-02 | MUST validate `sessionToken` before any protected operation | Prevents unauthorized access |
| SEC-03 | MUST use AES-GCM for all field-level encryption | Specification requirement per `Tecnologia.md` |
| SEC-04 | MUST generate unique IV (12 bytes) for each encryption operation | Prevents cryptographic attacks |
| SEC-05 | MUST derive keys using PBKDF2-HMAC-SHA256 with 600,000 iterations | OWASP compliance |
| SEC-06 | MUST NOT log sensitive data (passwords, keys, PII) | Security best practice |
| SEC-07 | MUST sanitize all user inputs before storage | Prevents XSS and injection attacks |
| SEC-08 | MUST implement CORS validation on backend | Prevents CSRF attacks |

### MUST NOT Rules

| ID | Rule | Rationale |
|----|------|-----------|
| SEC-09 | MUST NOT store Master Key in localStorage | Security risk - use memory or secure enclave |
| SEC-10 | MUST NOT transmit credentials in plain text | Security best practice |
| SEC-11 | MUST NOT disable TypeScript strict mode | Type safety is a security feature |
| SEC-12 | MUST NOT use `eval()` or `Function()` constructors | Code injection risk |

### SHOULD Rules

| ID | Rule | Rationale |
|----|------|-----------|
| SEC-13 | SHOULD implement rate limiting on auth endpoints | Prevents brute force attacks |
| SEC-14 | SHOULD use Content Security Policy headers | Defense in depth |
| SEC-15 | SHOULD validate JSONata expressions before execution | Prevents injection attacks |

---

## Category 2: Architecture Rules (HIGH)

### MUST Rules

| ID | Rule | Rationale |
|----|------|-----------|
| ARC-01 | MUST route all data operations through Core DataService | Ensures encryption transparency |
| ARC-02 | MUST NOT import directly between modules | Maintains module isolation |
| ARC-03 | MUST use dynamic imports for plugin loading | Enables lazy loading |
| ARC-04 | MUST follow Core/Plugin architecture from `Arquitectura.md` | System design requirement |
| ARC-05 | MUST use manifest.json for plugin registration | Enables dynamic discovery |
| ARC-06 | MUST implement soft delete with `_deleted` field | Data integrity requirement |
| ARC-07 | MUST include `_v` (version) and `_ts` (timestamp) fields | Enables conflict resolution |
| ARC-08 | MUST use `id` as primary key for all tables | API protocol requirement |

### MUST NOT Rules

| ID | Rule | Rationale |
|----|------|-----------|
| ARC-09 | MUST NOT create circular dependencies | Prevents build and runtime issues |
| ARC-10 | MUST NOT use global CSS in modules | Prevents style collisions |
| ARC-11 | MUST NOT bypass the Sync Queue for offline operations | Data consistency requirement |
| ARC-12 | MUST NOT hardcode spreadsheet IDs | Environment portability |

### SHOULD Rules

| ID | Rule | Rationale |
|----|------|-----------|
| ARC-13 | SHOULD co-locate tests with source files | Improves maintainability |
| ARC-14 | SHOULD use existing components from `CongreAdmin-UI` | Consistency and reusability |
| ARC-15 | SHOULD implement widgets for dashboard summaries | User experience requirement |

---

## Category 3: Code Quality Rules (HIGH)

### MUST Rules

| ID | Rule | Rationale |
|----|------|-----------|
| COD-01 | MUST use TypeScript strict mode | Type safety |
| COD-02 | MUST NOT use `any` type without explicit justification | Type safety |
| COD-03 | MUST define explicit return types for public functions | API clarity |
| COD-04 | MUST handle all Promise rejections | Prevents unhandled errors |
| COD-05 | MUST validate all external inputs | Data integrity |
| COD-06 | MUST use ESLint without disabling rules | Code quality |
| COD-07 | MUST pass all tests before marking task complete | Quality gate |

### MUST NOT Rules

| ID | Rule | Rationale |
|----|------|-----------|
| COD-08 | MUST NOT leave console.log() in production code | Clean logs |
| COD-09 | MUST NOT use deprecated APIs | Future compatibility |
| COD-10 | MUST NOT commit code with TypeScript errors | Build integrity |
| COD-11 | MUST NOT use `var` - use `const` or `let` | Modern JavaScript |
| COD-12 | MUST NOT mutate function parameters | Predictable behavior |

### SHOULD Rules

| ID | Rule | Rationale |
|----|------|-----------|
| COD-13 | SHOULD use functional programming patterns | Predictability and testability |
| COD-14 | SHOULD keep functions under 50 lines | Readability |
| COD-15 | SHOULD use descriptive variable names | Code clarity |
| COD-16 | SHOULD add JSDoc for public APIs | Documentation |
| COD-17 | SHOULD prefer immutability (spread operator, Object.freeze) | Predictable state |

---

## Category 4: UI/UX Rules (MEDIUM)

### MUST Rules

| ID | Rule | Rationale |
|----|------|-----------|
| UI-01 | MUST NOT hardcode strings - use i18n keys | Per `Localizacion.md` |
| UI-02 | MUST use Material Design 3 components | Design system requirement |
| UI-03 | MUST implement mobile-first responsive layouts | User accessibility |
| UI-04 | MUST show loading states (skeletons) for async operations | User feedback |
| UI-05 | MUST display error messages in user's language | User experience |
| UI-06 | MUST use `shield_lock` icon for admin-only sections | Visual consistency |
| UI-07 | MUST implement offline indicators | Transparency |

### MUST NOT Rules

| ID | Rule | Rationale |
|----|------|-----------|
| UI-08 | MUST NOT use custom fonts without fallbacks | Accessibility |
| UI-09 | MUST NOT disable zoom on mobile | Accessibility |
| UI-10 | MUST NOT use color as the only means of communication | Accessibility |

### SHOULD Rules

| ID | Rule | Rationale |
|----|------|-----------|
| UI-11 | SHOULD use Tailwind CSS for custom styling | Consistency |
| UI-12 | SHOULD implement dark mode support | User preference |
| UI-13 | SHOULD use framer-motion for animations | Polish |
| UI-14 | SHOULD show optimistic UI updates | Perceived performance |
| UI-15 | SHOULD use snackbars for success messages | M3 pattern |

---

## Category 5: Data Rules (HIGH)

### MUST Rules

| ID | Rule | Rationale |
|----|------|-----------|
| DAT-01 | MUST use JSONata for data transformations | Per `Tecnologia.md` |
| DAT-02 | MUST validate data against schema before save | Data integrity |
| DAT-03 | MUST sanitize data for public views (remove `enc_` fields) | Security |
| DAT-04 | MUST use ISO 8601 format for all dates | Consistency |
| DAT-05 | MUST use UUID for all record IDs | Collision prevention |
| DAT-06 | MUST implement batch operations for bulk data | Performance |

### MUST NOT Rules

| ID | Rule | Rationale |
|----|------|-----------|
| DAT-07 | MUST NOT store unencrypted PII in localStorage | Security |
| DAT-08 | MUST NOT exceed Google Sheets 10M cell limit | Platform constraint |
| DAT-09 | MUST NOT delete records physically (use soft delete) | Audit trail |

### SHOULD Rules

| ID | Rule | Rationale |
|----|------|-----------|
| DAT-10 | SHOULD implement data pagination | Performance |
| DAT-11 | SHOULD cache frequently accessed data | Performance |
| DAT-12 | SHOULD implement data export (JSON, CSV, PDF) | User utility |

---

## Category 6: Testing Rules (HIGH)

### MUST Rules

| ID | Rule | Rationale |
|----|------|-----------|
| TST-01 | MUST write tests for all new features | Quality assurance |
| TST-02 | MUST achieve 100% coverage on crypto functions | Security critical |
| TST-03 | MUST achieve 80% coverage on Core modules | Quality gate |
| TST-04 | MUST test authentication flows end-to-end | Security validation |
| TST-05 | MUST test offline sync scenarios | Reliability |

### MUST NOT Rules

| ID | Rule | Rationale |
|----|------|-----------|
| TST-06 | MUST NOT skip tests due to time constraints | Quality gate |
| TST-07 | MUST NOT mock cryptographic functions in integration tests | Security validation |

### SHOULD Rules

| ID | Rule | Rationale |
|----|------|-----------|
| TST-08 | SHOULD co-locate test files with source | Maintainability |
| TST-09 | SHOULD use descriptive test names | Clarity |
| TST-10 | SHOULD test edge cases and error conditions | Robustness |

---

## Category 7: Documentation Rules (MEDIUM)

### MUST Rules

| ID | Rule | Rationale |
|----|------|-----------|
| DOC-01 | MUST update CHANGELOG.md for all changes | Traceability |
| DOC-02 | MUST document all public APIs with JSDoc | API clarity |
| DOC-03 | MUST document security-sensitive code | Audit trail |
| DOC-04 | MUST follow `Guia_Documentacion.md` for module specs | Consistency |

### SHOULD Rules

| ID | Rule | Rationale |
|----|------|-----------|
| DOC-05 | SHOULD include examples in documentation | Usability |
| DOC-06 | SHOULD keep README.md up to date | Project clarity |
| DOC-07 | SHOULD document assumptions in code comments | Clarity |

---

## Rule Violation Handling

### Critical Violations (SEC-*, ARC-*)
- **Action:** MUST be fixed before any output
- **Reporting:** Must be explicitly called out in validation section

### High Violations (COD-*, DAT-*, TST-*)
- **Action:** MUST be fixed before output, unless documented as technical debt
- **Reporting:** Must be listed in validation section with remediation plan

### Medium Violations (UI-*, DOC-*)
- **Action:** SHOULD be fixed, but can be deferred with documentation
- **Reporting:** Should be noted in output for future resolution

---

## Rule Index by Priority

| Priority | Count | Categories |
|----------|-------|------------|
| Critical | 20 | Security (SEC-*) |
| High | 35 | Architecture (ARC-*), Code (COD-*), Data (DAT-*), Testing (TST-*) |
| Medium | 17 | UI/UX (UI-*), Documentation (DOC-*) |
| **Total** | **72** | |

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20
