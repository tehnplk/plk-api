# TEAM_003 — Home sync reload

- Scope: หลังจากผู้ใช้กดซิงค์ข้อมูล KPI บนหน้า /home แล้วซิงค์สำเร็จ ให้หน่วงเวลา 3 วินาทีและ reload หน้า /home หนึ่งครั้ง
- Implementation:
  - แก้ไขฟังก์ชัน `handleSyncFromGoogleSheets` ใน `src/app/home/page.tsx`
  - หลังจาก toast success แล้ว เรียก `setTimeout(() => window.location.reload(), 3000)`
- Notes:
  - ใช้คอมเมนต์ `// TEAM_003: ...` ติดไว้ใกล้โค้ดที่แก้ไข
  - `npm run lint` มี error อยู่ก่อนหน้าแล้วจากหลายไฟล์ในโปรเจกต์ (ส่วนใหญ่เป็น `any` type) และยังไม่ได้แก้ในรอบนี้
