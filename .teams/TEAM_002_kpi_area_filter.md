# TEAM_002 — KPI Area filter bug

- Scope: แก้บั๊ก KPI list ไม่กรองตามอำเภอ (Area)
- Finding: `HomePage` ส่ง `selectedDistrictScope` เข้า `KPIList` แต่ `KPIList` ไม่ส่งต่อไป `KPITable` ทำให้ `KPITable` ไม่ใช้ API `/api/kpi/report/kpi-list` ตามอำเภอ
- Plan:
  - เพิ่ม prop `selectedDistrictScope` ใน `KPIListProps`
  - ส่ง `selectedDistrictScope` เข้า `KPITable`
  - ตรวจสอบว่าการเปลี่ยนอำเภอเรียก `fetchDataFromDatabase` ใหม่ และข้อมูลเปลี่ยนตาม
