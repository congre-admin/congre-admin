# Congre-Admin AI Agent - Error Handling Policy

This document defines how the agent MUST behave when encountering errors, ambiguities, or missing information.

---

## 1. Ambiguity Handling

### 1.1 Types of Ambiguity

| Type | Description | Example |
|------|-------------|---------|
| **Requirement Ambiguity** | Unclear what to build | "Add a button" - what kind? where? |
| **Technical Ambiguity** | Unclear how to implement | Multiple valid approaches exist |
| **Data Ambiguity** | Unclear data structure | Schema not fully defined |
| **Priority Ambiguity** | Unclear trade-offs | Performance vs. features |

### 1.2 Response Protocol

When ambiguity is detected, the agent MUST:

```
STEP 1: Identify the ambiguity
  - Quote the unclear requirement
  - Explain why it's ambiguous

STEP 2: Assess impact
  - Is this a blocker? (Cannot proceed without clarification)
  - Is this non-blocking? (Can proceed with assumptions)

STEP 3: Take action based on impact
  - BLOCKER: Ask for clarification (see Section 2)
  - NON-BLOCKING: Document assumptions and proceed (see Section 3)

STEP 4: Document in output
  - Include ambiguity log in final output
```

### 1.3 Ambiguity Log Format

```markdown
## Ambiguities Encountered

### Ambiguity 1: [Title]
- **Location:** `path/to/file.md:section` or task description
- **Type:** Requirement / Technical / Data / Priority
- **Impact:** Blocker / Non-Blocker
- **Description:** [Why this is ambiguous]
- **Resolution:** [Clarification requested OR assumption made]
- **Assumption (if applicable):** [What was assumed]
```

---

## 2. When to Ask for Clarification

### 2.1 Blocker Scenarios (MUST Ask)

The agent MUST ask for clarification when:

| Scenario | Example | Action |
|----------|---------|--------|
| **Security-critical unclear** | Unclear encryption requirements | ASK - do not assume |
| **Data loss risk** | Unclear migration path | ASK - do not assume |
| **Conflicting requirements** | Two docs specify different behavior | ASK - do not choose |
| **Missing core spec** | Module referenced but not documented | ASK - do not invent |
| **API contract unclear** | Backend action not defined | ASK - do not guess |
| **Permission model unclear** | Who can access what is undefined | ASK - do not assume |

### 2.2 Clarification Request Format

```markdown
## ❗ Clarification Required

**Task:** [What task is blocked]

**Blocked By:** [What is unclear]

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A | [First option] | ... | ... |
| B | [Second option] | ... | ... |

**Recommendation:** [Agent's recommendation if applicable]

**Impact:** [What is blocked until clarified]

---

**Please clarify:** [Specific question to answer]
```

### 2.3 What NOT to Do

❌ NEVER:
- Assume security requirements
- Assume data structures for encrypted fields
- Choose between conflicting specifications
- Invent unspecified API endpoints
- Assume permission levels

---

## 3. When to Make Assumptions

### 3.1 Non-Blocker Scenarios (CAN Assume)

The agent MAY proceed with assumptions when:

| Scenario | Example | Action |
|----------|---------|--------|
| **Minor UI detail** | Button color not specified | ASSUME - follow M3 guidelines |
| **Standard pattern** | Common CRUD operation | ASSUME - follow existing patterns |
| **Default behavior** | Unspecified sort order | ASSUME - alphabetical/chronological |
| **Copy/text** | Placeholder text not specified | ASSUME - generic placeholder |
| **File organization** | Exact subfolder not specified | ASSUME - follow conventions |

### 3.2 Assumption Documentation Format

```markdown
## Assumptions Made

### Assumption 1: [Title]
- **Location:** `path/to/file.ts`
- **What was assumed:** [Description]
- **Why:** [Rationale - e.g., "follows existing pattern in X"]
- **Impact if wrong:** [Low/Medium/High] - what needs to change
- **Alternative considered:** [What else could have been done]
```

### 3.3 Assumption Guidelines

**GOOD Assumptions:**
- ✅ Follow existing patterns in codebase
- ✅ Align with documented architecture
- ✅ Are reversible with minimal refactoring
- ✅ Are clearly documented
- ✅ Have low impact if wrong

**BAD Assumptions:**
- ❌ Contradict existing documentation
- ❌ Are security-related
- ❌ Are difficult to reverse
- ❌ Are not documented
- ❌ Have high impact if wrong

---

## 4. Conflict Resolution

### 4.1 Types of Conflicts

| Type | Description | Example |
|------|-------------|---------|
| **Documentation Conflict** | Two docs specify different things | `API.md` vs `Backend.md` |
| **Pattern Conflict** | Existing code conflicts with spec | Code uses XXTEA, spec says AES-GCM |
| **Requirement Conflict** | Two requirements contradict | "Must be offline" vs "Must be real-time" |

### 4.2 Resolution Protocol

```
STEP 1: Identify the conflict
  - Quote both conflicting sources
  - Explain the contradiction

STEP 2: Determine source authority
  - Specification docs > Implementation code
  - Recent docs > Old docs (check dates)
  - Explicit > Implicit

STEP 3: If clear winner exists
  - Follow the authoritative source
  - Document the conflict and resolution

STEP 4: If no clear winner
  - Flag as blocker (see Section 2)
  - Do NOT choose arbitrarily
```

### 4.3 Conflict Log Format

```markdown
## Conflicts Identified

### Conflict 1: [Title]
- **Source A:** `path/to/doc1.md` - [What it says]
- **Source B:** `path/to/doc2.md` - [What it says]
- **Resolution:** [Which was followed and why]
- **Authority:** [Why one source takes precedence]
- **Action Required:** [Does code need to be updated?]
```

---

## 5. Missing Information Handling

### 5.1 Types of Missing Information

| Type | Description | Action |
|------|-------------|--------|
| **Missing Module Spec** | Referenced module not documented | ASK or follow pattern |
| **Missing API Endpoint** | Backend action not defined | ASK or follow convention |
| **Missing Test Data** | No sample data provided | GENERATE realistic data |
| **Missing Design** | UI not fully specified | FOLLOW M3 guidelines |
| **Missing Dependency** | Required library not listed | ADD to package.json |

### 5.2 Response Protocol

```
STEP 1: Identify what's missing
  - Be specific about what information is needed

STEP 2: Check if inferable
  - Can it be derived from existing patterns?
  - Is there a default or standard approach?

STEP 3: If inferable
  - Proceed with documented assumption
  - Follow existing patterns

STEP 4: If not inferable
  - Request clarification (Section 2)
  - Block implementation until resolved
```

---

## 6. Error Recovery

### 6.1 Implementation Errors

When the agent encounters an error during implementation:

```
STEP 1: Identify the error
  - Error message
  - Location (file:line)
  - Trigger condition

STEP 2: Analyze root cause
  - Why did this error occur?
  - What assumption was wrong?

STEP 3: Attempt fix
  - Apply targeted fix
  - Test the fix

STEP 4: If fix fails
  - Document the failure
  - Try alternative approach
  - If still failing, report as blocker

STEP 5: Document in output
  - Include error and resolution in report
```

### 6.2 Error Log Format

```markdown
## Errors Encountered

### Error 1: [Error message or title]
- **Location:** `path/to/file.ts:line`
- **Trigger:** [What caused the error]
- **Root Cause:** [Why it happened]
- **Resolution:** [How it was fixed]
- **Prevention:** [How to avoid in future]
```

---

## 7. Escalation Protocol

### 7.1 When to Escalate

Escalate (request human intervention) when:

| Condition | Example |
|-----------|---------|
| **Multiple blockers** | 3+ clarification requests pending |
| **Circular dependency** | A requires B, B requires A |
| **Spec contradiction unresolved** | No clear authority between conflicting specs |
| **Technical impossibility** | Requirement cannot be implemented |
| **Security concern** | Potential vulnerability identified |

### 7.2 Escalation Format

```markdown
## 🚨 Escalation Required

**Severity:** Critical / High / Medium

**Summary:** [Brief description of the issue]

**Context:**
[Detailed explanation of the situation]

**Attempts Made:**
1. [What was tried]
2. [What else was tried]

**Blockers:**
- [List of specific blockers]

**Options:**
| Option | Description | Trade-offs |
|--------|-------------|------------|
| A | ... | ... |
| B | ... | ... |

**Recommendation:** [Agent's recommendation]

**Impact:** [What is blocked until resolved]
```

---

## 8. Summary: Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│  Encountered Issue                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │ Is it ambiguous?    │
                  └─────────────────────┘
                       │           │
                      YES          NO
                       │           │
                       ▼           ▼
             ┌─────────────────┐  ┌──────────────────┐
             │ Is it a blocker?│  │ Proceed with     │
             └─────────────────┘  │ implementation   │
                  │           │   └──────────────────┘
                 YES          NO
                  │           │
                  ▼           ▼
        ┌─────────────────┐ ┌────────────────────┐
        │ ASK for         │ │ Document assumption│
        │ clarification   │ │ and proceed        │
        └─────────────────┘ └────────────────────┘

                  │
                  ▼
        ┌─────────────────────────┐
        │ Is there a conflict?    │
        └─────────────────────────┘
               │           │
              YES          NO
               │           │
               ▼           ▼
     ┌─────────────────┐  ┌──────────────────┐
     │ Check authority │  │ Continue         │
     │ Follow winner   │  │                  │
     └─────────────────┘  └──────────────────┘
               │
          No winner
               │
               ▼
     ┌─────────────────┐
     │ ASK for         │
     │ clarification   │
     └─────────────────┘
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20
