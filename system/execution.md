# Congre-Admin AI Agent - Execution Loop (Hardened)

**Version:** 2.0.0  
**Last Updated:** 2026-03-20

---

## The Execution Loop (Mandatory)

```
┌─────────────────────────────────────────────────────────────┐
│  LOOP START                                                 │
│  ↓                                                          │
│  [0] PRE-FLIGHT CHECK                                       │
│  ↓                                                          │
│  [1] ANALYZE REQUIREMENTS                                   │
│  ↓                                                          │
│  [2] DECOMPOSE & PLAN                                       │
│  ↓                                                          │
│  [3] IMPLEMENT                                              │
│  ↓                                                          │
│  [4] VALIDATE (HARDENED)                                    │
│  ↓                                                          │
│  [5] REFINE (if validation fails) ──┐                       │
│  ↓                                  │                       │
│  [6] POST-FLIGHT CHECK                │                       │
│  ↓                                  │                       │
│  [7] OUTPUT                         │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**This loop is MANDATORY.** The agent MUST NOT skip any phase.

---

## Phase 0: Pre-Flight Check (MANDATORY)

**Purpose:** Ensure task clarity and identify ambiguities BEFORE analysis.

### Actions:

1. **Restate the task** in agent's own words
2. **Identify the request type:**
   - New feature
   - Bug fix
   - Refactoring
   - Documentation
   - Other
3. **Identify missing or ambiguous requirements**
4. **Produce a structured plan outline**

### Output Format:

```markdown
## Pre-Flight Check

### Task Restatement
[Agent restates the task in its own words]

### Request Type
[New feature | Bug fix | Refactoring | Documentation | Other]

### Identified Ambiguities
- [List of ambiguous or missing requirements]

### Assumptions Required
- [List of assumptions that must be documented]

### Initial Plan Outline
1. [High-level step 1]
2. [High-level step 2]
3. [High-level step 3]
```

### Exit Criteria (ALL MUST PASS):
- [ ] Task restated clearly
- [ ] Ambiguities identified
- [ ] Assumptions listed
- [ ] Plan outline provided

### Blocker Detection:
If ANY of the following are true, MUST request clarification (see `error-handling.md`):
- Security requirements unclear
- Data loss risk identified
- Conflicting requirements detected
- Missing core specification

---

## Phase 1: Analyze Requirements (MANDATORY)

**Purpose:** Ensure complete understanding before any implementation.

### Actions:

1. **Read the task description** completely
2. **Identify the module(s) affected** by checking `/docs/modules/`
3. **Identify architecture documents** that apply:
   - New feature? → Read `Arquitectura.md`, `Tecnologia.md`
   - UI component? → Read `Interfaz.md`
   - API change? → Read `API.md`, `Backend.md`
   - Security-related? → Read `Permisos.md`, `Testing.md`
4. **Check for existing implementations** in `/src/` that can be reused
5. **Identify ambiguities** or missing information

### Exit Criteria (ALL MUST PASS):
- [ ] All relevant documentation has been read
- [ ] Ambiguities are identified and documented
- [ ] Task scope is clearly understood

### If Ambiguities Exist:
Follow `/system/error-handling.md` to request clarification or document assumptions.

---

## Phase 2: Decompose & Plan (MANDATORY)

**Purpose:** Break the task into atomic, testable units.

### Actions:

1. **Create a task breakdown** with numbered steps
2. **Identify dependencies** between tasks
3. **Estimate complexity** (Low/Medium/High) for each task
4. **Define acceptance tests** for each task
5. **Order tasks** for sequential implementation
6. **List required assumptions** with impact assessment

### Output Format:

```markdown
## Implementation Plan

### Task 1: [Name]
- **Description:** What will be done
- **Files affected:** List of files to create/modify
- **Complexity:** Low/Medium/High
- **Dependencies:** [Task IDs or "None"]
- **Tests:** What tests will validate this
- **Assumptions:** [Any assumptions for this task]

### Task 2: [Name]
...
```

### Exit Criteria (ALL MUST PASS):
- [ ] All tasks are atomic (can be tested independently)
- [ ] Dependencies are explicit
- [ ] Each task has clear acceptance criteria
- [ ] Assumptions documented

---

## Phase 3: Implement (MANDATORY)

**Purpose:** Produce working, tested code.

### Actions:

1. **Follow the plan** from Phase 2
2. **Implement one task at a time**
3. **Write tests alongside code** (co-located `.test.tsx` or `.test.ts` files)
4. **Apply rules** from `/system/rules.md` throughout
5. **Use existing patterns** from `/src/` (if files exist) or `/docs/`
6. **Document assumptions** in code comments

### Code Standards:

- **TypeScript:** Strict mode, no `any` unless documented
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Structure:** Follow `/docs/architecture/Estructura_Proyecto.md`
- **i18n:** No hardcoded strings (use `t('key.path')`)
- **Security:** Never expose `enc_` fields in public views

### Exit Criteria (ALL MUST PASS):
- [ ] All planned tasks are implemented
- [ ] All code has corresponding tests
- [ ] Code follows style guidelines
- [ ] Assumptions documented

---

## Phase 4: Validate (HARDENED - MANDATORY)

**Purpose:** Ensure the implementation meets ALL requirements.

**This phase CANNOT be skipped.** Validation is a BLOCKER step.

### Validation Checklist (Checklist-Driven):

#### L1: Compilation (BLOCKER)
- [ ] L1-01: TypeScript compiles (`tsc --noEmit` produces no errors)
- [ ] L1-02: No syntax errors (all files parse correctly)
- [ ] L1-03: All imports resolve (no "module not found" errors)
- [ ] L1-04: Types are defined (no implicit `any` types)
- [ ] L1-05: JSX is valid (all components render without JSX errors)

**L1 Pass Criteria:** ALL MUST pass. Zero errors allowed.

#### L2: Functional (BLOCKER)
- [ ] L2-01: Requirements met (all specified features implemented)
- [ ] L2-02: Tests pass (all unit tests pass)
- [ ] L2-03: Edge cases handled (null, undefined, empty states)
- [ ] L2-04: Error handling (errors caught and displayed)
- [ ] L2-05: Data persistence (data survives refresh if applicable)
- [ ] L2-06: Offline support (offline mode works if applicable)

**L2 Pass Criteria:** ALL applicable MUST pass. 100% requirements implemented.

#### L3: Security (BLOCKER)
- [ ] L3-01: No exposed `enc_` fields (review all public views)
- [ ] L3-02: Auth validation (protected routes check `sessionToken`)
- [ ] L3-03: No hardcoded secrets (search for keys, passwords, tokens)
- [ ] L3-04: Input sanitization (all user inputs sanitized)
- [ ] L3-05: No sensitive logs (no console.log with PII)
- [ ] L3-06: Encryption algorithm (uses AES-GCM, not XXTEA)
- [ ] L3-07: IV uniqueness (unique 12-byte IV per encryption)
- [ ] L3-08: Key derivation (PBKDF2 with 600,000 iterations)
- [ ] L3-09: No Master Key storage (MK not in localStorage)

**L3 Pass Criteria:** ALL MUST pass. Zero security violations allowed.

#### L4: Architecture (BLOCKER)
- [ ] L4-01: Core/Plugin pattern (modules independent, Core provides services)
- [ ] L4-02: No direct module imports (modules don't import from each other)
- [ ] L4-03: DataService usage (all data operations use Core DataService)
- [ ] L4-04: Dynamic imports (plugins loaded via dynamic import)
- [ ] L4-05: Manifest registration (new modules have manifest.json)
- [ ] L4-06: Soft delete (uses `_deleted` field)
- [ ] L4-07: Versioning (records include `_v` and `_ts` fields)
- [ ] L4-08: Primary keys (all tables use `id` as primary key)
- [ ] L4-09: No global CSS (modules use Tailwind or CSS Modules)
- [ ] L4-10: Sync Queue (offline operations use IndexedDB queue)

**L4 Pass Criteria:** ALL applicable MUST pass. Architecture violations MUST be fixed.

#### L5: Quality (DEFERRABLE)
- [ ] L5-01: No hardcoded strings (all UI text uses i18n keys)
- [ ] L5-02: M3 components (uses Material Design 3)
- [ ] L5-03: Responsive design (works on mobile and desktop)
- [ ] L5-04: Loading states (shows skeletons during async)
- [ ] L5-05: Error messages (user-friendly, in user's language)
- [ ] L5-06: JSDoc comments (public APIs documented)
- [ ] L5-07: ESLint passes (no linting errors)
- [ ] L5-08: Naming conventions (follows camelCase/PascalCase)
- [ ] L5-09: Function length (functions <50 lines)
- [ ] L5-10: No console.log (production code has no debug logs)
- [ ] L5-11: CHANGELOG updated (changes documented)
- [ ] L5-12: Module docs updated (relevant docs updated)

**L5 Pass Criteria:** MOST SHOULD pass. L5-01 (i18n) is MANDATORY. Minor violations can be deferred with documentation.

### Validation Report Format (MANDATORY):

```markdown
## Validation Report

### L1: Compilation
| Criterion | Status | Notes |
|-----------|--------|-------|
| L1-01 | ✅ PASS / ❌ FAIL | [Notes] |
...

**L1 Result:** ✅ PASS / ❌ FAIL

### L2: Functional
...

**L2 Result:** ✅ PASS / ❌ FAIL

### L3: Security
...

**L3 Result:** ✅ PASS / ❌ FAIL

### L4: Architecture
...

**L4 Result:** ✅ PASS / ❌ FAIL

### L5: Quality
...

**L5 Result:** ✅ PASS / ⚠️ PASS WITH DEFERRALS / ❌ FAIL

---

## Overall Result: ✅ PASS / ❌ FAIL

### Failed Checks (if any)
| ID | Criterion | Status | Remediation |
|----|-----------|--------|-------------|
| L3-01 | No exposed enc_ | ❌ FAIL | Will fix before output |

### Deferred Items (if any)
| ID | Criterion | Reason | Planned Resolution |
|----|-----------|--------|-------------------|
| L5-09 | Function length | Legacy code | Sprint 2 |
```

### Exit Criteria (ALL MUST PASS):
- [ ] L1 result: PASS
- [ ] L2 result: PASS
- [ ] L3 result: PASS
- [ ] L4 result: PASS
- [ ] L5 result: PASS or PASS WITH DEFERRALS
- [ ] All blocker failures resolved

---

## Phase 5: Refine (CONDITIONAL - MANDATORY IF VALIDATION FAILS)

**Purpose:** Fix any issues found during validation.

### Trigger:
This phase is **REQUIRED** if Phase 4 validation fails ANY blocker check (L1-L4).

### Actions:

1. **List all validation failures**
2. **Prioritize by severity:**
   - **Critical (L3 Security):** MUST fix immediately
   - **High (L1 Compilation, L2 Functional, L4 Architecture):** MUST fix before output
   - **Medium (L5 Quality):** SHOULD fix, can defer with documentation
3. **Fix issues** in priority order
4. **Re-run validation** (Phase 4)
5. **Repeat** until all blocker issues resolved

### Exit Criteria (ALL MUST PASS):
- [ ] All critical and high-priority issues resolved
- [ ] Medium and low issues tracked for future resolution
- [ ] Re-validation passes all blocker checks

---

## Phase 6: Post-Flight Check (MANDATORY)

**Purpose:** Final confirmation before output delivery.

**This phase CANNOT be skipped.** Post-flight check is a BLOCKER step.

### Actions:

1. **Confirm all required files are present**
2. **Confirm code is complete and consistent**
3. **Confirm all rules are followed**
4. **Confirm acceptance criteria are satisfied**
5. **Confirm validation report is included**

### Post-Flight Checklist:

- [ ] **PF-01:** All required files present (per output-spec.md)
- [ ] **PF-02:** Code is complete (no TODOs without tracking)
- [ ] **PF-03:** Code is consistent (naming, style, patterns)
- [ ] **PF-04:** All rules followed (per rules.md)
- [ ] **PF-05:** Acceptance criteria satisfied (per acceptance.md)
- [ ] **PF-06:** Validation report included
- [ ] **PF-07:** Assumptions documented
- [ ] **PF-08:** CHANGELOG updated (if applicable)
- [ ] **PF-09:** Tests included and passing
- [ ] **PF-10:** Documentation updates included

### Exit Criteria (ALL MUST PASS):
- [ ] All 10 post-flight checks pass

---

## Phase 7: Output (MANDATORY)

**Purpose:** Deliver the final result in the expected format.

### Output Requirements:

1. **File structure** MUST match `/system/output-spec.md`
2. **Code blocks** MUST include full file paths
3. **Changes** MUST be clearly marked (new/modified/deleted)
4. **Tests** MUST be included
5. **Documentation updates** MUST be included
6. **Validation report** MUST be included
7. **Post-flight check** MUST be included

### Output Format:

```markdown
## Summary

[Brief description of what was implemented]

## Files Changed

### NEW: `path/to/file.ts`
[Full file content]

### MODIFIED: `path/to/file.ts`
[Diff format]

## Tests

[Location and summary of test files]

## Documentation Updates

[Files updated in /docs/]

## Validation Report

[Full validation report from Phase 4]

## Post-Flight Check

| Check | Status |
|-------|--------|
| PF-01 | ✅ PASS |
...

**Post-Flight Result:** ✅ PASS

---

**Validated by:** AI Agent  
**Date:** YYYY-MM-DD  
**Result:** PASS / FAIL  
**Confidence:** High / Medium / Low
```

---

## Stop Condition (EXPLICIT)

**The execution loop terminates ONLY when ALL of the following are true:**

1. ✅ All acceptance criteria are satisfied (L1-L4 PASS, L5 PASS or deferred)
2. ✅ No rule violations remain (SEC-*, ARC-*, COD-*, DAT-*, TST-*)
3. ✅ Output fully matches the output specification
4. ✅ Post-flight check passes (all 10 checks)
5. ✅ Validation report included and shows PASS

**If ANY condition is false, the agent MUST:**
- Return to Phase 5 (Refine)
- Fix the failing checks
- Re-run validation (Phase 4)
- Re-run post-flight check (Phase 6)
- Repeat until ALL conditions are true

---

## Loop Enforcement

**This loop is MANDATORY and NON-NEGOTIABLE.**

The agent MUST:
- Complete ALL phases in order
- NOT skip any phase
- NOT proceed to next phase until exit criteria met
- Return to Phase 5 if validation fails
- Terminate ONLY when stop conditions are met

**Violation of this loop is a CRITICAL rule violation (SEC-01 equivalent).**

---

## Priority Resolution Hierarchy

When conflicts occur between documents or requirements, the agent MUST follow this priority order:

1. **System Prompt** (`/system/prompt.md`) - Highest authority
2. **Rules and Constraints** (`/system/rules.md`) - MUST comply
3. **Output Specification** (`/system/output-spec.md`) - Format requirement
4. **Acceptance Criteria** (`/system/acceptance.md`) - Validation requirement
5. **User Request** - Implementation target

**Lower-priority documents MUST yield to higher-priority documents.**

Example: If user request conflicts with a security rule, the security rule takes precedence.

---

**Version:** 2.0.0  
**Last Updated:** 2026-03-20
