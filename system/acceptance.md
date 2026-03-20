# Congre-Admin AI Agent - Acceptance Criteria

This document defines how all outputs MUST be validated before delivery. The agent MUST use this checklist for self-validation.

---

## Validation Levels

| Level | Name | Description |
|-------|------|-------------|
| L1 | Compilation | Code compiles without errors |
| L2 | Functional | Code works as specified |
| L3 | Security | Security rules are followed |
| L4 | Architecture | Architecture patterns are followed |
| L5 | Quality | Code quality standards met |

---

## L1: Compilation Validation

### Checklist

| # | Criterion | How to Validate |
|---|-----------|-----------------|
| L1-01 | TypeScript compiles | `tsc --noEmit` produces no errors |
| L1-02 | No syntax errors | All files parse correctly |
| L1-03 | All imports resolve | No "module not found" errors |
| L1-04 | Types are defined | No implicit `any` types |
| L1-05 | JSX is valid | All components render without JSX errors |

### Pass Criteria
- **ALL** L1 criteria MUST pass
- Zero TypeScript errors allowed
- Zero syntax errors allowed

---

## L2: Functional Validation

### Checklist

| # | Criterion | How to Validate |
|---|-----------|-----------------|
| L2-01 | Requirements met | All specified features are implemented |
| L2-02 | Tests pass | All unit tests pass (`npm test`) |
| L2-03 | Edge cases handled | Null, undefined, empty states handled |
| L2-04 | Error handling | Errors are caught and displayed appropriately |
| L2-05 | Data persistence | Data survives page refresh (if applicable) |
| L2-06 | Offline support | Offline mode works (if applicable) |

### Pass Criteria
- **ALL** applicable L2 criteria MUST pass
- 100% of specified requirements implemented
- All tests must pass

### Test Coverage Requirements

| Component Type | Minimum Coverage |
|----------------|------------------|
| Crypto functions | 100% |
| Core services | 80% |
| UI components | 70% |
| Business logic | 90% |

---

## L3: Security Validation

### Checklist

| # | Criterion | How to Validate |
|---|-----------|-----------------|
| L3-01 | No exposed `enc_` fields | Review all public views for encrypted field exposure |
| L3-02 | Auth validation | Protected routes check `sessionToken` |
| L3-03 | No hardcoded secrets | Search for keys, passwords, tokens in code |
| L3-04 | Input sanitization | All user inputs are sanitized |
| L3-05 | No sensitive logs | Review console.log statements for PII |
| L3-06 | CORS configured | Backend validates request origins |
| L3-07 | Encryption algorithm | Uses AES-GCM, not XXTEA or other |
| L3-08 | IV uniqueness | Each encryption uses unique 12-byte IV |
| L3-09 | Key derivation | Uses PBKDF2 with 600,000 iterations |
| L3-10 | No Master Key storage | MK not stored in localStorage |

### Pass Criteria
- **ALL** L3 criteria MUST pass
- Zero security violations allowed
- Any security issue is CRITICAL and blocks delivery

---

## L4: Architecture Validation

### Checklist

| # | Criterion | How to Validate |
|---|-----------|-----------------|
| L4-01 | Core/Plugin pattern | Modules are independent, Core provides services |
| L4-02 | No direct module imports | Modules don't import from each other |
| L4-03 | DataService usage | All data operations use Core DataService |
| L4-04 | Dynamic imports | Plugins loaded via dynamic import |
| L4-05 | Manifest registration | New modules have manifest.json |
| L4-06 | Soft delete | Uses `_deleted` field, not physical delete |
| L4-07 | Versioning | Records include `_v` and `_ts` fields |
| L4-08 | Primary keys | All tables use `id` as primary key |
| L4-09 | No global CSS | Modules use Tailwind or CSS Modules |
| L4-10 | Sync Queue | Offline operations use IndexedDB queue |

### Pass Criteria
- **ALL** applicable L4 criteria MUST pass
- Architecture violations MUST be fixed before delivery

---

## L5: Quality Validation

### Checklist

| # | Criterion | How to Validate |
|---|-----------|-----------------|
| L5-01 | No hardcoded strings | All UI text uses i18n keys |
| L5-02 | M3 components | Uses Material Design 3 components |
| L5-03 | Responsive design | Works on mobile and desktop |
| L5-04 | Loading states | Shows skeletons during async operations |
| L5-05 | Error messages | User-friendly error messages |
| L5-06 | JSDoc comments | Public APIs have documentation |
| L5-07 | ESLint passes | No linting errors |
| L5-08 | Naming conventions | Follows camelCase/PascalCase rules |
| L5-09 | Function length | Functions are <50 lines |
| L5-10 | No console.log | Production code has no debug logs |
| L5-11 | CHANGELOG updated | Changes documented in CHANGELOG.md |
| L5-12 | Module docs updated | Relevant `/docs/modules/` files updated |

### Pass Criteria
- **MOST** L5 criteria SHOULD pass
- Minor violations can be deferred with documentation
- i18n compliance (L5-01) is MANDATORY

---

## Validation Report Format

The agent MUST produce a validation report in this format:

```markdown
## Validation Report

### L1: Compilation
| Criterion | Status | Notes |
|-----------|--------|-------|
| TypeScript compiles | ✅ Pass | - |
| No syntax errors | ✅ Pass | - |
| ... | ... | ... |

**L1 Result:** ✅ PASS / ❌ FAIL

### L2: Functional
| Criterion | Status | Notes |
|-----------|--------|-------|
| Requirements met | ✅ Pass | All 5 features implemented |
| Tests pass | ✅ Pass | 23/23 tests passing |
| ... | ... | ... |

**L2 Result:** ✅ PASS / ❌ FAIL

### L3: Security
| Criterion | Status | Notes |
|-----------|--------|-------|
| No exposed enc_ fields | ✅ Pass | Reviewed all public views |
| Auth validation | ✅ Pass | All routes protected |
| ... | ... | ... |

**L3 Result:** ✅ PASS / ❌ FAIL

### L4: Architecture
| Criterion | Status | Notes |
|-----------|--------|-------|
| Core/Plugin pattern | ✅ Pass | - |
| No direct module imports | ✅ Pass | - |
| ... | ... | ... |

**L4 Result:** ✅ PASS / ❌ FAIL

### L5: Quality
| Criterion | Status | Notes |
|-----------|--------|-------|
| No hardcoded strings | ✅ Pass | All i18n keys |
| M3 components | ✅ Pass | - |
| ... | ⚠️ Deferred | Documented in technical debt |

**L5 Result:** ✅ PASS / ⚠️ PASS WITH DEFERRALS / ❌ FAIL

---

## Overall Result: ✅ PASS / ❌ FAIL

### Deferred Items (if any)
| ID | Criterion | Reason | Planned Resolution |
|----|-----------|--------|-------------------|
| L5-09 | Function length | Legacy code refactor | Sprint 2 |
```

---

## Failure Handling

### If Validation Fails:

1. **Identify all failures** by level (L1-L5)
2. **Prioritize by severity:**
   - L1 (Compilation) - BLOCKER
   - L3 (Security) - BLOCKER
   - L2 (Functional) - BLOCKER
   - L4 (Architecture) - HIGH
   - L5 (Quality) - MEDIUM
3. **Fix failures** in priority order
4. **Re-run validation**
5. **Repeat** until all blocker issues are resolved

### If Requirements Are Unclear:

1. **Document the ambiguity** in validation report
2. **State assumptions** made
3. **Flag for review** in output summary
4. **Proceed** with implementation based on best judgment

---

## Self-Validation Requirement

**The agent MUST run this validation checklist on EVERY output before delivery.**

This is not optional. The validation report MUST be included in the final output.

---

## Acceptance Sign-Off

At the end of each validation report, the agent MUST include:

```markdown
---

**Validated by:** AI Agent  
**Date:** YYYY-MM-DD  
**Result:** PASS / FAIL  
**Confidence:** High / Medium / Low

**Notes:** [Any additional context or concerns]
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20
