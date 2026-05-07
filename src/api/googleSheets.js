// Replace with the URL from Google Apps Script deployment
export const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyhwecljd_plbYsMrksqWPmSfWCel-d4w6yh8t90Z31h0UwiyY5nA3SPQ-UXNrBQJXlcg/exec";

export const fetchScores = async () => {
  if (WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
    console.warn("Please update WEB_APP_URL in src/api/googleSheets.js");
    return [];
  }
  
  try {
    const response = await fetch(WEB_APP_URL);
    const result = await response.json();
    if (result.status === "success") {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error fetching scores:", error);
    return [];
  }
};

export const submitScore = async (room, score) => {
  if (WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
    console.warn("Please update WEB_APP_URL in src/api/googleSheets.js");
    return { status: "error", message: "Web App URL not set" };
  }
  
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ room, score }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // text/plain used to avoid CORS preflight issues on some GAS setups
      }
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error submitting score:", error);
    return { status: "error", message: error.message };
  }
};
