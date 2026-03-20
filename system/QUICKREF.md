# Congre-Admin AI Agent - Quick Reference (Hardened)

**Version:** 2.0.0  
**Last Updated:** 2026-03-20

Quick reference card for using the hardened AI agent system.

---

## Entry Point

**Start here:** `/system/prompt.md`

This file defines the agent's role, priorities, priority resolution hierarchy, and references all supporting documents.

---

## The Execution Loop (8 Phases - MANDATORY)

```
[0] PRE-FLIGHT → [1] ANALYZE → [2] PLAN → [3] IMPLEMENT → 
[4] VALIDATE → [5] REFINE → [6] POST-FLIGHT → [7] OUTPUT
```

| Phase | Purpose | Exit Criteria |
|-------|---------|---------------|
| **0. Pre-Flight** | Restate task, identify ambiguities | Task clear, assumptions listed |
| **1. Analyze** | Read docs, identify constraints | All relevant docs read |
| **2. Plan** | Break into atomic tasks | Tasks atomic, tests defined |
| **3. Implement** | Code one task at a time | All tasks done, tests written |
| **4. Validate** | L1-L5 validation checklist | L1-L4 PASS, L5 PASS/deferred |
| **5. Refine** | Fix validation failures | All blockers fixed |
| **6. Post-Flight** | Final confirmation | All 10 checks PASS |
| **7. Output** | Deliver per output-spec | Format compliant |

**This loop is MANDATORY. You CANNOT skip any phase.**

---

## Stop Condition (EXPLICIT)

Execution terminates ONLY when ALL are true:

1. ✅ L1-L4 validation PASS
2. ✅ L5 validation PASS or deferred (L5-01 mandatory)
3. ✅ Zero rule violations (SEC-*, ARC-*, COD-*, DAT-*, TST-*)
4. ✅ Post-flight check all 10 PASS
5. ✅ Output matches output-spec.md

**If ANY condition is false → Return to Phase 5 (Refine)**

---

## Validation Levels

| Level | Name | Priority | Pass Condition |
|-------|------|----------|----------------|
| **L1** | Compilation | BLOCKER | Zero TypeScript errors |
| **L2** | Functional | BLOCKER | 100% requirements met |
| **L3** | Security | BLOCKER | Zero security violations |
| **L4** | Architecture | BLOCKER | Zero architecture violations |
| **L5** | Quality | DEFERRABLE | Most pass, L5-01 mandatory |

---

## Critical Rules (Top 20)

| ID | Rule | Category |
|----|------|----------|
| **SEC-01** | MUST NOT expose `enc_` fields in public views | Security |
| **SEC-03** | MUST use AES-GCM for encryption | Security |
| **SEC-09** | MUST NOT store Master Key in localStorage | Security |
| **ARC-01** | MUST route all data through Core DataService | Architecture |
| **ARC-02** | MUST NOT import directly between modules | Architecture |
| **ARC-06** | MUST implement soft delete (`_deleted`) | Architecture |
| **COD-01** | MUST use TypeScript strict mode | Code |
| **COD-02** | MUST NOT use `any` without justification | Code |
| **DAT-01** | MUST use JSONata for transformations | Data |
| **DAT-03** | MUST sanitize `enc_` fields for public views | Data |
| **TST-01** | MUST write tests for all new features | Testing |
| **TST-02** | MUST achieve 100% coverage on crypto | Testing |
| **UI-01** | MUST NOT hardcode strings (use i18n) | UI/UX |
| **UI-02** | MUST use Material Design 3 components | UI/UX |

**Full list:** `/system/rules.md` (91 rules total)

---

## Assumption Protocol (MANDATORY)

**You MUST NOT silently assume missing information.**

### Assumption Classes

| Class | Description | Action |
|-------|-------------|--------|
| **A (Blocker)** | Security, data loss, conflicts | MUST ask - CANNOT assume |
| **B (High)** | API contracts, permissions | SHOULD ask - can assume if blocked |
| **C (Medium)** | UI details, patterns | CAN assume with documentation |
| **D (Low)** | Placeholders, organization | CAN assume silently |

### Documentation Format

```markdown
## Assumptions Made

### Assumption [ID]: [Title]
- **Location:** `path/to/file.ts`
- **What:** [Statement]
- **Why:** [Rationale]
- **Impact:** [Low/Medium/High]
- **Class:** [B or C]
```

---

## Priority Resolution Hierarchy

When conflicts occur:

1. **System Prompt** (`prompt.md`) - Highest
2. **Rules** (`rules.md`) - MUST comply
3. **Output Spec** (`output-spec.md`) - Format
4. **Acceptance** (`acceptance.md`) - Validation
5. **User Request** - Implementation

**Lower yields to higher.**

---

## Output Format (Required Sections)

```markdown
## Summary
[Brief description]

## Files Changed
### NEW: `path/to/file.ts`
### MODIFIED: `path/to/file.ts`

## Code Content
[Full files or diffs]

## Tests
[Test locations and summary]

## Documentation Updates
[Files updated]

## Validation Report
[L1-L5 results with checklists]

## Post-Flight Check
[10 checks with status]

---

**Validated by:** AI Agent
**Date:** YYYY-MM-DD
**Result:** PASS / FAIL
**Confidence:** High / Medium / Low
```

---

## Pre-Flight Checklist (Phase 0)

- [ ] Task restated in own words
- [ ] Request type identified
- [ ] Ambiguities listed
- [ ] Assumptions documented
- [ ] Plan outline provided

---

## Post-Flight Checklist (Phase 6)

- [ ] PF-01: All required files present
- [ ] PF-02: Code complete (no TODOs)
- [ ] PF-03: Code consistent
- [ ] PF-04: All rules followed
- [ ] PF-05: Acceptance criteria satisfied
- [ ] PF-06: Validation report included
- [ ] PF-07: Assumptions documented
- [ ] PF-08: CHANGELOG updated
- [ ] PF-09: Tests included and passing
- [ ] PF-10: Documentation updates included

---

## When to Ask for Clarification (BLOCKER)

**MUST ask when:**

- ❌ Security requirements unclear
- ❌ Data loss risk identified
- ❌ Conflicting requirements
- ❌ Missing core specification
- ❌ API contract undefined
- ❌ Permission model unclear

**CANNOT assume Class A items.**

---

## Key Documentation

| Category | Document | Purpose |
|----------|----------|---------|
| **System** | `system/prompt.md` | Entry point |
| **Workflow** | `system/execution.md` | 8-phase loop |
| **Rules** | `system/rules.md` | 91 rules |
| **Validation** | `system/acceptance.md` | L1-L5 criteria |
| **Output** | `system/output-spec.md` | Format contract |
| **Assumptions** | `system/error-handling.md` | Protocol |
| **Architecture** | `docs/architecture/Arquitectura.md` | Core/Plugin |
| **Tech Stack** | `docs/architecture/Tecnologia.md` | React, MUI |
| **API** | `docs/architecture/API.md` | Backend protocol |
| **UI/UX** | `docs/architecture/Interfaz.md` | M3 components |
| **Security** | `docs/architecture/Permisos.md` | RBAC |
| **i18n** | `docs/architecture/Localizacion.md` | Translation |

---

## Examples

| Example | File | Description |
|---------|------|-------------|
| New Component | `examples/01-new-component.md` | PersonaCard (GOLD STANDARD) |
| Index | `examples/README.md` | All examples |

---

## Rule Index by Category

| Category | MUST | MUST NOT | SHOULD | Total |
|----------|------|----------|--------|-------|
| Security (SEC) | 8 | 4 | 3 | 15 |
| Architecture (ARC) | 8 | 4 | 3 | 15 |
| Code (COD) | 7 | 5 | 5 | 17 |
| Data (DAT) | 6 | 3 | 3 | 12 |
| Testing (TST) | 5 | 2 | 3 | 10 |
| UI/UX (UI) | 7 | 3 | 5 | 15 |
| Documentation (DOC) | 4 | 0 | 3 | 7 |
| **TOTAL** | **45** | **21** | **25** | **91** |

---

## Quick Checklist (Before Delivery)

- [ ] All 8 execution phases completed
- [ ] L1-L4 validation PASS
- [ ] L5 validation PASS or deferred (L5-01 PASS)
- [ ] Zero SEC-* violations
- [ ] Zero ARC-* violations
- [ ] Zero COD-* violations (or documented)
- [ ] Zero DAT-* violations
- [ ] Zero TST-* violations
- [ ] All assumptions documented
- [ ] Validation report included
- [ ] Post-flight check included
- [ ] CHANGELOG updated

---

## File Structure

```
congre-admin-1/
├── system/                 # AI Agent Specification (HARDENED)
│   ├── prompt.md           # Entry point (v2.0.0)
│   ├── execution.md        # 8-phase loop (v2.0.0)
│   ├── output-spec.md      # Output format (v1.0.0)
│   ├── rules.md            # 91 rules (v2.0.0)
│   ├── acceptance.md       # L1-L5 validation (v2.0.0)
│   ├── error-handling.md   # Assumption protocol (v2.0.0)
│   └── QUICKREF.md         # Quick reference (v2.0.0)
├── examples/               # Worked examples
│   ├── README.md           # Index
│   └── 01-new-component.md # Gold standard (v2.0.0)
├── docs/                   # Technical documentation
│   ├── architecture/       # System architecture
│   └── modules/            # Module specifications
├── src/                    # Frontend source
└── backend/                # Backend reference
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-03-20 | Hardened system (8 phases, 91 rules, L1-L5) |
| 1.0.0 | 2026-03-20 | Initial production system |

---

**This quick reference is for the HARDENED system (v2.0.0).**
