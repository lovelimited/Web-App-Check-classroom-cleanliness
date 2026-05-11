/* eslint-disable */
const SHEET_NAME = "CleanlinessScores";
const CACHE_SHEET_NAME = "Cache";
const ROOMS = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ["Timestamp", "Date", "Time", "Room", "Score", "Month", "AcademicYear"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.setFrozenRows(1);
  }
  
  let cacheSheet = ss.getSheetByName(CACHE_SHEET_NAME);
  if (!cacheSheet) {
    cacheSheet = ss.insertSheet(CACHE_SHEET_NAME);
    cacheSheet.getRange("A1").setValue(JSON.stringify({ status: "success", data: [] }));
  }
  
  return { dataSheet: sheet, cacheSheet: cacheSheet };
}

function getAcademicYear(date) {
  const month = date.getMonth(); 
  const year = date.getFullYear();
  return (month < 4) ? (year - 1).toString() : year.toString();
}

function rebuildCache() {
  const { dataSheet, cacheSheet } = setupSheet();
  const lastRow = dataSheet.getLastRow();
  let records = [];
  
  if (lastRow > 1) {
    const data = dataSheet.getRange(2, 1, lastRow - 1, 7).getValues();
    records = data.map(row => {
      let d = row[1];
      let dateStr = d;
      if (d instanceof Date) {
        dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
      }
      let m = row[5];
      let monthStr = m;
      if (m instanceof Date) {
        monthStr = m.getFullYear() + "-" + String(m.getMonth() + 1).padStart(2, '0');
      }
      return {
        timestamp: row[0],
        date: dateStr,
        time: row[2],
        room: row[3],
        score: row[4],
        month: monthStr,
        academicYear: row[6].toString()
      };
    });
  }
  
  const result = { status: "success", data: records };
  cacheSheet.getRange("A1").setValue(JSON.stringify(result));
  return result;
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Action: Rebuild Cache manually
    if (action === "rebuild") {
      return ContentService.createTextOutput(JSON.stringify(rebuildCache()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Action: Check specific room status (for CheckScore page)
    if (action === "check") {
      const room = e.parameter.room;
      const date = e.parameter.date;
      const { cacheSheet } = setupSheet();
      const cacheValue = cacheSheet.getRange("A1").getValue();
      let isChecked = false;
      let score = 0;
      
      if (cacheValue && cacheValue !== "") {
        try {
          const cache = JSON.parse(cacheValue);
          const record = cache.data.find(r => r.room === room && r.date === date);
          if (record) {
            isChecked = true;
            score = record.score;
          }
        } catch(e) {}
      }
      return ContentService.createTextOutput(JSON.stringify({ isChecked, score }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default: Return full data cache
    const { cacheSheet } = setupSheet();
    const cacheValue = cacheSheet.getRange("A1").getValue();
    
    if (!cacheValue || cacheValue === "" || cacheValue === "{}") {
      return ContentService.createTextOutput(JSON.stringify(rebuildCache()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(cacheValue)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // เพิ่มเวลารอเป็น 30 วินาที
    
    const { dataSheet, cacheSheet } = setupSheet();
    const data = JSON.parse(e.postData.contents);
    const room = data.room;
    const score = parseFloat(data.score);
    
    if (!room || isNaN(score)) {
      throw new Error("Missing data: " + JSON.stringify(data));
    }
    
    const now = new Date();
    const dateStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    const monthStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0');
    const academicYearStr = getAcademicYear(now);

    // ตรวจสอบการซ้ำใน Cache
    let cacheValue = cacheSheet.getRange("A1").getValue();
    let cacheContent = { data: [] };
    if (cacheValue && cacheValue !== "") {
      try { cacheContent = JSON.parse(cacheValue); } catch(e) {}
    }
    
    const isDuplicate = cacheContent.data.some(r => r.date === dateStr && r.room === room);
    if (isDuplicate) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ห้องนี้ถูกเช็คไปแล้วในวันนี้" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // บันทึกลงตารางหลัก
    dataSheet.appendRow([now, "'" + dateStr, timeStr, room, score, "'" + monthStr, "'" + academicYearStr]);

    // อัพเดท Cache
    const newRecord = {
      timestamp: now,
      date: dateStr,
      time: timeStr,
      room: room,
      score: score,
      month: monthStr,
      academicYear: academicYearStr
    };
    cacheContent.data.push(newRecord);
    
    // จำกัด Cache 1000 รายการ
    if (cacheContent.data.length > 1000) {
      cacheContent.data = cacheContent.data.slice(-1000);
    }
    
    cacheSheet.getRange("A1").setValue(JSON.stringify(cacheContent));

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "บันทึกสำเร็จ" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doOptions() {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
