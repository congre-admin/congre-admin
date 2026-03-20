# Congre-Admin AI Agent - Quick Reference

Quick reference card for using the AI agent system.

---

## Entry Point

**Start here:** `/system/prompt.md`

This file defines the agent's role, priorities, and references all supporting documents.

---

## The Execution Loop (Mandatory)

```
1. ANALYZE → 2. PLAN → 3. IMPLEMENT → 4. VALIDATE → 5. REFINE → 6. OUTPUT
```

| Phase | Purpose | Output |
|-------|---------|--------|
| **1. Analyze** | Read docs, identify ambiguities | Documentation log |
| **2. Plan** | Break into atomic tasks | Task list with tests |
| **3. Implement** | Code one task at a time | Working code + tests |
| **4. Validate** | Check against acceptance criteria | Validation report |
| **5. Refine** | Fix validation failures | Corrected code |
| **6. Output** | Deliver in specified format | Final response |

---

## Validation Levels

| Level | Name | Must Pass |
|-------|------|-----------|
| **L1** | Compilation | ✅ Always |
| **L2** | Functional | ✅ Always |
| **L3** | Security | ✅ Always (BLOCKER) |
| **L4** | Architecture | ✅ Always |
| **L5** | Quality | ⚠️ Can defer with notes |

---

## Critical Rules (Top 10)

| ID | Rule | Category |
|----|------|----------|
| **SEC-01** | MUST NOT expose `enc_` fields in public views | Security |
| **SEC-03** | MUST use AES-GCM for encryption | Security |
| **SEC-09** | MUST NOT store Master Key in localStorage | Security |
| **ARC-02** | MUST NOT import directly between modules | Architecture |
| **ARC-06** | MUST implement soft delete (`_deleted` field) | Architecture |
| **COD-01** | MUST use TypeScript strict mode | Code Quality |
| **COD-02** | MUST NOT use `any` type without justification | Code Quality |
| **UI-01** | MUST NOT hardcode strings (use i18n) | UI/UX |
| **DAT-03** | MUST sanitize `enc_` fields for public views | Data |
| **TST-01** | MUST write tests for all new features | Testing |

**Full list:** `/system/rules.md` (72 rules total)

---

## When to Ask for Clarification

**BLOCKER - Must Ask:**
- ❌ Security requirements unclear
- ❌ Data loss risk
- ❌ Conflicting requirements
- ❌ Missing core specification
- ❌ API contract undefined

**CAN Assume (document assumptions):**
- ✅ Minor UI details
- ✅ Standard patterns
- ✅ Default behaviors
- ✅ Placeholder text

**Full protocol:** `/system/error-handling.md`

---

## Output Format (Required Sections)

```markdown
## Summary
[Brief description]

## Files Changed
### NEW: `path/to/file.ts`
### MODIFIED: `path/to/file.ts`

## Tests
[Test locations]

## Documentation Updates
[Files updated]

## Validation
| Criterion | Status |
|-----------|--------|
| ... | ✅ Pass |
```

**Full spec:** `/system/output-spec.md`

---

## Key Documentation

| Category | Document | Purpose |
|----------|----------|---------|
| **Architecture** | `docs/architecture/Arquitectura.md` | Core/Plugin pattern |
| **Tech Stack** | `docs/architecture/Tecnologia.md` | React, MUI, TanStack |
| **API** | `docs/architecture/API.md` | Backend protocol |
| **UI/UX** | `docs/architecture/Interfaz.md` | M3 components |
| **Security** | `docs/architecture/Permisos.md` | RBAC matrix |
| **i18n** | `docs/architecture/Localizacion.md` | Translation strategy |
| **Modules** | `docs/modules/` | Module specifications |

---

## Examples

| Example | File | Description |
|---------|------|-------------|
| New Component | `examples/01-new-component.md` | PersonaCard with tests |
| New Module | `examples/README.md` | Full module walkthrough |
| Bug Fix | `examples/README.md` | Security fix pattern |

---

## Quick Checklist

Before delivering any output, verify:

- [ ] Execution loop followed (6 phases)
- [ ] All L1-L4 validation passes
- [ ] Security rules checked (SEC-*)
- [ ] No hardcoded strings (i18n keys used)
- [ ] Tests included
- [ ] Validation report included
- [ ] CHANGELOG updated (if applicable)

---

## File Structure

```
congre-admin-1/
├── system/              # AI Agent Specification
│   ├── prompt.md        # Entry point
│   ├── execution.md     # Workflow loop
│   ├── output-spec.md   # Output format
│   ├── rules.md         # 72 rules
│   ├── acceptance.md    # Validation criteria
│   └── error-handling.md # Ambiguity handling
├── examples/            # Worked examples
│   ├── README.md
│   └── 01-new-component.md
├── docs/                # Technical documentation
│   ├── architecture/    # System architecture
│   └── modules/         # Module specifications
├── src/                 # Frontend source
└── backend/             # Backend reference
```

---

**Version:** 2.0.0  
**Last Updated:** 2026-03-20
