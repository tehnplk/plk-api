-- แก้ไข area_level ของ KPI49 ให้เป็น 'จังหวัด'
UPDATE kpis 
SET area_level = 'จังหวัด' 
WHERE id = 'KPI49';

-- ตรวจสอบผลลัพธ์
SELECT id, name, area_level 
FROM kpis 
WHERE id = 'KPI49';
