---
name: common-skills
description: Core foundational guidelines and development standards for the MoneyLust project. Includes file length limits (500-600 lines max), check-before-create reuse policy, camelCase naming conventions, btoa/atob prohibition (use js-base64), asking before deleting obsolete files/code, mandatory yarn build verification, Thai function comments (params & returns), and Thai implementation plans.
---

# React Page & Code Architecture Standards

แนวทางและมาตรฐานการพัฒนาโค้ด โครงสร้าง Page, Component และ Utility Function ในโปรเจกต์นี้ เพื่อให้โค้ดอ่านง่าย สะอาด เป็นระเบียบ บำรุงรักษาสะดวก และป้องกันปัญหาไฟล์ยาวเกินไป (File Bloat)

---

## 1. กฎสำคัญที่สุด: ตรวจสอบก่อนสร้างใหม่เสมอ (Check Before Create)

> [!IMPORTANT]
> **ก่อนสร้างฟังก์ชัน, Component หรือ Data Type ใหม่ทุกครั้ง ต้องตรวจสอบของเดิมก่อนเสมอ:**
> 1. ตรวจสอบโฟลเดอร์ **Types กลาง** (`src/types/`) ว่ามี Type / Interface ของข้อมูลที่เคยสร้างไว้หรือไม่
> 2. ตรวจสอบโฟลเดอร์ **Component กลาง** (`src/components/`) ว่ามี UI Component ที่คล้ายกัน หรือปรับแต่งนำกลับมาใช้ซ้ำ (Reuse) ได้หรือไม่
> 3. ตรวจสอบโฟลเดอร์ **ฟังก์ชันกลาง** (`src/utils/`) เช่น `stockMath.ts` หรือ util อื่นๆ ว่ามีฟังก์ชันคำนวณ แปลงค่า จัดรูปแบบ (Format) ที่เคยสร้างไว้แล้วหรือไม่
> 4. **ห้ามเขียนฟังก์ชัน, Component หรือ Type ซ้ำซ้อน** หากมีของเดิมให้ reuse หรือขยายความสามารถ (extend) ของเดิมแทน

---

## 2. การจัดการโค้ดหรือไฟล์ที่ไม่จำเป็น: ต้องถามก่อนลบเสมอ (Ask Before Delete)

> [!WARNING]
> **ห้ามลบโค้ด ฟังก์ชัน หรือไฟล์ใดๆ ทิ้งโดยพลการก่อนได้รับอนุญาตเด็ดขาด:**
> 1. หากการแก้ไขหรือ Refactor ทำให้รู้สึกว่ามีโค้ดเก่า ฟังก์ชัน หรือไฟล์ส่วนใดที่ไม่จำเป็นแล้ว ให้ **สอบถามผู้ใช้ทันที** ว่าต้องการให้ลบทิ้งหรือไม่
> 2. ต้องได้รับคำยืนยัน/อนุญาตจากผู้ใช้ก่อน จึงจะสามารถลบออกได้

---

## 3. การทดสอบ Build ทุกครั้งที่มีการแก้ไขโค้ด (Mandatory Build Check)

> [!IMPORTANT]
> **ทุกครั้งที่มีการแก้ไขหรือเพิ่มโค้ดในโปรเจกต์:**
> - ต้องรันคำสั่ง **`yarn build`** (หรือ `cmd /c "yarn build"`) เพื่อทดสอบ TypeScript types, Syntax errors, และ Bundling เสมอ
> - ต้องมั่นใจว่า Build ผ่าน (Exit code 0) จึงจะถือว่าการทำงานในส่วนนั้นเสร็จสิ้น

---

## 4. กฎจำกัดขนาดไฟล์ไม่เกิน 500 - 600 บรรทัด (File Length Limit)

แต่ละไฟล์โค้ด **ต้องมีความยาวไม่เกิน 500 - 600 บรรทัด** หากไม่มีเหตุจำเป็นอย่างยิ่งยวด หากพบว่าไฟล์กำลังจะยาวเกินกำหนด ให้ปฏิบัติดังนี้:

1. **กรณีเป็น UI หรือ Sub-component เฉพาะหน้า**:
   - แตกออกเป็นไฟล์ย่อยไว้ในโฟลเดอร์ `sections/` ของหน้านั้นๆ (เช่น ฟอร์มย่อย, ตาราง, การ์ด, โมดอล)
2. **กรณีเป็น UI Component ที่ใช้มากกว่า 1 หน้า หรือใช้ร่วมกันหลายส่วน**:
   - ยกขึ้นไปสร้างเป็น **Shared Component กลาง** ใน `src/components/`
3. **กรณีเป็น Logic / ฟังก์ชันคำนวณ / Data Transformation ที่ใช้หลายส่วน**:
   - สกัดออกมาเป็นฟังก์ชันกลางและจัดหมวดหมู่ไว้ใน `src/utils/`

---

## 5. มาตรฐานการตั้งชื่อ (Naming Conventions)

- **ตัวแปร (Variables) และ ฟังก์ชัน (Functions)**: ต้องใช้รูปแบบ **`camelCase`** อย่างเคร่งครัด
  - ตัวอย่าง: `stockSymbol`, `currentPrice`, `maxAvailableBudget`, `calculateStockTranches`, `handleSelectPortfolio`, `formatCurrency`
- **React Components และ Types / Interfaces**: ใช้รูปแบบ **`PascalCase`**
  - ตัวอย่าง: `StockPlannerForm`, `TrancheDetailsTable`, `CalculationResult`, `StockOption`
- **ไฟล์ Component**: ใช้ **`PascalCase.tsx`** (เช่น `PortfolioHeader.tsx`, `GlassCard.tsx`)
- **ไฟล์ Utility / Helper Functions**: ใช้ **`camelCase.ts`** (เช่น `stockMath.ts`)

---

## 6. มาตรฐานการจัดการ Base64 (ห้ามใช้ btoa / atob โดยเด็ดขาด)

> [!CAUTION]
> **ห้ามใช้ฟังก์ชัน `btoa()` หรือ `atob()` ของเบราว์เซอร์โดยเด็ดขาด**
> เนื่องจาก `btoa` และ `atob` ไม่รองรับ UTF-8 / อักขระภาษาไทย และจะเกิด Runtime Error (`The string that to be encoded contains characters outside of the Latin1 range`)

ให้ใช้ไลบรารีมาตรฐาน **`js-base64`** (ซึ่งติดตั้งอยู่ในโปรเจกต์แล้ว) เสมอ:

```ts
import { Base64 } from 'js-base64';

// การเข้ารหัส (Encode)
const encodedString = Base64.encode(thaiString);

// การถอดรหัส (Decode)
const decodedString = Base64.decode(encodedString);
```

---

## 7. มาตรฐานการเขียน Comment อธิบายฟังก์ชันเป็นภาษาไทย (Function Documentation)

> [!NOTE]
> **เมื่อสร้างหรือแก้ไขฟังก์ชันใดๆ ก็ตาม ต้องเขียน Comment อธิบายกำกับเป็นภาษาไทยเสมอ:**
> 1. อธิบายภาพรวมว่าฟังก์ชันนี้ทำหน้าที่อะไร
> 2. ระบุ `@param` แต่ละตัวว่าคืออะไรและใช้ทำอะไร
> 3. ระบุ `@returns` ว่าผลลัพธ์ที่ได้คืนค่าอะไรกลับออกมา

```ts
/**
 * คำนวณการแบ่งไม้เข้าซื้อหุ้นตามกลยุทธ์ถัวเฉลี่ยต้นทุนขาลง (Average-Down)
 * 
 * @param stockSymbol - สัญลักษณ์หุ้น เช่น AAPL, NVDA
 * @param currentPrice - ราคาปัจจุบันของหุ้น
 * @param totalBudget - งบประมาณการลงทุนทั้งหมด
 * @param tranchesCount - จำนวนไม้ที่ต้องการแบ่งซื้อ
 * @returns ข้อมูลผลลัพธ์การคำนวณรายไม้และสถิติสะสม (CalculationResult)
 */
export const calculateStockTranches = (
  stockSymbol: string,
  currentPrice: number,
  totalBudget: number,
  tranchesCount: number
): CalculationResult => {
  // ...
};
```

---

## 8. ภาษาที่ใช้จัดทำ Implementation Plan และ เอกสาร (Thai Language Standard)

- เมื่อต้องจัดทำ **Implementation Plan** (`implementation_plan.md`), **Walkthrough** (`walkthrough.md`) หรือเอกสารสรุปงาน
- **ต้องเขียนและอธิบายเนื้อหาเป็นภาษาไทยเป็นหลัก** เพื่อให้ผู้ใช้สามารถอ่าน ทำความเข้าใจ และสื่อสารได้อย่างชัดเจน ตรงไปตรงมา

---

## 9. กฎการจัดโครงสร้างโฟลเดอร์ของ Page (Directory Structure)

ทุกหน้าที่สร้างใหม่ภายใต้ `src/pages/` **ต้องแยกเป็นโฟลเดอร์ประจำหน้าของตัวเองอย่างชัดเจน**:

```
src/pages/<PageName>/
├── <PageName>.tsx             # ไฟล์หน้าหลัก (Page Orchestrator) รวม State, Hooks, Layout (เป้าหมาย < 300 บรรทัด)
├── index.ts                   # Entry point สำหรับ re-export หน้านั้นออกไป
├── types.ts                   # Type definitions & Interfaces เฉพาะหน้านี้
└── sections/                  # โฟลเดอร์รวม UI Sub-components เฉพาะของหน้านี้
    ├── <ComponentA>.tsx       # เช่น Form, Header, Table, SummaryCards
    ├── <ComponentB>.tsx
    ├── <Modals>.tsx           # รวบรวม Dialog / Confirmation Modals
    └── <EmptyAlert>.tsx       # Alert แสดงสถานะเมื่อยังไม่มีข้อมูล
```

และสร้างไฟล์ Re-export ที่ระดับ `src/pages/<PageName>.tsx` เสมอ เพื่อให้ Routing ใน `App.tsx` เรียกใช้งานได้สะดวกและรองรับ Backward Compatibility:

```tsx
// src/pages/<PageName>.tsx
export { <PageName>, default } from './<PageName>/<PageName>';
export * from './<PageName>/types';
```

---

## 10. การแบ่งหน้าที่ (Responsibilities Separation)

### ก. หน้าหลัก (`<PageName>.tsx`)
- ทำหน้าที่เป็น **Orchestrator**:
  - ดึงข้อมูลจาก Redux Store (`useAppSelector`, `useAppDispatch`)
  - จัดการ Local State, URL Params (`useParams`, `useNavigate`)
  - จัดการคำนวณและ Memoization (`useMemo`, `useCallback`)
  - ควบคุม Layout Grid ใหญ่ และส่ง Props / Handlers ไปยังคอมโพเนนต์ใน `sections/`
- ขนาดไฟล์ควรสั้น กระชับ อ่านเข้าใจภาพรวมได้ทั้งหมดในหน้าจอเดียว

### ข. โฟลเดอร์ `sections/`
- รวบรวม Sub-components ที่ทำงานเฉพาะเรื่อง รับเฉพาะ Props ที่จำเป็น ไม่ผูกติดกับ Global State โดยไม่จำเป็น

### ค. ไฟล์ `types.ts`
- รวบรวม Interface และ Type ต่างๆ ที่ใช้เฉพาะภายในหน้านี้

---

## 11. การจัดการ Routing และ Route Paths (`src/routes/`)

> [!IMPORTANT]
> **รวมศูนย์การจัดการ Path ทั้งหมดในโฟลเดอร์ `src/routes/`:**
> 1. เก็บ Path URLs ทั้งหมดไว้ที่ `src/routes/paths.ts` (เช่น `PATHS.HOME`, `PATHS.PORTFOLIO(id)`) ห้าม Hardcode path ในโค้ด
> 2. รวมการประกาศ Route ไว้ใน `src/routes/AppRoutes.tsx`
> 3. **ในไฟล์หน้า UI หลักด้านบนสุดของหน้าหลัก หรือ เมนูย่อยๆ / sections ต้องมีการเขียน Comment ระบุ path ของหน้านั้นไว้ด้านบนสุดเสมอ:**
>    ```tsx
>    /**
>     * Route: /portfolio/:id
>     * Section: PortfolioSummaryCards (การ์ดสรุปภาพรวมงบประมาณและเงินคงเหลือของพอร์ต)
>     */
>    ```

---

## 12. Checklist ก่อนและหลังเขียนโค้ด

- [ ] 1. **Check First**: ตรวจดูใน `src/types/`, `src/components/`, และ `src/utils/` ก่อนว่ามีของเดิมที่นำมา reuse ได้หรือไม่
- [ ] 2. **Ask Before Delete**: หากมีโค้ด/ไฟล์ที่ไม่จำเป็นแล้ว ให้สอบถามผู้ใช้ก่อน ห้ามลบโดยไม่ได้รับอนุญาต
- [ ] 3. **Function Comments (Thai)**: เขียน JSDoc Comment ภาษาไทย อธิบายหน้าที่, `@param`, และ `@returns` ให้ครบถ้วน
- [ ] 4. **Plan in Thai**: จัดทำ Implementation Plan และเอกสารเป็นภาษาไทยเป็นหลัก
- [ ] 5. **Base64 Standard**: ห้ามใช้ `btoa` หรือ `atob` ให้ใช้ `Base64` จาก `js-base64` เสมอ
- [ ] 6. **Structure**: สร้างโครงสร้างแยก `src/pages/<PageName>/` พร้อม `types.ts`, `sections/`, และ `index.ts`
- [ ] 7. **Route Comment**: มี Comment ระบุ `Route: <path>` อยู่บรรทัดบนสุดของไฟล์หน้า UI หลัก และไฟล์ Sub-components/Sections เสมอ
- [ ] 8. **Centralized Routing**: เรียกใช้ Path ผ่าน `PATHS` จาก `src/routes` ไม่ Hardcode path
- [ ] 9. **Line Limit**: ตรวจสอบว่าไม่มีไฟล์ใดมีความยาวเกิน 500 - 600 บรรทัด
- [ ] 10. **Naming**: ตรวจสอบชื่อตัวแปร/ฟังก์ชันทั้งหมดว่าเป็น `camelCase` ถูกต้อง
- [ ] 11. **Re-export**: มี `src/pages/<PageName>.tsx` Re-export ป้องกัน Import Path พัง
- [ ] 12. **Mandatory Build Check**: รัน `yarn build` ทดสอบผ่าน 100% ไม่มีข้อผิดพลาด
