# Coding Skills & Tools Reference

> Research findings on best-in-class AI coding agents, frontend frameworks, and component libraries for 2025–2026. Tailored recommendations for the SimpleERP codebase (React 18 + TypeScript + TailwindCSS + Vite + Zustand).

---

## 1. AI Coding Agents — Comparison

| Agent | Maker | Model | Strengths | Weaknesses | Best For |
|---|---|---|---|---|---|
| **Claude Code** | Anthropic | Claude 4 (Sonnet/Opus) | Best reasoning, long context (200K), whole-repo understanding, file diffs, git integration, multi-step planning | No native autocomplete in editor (CLI-first) | Complex refactors, architecture decisions, full-stack features, code review |
| **Cursor** (Pro) | Cursor | Claude + GPT-4o hybrid | Native IDE with inline autocomplete (Tab), agent mode, codebase indexing, diff viewer | Subscription paywall for best features; less control | Daily coding with autocomplete + agent tasks |
| **GitHub Copilot** (Chat + Agents) | Microsoft/OpenAI | GPT-4o / Codex | Deep VS Code / JetBrains integration, inline suggestions, CLI agent (`/dev`) | Weak at multi-file refactors; noisy suggestions | Boilerplate, small fixes, learning unfamiliar APIs |
| **JetBrains AI Assistant** | JetBrains | Claude / GPT-4 | IDE-native, understands project structure deeply | Less powerful reasoning than Claude Code | IntelliJ users who want AI inside the IDE |
| **Amazon CodeWhisperer / Q Developer** | Amazon | Custom / Claude | AWS integration, security scanning | Narrow scope; AWS-centric | AWS Lambda / cloud-native work |

### Key Takeaway for SimpleERP
**Claude Code is the strongest agent for this project** — especially for refactoring the Zustand stores, building new API integrations, or restructuring the frontend architecture. Use it for complex tasks; keep Copilot/Cursor for quick inline completions during day-to-day editing.

### Claude Code Workflow Tips
```bash
# Start a task with explicit scope
claude -p "Refactor the product/purchase/sales stores to use a shared generic CRUD store pattern"

# Ask for a diff-based review
claude -p "Review src/client/src/stores/ and suggest improvements for type safety"

# Generate tests alongside code
claude -p "Add Vitest unit tests for the productStore"
```

---

## 2. React Component Libraries — Comparison

| Library | Approach | Customization | Accessibility | Bundle Size | Popularity | Verdict |
|---|---|---|---|---|---|---|
| **shadcn/ui** | Copy-paste components into your repo | Full TailwindCSS control | Radix primitives (WCAG) | Tree-shakeable, minimal | Fastest growing (2024–2025) | **#1 recommendation** |
| **Radix UI** | Headless, unstyled primitives | You style everything | Excellent (WAI-ARIA) | Tiny | Mature, stable | Good base, requires design work |
| **Headless UI** | Headless, Tailwind-first (by Tailwind Labs) | TailwindCSS classes | Good | Tiny | Large (Tailwind ecosystem) | Solid alternative |
| **MUI (Material UI)** | Full component library | Theme override | Partial | Heavy (~40KB+) | Very large | Avoid for custom UIs; heavy |
| **Ant Design** | Enterprise components | Limited | Moderate | Very heavy | Large (China market) | Avoid for ERP-light apps |
| **Chakra UI** | Style props, themeable | Good | Good | Medium (~44KB) | Large | Good but shadcn/ui wins |
| **NextUI** | TailwindCSS-based | TailwindCSS + Theme config | Moderate | Medium | Growing | Strong alternative to shadcn |
| **Ark UI** | Headless, framework-agnostic | CSS-in-JS or plain | Excellent | Tiny (tree-shakeable) | Emerging | Future-looking, excellent DX |

### Key Takeaway for SimpleERP
**shadcn/ui is the clear winner** for this project:
- Already using TailwindCSS with a custom theme → natural fit
- Components are copied into the repo → full control, no external runtime dependency
- Radix UI primitives underneath → full accessibility compliance
- Ships with a CLI: `npx shadcn@latest add button dialog table`
- Dark mode support built-in

---

## 3. TailwindCSS Component Libraries

| Library | Style | Themeable | Components | Shadcn Compatible | Notes |
|---|---|---|---|---|---|
| **shadcn/ui** | Copy-paste, Tailwind-first | Full | 50+ | Native | **Best choice** |
| **Headless UI** | Headless + Tailwind | Yes | Menus, dialogs, listboxes, transitions | Compatible | From Tailwind Labs |
| **NextUI** | TailwindCSS + presets | Yes (theme config) | 40+ | Compatible | Beautiful defaults, good docs |
| **Float UI** | Tailwind + React | Yes | 20+ | Compatible | Lightweight, modern |
| **Tailwind UI** | Official Tailwind Labs | Yes | 50+ | Compatible | Paid ($299), production-ready |

### SimpleERP already has:
- Custom Tailwind config with `primary` color palette (blue)
- Custom `.btn`, `.input`, `.label`, `.card` utility classes
- Inter font loaded from Google Fonts

**Recommendation**: Migrate custom components to shadcn/ui equivalents and keep the custom theme extended.

---

## 4. shadcn/ui Components — Priority List for SimpleERP

### High Priority (add immediately)

| Component | Why | Replaces/Covers |
|---|---|---|
| `button` | Accessible, multiple variants (`destructive`, `outline`, `ghost`) | All `<button className="btn ...">` |
| `dialog` | Full-featured accessible modal | Current custom `Modal.tsx` |
| `table` | Headless table wrapper for @tanstack/react-table | Manual table styling |
| `input` | Accessible form inputs with consistent styling | `.input` class |
| `label` | Built-in with `htmlFor` wiring | `.label` class |
| `form` | Form field wrappers with error states | Manual form layout |
| `select` | Native-feel dropdown | `<select>` or custom dropdowns |
| `separator` | Visual dividers | Manual `border-t` divs |

### Medium Priority

| Component | Why |
|---|---|
| `badge` | Status badges (e.g., "低库存", "已发货") |
| `dropdown-menu` | User menu, action menus |
| `tabs` | Dashboard sections, settings pages |
| `sheet` | Mobile-friendly side panel (sidebar on mobile) |
| `avatar` | User profile pictures in sidebar |
| `skeleton` | Loading states instead of `animate-pulse` |
| `toast` / `sonner` | Non-blocking notifications |
| `tooltip` | Hover hints for icons and abbreviations |
| `data-table` (shadcn) | Built on @tanstack/react-table with sorting/filtering/pagination |

### Lower Priority (future)

| Component | Use Case |
|---|---|
| `command` (Combobox) | Product/supplier/customer search |
| `calendar` | Date range for purchases/sales |
| `popover` | Inline popovers |
| `card` | Dashboard metric cards |
| `progress` | Inventory fill indicators |
| `alert-dialog` | Destructive action confirmations |

---

## 5. Actionable Recommendations for SimpleERP

### Quick Wins (1–2 days)

1. **Install shadcn/ui CLI**
   ```bash
   cd src/client
   npx shadcn@latest init
   # Choose: Slate, CSS variables: yes, tailwind.config.js: existing
   ```

2. **Add first components**
   ```bash
   npx shadcn@latest add button dialog input label separator badge
   ```

3. **Replace Modal.tsx** with shadcn `Dialog` component — it has:
   - Focus trapping
   - Escape key handling (already done manually)
   - Scroll lock (already done manually)
   - Smarter portal behavior

4. **Replace emoji icons** in Sidebar with Lucide React icons
   ```bash
   npx shadcn@latest add avatar dropdown-menu
   ```
   Lucide icons are included with shadcn and are tree-shakeable.

### Short-term (1 week)

5. **Add toast notifications** (`sonner` is the most popular shadcn addition)
   ```bash
   npx shadcn@latest add sonner
   ```
   Replace `try/catch` error handling in stores with toast feedback.

6. **Migrate table to shadcn `Table` + `@tanstack/react-table`**
   - `DataTable.tsx` already uses `@tanstack/react-table` — just use shadcn `Table` for styling

7. **Add loading skeletons** instead of `animate-pulse`
   ```bash
   npx shadcn@latest add skeleton
   ```

### Medium-term (2–4 weeks)

8. **Zustand store improvements** (ask Claude Code to help):
   - Add optimistic updates for instant UI feedback
   - Add error state persistence (don't clear on unmount)
   - Consider a shared `createStore<T>` generic factory

9. **DataTable search/filter** — enhance `DataTable.tsx` with:
   - Column-level filtering
   - Column visibility toggles
   - Export to CSV

10. **Responsive sidebar** — use shadcn `Sheet` for mobile drawer

### Architecture Improvements

11. **Add React Query (TanStack Query)** instead of Zustand for server state
    - Simpler API for caching, pagination, refetching
    - Zustand can stay for purely client state (UI toggles, selected rows)

12. **TypeScript strictness** — add to `tsconfig.json`:
    ```json
    {
      "strict": true,
      "noUncheckedIndexedAccess": true
    }
    ```
    Ask Claude Code to fix resulting type errors.

13. **Vitest** for unit tests on stores:
    ```bash
    npm install -D vitest
    ```

---

## 6. Claude Code — Prompt Engineering for This Project

### Effective Prompt Patterns

```markdown
# Generate a CRUD page
"Create a new page for PurchaseOrdersPage.tsx using the same pattern as ProductsPage.tsx.
Use the usePurchaseStore() store (already exists), the DataTable component, and shadcn/ui
Dialog for the add/edit form. Follow the same column layout and form structure."

# Refactor with constraints
"Refactor all store files in src/client/src/stores/ to use a shared generic
createResourceStore<T>(api) factory. Preserve all existing methods and types.
Run tests after refactoring."

# UI upgrade
"Replace all emoji icons in Sidebar.tsx with Lucide React icons from the lucide-react package.
Use appropriate icons for: dashboard, products, suppliers, customers, purchases, sales, inventory."

# Accessibility audit
"Review ProductsPage.tsx for accessibility issues. Check: form labels, button text,
table headers, modal focus management, color contrast."
```

### Useful Claude Code Commands
```bash
claude -p "Add shadcn/ui dialog to replace the custom Modal component"
claude -p "Refactor DataTable to use shadcn Table component"
claude -p "Add optimistic updates to the product store"
claude -p "Write unit tests for productStore using Vitest"
```

---

## 7. Recommended Skills for Claude Code Sessions

### Before Starting a Session
Set context in a CLAUDE.md file:
```markdown
# Project: SimpleERP
- Stack: React 18, TypeScript, TailwindCSS, Vite, Zustand, @tanstack/react-table
- Backend: Go API at /api
- UI: shadcn/ui components, Inter font, custom Tailwind theme (primary=blue)
- Convention: Chinese UI labels, camelCase types, PascalCase components
```

### Skill Shortcuts
- `/simplify` — After making changes, run to review for code quality/reuse
- `/loop` — For recurring tasks (e.g., check build status every 5 min)
- Use **EnterPlanMode** for any feature requiring more than 2 files changed

---

## 8. Tech Radar Summary

```
ADOPT (use now):
  ✓ shadcn/ui         — Best component library for TailwindCSS projects
  ✓ Claude Code       — Primary AI coding agent for complex tasks
  ✓ Zustand v5        — Lightweight, TypeScript-friendly state
  ✓ @tanstack/table   — Headless table, great DX
  ✓ TailwindCSS v3    — Stable, vast ecosystem
  ✓ Radix UI          — Accessibility primitives (via shadcn)

TRIAL (evaluate):
  ○ TanStack Query    — For server state (vs Zustand)
  ○ NextUI            — Alternative to shadcn if defaults preferred
  ○ Ark UI            — Future headless alternative to Radix
  ○ tRPC              — End-to-end type safety (if Go backend adds tRPC)

ASSESS (keep watching):
  △ V0 / v0.dev       — AI-generated UI (by Vercel)
  △ Bolt.new          — Full-stack AI project generation
  △ Copilot Agents    — Microsoft agent mode, improving fast
```

---

## 9. Quick-Start: Adding shadcn/ui to SimpleERP

```bash
# 1. Initialize shadcn/ui
cd src/client
npx shadcn@latest init
# Defaults:
#   Style: Default (slate)
#   Base color: Slate
#   CSS variables: Yes
#   Tailwind config: tailwind.config.js
#   CSS file: src/index.css
#   Components: 50+
#   Utils: Yes

# 2. Add key components
npx shadcn@latest add button dialog input label separator badge
npx shadcn@latest add table dropdown-menu avatar skeleton sonner
npx shadcn@latest add tabs sheet tooltip

# 3. Add Lucide icons (included with shadcn)
# Already available: import { Package, Users, ShoppingCart, ... } from "lucide-react"
```

After adding shadcn, run `npm run build` to verify no conflicts with the existing custom theme.

---

*Last updated: 2026-03-31 | Based on knowledge through August 2025*
