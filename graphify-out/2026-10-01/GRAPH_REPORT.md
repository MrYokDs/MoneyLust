# Graph Report - MoneyLust  (2026-10-01)

## Corpus Check
- 89 files · ~46,269 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .bat 1, .css 1)

## Summary
- 489 nodes · 1171 edges · 24 communities (18 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6411793f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SavedPlans/SavedPlans.tsx
- react
- DailyGrowthTable.tsx
- TradingNoteHeaderWidget.tsx
- dependencies
- package.json
- StockPlannerForm.tsx
- React Page & Code Architecture Standards
- compilerOptions
- DataBackupModal.tsx
- devDependencies
- MoneyLust Project Guidelines & Standards
- compilerOptions
- eslint.config.js
- scripts
- vite.config.ts
- tsconfig.json
- vercel.json
- 2. คำสั่งหลักในการใช้งาน (Core CLI Commands)
- Autonomous Build Verification (การทดสอบ Build อัตโนมัติโดยไม่ต้องขออนุญาต)
- Autonomous Workspace Terminal Execution (มาตรฐานการรันคำสั่ง Terminal อัตโนมัติภายใน Workspace)
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `react` - 44 edges
2. `@mui/material` - 43 edges
3. `lucide-react` - 30 edges
4. `CalculationResult` - 26 edges
5. `GlassCard()` - 25 edges
6. `compilerOptions` - 22 edges
7. `formatCurrency()` - 20 edges
8. `SavedPlans()` - 19 edges
9. `StockPlanner()` - 18 edges
10. `InvestmentPlan()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ก. หน้าหลัก (`<PageName>.tsx`)` --references--> `useAppDispatch()`  [INFERRED]
  .agents/skills/common-skills/SKILL.md → src/store/index.ts
- `3. Naming Conventions (มาตรฐานการตั้งชื่อ)` --references--> `StockPlannerForm()`  [INFERRED]
  AGENTS.md → src/pages/StockPlanner/sections/StockPlannerForm.tsx
- `5. มาตรฐานการตั้งชื่อ (Naming Conventions)` --references--> `StockPlannerForm()`  [INFERRED]
  .agents/skills/common-skills/SKILL.md → src/pages/StockPlanner/sections/StockPlannerForm.tsx
- `5. มาตรฐานการตั้งชื่อ (Naming Conventions)` --references--> `TrancheDetailsTable()`  [INFERRED]
  .agents/skills/common-skills/SKILL.md → src/pages/StockPlanner/sections/TrancheDetailsTable.tsx
- `5. มาตรฐานการตั้งชื่อ (Naming Conventions)` --references--> `StockOption`  [INFERRED]
  .agents/skills/common-skills/SKILL.md → src/pages/StockPlanner/types.ts

## Import Cycles
- 2-file cycle: `src/components/trading-note/TradingNoteContent.tsx -> src/components/trading-note/index.ts -> src/components/trading-note/TradingNoteContent.tsx`
- 4-file cycle: `src/pages/SavedPlans.tsx -> src/pages/SavedPlans/SavedPlans.tsx -> src/routes/index.ts -> src/routes/AppRoutes.tsx -> src/pages/SavedPlans.tsx`
- 4-file cycle: `src/pages/StockPlanner.tsx -> src/pages/StockPlanner/StockPlanner.tsx -> src/routes/index.ts -> src/routes/AppRoutes.tsx -> src/pages/StockPlanner.tsx`

## Communities (24 total, 6 thin omitted)

### Community 0 - "SavedPlans/SavedPlans.tsx"
Cohesion: 0.05
Nodes (48): notistack, react-dom, react-redux, react-router-dom, @reduxjs/toolkit, @tanstack/react-query, App(), Layout() (+40 more)

### Community 1 - "react"
Cohesion: 0.11
Nodes (38): lucide-react, @mui/material, react, CurrencyTextField(), CurrencyTextFieldProps, formatNumberWithCommas(), GlassCard(), GlassCardProps (+30 more)

### Community 2 - "DailyGrowthTable.tsx"
Cohesion: 0.14
Nodes (18): DailyGrowthTableProps, PortfolioBenchmarkCardProps, DAILY_RETURN_PRESETS, DailyReturnPreset, GrowthPlanFormData, TradingFeeSectionProps, StockPlannerState, DailyGrowthItem (+10 more)

### Community 3 - "TradingNoteHeaderWidget.tsx"
Cohesion: 0.14
Nodes (28): FloatingTradingNoteWindow(), FloatingTradingNoteWindowProps, NotePosition, MarketHolidaysTab(), MarketHolidaysTabProps, TradingNoteContent(), TradingNoteContentProps, TradingWindowsTab() (+20 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (36): dependencies, async-mutex, axios, dayjs, @emotion/react, @emotion/styled, formik, @formkit/auto-animate (+28 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (35): name, private, type, version, async-mutex, axios, dayjs, @emotion/react (+27 more)

### Community 6 - "StockPlannerForm.tsx"
Cohesion: 0.09
Nodes (36): InfoTooltipLabel(), InfoTooltipLabelProps, GrowthPlanFormProps, PortfolioGrowthPlanCardProps, CompanyInsightsCard(), CompanyInsightsCardProps, CurrencyExchangeField(), CurrencyExchangeFieldProps (+28 more)

### Community 7 - "React Page & Code Architecture Standards"
Cohesion: 0.12
Nodes (16): 10. การแบ่งหน้าที่ (Responsibilities Separation), 11. การจัดการ Routing และ Route Paths (`src/routes/`), 12. Checklist ก่อนและหลังเขียนโค้ด, 1. กฎสำคัญที่สุด: ตรวจสอบก่อนสร้างใหม่เสมอ (Check Before Create), 2. การจัดการโค้ดหรือไฟล์ที่ไม่จำเป็น: ต้องถามก่อนลบเสมอ (Ask Before Delete), 3. การทดสอบ Build ทุกครั้งที่มีการแก้ไขโค้ด (Mandatory Build Check - รันอัตโนมัติได้ทันที), 4. กฎจำกัดขนาดไฟล์ไม่เกิน 500 - 600 บรรทัด (File Length Limit), 5. มาตรฐานการตั้งชื่อ (Naming Conventions) (+8 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, composite, isolatedModules, jsx, lib, module (+15 more)

### Community 9 - "DataBackupModal.tsx"
Cohesion: 0.29
Nodes (14): DataBackupModal(), BACKUP_KEYS, copyBackupToClipboard(), downloadBackupJson(), getExportPayload(), importBackupFromJson(), ImportResult, MoneyLustBackupPayload (+6 more)

### Community 10 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/node, @types/react (+5 more)

### Community 11 - "MoneyLust Project Guidelines & Standards"
Cohesion: 0.13
Nodes (14): 10. Thai Language Standard for Planning Artifacts (การเขียน Implementation Plan เป็นภาษาไทย), 11. Centralized Routing & Route Comment Standard (การจัดการโฟลเดอร์ Routes และการเขียน Comment ระบุ Route Path ด้านบนสุดของไฟล์ UI), 12. Autonomous Workspace Terminal Execution (สิทธิ์การรัน Terminal อัตโนมัติภายใน Workspace), 13. Codebase Knowledge Graph & Graphify Maintenance (การอัปเดต Knowledge Graph ทุกครั้งหลังแก้โค้ด), 1. Check Before Create (ตรวจสอบก่อนสร้างใหม่เสมอ), 2. File Length Limit (จำกัดความยาวไฟล์ไม่เกิน 500-600 บรรทัด), 3. Naming Conventions (มาตรฐานการตั้งชื่อ), 4. Base64 Handling (ห้ามใช้ btoa / atob โดยเด็ดขาด) (+6 more)

### Community 12 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, noEmit, skipLibCheck, strict (+2 more)

### Community 13 - "eslint.config.js"
Cohesion: 0.33
Nodes (5): @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint

### Community 14 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 19 - "2. คำสั่งหลักในการใช้งาน (Core CLI Commands)"
Cohesion: 0.20
Nodes (9): 1. วัตถุประสงค์และประโยชน์ในโปรเจกต์ MoneyLust (Core Purpose), 2.1 การสกัดและสร้าง Knowledge Graph ใหม่ (Extraction), 2.2 การอัปเดต Graph หลังแก้ไขโค้ด (Incremental Update), 2.3 การสร้าง Interactive Web Visualizer (HTML Export), 2.4 การสืบค้นความสัมพันธ์ในโค้ด (Query & Path Tracing), 2. คำสั่งหลักในการใช้งาน (Core CLI Commands), 3. ขั้นตอนการนำไปใช้ใน Workflow การพัฒนา (Development Workflow), 4. รายการไฟล์ Output ที่สร้างขึ้น (`graphify-out/`) (+1 more)

### Community 20 - "Autonomous Build Verification (การทดสอบ Build อัตโนมัติโดยไม่ต้องขออนุญาต)"
Cohesion: 0.29
Nodes (6): 1. ที่มาและบริบท (Context & Origin), 2. เหตุผลและความสำคัญ (Rationale), 3. ระเบียบปฏิบัติมาตรฐาน (Standard Procedure), 4. รายการตรวจสอบ (Checklist), Autonomous Build Verification (การทดสอบ Build อัตโนมัติโดยไม่ต้องขออนุญาต), กฎปฏิบัติ:

### Community 21 - "Autonomous Workspace Terminal Execution (มาตรฐานการรันคำสั่ง Terminal อัตโนมัติภายใน Workspace)"
Cohesion: 0.33
Nodes (5): 1. บริบทและสิทธิ์ที่ได้รับอนุญาต (Context & Authorization), 2. คำสั่งที่ได้รับอนุญาตให้รันอัตโนมัติ (Pre-Authorized Command Patterns), 3. กฎเหล็กในการรันคำสั่ง (Mandatory Rules), 4. รายการตรวจสอบก่อนรันคำสั่ง (Checklist), Autonomous Workspace Terminal Execution (มาตรฐานการรันคำสั่ง Terminal อัตโนมัติภายใน Workspace)

## Knowledge Gaps
- **186 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+181 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `SavedPlans/SavedPlans.tsx`, `DailyGrowthTable.tsx`, `TradingNoteHeaderWidget.tsx`, `package.json`, `StockPlannerForm.tsx`, `DataBackupModal.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `@mui/material` connect `react` to `SavedPlans/SavedPlans.tsx`, `DailyGrowthTable.tsx`, `TradingNoteHeaderWidget.tsx`, `package.json`, `StockPlannerForm.tsx`, `DataBackupModal.tsx`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `CalculationResult` (e.g. with `3. Naming Conventions (มาตรฐานการตั้งชื่อ)` and `5. มาตรฐานการตั้งชื่อ (Naming Conventions)`) actually correct?**
  _`CalculationResult` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _186 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SavedPlans/SavedPlans.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.053750597228858096 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.11052353252247488 - nodes in this community are weakly interconnected._