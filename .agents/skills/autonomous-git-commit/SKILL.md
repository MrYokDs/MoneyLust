---
name: autonomous-git-commit
description: มาตรฐานการทำ Auto Commit & Push อัตโนมัติ (Autonomous Git Commit & Push) ในโปรเจกต์ MoneyLust ทุกครั้งที่แก้ไขโค้ดหรือทำงานเสร็จสิ้น โดยปรับเลขเวอร์ชันแอปตาม SemVer เขียน commit message เป็นภาษาไทย และสั่ง git push ทันที
---

# Autonomous Git Commit & Push Standard (การทำ Git Commit & Push อัตโนมัติหลังทำงานเสร็จ)

เอกสารมาตรฐานการทำ Git Commit และ Git Push อัตโนมัติในโปรเจกต์ MoneyLust ที่ได้รับการอนุญาตล่วงหน้า (Pre-authorized) จากผู้ใช้ โดยระบุข้อความอธิบายการเปลี่ยนแปลงเป็นภาษาไทย ปรับเลขเวอร์ชันแอปตาม Semantic Versioning และส่งขึ้นรีโมททันที

---

## 1. ที่มาและบริบท (Context & Origin)
- **คำสั่งของผู้ใช้**:
  - *"ฉันอยากให้คุณอัปสกิลให่ฉันหน่อยหลังจากนี้ทุกครั้งที่คุณแก้ไขหรือทำงานอะไรให้ฉันเสร็จให้คุณ auto commit ให้ฉันได้ไหมโดย commit บอกสิ่งที่ทำในcommit งานนั้นๆเป็นภาษาไทย"*
  - *"ไหนๆแล้วคุณช่วยเพิ่มกฏหลัง commmit ให้ auto push ให้ฉันด้วยเลยได้ไหม"*
  - *"เพิ่มอีกกฏคือ ก่อน push code ทุกครั้งคุณต้องปรับเลขเวอร์ชั่นของแอพด้วย โดยเราจะมี 3 ตำแหน่งเช่น 1.0.0 (เลขแรก = อัปเดทใหญ่, เลขลำดับที่ 2 = เพิ่มฟีเจอร์เล็กน้อย, เลขลำดับที่ 3 = แก้ไขบัค) อัปเดทเวอร์ชั้นตามความเมหาะสม"*
- **เป้าหมาย**: ซิงค์โค้ดและประวัติการเปลี่ยนแปลงขึ้น Remote Repository (GitHub) ทันทีอย่างต่อเนื่อง ควบคุมเวอร์ชันของระบบอย่างเป็นมาตรฐาน (SemVer) และไม่ต้องขออนุญาตในแต่ละรอบ

---

## 2. เหตุผลและความสำคัญ (Rationale)
1. **การควบคุมเวอร์ชันชัดเจน (Semantic Versioning Tracking)**: ผู้ใช้และระบบสามารถตรวจสอบได้ทันทีว่าการเปลี่ยนแปลงในแต่ละรอบเป็น Major, Minor หรือ Patch ผ่านเลขเวอร์ชัน 3 ตำแหน่งบนหน้าจอและ metadata
2. **ประวัติการทำงานชัดเจนและปลอดภัย (Auditable & Backed Up)**: การทำ commit พร้อม push ไปยัง GitHub ทันที ป้องกันการสูญหายของโค้ด และทำให้ทีม/ผู้ใช้เห็นการอัปเดตล่าสุดได้ทันที
3. **ความสมบูรณ์ของ Lifecycle (End-to-End Delivery)**:
   `Edit Code` -> `Bump App Version (package.json)` -> `Build Verification (yarn build)` -> `Knowledge Graph Update (graphify)` -> `Auto Git Commit (Thai Message)` -> `Auto Git Push`

---

## 3. ระเบียบปฏิบัติมาตรฐาน (Standard Procedure)

### โครงสร้างเลขเวอร์ชัน 3 ตำแหน่ง (MAJOR.MINOR.PATCH):
- **ตำแหน่งที่ 1 (MAJOR)**: อัปเดตใหญ่ (Major Update / Breaking Changes / ปรับโครงสร้างสถาปัตยกรรมหลัก)
- **ตำแหน่งที่ 2 (MINOR)**: เพิ่มฟีเจอร์ใหม่ หรือการต่อเติมฟังก์ชันการใช้งาน (Minor Feature / New Capabilities)
- **ตำแหน่งที่ 3 (PATCH)**: แก้ไขบั๊ก, ปรับแต่ง UI เล็กน้อย, ปรับคำ หรือ Refactor ย่อย (Bug Fix / UI Polish / Maintenance)

### ลำดับขั้นตอนการทำงาน (Workflow Sequence):
1. **แก้ไขโค้ดหรือทำงานตามที่ได้รับมอบหมายเสร็จสิ้น**
2. **ปรับปรุงเลขเวอร์ชันใน `package.json` (Rule 15)**:
   - ปรับเลข `"version"` ใน `package.json` ให้ขยับตามความเหมาะสมของงาน (Major, Minor, หรือ Patch)
3. **ทดสอบ Build (Rule 8)**:
   ```bash
   cmd /c "yarn build"
   ```
   *ต้องได้ Exit code 0 ก่อนเสมอ ห้าม commit/push โค้ดที่ build ไม่ผ่าน*
4. **อัปเดต Knowledge Graph (Rule 13)**:
   ```bash
   cmd /c "graphify update ."
   ```
5. **ตรวจสอบสถานะการเปลี่ยนแปลง (Git Status)**:
   ```bash
   cmd /c "git status"
   ```
6. **Stage ไฟล์ทั้งหมดที่เกี่ยวข้อง**:
   ```bash
   cmd /c "git add ."
   ```
7. **ทำ Git Commit ด้วยข้อความภาษาไทย**:
   - เขียน Commit Message ให้กระชับ ได้ใจความ อธิบายสิ่งที่ทำลงไปจริงในงานนั้นๆ
   - รูปแบบที่แนะนำ:
     - `feat: <คำอธิบายฟีเจอร์ใหม่เป็นภาษาไทย>`
     - `fix: <คำอธิบายการแก้บั๊กเป็นภาษาไทย>`
     - `refactor: <คำอธิบายการปรับโครงสร้างโค้ดเป็นภาษาไทย>`
     - `style: <คำอธิบายการปรับแต่ง UI/สไตล์เป็นภาษาไทย>`
     - `docs: <คำอธิบายการอัปเดตเอกสาร/สกิลเป็นภาษาไทย>`
   - ตัวอย่างคำสั่ง:
     ```bash
     cmd /c "git commit -m \"style: ปรับดีไซน์ตารางรายวัน และอัปเดตเวอร์ชันเป็น 1.0.4\""
     ```
8. **สั่ง Git Push อัตโนมัติทันที**:
   ```bash
   cmd /c "git push"
   ```
9. **รายงานผล Commit & Push ให้ผู้ใช้ทราบ**:
   - แจ้งเวอร์ชันใหม่, Commit hash, ข้อความ Commit และสถานะการ Push ขึ้น Remote สำเร็จ

---

## 4. รายการตรวจสอบ (Checklist)
- [ ] มีการปรับเลขเวอร์ชันใน `package.json` ตาม SemVer (Major/Minor/Patch) หรือไม่
- [ ] โค้ดผ่านการทดสอบ `yarn build` สมบูรณ์ (Exit code 0) หรือไม่
- [ ] มีการรัน `graphify update .` เรียบร้อยแล้วหรือไม่
- [ ] ทำการ Stage ไฟล์ด้วย `git add .`
- [ ] Commit Message เป็นภาษาไทยที่สื่อความหมายชัดเจนตรงกับงานที่ทำ
- [ ] สั่งรัน Git Commit ผ่าน CMD บน Windows
- [ ] สั่งรัน Git Push ขึ้น Remote Repository ทันที
- [ ] รายงานข้อความ Commit และสถานะ Push ให้ผู้ใช้รับทราบ
