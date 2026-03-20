# Congre-Admin AI Agent - Acceptance Criteria (Hardened)

**Version:** 2.0.0  
**Last Updated:** 2026-03-20

---

## Validation Levels

| Level | Name | Description | Priority |
|-------|------|-------------|----------|
| L1 | Compilation | Code compiles without errors | BLOCKER |
| L2 | Functional | Code works as specified | BLOCKER |
| L3 | Security | Security rules are followed | BLOCKER |
| L4 | Architecture | Architecture patterns are followed | BLOCKER |
| L5 | Quality | Code quality standards met | DEFERRABLE |

---

## L1: Compilation Validation (BLOCKER)

### Checklist

| ID | Criterion | How to Validate | Pass Condition |
|----|-----------|-----------------|----------------|
| L1-01 | TypeScript compiles | `tsc --noEmit` produces no errors | Zero errors |
| L1-02 | No syntax errors | All files parse correctly | Zero errors |
| L1-03 | All imports resolve | No "module not found" errors | Zero errors |
| L1-04 | Types are defined | No implicit `any` types | Zero implicit any |
| L1-05 | JSX is valid | All components render without JSX errors | Zero errors |

### Pass Criteria
- **ALL** L1 criteria MUST pass
- Zero TypeScript errors allowed
- Zero syntax errors allowed

**L1 Result:** ✅ PASS / ❌ FAIL

---

## L2: Functional Validation (BLOCKER)

### Checklist

| ID | Criterion | How to Validate | Pass Condition |
|----|-----------|-----------------|----------------|
| L2-01 | Requirements met | All specified features are implemented | 100% implemented |
| L2-02 | Tests pass | All unit tests pass (`npm test`) | 100% pass |
| L2-03 | Edge cases handled | Null, undefined, empty states handled | All handled |
| L2-04 | Error handling | Errors are caught and displayed appropriately | All caught |
| L2-05 | Data persistence | Data survives page refresh (if applicable) | Verified |
| L2-06 | Offline support | Offline mode works (if applicable) | Verified |

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

**L2 Result:** ✅ PASS / ❌ FAIL

---

## L3: Security Validation (BLOCKER)

### Checklist

| ID | Criterion | How to Validate | Pass Condition |
|----|-----------|-----------------|----------------|
| L3-01 | No exposed `enc_` fields | Review all public views for encrypted field exposure | Zero exposures |
| L3-02 | Auth validation | Protected routes check `sessionToken` | All routes protected |
| L3-03 | No hardcoded secrets | Search for keys, passwords, tokens in code | Zero found |
| L3-04 | Input sanitization | All user inputs are sanitized | All sanitized |
| L3-05 | No sensitive logs | Review console.log statements for PII | Zero PII in logs |
| L3-06 | CORS configured | Backend validates request origins | CORS headers present |
| L3-07 | Encryption algorithm | Uses AES-GCM, not XXTEA or other | AES-GCM only |
| L3-08 | IV uniqueness | Each encryption uses unique 12-byte IV | Verified unique |
| L3-09 | Key derivation | Uses PBKDF2 with 600,000 iterations | Verified iterations |
| L3-10 | No Master Key storage | MK not stored in localStorage | Zero MK storage |

### Pass Criteria
- **ALL** L3 criteria MUST pass
- Zero security violations allowed
- Any security issue is CRITICAL and blocks delivery

**L3 Result:** ✅ PASS / ❌ FAIL

---

## L4: Architecture Validation (BLOCKER)

### Checklist

| ID | Criterion | How to Validate | Pass Condition |
|----|-----------|-----------------|----------------|
| L4-01 | Core/Plugin pattern | Modules are independent, Core provides services | Pattern followed |
| L4-02 | No direct module imports | Modules don't import from each other | Zero cross-imports |
| L4-03 | DataService usage | All data operations use Core DataService | All use DataService |
| L4-04 | Dynamic imports | Plugins loaded via dynamic import | All lazy loaded |
| L4-05 | Manifest registration | New modules have manifest.json | Manifest present |
| L4-06 | Soft delete | Uses `_deleted` field, not physical delete | Soft delete only |
| L4-07 | Versioning | Records include `_v` and `_ts` fields | Both fields present |
| L4-08 | Primary keys | All tables use `id` as primary key | All use `id` |
| L4-09 | No global CSS | Modules use Tailwind or CSS Modules | Zero global CSS |
| L4-10 | Sync Queue | Offline operations use IndexedDB queue | Queue used |

### Pass Criteria
- **ALL** applicable L4 criteria MUST pass
- Architecture violations MUST be fixed before delivery

**L4 Result:** ✅ PASS / ❌ FAIL

---

## L5: Quality Validation (DEFERRABLE)

### Checklist

| ID | Criterion | How to Validate | Pass Condition |
|----|-----------|-----------------|----------------|
| L5-01 | No hardcoded strings | All UI text uses i18n keys | All use `t()` |
| L5-02 | M3 components | Uses Material Design 3 components | MUI components used |
| L5-03 | Responsive design | Works on mobile and desktop | Both viewports work |
| L5-04 | Loading states | Shows skeletons during async operations | Skeletons present |
| L5-05 | Error messages | User-friendly error messages | All errors localized |
| L5-06 | JSDoc comments | Public APIs have documentation | All exported APIs documented |
| L5-07 | ESLint passes | No linting errors | Zero lint errors |
| L5-08 | Naming conventions | Follows camelCase/PascalCase rules | All names correct |
| L5-09 | Function length | Functions are <50 lines | All functions <50 lines |
| L5-10 | No console.log | Production code has no debug logs | Zero console.log |
| L5-11 | CHANGELOG updated | Changes documented in CHANGELOG.md | Entry present |
| L5-12 | Module docs updated | Relevant `/docs/modules/` files updated | Docs updated |

### Pass Criteria
- **MOST** L5 criteria SHOULD pass
- Minor violations can be deferred with documentation
- **L5-01 (i18n) is MANDATORY** - cannot be deferred

**L5 Result:** ✅ PASS / ⚠️ PASS WITH DEFERRALS / ❌ FAIL

---

## Validation Report Format (MANDATORY)

The agent MUST produce a validation report in this format:

```markdown
## Validation Report

### L1: Compilation
| ID | Criterion | Status | Notes |
|----|-----------|--------|-------|
| L1-01 | TypeScript compiles | ✅ PASS | - |
| L1-02 | No syntax errors | ✅ PASS | - |
| L1-03 | All imports resolve | ✅ PASS | - |
| L1-04 | Types are defined | ✅ PASS | - |
| L1-05 | JSX is valid | ✅ PASS | - |

**L1 Result:** ✅ PASS

### L2: Functional
| ID | Criterion | Status | Notes |
|----|-----------|--------|-------|
| L2-01 | Requirements met | ✅ PASS | All 5 features implemented |
| L2-02 | Tests pass | ✅ PASS | 23/23 tests passing |
| L2-03 | Edge cases handled | ✅ PASS | - |
| L2-04 | Error handling | ✅ PASS | - |
| L2-05 | Data persistence | ✅ PASS | Verified |
| L2-06 | Offline support | ✅ PASS | Verified |

**L2 Result:** ✅ PASS

### L3: Security
| ID | Criterion | Status | Notes |
|----|-----------|--------|-------|
| L3-01 | No exposed enc_ fields | ✅ PASS | Reviewed all public views |
| L3-02 | Auth validation | ✅ PASS | All routes protected |
| L3-03 | No hardcoded secrets | ✅ PASS | - |
| L3-04 | Input sanitization | ✅ PASS | - |
| L3-05 | No sensitive logs | ✅ PASS | - |
| L3-06 | CORS configured | ✅ PASS | - |
| L3-07 | Encryption algorithm | ✅ PASS | AES-GCM used |
| L3-08 | IV uniqueness | ✅ PASS | - |
| L3-09 | Key derivation | ✅ PASS | 600k iterations |
| L3-10 | No Master Key storage | ✅ PASS | - |

**L3 Result:** ✅ PASS

### L4: Architecture
| ID | Criterion | Status | Notes |
|----|-----------|--------|-------|
| L4-01 | Core/Plugin pattern | ✅ PASS | - |
| L4-02 | No direct module imports | ✅ PASS | - |
| L4-03 | DataService usage | ✅ PASS | - |
| L4-04 | Dynamic imports | ✅ PASS | - |
| L4-05 | Manifest registration | ✅ PASS | - |
| L4-06 | Soft delete | ✅ PASS | - |
| L4-07 | Versioning | ✅ PASS | - |
| L4-08 | Primary keys | ✅ PASS | - |
| L4-09 | No global CSS | ✅ PASS | - |
| L4-10 | Sync Queue | ✅ PASS | - |

**L4 Result:** ✅ PASS

### L5: Quality
| ID | Criterion | Status | Notes |
|----|-----------|--------|-------|
| L5-01 | No hardcoded strings | ✅ PASS | All i18n keys |
| L5-02 | M3 components | ✅ PASS | - |
| L5-03 | Responsive design | ✅ PASS | - |
| L5-04 | Loading states | ✅ PASS | - |
| L5-05 | Error messages | ✅ PASS | - |
| L5-06 | JSDoc comments | ✅ PASS | - |
| L5-07 | ESLint passes | ✅ PASS | - |
| L5-08 | Naming conventions | ✅ PASS | - |
| L5-09 | Function length | ⚠️ DEFERRED | Legacy code - see notes |
| L5-10 | No console.log | ✅ PASS | - |
| L5-11 | CHANGELOG updated | ✅ PASS | - |
| L5-12 | Module docs updated | ✅ PASS | - |

**L5 Result:** ⚠️ PASS WITH DEFERRALS

---

## Overall Result: ✅ PASS

### Deferred Items
| ID | Criterion | Reason | Planned Resolution |
|----|-----------|--------|-------------------|
| L5-09 | Function length | Legacy code refactor | Sprint 2 |
```

---

## Failure Handling Protocol

### If Validation Fails:

1. **Identify all failures** by level (L1-L5)
2. **Prioritize by severity:**
   - **L1 (Compilation)** - BLOCKER - Fix immediately
   - **L3 (Security)** - BLOCKER - Fix immediately
   - **L2 (Functional)** - BLOCKER - Fix immediately
   - **L4 (Architecture)** - BLOCKER - Fix immediately
   - **L5 (Quality)** - MEDIUM - Can defer with documentation
3. **Fix failures** in priority order
4. **Re-run validation** (return to Phase 4)
5. **Repeat** until all blocker issues are resolved

### Stop Condition:
The agent CANNOT proceed to output until:
- L1 Result: PASS
- L2 Result: PASS
- L3 Result: PASS
- L4 Result: PASS
- L5 Result: PASS or PASS WITH DEFERRALS (with L5-01 PASS)

---

## Self-Validation Requirement (MANDATORY)

**The agent MUST run this validation checklist on EVERY output before delivery.**

This is NOT optional. The validation report MUST be included in the final output.

**Failure to include validation report is a rule violation (DOC-01).**

---

## Acceptance Sign-Off (MANDATORY)

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

## Priority Resolution

When validation criteria conflict, follow this priority:

1. **L3 (Security)** - Highest priority - never compromise
2. **L1 (Compilation)** - Must compile
3. **L2 (Functional)** - Must work as specified
4. **L4 (Architecture)** - Must follow architecture
5. **L5 (Quality)** - Can defer with documentation (except L5-01)

---

**Version:** 2.0.0  
**Last Updated:** 2026-03-20
