# Congre-Admin AI Agent - Examples

This directory contains complete examples demonstrating correct usage of the agent system.

---

## Available Examples

| Example | Description | Complexity |
|---------|-------------|------------|
| [01-new-component](#example-01-create-new-component) | Creating a new React component with tests | Low |
| [02-new-module](#example-02-create-new-module) | Creating a complete new module | High |
| [03-bug-fix](#example-03-bug-fix) | Fixing a security vulnerability | Medium |
| [multi-agent-example](./multi-agent-example.md) | Full Planner → Executor → Reviewer orchestration walkthrough | High |

---

## Example 01: Create New Component

### Input Request

```
Create a reusable PersonaCard component that displays a person's basic information.
The card should show:
- Name (with encrypted surname handling)
- Service tags (etiquetas)
- Contact info (phone, email)
- A "View Details" button

Follow M3 design guidelines and include i18n support.
```

### Step-by-Step Reasoning (Plan)

```markdown
## Analysis

**Relevant Documentation:**
- `/docs/architecture/Interfaz.md` - UI/UX guidelines, M3 components
- `/docs/architecture/Localizacion.md` - i18n requirements
- `/docs/modules/Personas.md` - Persona data structure
- `/system/rules.md` - Security rules (enc_ fields)

**Key Considerations:**
1. SEC-01: Must NOT expose `enc_apellido` in plain text - need to handle encrypted surnames
2. UI-01: Must use i18n keys, no hardcoded strings
3. UI-02: Must use Material Design 3 components
4. COD-02: Must use proper TypeScript types

**Assumptions:**
- Persona object may have `identidad.nombreAbreviado` for display when surname is encrypted
- Component will receive `Persona` object as prop
- Clicking card navigates to detail view (parent handles navigation)

## Implementation Plan

### Task 1: Create TypeScript types
- **File:** `src/core/components/PersonaCard/PersonaCard.types.ts`
- **Complexity:** Low

### Task 2: Create component implementation
- **File:** `src/core/components/PersonaCard/PersonaCard.tsx`
- **Complexity:** Medium
- **Dependencies:** MUI Card, Typography, Button components

### Task 3: Create component tests
- **File:** `src/core/components/PersonaCard/PersonaCard.test.tsx`
- **Complexity:** Medium

### Task 4: Add i18n keys
- **File:** `src/core/locales/es.json`, `src/core/locales/en.json`
- **Complexity:** Low

### Task 5: Export from component library
- **File:** `src/core/components/index.ts`
- **Complexity:** Low
```

### Final Output

```markdown
## Summary

Created a reusable `PersonaCard` component following M3 design guidelines with full i18n support. The component safely handles encrypted surname fields by using the `nombreAbreviado` fallback.

## Files Changed

### NEW: `src/core/components/PersonaCard/PersonaCard.types.ts`

```typescript
import { Persona } from '../../data/types';

export interface PersonaCardProps {
  /** Persona object to display */
  persona: Persona;
  /** Click handler - parent handles navigation */
  onClick?: (persona: Persona) => void;
  /** Compact mode - shows less information */
  compact?: boolean;
}
```

### NEW: `src/core/components/PersonaCard/PersonaCard.tsx`

```typescript
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PersonaCardProps } from './PersonaCard.types';

export const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  onClick,
  compact = false,
}) => {
  const { t } = useTranslation();

  // SECURITY: Use nombreAbreviado to avoid exposing encrypted surname (SEC-01)
  const displayName = persona.identidad.nombreAbreviado || persona.identidad.nombre;

  // SECURITY (SEC-01): This component reads enc_servicio and enc_contacto fields.
  // It MUST only be used inside authenticated views where DataService has already
  // decrypted the Persona object. NEVER pass a raw (undecrypted) Persona from a
  // public data source to this component. For public-facing persona displays,
  // use sanitizeForPublicView() first and render only non-enc_ fields.

  const handleClick = () => {
    onClick?.(persona);
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {},
      }}
    >
      <CardContent>
        <Typography variant="h6" component="div">
          {displayName}
        </Typography>

        {!compact && (
          <>
            {persona.enc_servicio?.etiquetas && (
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {persona.enc_servicio.etiquetas.map((etiqueta: string) => (
                  <Chip
                    key={etiqueta}
                    label={etiqueta}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}

            {persona.enc_contacto?.telefonos?.[0] && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {persona.enc_contacto.telefonos[0].valor}
              </Typography>
            )}
          </>
        )}
      </CardContent>

      <CardActions>
        <Button size="small" onClick={handleClick}>
          {t('personas.card.viewDetails')}
        </Button>
      </CardActions>
    </Card>
  );
};
```

### NEW: `src/core/components/PersonaCard/PersonaCard.test.tsx`

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonaCard } from './PersonaCard';
import { Persona } from '../../data/types';

const mockPersona: Persona = {
  id: 'test-1',
  identidad: {
    nombre: 'Juan',
    enc_apellido: 'iv:ciphertext',
    nombreAbreviado: 'J. Perez',
    genero: 'H',
  },
  enc_servicio: {
    etiquetas: ['Anciano', 'Bautizado'],
  },
  enc_contacto: {
    telefonos: [{ tipo: 'celular', valor: '+1234567890' }],
  },
};

describe('PersonaCard', () => {
  it('renders persona name correctly', () => {
    render(<PersonaCard persona={mockPersona} />);
    expect(screen.getByText('J. Perez')).toBeInTheDocument();
  });

  it('displays service tags', () => {
    render(<PersonaCard persona={mockPersona} />);
    expect(screen.getByText('Anciano')).toBeInTheDocument();
    expect(screen.getByText('Bautizado')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = vi.fn();
    render(<PersonaCard persona={mockPersona} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button', /view details/i));
    expect(handleClick).toHaveBeenCalledWith(mockPersona);
  });

  it('hides extra info in compact mode', () => {
    render(<PersonaCard persona={mockPersona} compact />);
    expect(screen.queryByText('+1234567890')).not.toBeInTheDocument();
  });
});
```

### MODIFIED: `src/core/locales/es.json`

```json
{
  "personas": {
    "card": {
      "viewDetails": "Ver detalles"
    }
  }
}
```

### MODIFIED: `src/core/locales/en.json`

```json
{
  "personas": {
    "card": {
      "viewDetails": "View details"
    }
  }
}
```

### MODIFIED: `src/core/components/index.ts`

```typescript
// Added export
export { PersonaCard } from './PersonaCard/PersonaCard';
export type { PersonaCardProps } from './PersonaCard/PersonaCard.types';
```

## Tests

All tests pass:
```
✓ src/core/components/PersonaCard/PersonaCard.test.tsx (4 tests)
  ✓ PersonaCard
    ✓ renders persona name correctly
    ✓ displays service tags
    ✓ calls onClick when card is clicked
    ✓ hides extra info in compact mode
```

## Validation

| Criterion | Status |
|-----------|--------|
| TypeScript compiles | ✅ Pass |
| Tests pass | ✅ Pass (4/4) |
| SEC-01: enc_ fields | ✅ Pass (component is authenticated-view-only; enc_ fields are pre-decrypted by DataService before reaching this component — see security comment in source) |
| i18n compliance | ✅ Pass (all strings use t()) |
| Architecture compliance | ✅ Pass (Core component pattern) |
| M3 components used | ✅ Pass (Card, Typography, Button, Chip) |

---

**Validated by:** AI Agent
**Date:** 2026-03-20
**Result:** PASS  
**Confidence:** High
```

---

## Example 02: Create New Module

### Input Request

```
Create a new module for managing congregation announcements (Anuncios).
The module should allow admins to create, edit, and delete announcements.
Announcements should support:
- Title and content (rich text)
- Priority levels (normal, important, urgent)
- Publication date range
- Optional attachments (PDF, images)

The module should appear under the "Administración" section.
```

### Step-by-Step Reasoning (Plan)

```markdown
## Analysis

**Relevant Documentation:**
- `/docs/architecture/Arquitectura.md` - Plugin architecture
- `/docs/architecture/Permisos.md` - RBAC requirements (admin only)
- `/docs/architecture/Interfaz.md` - UI components
- `/docs/architecture/Guia_Documentacion.md` - Module documentation standard
- `/docs/modules/Admin_Anuncios.md` - Check if exists (if not, create)

**Key Considerations:**
1. ARC-05: Must have manifest.json for plugin registration
2. SEC-02: Must validate admin permissions
3. UI-01: Must use i18n for all strings
4. DAT-06: Must implement batch operations for multiple announcements

**Missing Information:**
- Attachment storage mechanism (assume IndexedDB for local, GSheet for backend)
- Rich text editor library (assume react-quill or similar)

**Assumptions:**
- Announcements are stored in GSheet `Anuncios` table
- Attachments are stored as base64 or external URLs
- Rich text is stored as HTML

## Implementation Plan

### Task 1: Create module structure
- **Files:** `src/modules/anuncios/` directory structure
- **Complexity:** Low

### Task 2: Create manifest.json
- **File:** `src/modules/anuncios/manifest.json`
- **Complexity:** Low

### Task 3: Create TypeScript types
- **File:** `src/modules/anuncios/anuncios.types.ts`
- **Complexity:** Low

### Task 4: Create DataService adapter
- **File:** `src/modules/anuncios/hooks/useAnuncios.ts`
- **Complexity:** Medium

### Task 5: Create announcement list view
- **File:** `src/modules/anuncios/views/AnunciosList.tsx`
- **Complexity:** Medium

### Task 6: Create announcement editor
- **File:** `src/modules/anuncios/views/AnuncioEditor.tsx`
- **Complexity:** High

### Task 7: Add i18n keys
- **Files:** `src/core/locales/*.json`
- **Complexity:** Low

### Task 8: Create tests
- **Files:** `*.test.tsx` for each component
- **Complexity:** Medium

### Task 9: Update documentation
- **File:** `docs/modules/Admin_Anuncios.md`
- **Complexity:** Low
```

### Final Output

> **Note:** This example focuses on the planning and structure phase.
> The gold standard for complete file output (with validation reports, test files,
> and post-flight checks) is `examples/01-new-component.md`.
> For a new module, apply the same output pattern to each task in the plan above.

**Key files the Executor MUST produce for this module:**

```
src/modules/anuncios/
├── manifest.json              ← Required by ARC-05
├── index.ts                   ← Public exports
├── anuncios.types.ts          ← TypeScript types (COD-01)
├── components/
│   └── AnuncioCard.tsx        ← Card component + AnuncioCard.test.tsx
├── hooks/
│   └── useAnuncios.ts         ← Data hook + useAnuncios.test.ts
└── views/
    ├── AnunciosList.tsx        ← List view (public + admin tabs)
    └── AnuncioEditor.tsx       ← Editor view (admin only, shield_lock)
```

**Minimum viable `manifest.json` for this module:**
```json
{
  "id": "admin_anuncios",
  "seccion": "Administración",
  "nombre": "Anuncios",
  "icono": "campaign",
  "version": "1.0.0",
  "dependencias": [],
  "dataAliases": {
    "anuncios": "Anuncios"
  },
  "dashboardWidgets": [
    {
      "component": "AnuncioWidget",
      "query": "$anuncios[prioridad = 1 and _deleted != true]"
    }
  ],
  "navegacion": [
    { "id": "lista", "label": "anuncios.nav.lista", "privacidad": "public" },
    { "id": "gestionar", "label": "anuncios.nav.gestionar", "privacidad": "shield_lock" }
  ]
}
```

**Validation checklist specific to this module:**
- [ ] SEC-01: `AnunciosList` public tab MUST NOT render any `enc_` fields
- [ ] ARC-02: No imports from other `src/modules/*/` directories
- [ ] ARC-05: `manifest.json` present with all required fields
- [ ] UI-06: "Gestionar" tab uses `shield_lock` icon
- [ ] DAT-05: All announcement IDs are UUIDs
- [ ] TST-01: Each `.tsx` file has a co-located `.test.tsx`

---

## Example 03: Bug Fix

### Input Request

```
Security audit found that the public view of personas is exposing encrypted fields.
Fix the data sanitization to ensure enc_ fields are never sent to public views.
```

### Step-by-Step Reasoning (Plan)

```markdown
## Analysis

**Relevant Documentation:**
- `/docs/architecture/Permisos.md` - Public view permissions
- `/docs/architecture/Backend.md` - Data sanitization
- `/docs/architecture/Esquemas_Comunes.md` - Common schemas
- `/system/rules.md` - SEC-01, SEC-03, DAT-03

**Root Cause:**
The `sanitizeForPublicView` function is not recursively removing all `enc_` prefixed fields from nested objects.

**Impact:**
CRITICAL - Encrypted PII may be exposed to unauthenticated users

**Fix Strategy:**
1. Update sanitization function to recursively process nested objects
2. Add tests to verify all enc_ fields are removed
3. Audit all public endpoints for compliance

## Implementation Plan

### Task 1: Fix sanitization function
- **File:** `backend/src/api.gs`
- **Complexity:** Medium

### Task 2: Add comprehensive tests
- **File:** `backend/src/api.test.gs`
- **Complexity:** Medium

### Task 3: Audit and fix frontend public views
- **Files:** `src/modules/*/views/*Public.tsx`
- **Complexity:** Medium

### Task 4: Update documentation
- **File:** `docs/CHANGELOG.md`
- **Complexity:** Low
```

### Final Output

> **Note:** This example is a security bug fix. The Executor MUST produce actual corrected code, not a description. Below is the complete fix for the sanitization function described in the plan.

**MODIFIED: `src/core/utils/sanitize.ts`**

```typescript
/**
 * Recursively removes all fields prefixed with `enc_` from an object.
 * Used to sanitize data before sending to public views or unauthenticated users.
 *
 * @security SEC-01, DAT-03 — Never expose encrypted fields publicly.
 * @param data - Object or array to sanitize
 * @returns New object with all enc_ fields removed (deep clone, no mutation)
 */
export function sanitizeForPublicView<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map(sanitizeForPublicView) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (key.startsWith('enc_')) return acc;
      return { ...acc, [key]: sanitizeForPublicView(value) };
    }, {} as T);
  }
  return data;
}
```

**NEW: `src/core/utils/sanitize.test.ts`**

```typescript
import { sanitizeForPublicView } from './sanitize';

describe('sanitizeForPublicView', () => {
  it('removes top-level enc_ fields', () => {
    const input = { id: '1', nombre: 'Test', enc_apellido: 'secret' };
    expect(sanitizeForPublicView(input)).toEqual({ id: '1', nombre: 'Test' });
  });

  it('removes enc_ fields from nested objects', () => {
    const input = { id: '1', contacto: { telefono: '123', enc_email: 'secret' } };
    expect(sanitizeForPublicView(input)).toEqual({ id: '1', contacto: { telefono: '123' } });
  });

  it('removes enc_ fields from objects inside arrays', () => {
    const input = [{ id: '1', enc_data: 'secret' }, { id: '2', nombre: 'ok' }];
    expect(sanitizeForPublicView(input)).toEqual([{ id: '1' }, { id: '2', nombre: 'ok' }]);
  });

  it('does not mutate the original object', () => {
    const input = { id: '1', enc_secret: 'x' };
    sanitizeForPublicView(input);
    expect(input).toHaveProperty('enc_secret');
  });

  it('handles null and primitive values safely', () => {
    expect(sanitizeForPublicView(null)).toBeNull();
    expect(sanitizeForPublicView('string')).toBe('string');
    expect(sanitizeForPublicView(42)).toBe(42);
  });
});
```

**Validation report excerpt (L3 Security):**

| ID | Criterion | Status | Notes |
|----|-----------|--------|-------|
| L3-01 | No exposed `enc_` fields | ✅ PASS | `sanitizeForPublicView` now recursive |
| L3-04 | Input sanitization | ✅ PASS | Applied at DataService layer |

**Overall Result:** ✅ PASS  
**Validated by:** Reviewer Agent | **Date:** 2026-03-20 | **Confidence:** High

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20
