import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory storage for feedback (replace with database in production)
let feedbackStorage = [];

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

      // Store feedback (in production, use a database)
      feedbackStorage.push(enrichedFeedback);

      // Send email notification for high-priority feedback
      if (feedback.type === 'bug' || feedback.rating <= 2) {
        await sendEmailNotification(enrichedFeedback);
      }

      // Log feedback for monitoring
      console.log('📝 New feedback received:', {
        type: feedback.type,
        rating: feedback.rating,
        title: feedback.title,
        contextSession: feedback.userContext?.sessionId?.slice(0, 8)
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

    } else if (event.httpMethod === 'GET') {
      // Admin endpoint to view feedback (add authentication in production)
      const adminKey = event.queryStringParameters?.key;
      
      if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }

      // Filter and anonymize data for admin view
      const adminFeedback = feedbackStorage.map(f => ({
        id: f.id,
        type: f.type,
        rating: f.rating,
        title: f.title,
        description: f.description,
        timestamp: f.serverTimestamp,
        context: {
          screen: f.userContext?.currentScreen,
          mistakeCount: f.userContext?.lastMistakeCount,
          sessionDuration: f.userContext?.sessionDuration
        },
        processed: f.processed
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          feedback: adminFeedback,
          summary: generateFeedbackSummary(feedbackStorage)
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
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping email notification');
      return;
    }

    const fromEmail = process.env.FEEDBACK_FROM_EMAIL || 'feedback@yourdomain.com';
    const toEmail = process.env.FEEDBACK_NOTIFICATION_EMAIL || process.env.FEEDBACK_FROM_EMAIL;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚨 New ${feedback.type === 'bug' ? 'Bug Report' : 'Low Rating'} Feedback</h2>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 4px 0;"><strong>Type:</strong> ${feedback.type}</li>
            <li style="padding: 4px 0;"><strong>Rating:</strong> ${feedback.rating}/5 stars</li>
            <li style="padding: 4px 0;"><strong>Title:</strong> ${feedback.title || 'No title'}</li>
            <li style="padding: 4px 0;"><strong>Time:</strong> ${feedback.serverTimestamp}</li>
          </ul>
        </div>
        
        <div style="margin: 20px 0;">
          <h3>Description:</h3>
          <p style="background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 10px 0;">
            ${feedback.description}
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
          <h3 style="margin-top: 0;">Context:</h3>
          <ul style="list-style: none; padding: 0; font-size: 14px; color: #6b7280;">
            <li><strong>Screen:</strong> ${feedback.userContext?.currentScreen || 'Unknown'}</li>
            <li><strong>Session ID:</strong> ${feedback.userContext?.sessionId?.slice(0, 8) || 'None'}</li>
            <li><strong>Mistakes Count:</strong> ${feedback.userContext?.lastMistakeCount ?? 'Unknown'}</li>
            <li><strong>User Agent:</strong> ${feedback.userAgent}</li>
          </ul>
        </div>
        
        <p style="color: #dc2626; font-weight: bold; margin-top: 20px;">
          ⚠️ This feedback requires immediate attention.
        </p>
      </div>
    `;

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `🚨 French App: ${feedback.type === 'bug' ? 'Bug Report' : 'Low Rating'} - ${feedback.rating}/5`,
      html: emailHtml
    });

    console.log('📧 Email notification sent via Resend:', emailResult.data?.id);
    
  } catch (error) {
    console.error('Failed to send email notification via Resend:', error);
  }
}

function generateFeedbackSummary(feedbackList) {
  const total = feedbackList.length;
  const typeBreakdown = feedbackList.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {});

  const averageRating = feedbackList.length > 0 
    ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
    : 0;

  const criticalIssues = feedbackList.filter(f => 
    f.type === 'bug' || f.rating <= 2
  ).length;

  const recentFeedback = feedbackList.filter(f => {
    const feedbackDate = new Date(f.serverTimestamp);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return feedbackDate > weekAgo;
  }).length;

  return {
    totalFeedback: total,
    averageRating: parseFloat(averageRating),
    typeBreakdown,
    criticalIssues,
    recentFeedback,
    needsAttention: criticalIssues > 0,
    lastUpdated: new Date().toISOString()
  };
} 