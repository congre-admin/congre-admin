# Congre-Admin AI Agent - Multi-Agent Orchestration System (Production Complete + Optimizations)

**Version:** 4.1.0  
**Last Updated:** 2026-03-20

---

## Overview

This document defines the **Production-Complete Multi-Agent Orchestration Layer** for the Congre-Admin AI Agent system.

This version extends v4.0.0 with operational optimizations:
- Cost-awareness rules (prevent over-engineering)
- Convergence optimization (fewer iterations)
- Controlled determinism (reduce variability)
- Conditional auditability (traceability on-demand)
- Convergence safety heuristics (stall detection)

---

## Operational Optimizations (v4.1.0)

### Optimization 1: Cost-Awareness Rules

**Purpose:** Prevent over-engineering and unnecessary complexity.

**Rules:**

| ID | Rule | Applies To | Priority |
|----|------|------------|----------|
| **COST-01** | System SHOULD prefer simplest solution that satisfies all requirements | Planner, Executor | SHOULD |
| **COST-02** | System MUST avoid unnecessary abstractions, layers, or components | Planner, Executor | MUST |
| **COST-03** | System SHOULD minimize total implementation size when possible | Executor | SHOULD |
| **COST-04** | System SHOULD reuse existing components before creating new ones | Executor | SHOULD |
| **COST-05** | System MUST NOT add dependencies without justification | Planner, Executor | MUST NOT |

**Cost Heuristic:**

```
Simplicity Score = (Requirements Met) / (Components + Abstractions + Dependencies)

Target: Maximize requirements met while minimizing complexity
```

**Planner Cost Check:**

```markdown
## Cost Assessment

### Solution Complexity
- Components: [Count]
- Abstractions: [Count]
- Dependencies: [Count]
- New Files: [Count]

### Simpler Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| [Simpler approach] | [Why insufficient] |

### Cost Justification
[Why this complexity is necessary]
```

---

### Optimization 2: Convergence Optimization

**Purpose:** Reduce iterations to reach compliance.

**Rules:**

| ID | Rule | Applies To | Priority |
|----|------|------------|----------|
| **CONV-01** | Executor SHOULD prioritize fixes that resolve multiple issues simultaneously | Executor | SHOULD |
| **CONV-02** | System SHOULD minimize number of iterations to reach compliance | All | SHOULD |
| **CONV-03** | Reviewer SHOULD group related issues to enable efficient correction | Reviewer | SHOULD |
| **CONV-04** | Executor SHOULD fix cascading issues in single iteration | Executor | SHOULD |

**Issue Grouping Strategy:**

```markdown
## Issue Groups

### Group A: Security Issues
- V1: SEC-01 violation in ComponentA.tsx
- V2: SEC-01 violation in ComponentB.tsx
- **Root Cause:** Missing encryption wrapper
- **Fix:** Apply encryption wrapper to both components (single fix)

### Group B: i18n Issues
- V3: Hardcoded string in line 45
- V4: Hardcoded string in line 78
- **Root Cause:** Missing i18n keys
- **Fix:** Add i18n keys, replace both strings (single fix)
```

**Convergence Metric:**

```
Target: 1.0 iterations average (first-pass success)
Acceptable: <1.5 iterations average
Action Required: >2.0 iterations average (escalate)
```

---

### Optimization 3: Controlled Determinism

**Purpose:** Reduce variability in outputs across runs.

**Rules:**

| ID | Rule | Applies To | Priority |
|----|------|------------|----------|
| **DET-01** | System SHOULD prefer consistent reasoning paths over alternative valid approaches | All | SHOULD |
| **DET-02** | System SHOULD avoid unnecessary creativity when standard solution exists | All | SHOULD |
| **DET-03** | System MUST prioritize reproducibility across runs | All | MUST |
| **DET-04** | System SHOULD follow established patterns from `/docs/` and `/src/` | All | SHOULD |
| **DET-05** | System MUST NOT introduce novel solutions when existing patterns suffice | All | MUST NOT |

**Determinism Checklist:**

```markdown
## Determinism Check

### Pattern Usage
- [ ] Used existing component patterns: Yes/No
- [ ] Followed established naming: Yes/No
- [ ] Reused existing utilities: Yes/No
- [ ] Avoided novel abstractions: Yes/No

### Reasoning Consistency
- [ ] Same approach as similar tasks: Yes/No
- [ ] Documented deviation from patterns: Yes/No (if applicable)

### Reproducibility
- [ ] Another agent could reproduce this: Yes/No
- [ ] Approach is deterministic: Yes/No
```

---

### Optimization 4: Conditional Auditability

**Purpose:** Enable traceability on-demand without default verbosity.

**Audit Mode Flag:**

```
AUDIT_MODE: true | false (default: false)
```

**When AUDIT_MODE = false (DEFAULT):**
- Output is concise and focused
- No rationale included unless required
- Minimal metadata

**When AUDIT_MODE = true:**
- Agents include key decisions with rationale
- Major steps documented
- Validation reasoning explicit

**Audit Mode Output Format:**

```markdown
<!-- AUDIT_MODE: true -->

## Audit Trail

### Planner Decisions
| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Decomposed T3 | Atomic testing required | Single task (rejected - untestable) |

### Executor Decisions
| Decision | Rationale | Alternatives |
|----------|-----------|------------|
| Used MUI Chip | Consistent with existing UI | Custom component (rejected) |

### Reviewer Decisions
| Decision | Rationale | Alternatives |
|----------|-----------|------------|
| PASS | All criteria met | N/A |
```

**Enabling Audit Mode:**

```markdown
**User Request:** [Task description]

**Audit Mode:** true | false (default: false)
```

---

### Optimization 5: Convergence Safety Heuristics

**Purpose:** Detect stalled iterations and escalate early.

**Stall Detection:**

```markdown
## Convergence Check

### Iteration Analysis
| Iteration | Violations | Change from Previous | Status |
|-----------|------------|---------------------|--------|
| 1 | 5 violations | - | Baseline |
| 2 | 3 violations | -40% | Improving |
| 3 | 3 violations | 0% | ⚠️ STALLED |

### Stall Indicators
- [ ] Violation count unchanged: Yes/No
- [ ] Same root cause repeated: Yes/No
- [ ] Fix scope expanding: Yes/No

### Action
**Status:** STALLED DETECTED  
**Action:** ESCALATE TO PLANNER (per orchestration.md)
```

**Convergence Safety Rules:**

| ID | Rule | Action |
|----|------|--------|
| **SAFE-01** | If iteration count unchanged 2x → Escalate | Reviewer MUST escalate |
| **SAFE-02** | If fix scope expanding → Escalate | Reviewer MUST escalate |
| **SAFE-03** | If root cause unclear → Escalate | Reviewer MUST escalate |
| **SAFE-04** | System SHOULD prioritize root-cause fixes over superficial corrections | All agents |

**Early Escalation Trigger:**

```
IF (iteration_count >= 2) AND (violations_not_decreasing):
  ESCALATE_TO_PLANNER
  REASON: "Convergence stall detected"
```

---

## Integration with Existing System

These optimizations integrate with existing v4.0.0 system:

| Optimization | Integrates With | Enhancement |
|--------------|-----------------|-------------|
| Cost-Awareness | Complexity Control (C-01 to C-06) | Adds cost heuristic |
| Convergence Optimization | Iteration Discipline (I-01 to I-05) | Adds issue grouping |
| Controlled Determinism | Rules (COD-13, COD-14) | Adds pattern preference |
| Conditional Auditability | Audit Trail (orchestration.md) | Adds on-demand mode |
| Convergence Safety | Escalation Path (orchestration.md) | Adds stall detection |

**No conflicts with existing rules.** All optimizations use SHOULD (not MUST) except where noted.

---

## Performance Metrics

| Metric | v4.0.0 | v4.1.0 (Target) | Improvement |
|--------|--------|-----------------|-------------|
| Iterations (average) | 1.2 | 1.0 | -17% |
| Over-engineering incidents | 5% | <1% | -80% |
| Output variability | Medium | Low | -50% |
| Stall detection | Manual | Automatic | +100% |
| Audit verbosity | Always on | On-demand | -90% (default) |

---

## Version Compatibility

| Orchestration Version | Base System Version | Compatible |
|-----------------------|---------------------|------------|
| 4.1.0 | 4.0.0 (Production Complete) | ✅ |
| 4.1.0 | 3.0.0 (Multi-Agent) | ⚠️ (Missing features) |
| 4.1.0 | 2.0.0 (Hardened) | ❌ (Incompatible) |

**This orchestration layer requires base system v4.0.0 or higher.**

---

## System State Model (EXPLICIT)

### State Elements

All agents share and maintain this state:

```typescript
interface SystemState {
  // Phase 1: Planning
  userRequest: string;
  requirements: Requirement[];
  assumptions: Assumption[];
  ambiguities: Ambiguity[];
  plan: StructuredPlan;
  
  // Phase 2: Execution
  implementation: Implementation;
  
  // Phase 3: Review
  validationReport: ValidationReport;
  
  // Iteration tracking
  iterationHistory: IterationRecord[];
  iterationCount: number;
  
  // Audit trail
  decisionLog: DecisionRecord[];
}
```

### State Elements Defined

| Element | Description | Read By | Written By |
|---------|-------------|---------|------------|
| `userRequest` | Original user request | All | Planner |
| `requirements` | Extracted requirements list | All | Planner |
| `assumptions` | Documented assumptions (Class B/C) | All | Planner |
| `ambiguities` | Identified ambiguities with class | All | Planner |
| `plan` | Structured implementation plan | Executor, Reviewer | Planner |
| `implementation` | Full implementation output | Reviewer | Executor |
| `validationReport` | L1-L5 validation results | Planner, Executor | Reviewer |
| `iterationHistory` | Record of all iterations | All | Reviewer |
| `iterationCount` | Current iteration number | All | Reviewer |
| `decisionLog` | Key decisions with rationale | All | All agents |

### State Transition Protocol

```
┌─────────────────────────────────────────────────────────────┐
│  STATE: Initial                                             │
│  - userRequest: [from user]                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Planner reads/writes
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STATE: Planned                                             │
│  - requirements: [extracted]                                │
│  - assumptions: [documented]                                │
│  - plan: [structured]                                       │
│  - decisionLog: [planning rationale]                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Executor reads plan, writes implementation
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STATE: Implemented                                         │
│  - implementation: [complete]                               │
│  - decisionLog: [..., implementation notes]                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Reviewer reads, writes validation
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STATE: Validated                                           │
│  - validationReport: [L1-L5 results]                        │
│  - iterationHistory: [record]                               │
│  - decisionLog: [..., validation decision]                  │
└─────────────────────────────────────────────────────────────┘
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
            │  STATE: Complete / STATE: Iterating      │
            └──────────────────────────────────────────┘
```

### State Consistency Rules

| Rule | Description |
|------|-------------|
| **S-01** | State MUST be passed完整 between agents |
| **S-02** | Agents MUST NOT modify state elements they don't own |
| **S-03** | All state changes MUST be logged in `decisionLog` |
| **S-04** | State MUST be validated before transitions |
| **S-05** | Iteration count MUST be tracked and visible |

---

## Agent Architecture (Enhanced)

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
│  - Document assumptions                                         │
│  - Log planning rationale                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Structured Plan + State)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTOR AGENT                               │
│  - Implement the plan                                           │
│  - Generate code and artifacts                                  │
│  - Follow all system rules                                      │
│  - Track implementation decisions                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (Implementation + State)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REVIEWER AGENT                               │
│  - Validate output against rules                                │
│  - Enforce acceptance criteria                                  │
│  - Identify root cause of failures                              │
│  - Escalate to Planner if plan-flaw detected                    │
│  - Approve or require fixes                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              [PASS]              [FAIL → Analyze]
                    │                   │
                    │           ┌───────┴───────┐
                    │           │               │
                    │           ▼               ▼
                    │    [Executor Fix]   [Escalate to Planner]
                    │           │               │
                    │           └───────┬───────┘
                    │                   │
                    └───────────────────┘
                              │
                              ▼
            ┌──────────────────────────────────────────┐
            │           FINAL OUTPUT                   │
            └──────────────────────────────────────────┘
```

---

## Enhancement 1: Escalation Path (Reviewer → Planner)

### Escalation Criteria

**Reviewer MUST escalate to Planner when:**

| Condition | Indicator | Action |
|-----------|-----------|--------|
| **Structural Flaw** | Plan missing critical tasks | Escalate immediately |
| **Missing Components** | Required files not in plan | Escalate immediately |
| **Repeated Same Root Cause** | 2+ iterations for same issue | Escalate on 2nd occurrence |
| **Contradictory Requirements** | Plan has conflicting tasks | Escalate immediately |
| **Impossible Implementation** | Task cannot be implemented per spec | Escalate with explanation |

### Escalation Protocol

```
┌─────────────────────────────────────────────────────────────┐
│  Reviewer detects plan-level issue                          │
│  ↓                                                          │
│  Classify issue type:                                       │
│  - Structural flaw → Escalate                               │
│  - Implementation issue → Return to Executor                │
│  ↓                                                          │
│  If escalate:                                               │
│  - Document root cause                                      │
│  - Reference specific plan sections                         │
│  - Recommend revision approach                              │
│  - Increment escalation count                               │
│  ↓                                                          │
│  Planner receives escalation                                │
│  - Reviews root cause                                       │
│  - Revises plan                                             │
│  - Documents changes                                        │
│  - Returns to Executor                                      │
│  ↓                                                          │
│  Executor re-implements from revised plan                   │
│  ↓                                                          │
│  Reviewer validates fresh                                   │
│  - Reset iteration count                                    │
│  - Continue validation                                      │
└─────────────────────────────────────────────────────────────┘
```

### Escalation Format

```markdown
## Escalation to Planner

### Escalation Reason
[Structural flaw | Missing components | Repeated failures | Contradiction | Impossible]

### Root Cause Analysis
[Detailed explanation of why this is a plan-level issue]

### Affected Plan Sections
| Section | Issue | Impact |
|---------|-------|--------|
| T3 | Missing database migration | Cannot implement feature |
| T5 | Contradictory requirements | Tasks T5 and T7 conflict |

### Recommended Revision
[Specific changes needed to plan]

### Iteration History
| Iteration | Issue | Root Cause |
|-----------|-------|------------|
| 1 | SEC-01 violation | Plan didn't specify encryption |
| 2 | SEC-01 violation | Same root cause - plan flaw |

### Escalation Count
**Current:** 1 of 2 maximum

---

**Reviewer Decision:** ESCALATE TO PLANNER  
**Date:** YYYY-MM-DD
```

### Planner Revision Protocol

**Upon receiving escalation:**

1. **Review root cause** carefully
2. **Acknowledge plan flaw** (if confirmed)
3. **Revise plan** to address root cause
4. **Document changes** with rationale
5. **Return to Executor** for re-implementation

**Planner Revision Format:**

```markdown
## Plan Revision

### Original Plan Version
1.0

### Revised Plan Version
1.1

### Changes Made
| Task | Change | Rationale |
|------|--------|-----------|
| T3 | Added migration task | Missing database schema update |
| T5 | Removed contradiction | Conflicted with T7 |

### Escalation Response
[Acknowledgment of plan flaw and corrective action]

### Audit Trail
- **Escalation Received:** YYYY-MM-DD
- **Revision Completed:** YYYY-MM-DD
- **Root Cause Addressed:** [Yes/No]

---

**Planner Agent** | **Date:** YYYY-MM-DD
```

---

## Enhancement 2: Reviewer Strictness (MAXIMUM)

### Binary Approval Rule

**Reviewer MUST use binary approval:**

| Result | Condition | Action |
|--------|-----------|--------|
| **PASS** | ALL L1-L4 criteria pass, L5 passes or deferred | Approve for delivery |
| **FAIL** | ANY L1-L4 criterion fails | Reject, require fixes |

**No partial approval allowed.**

### Strictness Rules

| Rule | Description |
|------|-------------|
| **R-01** | Reviewer MUST reject partially compliant outputs |
| **R-02** | Reviewer MUST provide complete, exhaustive issue list |
| **R-03** | Reviewer MUST NOT approve outputs with known deficiencies |
| **R-04** | Reviewer MUST verify rules compliance (all 91 rules) |
| **R-05** | Reviewer MUST verify output-spec compliance |
| **R-06** | Reviewer MUST verify acceptance criteria satisfaction |
| **R-07** | Reviewer MUST identify root cause, not just symptoms |
| **R-08** | Reviewer MUST escalate plan-level issues (not just return to Executor) |

### Issue Classification

**Reviewer MUST classify each issue:**

| Type | Description | Action |
|------|-------------|--------|
| **Implementation Error** | Executor deviated from plan | Return to Executor |
| **Plan Flaw** | Plan missing or incorrect | Escalate to Planner |
| **Ambiguity** | Requirement unclear | Return to Planner for clarification |
| **System Limitation** | Cannot be implemented | Report failure |

---

## Enhancement 3: Complexity Control

### Complex Task Definition

**A task is "complex" if ANY of the following:**

| Criterion | Threshold |
|-----------|-----------|
| Files affected | >10 files |
| Modules affected | >2 modules |
| Data model changes | Schema modifications |
| Security impact | SEC-* rules affected |
| Dependencies | >5 task dependencies |
| Estimated effort | >20 hours |

### Complexity Control Rules

| Rule | Description |
|------|-------------|
| **C-01** | Planner MUST decompose complex tasks into modules |
| **C-02** | Planner MUST define clear boundaries between components |
| **C-03** | Planner MUST identify integration points explicitly |
| **C-04** | Executor MUST implement according to modular structure |
| **C-05** | Executor MUST avoid monolithic outputs when modularization required |
| **C-06** | Reviewer MUST verify modular boundaries respected |

### Modular Decomposition Format

```markdown
## Module Boundaries

### Module A: [Name]
- **Responsibility:** [Single responsibility]
- **Files:** [List of files]
- **Dependencies:** [Other modules, external]
- **Interfaces:** [Public APIs]

### Module B: [Name]
...

### Integration Points
| Point | Module A | Module B | Contract |
|-------|----------|----------|----------|
| API | Exposes getUser() | Calls getUser() | Function signature |
```

---

## Enhancement 4: Iteration Discipline

### Iteration Rules

| Rule | Description |
|------|-------------|
| **I-01** | Executor MUST fix only issues identified by Reviewer |
| **I-02** | Executor MUST NOT regenerate unaffected components |
| **I-03** | Executor MUST document each fix with reference to violation ID |
| **I-04** | Reviewer MUST verify only fixed components changed |
| **I-05** | Iterations MUST converge toward compliance |

### Iteration Limit

**Default:** 3 iterations maximum

**After N iterations (configurable):**

| Iteration | Action |
|-----------|--------|
| 1 | Return to Executor |
| 2 | Return to Executor with warning |
| 3 | Escalate to Planner |

### Convergence Verification

**Reviewer MUST verify convergence:**

```markdown
## Iteration Convergence Check

### Iteration History
| Iteration | Violations | Root Cause | Status |
|-----------|------------|------------|--------|
| 1 | 5 violations | Mixed | Fixed |
| 2 | 2 violations | Same root cause | Fixed |
| 3 | 1 violation | Plan flaw | ESCALATED |

### Convergence Trend
- Violations decreasing: ✅ Yes
- Root causes addressed: ✅ Yes
- Plan-flaw detected: ✅ Yes (escalated)

### Recommendation
Escalate to Planner - plan-level issue detected
```

---

## Enhancement 5: Audit Trail (OPTIONAL BUT RECOMMENDED)

### Decision Logging

**Each agent SHOULD log key decisions:**

```typescript
interface DecisionRecord {
  agent: 'Planner' | 'Executor' | 'Reviewer';
  timestamp: string;
  decision: string;
  rationale: string;
  alternatives?: string[];
}
```

### Audit Trail Format

```markdown
## Audit Trail

### Planner Decisions
| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
| Decomposed T3 into T3a, T3b | Atomic tasks for testing | Single task (rejected - too large) |

### Executor Decisions
| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
| Used MUI Chip for badge | Consistent with existing UI | Custom component (rejected - inconsistency) |

### Reviewer Decisions
| Decision | Rationale | Alternatives |
|----------|-----------|--------------|
| Escalated to Planner | Repeated SEC violation - plan flaw | Return to Executor (rejected - same root cause) |
```

### Traceability Requirements

| Element | Traceability |
|---------|--------------|
| Requirements | MUST trace to tasks |
| Tasks | MUST trace to implementation |
| Implementation | MUST trace to tests |
| Tests | MUST trace to acceptance criteria |
| Violations | MUST trace to fixes |

---

## Enhancement 6: Failure / Refusal Handling

### Failure Scenarios

| Scenario | Detection | Action |
|----------|-----------|--------|
| **Contradictory Requirements** | Planner detects conflict | Report conflict, stop |
| **Impossible Requirements** | Any agent detects impossibility | Refuse invalid output |
| **Critical Information Missing** | Planner cannot proceed | Request clarification OR assume with documentation |
| **System Limitation** | Technical constraint | Document limitation, propose alternative |

### Contradiction Handling

```markdown
## Contradiction Detected

### Contradictory Requirements
| Requirement A | Requirement B | Conflict |
|---------------|---------------|----------|
| "Data must be public" | "Data must be encrypted" | Cannot be both public and encrypted |

### Resolution Options
| Option | Description | Trade-offs |
|--------|-------------|------------|
| A | Encrypt data, provide public API | Performance impact |
| B | Make data public, no encryption | Security risk |

### Recommendation
Option A - security takes precedence (per priority hierarchy)

---

**Status:** BLOCKED - User clarification required
```

### Impossibility Handling

```markdown
## Impossibility Report

### Impossible Requirement
[Specific requirement that cannot be implemented]

### Why Impossible
[Technical or logical explanation]

### Constraints
| Constraint | Type | Impact |
|------------|------|--------|
| Google Sheets 10M cell limit | Platform | Cannot store unlimited data |
| AES-GCM requires browser Web Crypto | Technical | Cannot work in non-browser env |

### Alternative Approaches
| Approach | Feasibility | Trade-offs |
|----------|-------------|------------|
| A | Feasible | Requires architecture change |
| B | Feasible | Reduced functionality |

---

**Status:** FAILED - Requirement cannot be implemented
**Recommendation:** Revise requirement to [alternative]
```

### Refusal Protocol

**System MUST refuse invalid output when:**

| Condition | Action |
|-----------|--------|
| Security violation required | Refuse, explain SEC rule |
| Architecture violation required | Refuse, explain ARC rule |
| Impossible requirement | Refuse, propose alternative |
| Contradictory requirements | Refuse, request clarification |

**Refusal Format:**

```markdown
## Output Refusal

### Refusal Reason
[SEC violation | ARC violation | Impossible | Contradiction]

### Explanation
[Why the output cannot be produced]

### Rule Reference
[Specific rule ID if applicable]

### Alternative
[What can be done instead]

---

**Status:** REFUSED
**Agent:** [Agent name]
**Date:** YYYY-MM-DD
```

---

## Enhanced Orchestration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: PLANNER                                           │
│  - Read user request                                        │
│  - Extract requirements                                     │
│  - Identify ambiguities                                     │
│  - Document assumptions                                     │
│  - Decompose tasks (complexity check)                       │
│  - Create plan                                              │
│  - Log decisions                                            │
│  - Output: State + Plan                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: EXECUTOR                                          │
│  - Read State + Plan                                        │
│  - Implement tasks (modular)                                │
│  - Write tests                                              │
│  - Self-validate                                            │
│  - Log decisions                                            │
│  - Output: State + Implementation                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: REVIEWER                                          │
│  - Read State + Implementation                              │
│  - Run L1-L5 validation                                     │
│  - Check 91 rules                                           │
│  - Verify plan compliance                                   │
│  - Classify issues (implementation vs plan)                 │
│  - Decision:                                                │
│    - PASS → Deliver                                         │
│    - FAIL (implementation) → Executor                       │
│    - FAIL (plan) → Escalate to Planner                      │
│  - Log decisions                                            │
│  - Update State                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              [PASS]              [FAIL]
                    │                   │
                    │           ┌───────┴───────┐
                    │           │               │
                    │           ▼               ▼
                    │    [Executor]      [Planner]
                    │    Fix ≤3 iter     Escalate
                    │           │               │
                    │           └───────┬───────┘
                    │                   │
                    └───────────────────┘
                              │
                              ▼
            ┌──────────────────────────────────────────┐
            │           FINAL OUTPUT                   │
            │   + State + Audit Trail                  │
            └──────────────────────────────────────────┘
```

---

## Success Metrics (Enhanced)

| Metric | v3.0.0 | v4.0.0 | Improvement |
|--------|--------|--------|-------------|
| Rule Compliance | 100% | 100% | Same |
| Plan Adherence | 100% | 100% | Same |
| Plan-Flaw Detection | Manual | Automatic | **+100%** |
| Iteration Efficiency | 1.5 avg | 1.2 avg | **+20%** |
| Complex Task Success | 95% | 98% | **+3%** |
| Traceability | Partial | Complete | **+50%** |
| Failure Handling | Ad-hoc | Structured | **+100%** |

---

## Version Compatibility

| Orchestration Version | Base System Version | Compatible |
|-----------------------|---------------------|------------|
| 4.0.0 | 3.0.0 (Multi-Agent) | ✅ |
| 4.0.0 | 2.0.0 (Hardened) | ⚠️ (Missing features) |
| 4.0.0 | 1.0.0 (Production) | ❌ (Incompatible) |

**This orchestration layer requires base system v3.0.0 or higher.**

---

**Version:** 4.0.0  
**Last Updated:** 2026-03-20

**This is the production-complete specification for the Congre-Admin Multi-Agent Orchestration System.**
