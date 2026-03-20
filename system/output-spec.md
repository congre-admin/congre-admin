# Congre-Admin AI Agent - Output Specification

This document defines the **mandatory output format** for all agent responses. All outputs MUST conform to this specification.

---

## 1. Output Structure

Every response MUST include the following sections in order:

### 1.1 Summary (REQUIRED)
A brief (2-4 sentences) description of what was implemented or changed.

**Format:**
```markdown
## Summary

[Concise description of the work completed, which modules are affected, and any notable implementation decisions.]
```

### 1.2 Files Changed (REQUIRED)
A complete list of all files created, modified, or deleted.

**Format:**
```markdown
## Files Changed

### NEW: `path/to/file.ts`
### MODIFIED: `path/to/file.ts`
### DELETED: `path/to/file.ts`
```

### 1.3 Code Content (REQUIRED)
Full content of all new or modified files.

**Format:**
```markdown
### NEW: `src/modules/example/components/Example.tsx`

```typescript
// Complete file content here
```

### MODIFIED: `src/core/services/DataService.ts`

```diff
// Show unified diff format
- old line
+ new line
```
```

### 1.4 Tests (REQUIRED)
Location and summary of test files.

**Format:**
```markdown
## Tests

- `src/modules/example/components/Example.test.tsx` - Unit tests for Example component
- `src/modules/example/hooks/useExample.test.ts` - Hook validation tests
```

### 1.5 Documentation Updates (REQUIRED IF APPLICABLE)
List of documentation files updated.

**Format:**
```markdown
## Documentation Updates

- `docs/modules/Admin_Registros.md` - Added Asistencia feature specification
- `docs/CHANGELOG.md` - Logged 2026-03-20 changes
```

### 1.6 Validation Results (REQUIRED)
Confirmation that acceptance criteria were checked.

**Format:**
```markdown
## Validation

| Criterion | Status |
|-----------|--------|
| TypeScript compiles | ✅ Pass |
| Tests pass | ✅ Pass |
| Security rules followed | ✅ Pass |
| i18n compliance | ✅ Pass |
| Architecture compliance | ✅ Pass |
```

---

## 2. File Structure Expectations

### 2.1 New Modules

When creating a new module, the structure MUST follow:

```
src/modules/[module_name]/
├── components/         # React components exclusive to this module
├── hooks/              # Custom hooks with business logic
├── views/              # Page-level components (route targets)
├── manifest.json       # Module metadata (see docs/architecture/Arquitectura.md)
├── index.ts            # Public exports
└── [module_name].test.ts  # Module-level tests
```

### 2.2 New Components

When creating a new component:

```
src/core/components/ OR src/modules/[module]/components/
├── ComponentName.tsx       # Component implementation
├── ComponentName.test.tsx  # Component tests
└── ComponentName.types.ts  # TypeScript types (if complex)
```

### 2.3 New Services

When creating a new service:

```
src/core/services/ OR src/services/
├── ServiceName.ts          # Service implementation
├── ServiceName.test.ts     # Service tests
└── ServiceName.types.ts    # TypeScript types
```

---

## 3. Naming Conventions

### 3.1 Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `PersonaSelector.tsx` |
| Hooks | camelCase with `use` prefix | `useAsignaciones.ts` |
| Services | PascalCase | `DataService.ts` |
| Types/Interfaces | PascalCase with `.types.ts` suffix | `Personas.types.ts` |
| Tests | Same name as target + `.test` | `Example.test.tsx` |
| Modules | snake_case | `admin_registros/` |

### 3.2 Code Identifiers

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `personaId` |
| Functions | camelCase | `getAsignaciones()` |
| Components | PascalCase | `PersonaSelector` |
| Types/Interfaces | PascalCase | `Persona`, `IPersona` |
| Constants | UPPER_SNAKE_CASE | `AES_GCM_ALGORITHM` |
| Private members | camelCase with underscore prefix | `_internalState` |

---

## 4. Code Style Requirements

### 4.1 TypeScript

- **Strict mode:** All code MUST use strict TypeScript
- **No `any`:** Use proper types or `unknown` with type guards
- **Explicit return types:** Required for public functions
- **Generics:** Use for reusable functions and components

**Example:**
```typescript
// ✅ CORRECT
export function getPersona(id: string): Persona | null {
  // implementation
}

// ❌ INCORRECT
export function getPersona(id: any): any {
  // implementation
}
```

### 4.2 React Components

- **Functional components only:** No class components
- **Typed props:** All components MUST have explicit prop types
- **Default values:** Use destructuring defaults or `defaultProps`
- **Memoization:** Use `React.memo()` for pure components

**Example:**
```typescript
// ✅ CORRECT
interface PersonaSelectorProps {
  filtro?: string;
  onSelect: (persona: Persona) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  filtro = '',
  onSelect
}) => {
  // implementation
};
```

### 4.3 Styling

- **Tailwind CSS:** Primary styling method
- **MUI Components:** Use Material Design components where appropriate
- **No global CSS:** Except in `src/styles/`
- **CSS Modules:** For component-specific styles if needed

**Example:**
```tsx
// ✅ CORRECT
<div className="flex gap-2 p-4 bg-surface rounded-lg">
  <Button variant="contained">Guardar</Button>
</div>
```

---

## 5. Documentation Requirements

### 5.1 JSDoc Comments

Required for:
- Public API functions
- Complex business logic
- Non-obvious implementation decisions

**Format:**
```typescript
/**
 * Derives the Master Key from user credentials using PBKDF2.
 * 
 * @param password - User's password
 * @param salt - 16-byte salt from backend
 * @returns Promise resolving to 256-bit derived key
 * 
 * @security This key is used to unwrap the wrapped_mk from backend
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  // implementation
}
```

### 5.2 Inline Comments

Required for:
- Security-sensitive operations
- Complex JSONata expressions
- Workarounds for known issues

**Format:**
```typescript
// SECURITY: Never log encrypted fields - they contain PII
if (key.startsWith('enc_')) {
  continue;
}

// JSONata: Filters personas by active service tags
const expression = '$personas[$.enc_servicio.etiquetas ~> $contains("Activo")]';
```

### 5.3 CHANGELOG Updates

When modifying documentation or adding features, update `/docs/CHANGELOG.md`:

```markdown
## YYYY-MM-DD

### Agregado / Modificado / Eliminado

**Archivos:** `list`, `of`, `affected`, `files`

**Descripción:** Brief description of changes
```

---

## 6. Snippet vs. Full File

### When to Output Full Files:
- New files
- Files with >50% content changed
- Files <100 lines total

### When to Output Diffs:
- Files with <50% content changed
- Files >100 lines total
- Minor fixes or additions

### When to Output Snippets:
- Illustrating a specific pattern
- Showing usage examples
- Explaining a concept

---

## 7. Response Length Management

For large changes:

1. **Prioritize critical files** first
2. **Group related changes** together
3. **Use continuation markers** if response is truncated:

```markdown
[CONTINUED IN NEXT RESPONSE - File: src/core/services/DataService.ts]
```

---

## 8. Error Reporting Format

If errors occur during implementation:

```markdown
## Errors Encountered

### Error 1: [Description]
- **Location:** `path/to/file.ts:line`
- **Cause:** Why the error occurred
- **Resolution:** How it was fixed OR what is needed to fix
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20
