# MoneyLust Project Guidelines & Standards

## 1. Check Before Create (ตรวจสอบก่อนสร้างใหม่เสมอ)
Before creating any new function, React component, or data type:
- **Always inspect `src/types/`** (shared TypeScript types), **`src/components/`** (shared UI components), and **`src/utils/`** (shared utilities/math/helpers) first.
- If a similar component, function, or type already exists, reuse or extend it. Never write duplicate code.

## 2. File Length Limit (จำกัดความยาวไฟล์ไม่เกิน 500-600 บรรทัด)
- No single code file should exceed **500 - 600 lines** unless strictly unavoidable.
- If a file approaches this limit:
  - If it is page-specific UI, split it into sub-components inside `src/pages/<PageName>/sections/`.
  - If a component is used or likely to be used across multiple pages/categories, extract it to `src/components/`.
  - If a function is shared across multiple places, extract it to `src/utils/`.

## 3. Naming Conventions (มาตรฐานการตั้งชื่อ)
- **Variables, functions, and methods** MUST strictly use **`camelCase`** (e.g., `calculateStockTranches`, `maxAvailableBudget`, `handleSelectPortfolio`).
- **React Components, Types, and Interfaces** use **`PascalCase`** (e.g., `StockPlannerForm`, `CalculationResult`).
- Component files: `PascalCase.tsx`. Utility files: `camelCase.ts`.

## 4. Base64 Handling (ห้ามใช้ btoa / atob โดยเด็ดขาด)
- **STRICTLY PROHIBITED**: Never use native `btoa()` or `atob()` functions due to UTF-8/Unicode limitations (fails on Thai language strings).
- Always use standard Base64 handling from `js-base64` (installed in project):
  ```ts
  import { Base64 } from 'js-base64';
  const encoded = Base64.encode(str);
  const decoded = Base64.decode(encodedStr);
  ```

## 5. Page Architecture & Modular Folder Standard
Whenever creating a new page or refactoring existing pages under `src/pages/`:
1. **Never create a single bloated page file**.
2. Create a dedicated directory for each page: `src/pages/<PageName>/`.
3. Inside `src/pages/<PageName>/`:
   - `<PageName>.tsx`: Main page orchestrator (keeps state, hooks, layout; aim for < 300 lines).
   - `types.ts`: Page-specific TypeScript interfaces & types.
   - `index.ts`: Re-export the page component (`export { <PageName>, default } from './<PageName>'; export * from './types';`).
   - `sections/`: Dedicated subfolder containing focused UI sub-components (Forms, Tables, Cards, Modals, EmptyAlerts).
4. Create `src/pages/<PageName>.tsx` to re-export from `./<PageName>/<PageName>` to ensure 100% backward compatibility with routing in `App.tsx`.

For the complete specification and checklist, refer to the skill:
- [SKILL.md](file:///f:/All_Works/Programming/React_Programming/MoneyLust/.agents/skills/common-skills/SKILL.md)

## 6. Continuous Learning Trigger (การเรียนรู้จากคำสั่ง "คราวหลัง" / "ครั้งหน้า")
Whenever the user uses phrases like **"คราวหลัง..."** หรือ **"ครั้งหน้า..."** (e.g., "คราวหลังทำแบบนี้", "ครั้งหน้าให้..."):
- Treat this as an explicit directive to **learn from past mistakes and feedback**.
- **Automatically capture and persist this knowledge** into a brand-new, dedicated skill folder under `.agents/skills/<new-skill-name>/SKILL.md` (separate from `common-skills`).
- Document the context, rationale, standard procedure, and checklist so that the agent adheres to it autonomously in all future tasks.

## 7. Obsolete Code & File Deletion Policy (การลบโค้ด/ไฟล์ที่ไม่จำเป็น - ต้องขออนุญาตก่อนเสมอ)
- If any modification makes existing code, functions, or files redundant or obsolete:
  - **Always ask the user first** whether they want to delete it.
  - **STRICTLY FORBIDDEN to delete any file or code block before receiving explicit permission from the user.**

## 8. Mandatory Build Check (ทดสอบ Build ทุกครั้งหลังแก้โค้ด - ได้รับอนุญาตให้รันอัตโนมัติได้ทันที)
- **Every time code is modified**, you MUST execute `yarn build` (via `cmd /c "yarn build"`) to test for compilation, type errors, or bundle issues immediately.
- **Pre-authorized Execution**: The user has explicitly authorized running `cmd /c "yarn build"` automatically. Do NOT ask for user permission before executing this command.
- Never complete a turn with unverified code modifications.

## 9. Function Documentation & Thai Comments Standard (การเขียน Comment อธิบายฟังก์ชันเป็นภาษาไทย)
- Whenever creating or declaring any function:
  - Must write explanatory comments (JSDoc/TSDoc format).
  - Clearly describe what the function does, its `@param` (parameters), and its `@returns` (returned value).
  - Comments must predominantly be written in **Thai (ภาษาไทย)**.

## 10. Thai Language Standard for Planning Artifacts (การเขียน Implementation Plan เป็นภาษาไทย)
- All `implementation_plan.md`, `walkthrough.md`, and planning artifacts MUST predominantly be written in **Thai (ภาษาไทย)** for clear alignment with the user.

## 11. Centralized Routing & Route Comment Standard (การจัดการโฟลเดอร์ Routes และการเขียน Comment ระบุ Route Path ด้านบนสุดของไฟล์ UI)
- All route paths and route tables MUST be centralized under `src/routes/` (`paths.ts`, `AppRoutes.tsx`).
- Never hardcode route paths in application components; always use constants from `src/routes/paths.ts` (e.g. `PATHS.HOME`, `PATHS.PORTFOLIO(id)`).
- Every main UI page file and its sub-components/sections MUST have a top-of-file comment indicating its route path (`/** Route: /... */`).

## 12. Autonomous Workspace Terminal Execution (สิทธิ์การรัน Terminal อัตโนมัติภายใน Workspace)
- **Pre-authorized Terminal Execution**: The user has explicitly granted full permission to run any terminal command via `run_command` needed for project development, building, testing, linting, code verification, math simulation, and package management autonomously without asking for user permission before executing.
- **Strict Workspace Boundary**: All commands and operations MUST strictly have their working directory (`Cwd`) within the MoneyLust project workspace. It is **STRICTLY FORBIDDEN** to touch, read, modify, or delete anything outside this workspace.
- For complete specification, refer to:
  - [workspace-terminal-execution SKILL.md](file:///f:/All_Works/Programming/React_Programming/MoneyLust/.agents/skills/workspace-terminal-execution/SKILL.md)


