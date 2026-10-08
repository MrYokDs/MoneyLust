---
name: autonomous-git-commit
description: มาตรฐานการทำ Auto Commit & Push อัตโนมัติ (Autonomous Git Commit & Push) ในโปรเจกต์ MoneyLust ทุกครั้งที่แก้ไขโค้ดหรือทำงานเสร็จสิ้น โดยเขียน commit message เป็นภาษาไทยและสั่ง git push ทันที
---

# Autonomous Git Commit & Push Standard (การทำ Git Commit & Push อัตโนมัติหลังทำงานเสร็จ)

เอกสารมาตรฐานการทำ Git Commit และ Git Push อัตโนมัติในโปรเจกต์ MoneyLust ที่ได้รับการอนุญาตล่วงหน้า (Pre-authorized) จากผู้ใช้ โดยระบุข้อความอธิบายการเปลี่ยนแปลงเป็นภาษาไทยและส่งขึ้นรีโมททันที

---

## 1. ที่มาและบริบท (Context & Origin)
- **คำสั่งของผู้ใช้**:
  - *"ฉันอยากให้คุณอัปสกิลให่ฉันหน่อยหลังจากนี้ทุกครั้งที่คุณแก้ไขหรือทำงานอะไรให้ฉันเสร็จให้คุณ auto commit ให้ฉันได้ไหมโดย commit บอกสิ่งที่ทำในcommit งานนั้นๆเป็นภาษาไทย"*
  - *"ไหนๆแล้วคุณช่วยเพิ่มกฏหลัง commmit ให้ auto push ให้ฉันด้วยเลยได้ไหม"*
- **เป้าหมาย**: ซิงค์โค้ดและประวัติการเปลี่ยนแปลงขึ้น Remote Repository (GitHub) ทันทีอย่างต่อเนื่อง ไม่คั่งค้างในเครื่อง และไม่ต้องขออนุญาตในแต่ละรอบ

---

## 2. เหตุผลและความสำคัญ (Rationale)
1. **ประวัติการทำงานชัดเจนและปลอดภัย (Auditable & Backed Up)**: การทำ commit พร้อม push ไปยัง GitHub ทันที ป้องกันการสูญหายของโค้ด และทำให้ทีม/ผู้ใช้เห็นการอัปเดตล่าสุดได้ทันที
2. **การทำงานอัตโนมัติไร้รอยต่อ (Zero Friction Execution)**: ผู้ใช้ได้ให้อำนาจล่วงหน้าทั้งการ commit และ push จึงไม่ต้องเสียรอบการถามยืนยัน
3. **ความสมบูรณ์ของ Lifecycle (End-to-End Delivery)**:
   `Edit Code` -> `Build Verification (yarn build)` -> `Knowledge Graph Update (graphify)` -> `Auto Git Commit (Thai Message)` -> `Auto Git Push`

---

## 3. ระเบียบปฏิบัติมาตรฐาน (Standard Procedure)

### ลำดับขั้นตอนการทำงาน (Workflow Sequence):
1. **แก้ไขโค้ดหรือทำงานตามที่ได้รับมอบหมายเสร็จสิ้น**
2. **ทดสอบ Build (Rule 8)**:
   ```bash
   cmd /c "yarn build"
   ```
   *ต้องได้ Exit code 0 ก่อนเสมอ ห้าม commit/push โค้ดที่ build ไม่ผ่าน*
3. **อัปเดต Knowledge Graph (Rule 13)**:
   ```bash
   cmd /c "graphify update ."
   ```
4. **ตรวจสอบสถานะการเปลี่ยนแปลง (Git Status)**:
   ```bash
   cmd /c "git status"
   ```
5. **Stage ไฟล์ทั้งหมดที่เกี่ยวข้อง**:
   ```bash
   cmd /c "git add ."
   ```
6. **ทำ Git Commit ด้วยข้อความภาษาไทย**:
   - เขียน Commit Message ให้กระชับ ได้ใจความ อธิบายสิ่งที่ทำลงไปจริงในงานนั้นๆ
   - รูปแบบที่แนะนำ:
     - `feat: <คำอธิบายฟีเจอร์ใหม่เป็นภาษาไทย>`
     - `fix: <คำอธิบายการแก้บั๊กเป็นภาษาไทย>`
     - `refactor: <คำอธิบายการปรับโครงสร้างโค้ดเป็นภาษาไทย>`
     - `style: <คำอธิบายการปรับแต่ง UI/สไตล์เป็นภาษาไทย>`
     - `docs: <คำอธิบายการอัปเดตเอกสาร/สกิลเป็นภาษาไทย>`
   - ตัวอย่างคำสั่ง:
     ```bash
     cmd /c "git commit -m \"feat: เพิ่มช่วงฟื้นทุนในตารางแผนการเติบโตรายวันเมื่อพอร์ตขาดทุน\""
     ```
7. **สั่ง Git Push อัตโนมัติทันที**:
   ```bash
   cmd /c "git push"
   ```
8. **รายงานผล Commit & Push ให้ผู้ใช้ทราบ**:
   - แจ้ง Commit hash, ข้อความ Commit และสถานะการ Push ขึ้น Remote สำเร็จ

---

## 4. รายการตรวจสอบ (Checklist)
- [ ] โค้ดผ่านการทดสอบ `yarn build` สมบูรณ์ (Exit code 0) หรือไม่
- [ ] มีการรัน `graphify update .` เรียบร้อยแล้วหรือไม่
- [ ] ทำการ Stage ไฟล์ด้วย `git add .`
- [ ] Commit Message เป็นภาษาไทยที่สื่อความหมายชัดเจนตรงกับงานที่ทำ
- [ ] สั่งรัน Git Commit ผ่าน CMD บน Windows
- [ ] สั่งรัน Git Push ขึ้น Remote Repository ทันที
- [ ] รายงานข้อความ Commit และสถานะ Push ให้ผู้ใช้รับทราบ
