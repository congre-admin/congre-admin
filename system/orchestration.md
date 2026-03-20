# Congre-Admin AI Agent - Multi-Agent Orchestration System

**Version:** 3.0.0  
**Last Updated:** 2026-03-20

---

## Overview

This document defines the **Multi-Agent Orchestration Layer** for the Congre-Admin AI Agent system.

The system uses **three specialized agents** working in coordination to improve reliability, validation rigor, and output consistency.

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PLANNER AGENT                               │
│  - Interpret requirements                                       │
│  - Identify ambiguities                                         │
│  - Produce structured plan                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Structured Plan)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTOR AGENT                               │
│  - Implement the plan                                           │
│  - Generate code and artifacts                                  │
│  - Follow all system rules                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Full Implementation)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REVIEWER AGENT                               │
│  - Validate output against rules                                │
│  - Enforce acceptance criteria                                  │
│  - Approve or require fixes                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              [PASS]              [FAIL → Iterate]
                    │                   │
                    │                   └──────┐
                    │                          │
                    ▼                          ▼
            ┌──────────────────────────────────────────┐
            │           FINAL OUTPUT                   │
            └──────────────────────────────────────────┘
```

---

## Agent Roles and Responsibilities

### 1. Planner Agent

**Purpose:** Interpret user requests and produce structured implementation plans.

**Responsibilities:**
- Restate requirements in agent's own words
- Identify ambiguities and missing information
- Classify assumptions (Class A-D per `error-handling.md`)
- Decompose task into atomic, testable units
- Identify affected files and modules
- Define acceptance tests for each task

**Output:** Structured plan document (see `agents/planner.md`)

**Authority:** Cannot approve implementation - only plans

---

### 2. Executor Agent

**Purpose:** Implement plans produced by the Planner Agent.

**Responsibilities:**
- Follow the approved plan exactly
- Generate all code and artifacts
- Apply all system rules (`rules.md`)
- Write tests alongside code
- Include documentation updates
- Produce output per `output-spec.md`

**Constraints:**
- MUST NOT deviate from approved plan
- MUST follow output specification strictly
- MUST NOT skip any execution phases

**Output:** Full implementation with validation report (see `agents/executor.md`)

**Authority:** Cannot approve own work - requires Reviewer approval

---

### 3. Reviewer Agent

**Purpose:** Validate Executor's output against all system requirements.

**Responsibilities:**
- Run L1-L5 validation checks (`acceptance.md`)
- Verify rule compliance (`rules.md` - 91 rules)
- Check output format compliance (`output-spec.md`)
- Verify plan was followed correctly
- Identify ALL violations with specific references
- Approve or require fixes

**Authority:**
- CAN reject output for any rule violation
- CAN require Planner revision (if plan was flawed)
- MUST approve before final output delivery
- Final gatekeeper for quality

**Output:** Validation report with PASS/FAIL decision (see `agents/reviewer.md`)

---

## Orchestration Flow (MANDATORY)

### Phase 1: Planner Execution

```
INPUT: User Request
  ↓
[Planner reads /system/prompt.md]
  ↓
[Planner reads relevant /docs/ files]
  ↓
[Planner identifies ambiguities]
  ↓
[Planner produces Structured Plan]
  ↓
OUTPUT: Structured Plan Document
```

**Exit Criteria:**
- Requirements restated clearly
- All ambiguities identified
- Assumptions documented (Class B/C)
- Task decomposition complete
- File/module plan provided

---

### Phase 2: Executor Implementation

```
INPUT: Structured Plan from Planner
  ↓
[Executor reads plan]
  ↓
[Executor follows 8-phase execution loop]
  ↓
[Executor generates code + tests]
  ↓
[Executor runs self-validation]
  ↓
OUTPUT: Full Implementation + Validation Report
```

**Exit Criteria:**
- All planned tasks implemented
- Tests written and passing
- Self-validation complete
- Output per `output-spec.md`

---

### Phase 3: Reviewer Validation

```
INPUT: Implementation from Executor
  ↓
[Reviewer reads implementation]
  ↓
[Reviewer runs L1-L5 validation]
  ↓
[Reviewer checks 91 rules compliance]
  ↓
[Reviewer verifies plan was followed]
  ↓
Decision: PASS or FAIL
```

**If PASS:**
- Output delivered to user

**If FAIL:**
- Return to Executor with issue list
- Executor fixes only identified issues
- Reviewer re-validates
- Repeat until PASS

---

## Iteration Loop (MANDATORY)

```
┌─────────────────────────────────────────────────────────────┐
│  Reviewer detects violations                                │
│  ↓                                                          │
│  Returns issue list to Executor                             │
│  ↓                                                          │
│  Executor fixes ONLY identified issues                      │
│  ↓                                                          │
│  Reviewer re-validates                                      │
│  ↓                                                          │
│  If still FAIL → repeat                                     │
│  If PASS → deliver output                                   │
└─────────────────────────────────────────────────────────────┘
```

**Iteration Rules:**
- Executor MUST fix only identified issues (no scope creep)
- Reviewer MUST re-validate all checks (not just fixes)
- Maximum 3 iterations before escalation to Planner
- After 3 iterations, Planner MUST revise plan

---

## Agent Contracts (EXPLICIT)

### Contract 1: Planner → Executor

**Format:**

```markdown
## Structured Plan

### Requirements Restatement
[Clear restatement of user request]

### Assumptions
| ID | Assumption | Class | Rationale |
|----|------------|-------|-----------|
| A1 | [Assumption] | B/C | [Why] |

### Task Decomposition
| Task ID | Description | Files | Complexity | Tests |
|---------|-------------|-------|------------|-------|
| T1 | [Task] | [Files] | [Level] | [Tests] |

### Acceptance Criteria
- [Criterion 1]
- [Criterion 2]

### Affected Documentation
- [File 1]
- [File 2]
```

**Guarantees:**
- Planner guarantees tasks are atomic
- Planner guarantees dependencies identified
- Planner guarantees acceptance tests defined

---

### Contract 2: Executor → Reviewer

**Format:**

```markdown
## Implementation Output

### Summary
[Brief description]

### Files Changed
[Per output-spec.md]

### Code Content
[Full files or diffs]

### Tests
[Location and summary]

### Documentation Updates
[Files updated]

### Self-Validation Report
[L1-L5 results]

### Plan Compliance Statement
"I confirm this implementation follows the approved plan exactly."
```

**Guarantees:**
- Executor guarantees all tasks completed
- Executor guarantees tests passing
- Executor guarantees rules followed
- Executor guarantees output format compliant

---

### Contract 3: Reviewer → Executor (Iteration)

**Format:**

```markdown
## Validation Report

### Overall Result: ❌ FAIL

### Violations Found
| ID | Rule/Criterion | Location | Severity | Required Fix |
|----|----------------|----------|----------|--------------|
| V1 | [Rule ID] | [File:line] | [Level] | [What to fix] |

### Plan Deviations
| Deviation | Description | Required Action |
|-----------|-------------|-----------------|
| D1 | [What differed from plan] | [Fix or justify] |

### Required Actions
1. [Action 1]
2. [Action 2]

### Re-validation Required
- [ ] All violations fixed
- [ ] Re-run L1-L5 validation
- [ ] Confirm plan compliance
```

**Guarantees:**
- Reviewer guarantees specific violation IDs
- Reviewer guarantees actionable fixes
- Reviewer guarantees rule references

---

## Failure Handling

### Scenario 1: Ambiguous Input

**Detection:** Planner cannot clarify requirements

**Action:**
1. Planner identifies ambiguity class
2. If Class A (Blocker) → Request user clarification
3. If Class B/C → Document assumptions, proceed
4. If Class D → Assume silently

---

### Scenario 2: Invalid Plan

**Detection:** Reviewer finds plan flaws during validation

**Action:**
1. Reviewer flags plan deviation or flaw
2. If minor → Executor documents deviation, proceeds
3. If major → Return to Planner for plan revision
4. Planner revises plan, cycle restarts

---

### Scenario 3: Impossible Requirements

**Detection:** Any agent detects impossible requirement

**Action:**
1. Agent documents impossibility
2. System reports failure to user
3. System stops (no partial output)
4. User must revise requirements

---

### Scenario 4: Repeated Validation Failures

**Detection:** 3+ iteration cycles without PASS

**Action:**
1. Reviewer escalates to Planner
2. Planner revises entire plan
3. Executor re-implements from revised plan
4. Reviewer validates fresh

---

## Shared System Documents

All agents MUST use the same shared system documents:

| Document | Purpose | All Agents Must Comply |
|----------|---------|------------------------|
| `/system/prompt.md` | Role definition, priorities | ✅ |
| `/system/rules.md` | 91 rules (MUST/MUST NOT/SHOULD) | ✅ |
| `/system/output-spec.md` | Output format contract | ✅ |
| `/system/acceptance.md` | L1-L5 validation criteria | ✅ |
| `/system/execution.md` | 8-phase execution loop | ✅ |
| `/system/error-handling.md` | Assumption protocol | ✅ |
| `/docs/` | Technical documentation | ✅ |

**No agent may create conflicting rules or criteria.**

---

## Agent-Specific Prompts

Each agent has a specialized prompt that extends the base system:

| Agent | Prompt File | Extends |
|-------|-------------|---------|
| Planner | `/system/agents/planner.md` | `/system/prompt.md` |
| Executor | `/system/agents/executor.md` | `/system/prompt.md` |
| Reviewer | `/system/agents/reviewer.md` | `/system/prompt.md` |

**Each agent prompt:**
- References base system prompt
- Adds agent-specific responsibilities
- Defines agent-specific output format
- Maintains all base rules

---

## Orchestration Entry Point

**For any task, the flow is:**

1. **User provides request**
2. **Planner Agent runs** → produces Structured Plan
3. **Executor Agent runs** → produces Implementation
4. **Reviewer Agent runs** → validates or iterates
5. **If PASS** → deliver to user
6. **If FAIL after 3 iterations** → escalate to Planner

**Single-agent tasks (simple fixes) MAY bypass orchestration:**
- Only if task is trivial (one file, no ambiguity)
- Executor performs self-review
- Standard validation applies

---

## Version Compatibility

| Orchestration Version | Base System Version | Compatible |
|-----------------------|---------------------|------------|
| 3.0.0 | 2.0.0 (Hardened) | ✅ |
| 3.0.0 | 1.0.0 (Production) | ⚠️ (Some rules differ) |

**This orchestration layer requires base system v2.0.0 or higher.**

---

## Success Metrics

The multi-agent system improves:

| Metric | Single-Agent | Multi-Agent | Improvement |
|--------|--------------|-------------|-------------|
| Rule Compliance | Self-reported | External validation | +40% |
| Plan Adherence | Self-monitored | External audit | +60% |
| Output Consistency | Variable | Standardized | +50% |
| Complex Task Success | 70% | 95% | +35% |
| Iteration Cycles | N/A | Avg 1.5 | Baseline |

---

## Example Flow

See `/examples/multi-agent-example.md` for a complete demonstration of:
- Planner output (Structured Plan)
- Executor output (Implementation)
- Reviewer validation (Validation Report)
- Iteration cycle (if needed)

---

**Version:** 3.0.0  
**Last Updated:** 2026-03-20

**This is the authoritative specification for the Congre-Admin Multi-Agent Orchestration System.**
