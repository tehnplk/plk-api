1.user จะบันทึกข้อมูลเข้าตาราง kpi_report เท่านั้น
2.ตาราง kpis กับ kpi_report เชื่อมกันด้วย kpis.id = kpi_report.kpi_id
3.การแสดง kpi datatable ที่ /home เป็นการแสดงตัวเลขที่มาจากการ sum จากตาราง kpi_report และคำรซณสถานะตาม condition