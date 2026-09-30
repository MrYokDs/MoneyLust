---
name: graphify
description: มาตรฐานและคู่มือการใช้งาน Graphify (Knowledge Graph & Architecture Visualizer) สำหรับโปรเจกต์ MoneyLust ช่วยวิเคราะห์ความเชื่อมโยงของโค้ด โครงสร้างสถาปัตยกรรม (AST) แผนภาพ Call-flow และตรวจสอบผลกระทบข้ามไฟล์ (Impact Analysis)
---

# Graphify Codebase Knowledge Graph & Architecture Standards

คู่มือและมาตรฐานการใช้งาน **Graphify** ในโปรเจกต์ **MoneyLust** เพื่อแปลงโครงสร้างโค้ดทั้งหมด (TypeScript, React, Redux, Types, Utils) ให้กลายเป็น Knowledge Graph และ Interactive Architecture Visualizer

---

## 1. วัตถุประสงค์และประโยชน์ในโปรเจกต์ MoneyLust (Core Purpose)

1. **ทำความเข้าใจสถาปัตยกรรมระบบ (Deep Architectural Context)**:
   - ใช้ Tree-sitter ในการวิเคราะห์โครงสร้าง Abstract Syntax Tree (AST) ของไฟล์ `.ts`, `.tsx` ในเครื่องแบบ Deterministic โดยไม่ต้องส่งโค้ดขึ้น Cloud
   - ระบุความสัมพันธ์ระหว่าง Component, Hooks, Redux Slices, Utility Functions และ TypeScript Types
2. **วิเคราะห์ผลกระทบก่อนแก้โค้ด (Blast Radius & Impact Analysis)**:
   - ก่อนแก้ไขฟังก์ชันหรือ Type ใน `src/types/` หรือ `src/utils/` สามารถตรวจสอบได้ทันทีว่ามีจุดไหนใน `src/pages/` หรือ `src/components/` เรียกใช้งานอยู่บ้าง
3. **ลดการใช้ Token และเพิ่มความแม่นยำของ AI Assistant**:
   - แทนที่จะต้องสแกนเปิดไฟล์จำนวนมากผ่าน Grep หว่านแห AI สามารถ Query ตรงผ่าน Knowledge Graph ได้อย่างรวดเร็ว
4. **แผนภาพสถาปัตยกรรมแบบ Interactive (Visualizer)**:
   - สร้างไฟล์แผนภาพ HTML (ทั้ง Graph Network และ Mermaid Call-flow) สำหรับเปิดดูสถาปัตยกรรมได้ทันทีในเว็บเบราว์เซอร์

---

## 2. คำสั่งหลักในการใช้งาน (Core CLI Commands)

รันคำสั่งผ่าน Terminal ภายใน Workspace ของโปรเจกต์:

### 2.1 การสกัดและสร้าง Knowledge Graph ใหม่ (Extraction)
สำหรับโปรเจกต์ MoneyLust ที่เน้นซอร์สโค้ด สามารถรันแบบ Code-only (ทำงานบนเครื่อง 100% ไม่ต้องใช้ API key ใดๆ):
```bash
cmd /c "graphify extract . --code-only"
```
- ผลลัพธ์จะถูกจัดเก็บไว้ที่โฟลเดอร์ `graphify-out/` ประกอบด้วย `graph.json` และ `.graphify_analysis.json`

### 2.2 การอัปเดต Graph หลังแก้ไขโค้ด (Incremental Update)
เมื่อมีการเพิ่มหรือแก้ไขไฟล์โค้ดในโปรเจกต์ ให้รันคำสั่งอัปเดตเฉพาะส่วนที่เปลี่ยนแปลง:
```bash
cmd /c "graphify update ."
```

### 2.3 การสร้าง Interactive Web Visualizer (HTML Export)
สร้างไฟล์ HTML กราฟความสัมพันธ์แบบเปิดดูในเบราว์เซอร์ได้ทันทีโดยไม่ต้องเปิดเซิร์ฟเวอร์:
```bash
# 1. แผนภาพโครงข่ายความสัมพันธ์รวมทั้งระบบ (Interactive Network Graph)
cmd /c "graphify export html"
# ได้ไฟล์: graphify-out/graph.html

# 2. แผนภาพผังการเรียกใช้งานและสถาปัตยกรรม (Mermaid Call-flow Architecture)
cmd /c "graphify export callflow-html"
# ได้ไฟล์: graphify-out/MoneyLust-callflow.html
```

### 2.4 การสืบค้นความสัมพันธ์ในโค้ด (Query & Path Tracing)
```bash
# ถามข้อมูลความเชื่อมโยงของระบบ
cmd /c "graphify query \"portfolio growth calculation\""

# ค้นหาเส้นทางการเชื่อมต่อสั้นที่สุดระหว่าง 2 คอนเซปต์
cmd /c "graphify path \"StockPlanner\" \"stockMath\""

# อธิบายบทบาทหน้าที่ของ Component หรือ Module
cmd /c "graphify explain \"stockPlannerSlice\""
```

---

## 3. ขั้นตอนการนำไปใช้ใน Workflow การพัฒนา (Development Workflow)

1. **ก่อน Refactor หรือเพิ่มฟีเจอร์ใหญ่ (Pre-implementation)**:
   - รัน `graphify extract . --code-only` หากยังไม่เคยสร้าง Graph
   - ใช้ `graphify query` หรือตรวจดู `graphify-out/graph.json` เพื่อทำความเข้าใจ Dependency Graph
2. **ขณะพัฒนาและแก้ไขโค้ด**:
   - ปฏิบัติตามกฎ [common-skills](file:///f:/All_Works/Programming/React_Programming/MoneyLust/.agents/skills/common-skills/SKILL.md) ตรวจสอบ Type และ Component ก่อนสร้างใหม่เสมอ
   - คุมความยาวไฟล์ไม่เกิน 500-600 บรรทัด
3. **หลังพัฒนาและตรวจสอบ Build (Post-implementation)**:
   - รัน `cmd /c "yarn build"` ตามมาตรฐาน [autonomous-build-verification](file:///f:/All_Works/Programming/React_Programming/MoneyLust/.agents/skills/autonomous-build-verification/SKILL.md)
   - รัน `cmd /c "graphify update ."` เพื่อให้ Knowledge Graph อัปเดตล่าสุดพร้อมใช้งานเสมอ

---

## 4. รายการไฟล์ Output ที่สร้างขึ้น (`graphify-out/`)

- `graphify-out/graph.json`: ข้อมูล Graph โครงสร้าง Node และ Edge ทั้งหมดในระบบ
- `graphify-out/graph.html`: หน้าเว็บจำลองโครงข่ายความสัมพันธ์แบบ Interactive (ซูม/ลากดูจุดเชื่อมโยงได้)
- `graphify-out/MoneyLust-callflow.html`: แผนภาพ Flow สถาปัตยกรรมและตาราง Call Tables ด้วย Mermaid
- `graphify-out/manifest.json`: แคชสถานะไฟล์เพื่อรองรับการอัปเดตแบบ Incremental อย่างรวดเร็ว
