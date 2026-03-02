/**
 * French Learning App - Feedback Collector
 * Google Apps Script for collecting user feedback into Google Sheets
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet
 * 2. Create a new Apps Script project (script.google.com)
 * 3. Replace the default code with this script
 * 4. Deploy as web app with "Anyone" access
 * 5. Copy the web app URL to your .env file as REACT_APP_GOOGLE_SCRIPT_URL
 */

// Configuration - Update these values
const CONFIG = {
  SHEET_NAME: 'Feedback', // Name of the sheet tab
  NOTIFICATION_EMAIL: 'your-email@gmail.com', // Where to send notifications
  SEND_EMAIL_NOTIFICATIONS: true, // Set to false to disable emails
  NOTIFY_ON_LOW_RATINGS: true, // Send emails for ratings <= 2
  NOTIFY_ON_BUGS: true // Send emails for bug reports
};

/**
 * Main function that handles POST requests from the React app
 */
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Add to Google Sheet
    const result = addFeedbackToSheet(data);
    
    // Send email notification if needed
    if (shouldSendNotification(data)) {
      sendEmailNotification(data);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Feedback recorded successfully',
        rowId: result.rowId
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    console.error('Error processing feedback:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Add feedback data to Google Sheet
 */
function addFeedbackToSheet(data) {
  const sheet = getOrCreateSheet();
  
  // Prepare row data
  const rowData = [
    new Date(data.timestamp), // A: Timestamp
    data.type,                // B: Type (bug, feature, improvement, general)
    data.rating,              // C: Rating (1-5)
    data.title,               // D: Title
    data.description,         // E: Description
    data.sessionId,           // F: Session ID
    data.mistakeCount,        // G: Mistake Count
    data.currentScreen,       // H: Current Screen
    data.userAgent,           // I: User Agent
    data.url,                 // J: URL
    'New'                     // K: Status
  ];
  
  // Add the row
  const range = sheet.appendRow(rowData);
  const rowId = sheet.getLastRow();
  
  // Apply formatting for better readability
  formatNewRow(sheet, rowId, data);
  
  console.log(`Added feedback to row ${rowId}: ${data.type} - ${data.rating}/5`);
  
  return { rowId, range };
}

/**
 * Get existing sheet or create new one with headers
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    // Create new sheet with headers
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
    
    const headers = [
      'Timestamp', 'Type', 'Rating', 'Title', 'Description',
      'Session ID', 'Mistake Count', 'Current Screen', 'User Agent', 'URL', 'Status'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    
    // Set column widths
    sheet.setColumnWidth(1, 150); // Timestamp
    sheet.setColumnWidth(2, 100); // Type
    sheet.setColumnWidth(3, 80);  // Rating
    sheet.setColumnWidth(4, 200); // Title
    sheet.setColumnWidth(5, 300); // Description
    sheet.setColumnWidth(6, 120); // Session ID
    sheet.setColumnWidth(7, 100); // Mistake Count
    sheet.setColumnWidth(8, 150); // Current Screen
    sheet.setColumnWidth(9, 200); // User Agent
    sheet.setColumnWidth(10, 250); // URL
    sheet.setColumnWidth(11, 100); // Status
  }
  
  return sheet;
}

/**
 * Apply formatting to newly added row
 */
function formatNewRow(sheet, rowId, data) {
  const range = sheet.getRange(rowId, 1, 1, 11);
  
  // Color code by type and rating
  let backgroundColor = '#ffffff';
  if (data.type === 'bug' || data.rating <= 2) {
    backgroundColor = '#fce8e6'; // Light red for bugs and low ratings
  } else if (data.type === 'feature') {
    backgroundColor = '#e8f4fd'; // Light blue for features
  } else if (data.rating >= 4) {
    backgroundColor = '#e6f4ea'; // Light green for high ratings
  }
  
  range.setBackground(backgroundColor);
  
  // Make critical items bold
  if (data.type === 'bug' || data.rating <= 2) {
    range.setFontWeight('bold');
  }
}

/**
 * Determine if we should send email notification
 */
function shouldSendNotification(data) {
  if (!CONFIG.SEND_EMAIL_NOTIFICATIONS) return false;
  
  return (CONFIG.NOTIFY_ON_BUGS && data.type === 'bug') ||
         (CONFIG.NOTIFY_ON_LOW_RATINGS && data.rating <= 2);
}

/**
 * Send email notification for critical feedback
 */
function sendEmailNotification(data) {
  try {
    const subject = `🚨 French App Feedback: ${data.type === 'bug' ? 'Bug Report' : 'Low Rating'} - ${data.rating}/5`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #dc2626;">🚨 New ${data.type === 'bug' ? 'Bug Report' : 'Low Rating'} Feedback</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Details:</h3>
          <ul>
            <li><strong>Type:</strong> ${data.type}</li>
            <li><strong>Rating:</strong> ${data.rating}/5 ⭐</li>
            <li><strong>Title:</strong> ${data.title || 'No title'}</li>
            <li><strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}</li>
          </ul>
        </div>
        
        <div style="margin: 20px 0;">
          <h3>Description:</h3>
          <p style="background: white; padding: 15px; border-left: 4px solid #3b82f6;">
            ${data.description}
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          <h3>Context:</h3>
          <ul>
            <li><strong>Screen:</strong> ${data.currentScreen || 'Unknown'}</li>
            <li><strong>Session ID:</strong> ${data.sessionId || 'None'}</li>
            <li><strong>Mistakes:</strong> ${data.mistakeCount}</li>
            <li><strong>URL:</strong> ${data.url}</li>
          </ul>
        </div>
        
        <p style="margin-top: 20px;">
          <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" 
             style="background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            📊 View in Google Sheets
          </a>
        </p>
        
        <p style="color: #dc2626; font-weight: bold; margin-top: 20px;">
          ⚠️ This feedback requires immediate attention.
        </p>
      </div>
    `;
    
    GmailApp.sendEmail(
      CONFIG.NOTIFICATION_EMAIL,
      subject,
      '', // Plain text body (empty since we're using HTML)
      {
        htmlBody: htmlBody,
        name: 'French Learning App'
      }
    );
    
    console.log(`📧 Email notification sent for ${data.type} feedback`);
    
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

/**
 * Test function - run this to test the setup
 */
function testSetup() {
  console.log('Testing feedback system setup...');
  
  // Test data
  const testData = {
    timestamp: new Date().toISOString(),
    type: 'general',
    rating: 5,
    title: 'Test Feedback',
    description: 'This is a test to verify the feedback system is working correctly.',
    sessionId: 'test-session-123',
    mistakeCount: 0,
    currentScreen: '/test',
    userAgent: 'Test Agent',
    url: 'https://test.com'
  };
  
  try {
    const result = addFeedbackToSheet(testData);
    console.log('✅ Test successful! Added to row:', result.rowId);
    console.log('📊 View your sheet:', SpreadsheetApp.getActiveSpreadsheet().getUrl());
    
    return {
      success: true,
      message: 'Test completed successfully',
      sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      rowId: result.rowId
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
} 