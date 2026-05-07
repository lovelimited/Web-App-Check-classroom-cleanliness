/* eslint-disable */
// Google Apps Script ignores this file in the local build, so we disable eslint for it.

const SHEET_NAME = "CleanlinessScores";
const ROOMS = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Set headers if they don't exist
  const headers = ["Timestamp", "Date", "Time", "Room", "Score", "Month", "AcademicYear"];
  const range = sheet.getRange(1, 1, 1, headers.length);
  
  if (range.getValues()[0].join("") === "") {
    range.setValues([headers]);
    range.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// Function to calculate academic year (May to April)
function getAcademicYear(date) {
  const month = date.getMonth(); // 0 = Jan, 4 = May
  const year = date.getFullYear();
  // If month is before May (Jan - Apr), it belongs to previous academic year
  if (month < 4) {
    return (year - 1).toString();
  } else {
    return year.toString();
  }
}

function doPost(e) {
  try {
    const sheet = setupSheet();
    const data = JSON.parse(e.postData.contents);
    
    const room = data.room;
    const score = parseFloat(data.score);
    
    if (!room || !score) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Missing room or score"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!ROOMS.includes(room)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Invalid room"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const now = new Date();
    // format date as YYYY-MM-DD
    const dateStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    const monthStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0');
    const academicYearStr = getAcademicYear(now);
    
    // Check for duplicate on the same day
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingData = sheet.getRange(2, 2, lastRow - 1, 3).getValues(); // Col 2 (Date), Col 4 (Room)
      for (let i = 0; i < existingData.length; i++) {
        if (existingData[i][0] === dateStr && existingData[i][2] === room) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "Room already checked today"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // Append row
    sheet.appendRow([now, dateStr, timeStr, room, score, monthStr, academicYearStr]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Score saved successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Enable CORS for preflight requests
function doOptions() {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  try {
    const sheet = setupSheet();
    const lastRow = sheet.getLastRow();
    let records = [];
    
    if (lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
      records = data.map(row => {
        // จัดการเรื่องวันที่ให้เป็น String รูปแบบ YYYY-MM-DD เสมอ
        let d = row[1];
        let dateStr = d;
        if (d instanceof Date) {
          dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
        }

        return {
          timestamp: row[0],
          date: dateStr,
          time: row[2],
          room: row[3],
          score: row[4],
          month: row[5],
          academicYear: row[6]
        };
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: records
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
