# Google Sheets Feedback System Setup Guide

This guide walks you through setting up a Google Sheets-based feedback system for your French learning app.

## Why Google Sheets + Apps Script?

✅ **Free and Easy**: No API keys or paid services needed  
✅ **Real-time Data**: Instant feedback collection and analysis  
✅ **Automatic Notifications**: Email alerts for bugs and low ratings  
✅ **Offline-First**: Users can submit feedback offline, syncs when online  
✅ **Rich Analytics**: Built-in charts, filters, and analysis tools  
✅ **Collaborative**: Easy to share with team members  

---

## Step-by-Step Setup

### 1. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "French App Feedback" (or whatever you prefer)
4. Keep this tab open - you'll need the sheet URL later

### 2. Set Up Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default `Code.gs` content with the code from `google-apps-script/feedback-collector.js`
4. **Important**: Update the CONFIG section at the top:
   ```javascript
   const CONFIG = {
     SHEET_NAME: 'Feedback', // Name of the sheet tab
     NOTIFICATION_EMAIL: 'your-email@gmail.com', // Your email for notifications
     SEND_EMAIL_NOTIFICATIONS: true, // Set to false to disable emails
     NOTIFY_ON_LOW_RATINGS: true, // Email for ratings <= 2
     NOTIFY_ON_BUGS: true // Email for bug reports
   };
   ```
5. Save the project (Ctrl+S or Cmd+S)
6. Name your project "French App Feedback Collector"

### 3. Connect to Your Google Sheet

1. In Apps Script, click the "Resources" or "Services" menu
2. If prompted, authorize the script to access your Google account
3. Go back to your Google Sheet and copy the URL
4. In Apps Script, you need to either:
   - **Option A**: Make sure the Apps Script is bound to your sheet (create it from Extensions > Apps Script in your sheet)
   - **Option B**: Use `SpreadsheetApp.openById('YOUR_SHEET_ID')` in the script

### 4. Test the Setup

1. In Apps Script, click the "Run" button next to `testSetup` function
2. Grant permissions when prompted
3. Check the Execution Log for success message
4. Go to your Google Sheet - you should see a new "Feedback" tab with test data

### 5. Deploy as Web App

1. In Apps Script, click "Deploy" > "New deployment"
2. Choose "Web app" as the type
3. Set the following:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click "Deploy"
5. **Important**: Copy the Web App URL - you'll need this for your React app

### 6. Configure Your React App

Add this to your `.env` file:
```bash
# Google Apps Script Web App URL
REACT_APP_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 7. Test End-to-End

1. Start your React app: `npm run netlify:dev`
2. Click the feedback button in your app
3. Submit a test feedback
4. Check your Google Sheet - the feedback should appear instantly!
5. If you enabled email notifications, check your inbox for critical feedback

---

## What You Get

### 📊 **Organized Data Collection**
- **Timestamp**: When feedback was submitted
- **Type**: Bug, Feature Request, Improvement, General
- **Rating**: 1-5 star rating
- **Title & Description**: User's feedback content
- **Context**: Session ID, mistake count, current screen
- **Technical Info**: User agent, URL for debugging

### 🎨 **Visual Organization**
- **Color Coding**: 
  - Red: Bugs and low ratings (≤2)
  - Blue: Feature requests
  - Green: High ratings (≥4)
  - White: General feedback
- **Bold Text**: Critical issues that need attention
- **Status Column**: Track if feedback has been addressed

### 📧 **Automatic Notifications**
- **Email alerts** for bugs and low ratings
- **Rich HTML emails** with all context
- **Direct links** to your Google Sheet
- **Customizable triggers** (configure what sends emails)

### 📈 **Built-in Analytics**
- **Charts**: Create graphs of ratings over time
- **Filters**: Filter by type, rating, date range
- **Pivot Tables**: Analyze patterns in feedback
- **Conditional Formatting**: Highlight important feedback

---

## Advanced Features

### Custom Email Templates
Modify the `sendEmailNotification` function to customize email content:
```javascript
// Add your own email styling and content
const htmlBody = `
  <div style="your-custom-styles">
    <!-- Your custom email template -->
  </div>
`;
```

### Webhook Integration
Add webhook calls to notify other services:
```javascript
// In addFeedbackToSheet function, add:
if (data.type === 'bug') {
  UrlFetchApp.fetch('https://your-webhook-url.com', {
    method: 'POST',
    payload: JSON.stringify(data)
  });
}
```

### Data Validation
Add validation rules to ensure data quality:
```javascript
// Add in doPost function:
if (!data.description || data.description.length < 10) {
  throw new Error('Description must be at least 10 characters');
}
```

---

## Security Notes

- **Public Access**: The web app is accessible to anyone with the URL
- **Rate Limiting**: Consider adding rate limiting for production
- **Data Privacy**: Feedback data is stored in your Google account
- **Permissions**: Apps Script has full access to your Google account

---

## Troubleshooting

### Common Issues:

1. **"Script not authorized"**: Run `testSetup` function to grant permissions
2. **"Sheet not found"**: Ensure sheet name matches CONFIG.SHEET_NAME
3. **"CORS error"**: Make sure web app is deployed with "Anyone" access
4. **"No data appearing"**: Check Apps Script execution logs for errors

### Debug Steps:

1. Check Apps Script execution log
2. Verify web app URL in .env file
3. Test with browser dev tools network tab
4. Run `testSetup` function to verify basic functionality

---

## Cost Analysis

- **Google Sheets**: Free (up to 10M cells)
- **Apps Script**: Free (generous limits)
- **Gmail**: Free (email notifications)
- **Total Cost**: $0/month 🎉

Compare this to alternatives:
- **Firebase**: $25-100/month
- **Airtable**: $20-50/month  
- **Custom Backend**: $10-50/month hosting

---

## Next Steps

Once your feedback system is working:

1. **Monitor Daily**: Check for new feedback and critical issues
2. **Respond to Users**: Consider adding a "Response" column
3. **Analyze Trends**: Use Google Sheets charts to track improvement
4. **Iterate**: Update your app based on user feedback
5. **Scale**: Consider moving to a database if you get 1000+ feedback items

Your feedback system is now ready to help you build a better French learning app! 🇫🇷✨ 