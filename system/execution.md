# Congre-Admin AI Agent - Execution Loop

This document defines the **mandatory workflow** that the AI agent MUST follow for every task. This is not a suggestion—it is a strict requirement.

---

## The Execution Loop

```
┌─────────────────────────────────────────────────────────────┐
│  LOOP START                                                 │
│  ↓                                                          │
│  [1] ANALYZE REQUIREMENTS                                   │
│  ↓                                                          │
│  [2] DECOMPOSE & PLAN                                       │
│  ↓                                                          │
│  [3] IMPLEMENT                                              │
│  ↓                                                          │
│  [4] VALIDATE                                               │
│  ↓                                                          │
│  [5] REFINE (if validation fails) ──┐                       │
│  ↓                                  │                       │
│  [6] OUTPUT                                             │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Analyze Requirements

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

### Exit Criteria:
- [ ] All relevant documentation has been read
- [ ] Ambiguities are identified and documented
- [ ] Task scope is clearly understood

### If Ambiguities Exist:
Follow `/system/error-handling.md` to request clarification or document assumptions.

---

## Phase 2: Decompose & Plan

**Purpose:** Break the task into atomic, testable units.

### Actions:

1. **Create a task breakdown** with numbered steps
2. **Identify dependencies** between tasks
3. **Estimate complexity** (Low/Medium/High) for each task
4. **Define acceptance tests** for each task
5. **Order tasks** for sequential implementation

### Output Format:

```markdown
## Implementation Plan

### Task 1: [Name]
- **Description:** What will be done
- **Files affected:** List of files to create/modify
- **Complexity:** Low/Medium/High
- **Tests:** What tests will validate this

### Task 2: [Name]
...
```

### Exit Criteria:
- [ ] All tasks are atomic (can be tested independently)
- [ ] Dependencies are explicit
- [ ] Each task has clear acceptance criteria

---

## Phase 3: Implement

**Purpose:** Produce working, tested code.

### Actions:

1. **Follow the plan** from Phase 2
2. **Implement one task at a time**
3. **Write tests alongside code** (co-located `.test.tsx` or `.test.ts` files)
4. **Apply rules** from `/system/rules.md` throughout
5. **Use existing patterns** from `/src/` (if files exist) or `/docs/`

### Code Standards:

- **TypeScript:** Strict mode, no `any` unless documented
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Structure:** Follow `/docs/architecture/Estructura_Proyecto.md`
- **i18n:** No hardcoded strings (use `t('key.path')`)
- **Security:** Never expose `enc_` fields in public views

### Exit Criteria:
- [ ] All planned tasks are implemented
- [ ] All code has corresponding tests
- [ ] Code follows style guidelines

---

## Phase 4: Validate

**Purpose:** Ensure the implementation meets all requirements.

### Validation Checklist:

#### Functional Correctness:
- [ ] Code compiles without errors (`tsc --noEmit`)
- [ ] Tests pass
- [ ] No TypeScript errors

#### Security Compliance:
- [ ] No `enc_` fields exposed in public views
- [ ] Authentication checks in place for protected routes
- [ ] No sensitive data in logs or console statements

#### Architecture Compliance:
- [ ] Modules do not import from each other directly
- [ ] Core services are used for data operations
- [ ] i18n keys used instead of hardcoded strings

#### Documentation:
- [ ] JSDoc comments for public APIs
- [ ] Complex logic has inline comments
- [ ] CHANGELOG.md updated (if applicable)

### Exit Criteria:
- [ ] All validation checks pass
- [ ] OR: Failures are documented with remediation plan

---

## Phase 5: Refine (Conditional)

**Purpose:** Fix any issues found during validation.

### Trigger:
This phase is **required** if Phase 4 validation fails.

### Actions:

1. **List all validation failures**
2. **Prioritize by severity:**
   - **Critical:** Security issues, compilation errors
   - **High:** Functional bugs, missing tests
   - **Medium:** Style violations, documentation gaps
   - **Low:** Minor improvements
3. **Fix issues** in priority order
4. **Re-run validation** (Phase 4)

### Exit Criteria:
- [ ] All critical and high-priority issues are resolved
- [ ] Medium and low issues are tracked for future resolution

---

## Phase 6: Output

**Purpose:** Deliver the final result in the expected format.

### Output Requirements:

1. **File structure** must match `/system/output-spec.md`
2. **Code blocks** must include full file paths
3. **Changes** must be clearly marked (new/modified/deleted)
4. **Tests** must be included
5. **Documentation updates** must be included

### Output Format:

```markdown
## Summary

[Brief description of what was implemented]

## Files Changed

### NEW: `path/to/file.ts`
```typescript
// Full file content
```

### MODIFIED: `path/to/file.ts`
```diff
// Show changes
```

## Tests

[Location of test files]

## Documentation Updates

[Files updated in /docs/]
```

---

## Loop Enforcement

**This loop is mandatory.** The agent MUST NOT skip phases or proceed to implementation without completing analysis and planning first.

If a task seems simple, the agent MUST still:
1. Read relevant documentation
2. Create a minimal plan
3. Validate before outputting

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20
