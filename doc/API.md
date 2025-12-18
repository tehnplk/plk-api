# คู่มือการเรียกใช้ API Endpoints

## Base URL
```
https://script.google.com/macros/s/AKfycbzKcomVEGs3E_JMkZpkJjwjzVjrbzNxyJD1byzhsAsRB8bGEM1qxUqVSZtHK0MOnVRfmg/exec
```

---

## 1. ดึงข้อมูล KPI (GET)

### ดึงทั้งหมด
```
GET ?sheet=kpi
```

### ดึงตาม kpi_id
```
GET ?sheet=kpi&kpi_id=KPI001
```

### ตัวอย่าง JavaScript
```javascript
// ดึง KPI ทั้งหมด
const res = await fetch(BASE_URL + '?sheet=kpi');
const data = await res.json();

// ดึงเฉพาะ KPI001
const res = await fetch(BASE_URL + '?sheet=kpi&kpi_id=KPI001');
const data = await res.json();
```

### Response
```json
{
  "data": [
    { "kpi_id": "KPI001", "kpi_name": "รายได้", "description": "รายได้รวม" }
  ],
  "count": 1
}
```

---

## 2. ดึงข้อมูล Data (GET)

### ดึงทั้งหมด
```
GET ?sheet=data
```

### ดึงตาม Filter (สามารถใช้ร่วมกันได้)
```
GET ?sheet=data&money_year=2024
GET ?sheet=data&money_year=2024&kpi_id=KPI001
GET ?sheet=data&money_year=2024&kpi_id=KPI001&amp=AMP01
```

### ตัวอย่าง JavaScript
```javascript
// ดึงทั้งหมด
const res = await fetch(BASE_URL + '?sheet=data');

// ดึงตามปีงบประมาณ
const res = await fetch(BASE_URL + '?sheet=data&money_year=2024');

// ดึงตาม composite key ครบ 3 ตัว
const res = await fetch(BASE_URL + '?sheet=data&money_year=2024&kpi_id=KPI001&amp=AMP01');

const data = await res.json();
```

### Response
```json
{
  "data": [
    { "money_year": "2024", "kpi_id": "KPI001", "amp": "AMP01", "value": 100, "target": 150 }
  ],
  "count": 1
}
```

---

## 3. สร้างข้อมูล Data (CREATE)

### Endpoint
```
POST ?action=create
Content-Type: application/json
```

### Body (ต้องมี 3 field นี้เสมอ)
```json
{
  "money_year": "2024",
  "kpi_id": "KPI001",
  "amp": "AMP01",
  "value": 100,
  "target": 150
}
```

### ตัวอย่าง JavaScript
```javascript
const res = await fetch(BASE_URL + '?action=create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    money_year: '2024',
    kpi_id: 'KPI001',
    amp: 'AMP01',
    value: 100,
    target: 150
  })
});
const data = await res.json();
```

### Response สำเร็จ
```json
{
  "success": true,
  "message": "Record created successfully",
  "data": { "money_year": "2024", "kpi_id": "KPI001", "amp": "AMP01", "value": 100, "target": 150 }
}
```

### Response ผิดพลาด (ข้อมูลซ้ำ)
```json
{
  "error": "Record with this composite key already exists"
}
```

---

## 4. แก้ไขข้อมูล Data (UPDATE)

### Endpoint
```
POST ?action=update
Content-Type: application/json
```

### Body (ต้องมี composite key + field ที่จะแก้)
```json
{
  "money_year": "2024",
  "kpi_id": "KPI001",
  "amp": "AMP01",
  "value": 120
}
```

### ตัวอย่าง JavaScript
```javascript
const res = await fetch(BASE_URL + '?action=update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    money_year: '2024',
    kpi_id: 'KPI001',
    amp: 'AMP01',
    value: 120
  })
});
const data = await res.json();
```

### Response สำเร็จ
```json
{
  "success": true,
  "message": "Record updated successfully",
  "data": { "money_year": "2024", "kpi_id": "KPI001", "amp": "AMP01", "value": 120 }
}
```

### Response ผิดพลาด (ไม่พบข้อมูล)
```json
{
  "error": "Record not found"
}
```

---

## 5. Error Handling

### รูปแบบ Error Response
```json
{
  "error": "Error message here"
}
```

### Error ที่พบบ่อย
| Error | สาเหตุ |
|-------|--------|
| `Invalid sheet parameter` | ไม่ได้ระบุ sheet หรือระบุผิด |
| `Missing required fields: money_year, kpi_id, amp` | ไม่ได้ส่ง composite key ครบ |
| `Record with this composite key already exists` | สร้างข้อมูลซ้ำ |
| `Record not found` | ไม่พบข้อมูลที่จะ update |
| `Required columns not found in sheet` | ชีทไม่มีคอลัมน์ที่จำเป็น |

---

## 6. ตัวอย่างโครงสร้างชีท

### ชีท `kpi`
| kpi_id | kpi_name | description | unit |
|--------|----------|-------------|------|
| KPI001 | รายได้ | รายได้รวมทั้งหมด | บาท |
| KPI002 | จำนวนลูกค้า | จำนวนลูกค้าใหม่ | คน |

### ชีท `data`
| money_year | kpi_id | amp | value | target | remark |
|------------|--------|------|-------|--------|--------|
| 2024 | KPI001 | AMP01 | 100000 | 150000 | Q1 |
| 2024 | KPI001 | AMP02 | 120000 | 150000 | Q1 |
| 2024 | KPI002 | AMP01 | 50 | 100 | Q1 |