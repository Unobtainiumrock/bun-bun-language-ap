// Feedback is stored client-side in IndexedDB via Dexie.
// This function handles server-side logging and optional email notifications.

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    if (event.httpMethod === 'POST') {
      const feedback = JSON.parse(event.body);
      
      // Validate feedback data
      if (!feedback.type || !feedback.description || !feedback.rating) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      // Add server-side metadata
      const enrichedFeedback = {
        ...feedback,
        id: Date.now().toString(),
        serverTimestamp: new Date().toISOString(),
        userAgent: event.headers['user-agent'] || 'unknown',
        ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown',
        processed: false
      };

      if (feedback.type === 'bug' || feedback.rating <= 2) {
        await sendEmailNotification(enrichedFeedback);
      }

      console.log('New feedback received:', {
        type: feedback.type,
        rating: feedback.rating,
        title: feedback.title,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Feedback received successfully',
          id: enrichedFeedback.id 
        })
      };

    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Feedback function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

async function sendEmailNotification(feedback) {
  const toEmail = process.env.FEEDBACK_NOTIFICATION_EMAIL;
  if (!toEmail) {
    console.log('FEEDBACK_NOTIFICATION_EMAIL not configured, skipping email');
    return;
  }
  // TODO: Wire up an email provider (Resend, SES, etc.) when ready.
  // For now, critical feedback is logged to the function output.
  console.log('CRITICAL FEEDBACK (email not configured):', JSON.stringify({
    type: feedback.type,
    rating: feedback.rating,
    title: feedback.title,
    description: feedback.description,
    timestamp: feedback.serverTimestamp,
  }));
} 