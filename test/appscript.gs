// ==================== CONFIG ====================
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_KPI = 'kpi';
const SHEET_DATA = 'data';

// ==================== WEB APP ENTRY POINTS ====================
function doGet(e) {
  const params = e.parameter;
  const action = params.action || 'get';
  const sheet = params.sheet;
  
  try {
    if (sheet === SHEET_KPI) {
      return jsonResponse(getKpiData(params));
    } else if (sheet === SHEET_DATA) {
      return jsonResponse(getDataRecords(params));
    } else {
      return jsonResponse({ error: 'Invalid sheet parameter' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function doPost(e) {
  const params = e.parameter;
  const action = params.action;
  const body = JSON.parse(e.postData.contents || '{}');
  
  try {
    const sheet = params.sheet;

    if (sheet === SHEET_DATA) {
      switch (action) {
        case 'create':
          return jsonResponse(createDataRecord(body));
        case 'update':
          return jsonResponse(updateDataRecord(body));
        case 'upsert_report':
          return jsonResponse(upsertKpiReportRecord(body));
        default:
          return jsonResponse({ error: 'Invalid action for data sheet' }, 400);
      }
    } else if (sheet === SHEET_KPI) {
      switch (action) {
        case 'update_sum':
          return jsonResponse(updateKpiSumById(body));
        default:
          return jsonResponse({ error: 'Invalid action for kpi sheet' }, 400);
      }
    } else {
      return jsonResponse({ error: 'Invalid sheet parameter' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ==================== KPI SHEET (GET ONLY) ====================
function getKpiData(params) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_KPI);
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return { data: [] };
  
  const headers = data[0];
  const rows = data.slice(1);
  
  let result = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  
  // Filter by kpi_id if provided
  if (params.kpi_id) {
    result = result.filter(r => String(r.kpi_id) === String(params.kpi_id));
  }
  
  return { data: result, count: result.length };
}

function updateKpiSumById(body) {
  const { id, sum_result } = body;

  if (!id) {
    throw new Error('Missing required field: id');
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_KPI);
  const data = sheet.getDataRange().getValues();

  if (data.length === 0) {
    throw new Error('KPI sheet is empty');
  }

  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const sumIdx = headers.indexOf('sum_result');

  if (idIdx === -1 || sumIdx === -1) {
    throw new Error('Required columns id or sum_result not found in KPI sheet');
  }

  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(id)) {
      targetRow = i + 1; // 1-based row index in sheet
      break;
    }
  }

  if (targetRow === -1) {
    throw new Error('KPI record not found for given id');
  }

  sheet.getRange(targetRow, sumIdx + 1).setValue(sum_result);

  return {
    success: true,
    message: 'KPI sum_result updated successfully',
    data: body
  };
}

// ==================== DATA SHEET (CRUD) ====================
// Composite PK: money_year + kpi_id + amp

function getDataRecords(params) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return { data: [] };
  
  const headers = data[0];
  const rows = data.slice(1);
  
  let result = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  
  // Filter by composite key parts if provided
  if (params.money_year) {
    result = result.filter(r => String(r.money_year) === String(params.money_year));
  }
  if (params.kpi_id) {
    result = result.filter(r => String(r.kpi_id) === String(params.kpi_id));
  }
  if (params.amp) {
    result = result.filter(r => String(r.amp) === String(params.amp));
  }
  
  return { data: result, count: result.length };
}

function createDataRecord(body) {
  const { money_year, kpi_id, amp } = body;
  
  // Validate required fields (composite PK)
  if (!money_year || !kpi_id || !amp) {
    throw new Error('Missing required fields: money_year, kpi_id, amp');
  }
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Check if record already exists
  const existingRow = findRowByCompositeKey(sheet, money_year, kpi_id, amp);
  if (existingRow !== -1) {
    throw new Error('Record with this composite key already exists');
  }
  
  // Build new row based on headers
  const newRow = headers.map(h => body[h] !== undefined ? body[h] : '');
  sheet.appendRow(newRow);
  
  return { 
    success: true, 
    message: 'Record created successfully',
    data: body 
  };
}

function updateDataRecord(body) {
  const { money_year, kpi_id, amp } = body;
  
  // Validate required fields (composite PK)
  if (!money_year || !kpi_id || !amp) {
    throw new Error('Missing required fields: money_year, kpi_id, amp');
  }
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find existing record
  const rowIndex = findRowByCompositeKey(sheet, money_year, kpi_id, amp);
  if (rowIndex === -1) {
    throw new Error('Record not found');
  }
  
  // Update row (rowIndex + 1 because sheet is 1-indexed, +1 for header)
  const actualRow = rowIndex + 2;
  headers.forEach((h, colIndex) => {
    if (body[h] !== undefined) {
      sheet.getRange(actualRow, colIndex + 1).setValue(body[h]);
    }
  });
  
  return { 
    success: true, 
    message: 'Record updated successfully',
    data: body 
  };
}

function upsertKpiReportRecord(body) {
  const { money_year, kpi_id, area_name } = body;

  if (!money_year || !kpi_id || !area_name) {
    throw new Error('Missing required fields: money_year, kpi_id, area_name');
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_DATA);
  const headers = Object.keys(body);

  if (headers.length === 0) {
    throw new Error('No fields provided to upsert');
  }

  // Always overwrite header row (row 1) with keys from POST body
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const data = sheet.getDataRange().getValues();
  const headerRow = data[0];
  const myIdx = headerRow.indexOf('money_year');
  const kpiIdx = headerRow.indexOf('kpi_id');
  const areaIdx = headerRow.indexOf('area_name');

  if (myIdx === -1 || kpiIdx === -1 || areaIdx === -1) {
    throw new Error('Required columns not found in data sheet');
  }

  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][myIdx]) === String(money_year) &&
        String(data[i][kpiIdx]) === String(kpi_id) &&
        String(data[i][areaIdx]) === String(area_name)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    const newRow = headers.map(h => body[h] !== undefined ? body[h] : '');
    sheet.appendRow(newRow);
    return {
      success: true,
      mode: 'created',
      data: body,
    };
  } else {
    headers.forEach((h, colIndex) => {
      if (body[h] !== undefined) {
        sheet.getRange(targetRow, colIndex + 1).setValue(body[h]);
      }
    });
    return {
      success: true,
      mode: 'updated',
      data: body,
    };
  }
}

// ==================== HELPER FUNCTIONS ====================
function findRowByCompositeKey(sheet, money_year, kpi_id, amp) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const myIdx = headers.indexOf('money_year');
  const kpiIdx = headers.indexOf('kpi_id');
  const ampIdx = headers.indexOf('amp');
  
  if (myIdx === -1 || kpiIdx === -1 || ampIdx === -1) {
    throw new Error('Required columns not found in sheet');
  }
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][myIdx]) === String(money_year) &&
        String(data[i][kpiIdx]) === String(kpi_id) &&
        String(data[i][ampIdx]) === String(amp)) {
      return i - 1; // Return 0-based index excluding header
    }
  }
  return -1;
}

function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}