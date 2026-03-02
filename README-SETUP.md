# Setup Instructions for French Learning App

## Environment Variables Setup

### For Local Development:

1. **Create `.env` file** in the project root:
```bash
touch .env
```

2. **Add your OpenAI API key** to `.env`:
```bash
# .env file
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
VITE_APP_NAME=French for You
VITE_APP_VERSION=1.0.0
```

⚠️ **Important**: The API key is now `OPENAI_API_KEY` (no `VITE_` prefix) because it's used by Netlify Functions on the server, not in the browser!

### For Netlify Deployment:

1. Go to your Netlify site dashboard
2. **Site settings** → **Environment variables**
3. Add: `OPENAI_API_KEY` = `your-api-key-here`

## Development Workflow

### Option 1: Frontend Only Development
```bash
npm run dev
```
- **URL**: http://localhost:5173
- **Features**: React app with hot reload
- **Limitations**: ❌ AI features won't work (no backend functions)

### Option 2: Full Stack Development (Recommended)
```bash
npm run netlify:dev
```
- **URL**: http://localhost:8888 ← **Use this one!**
- **Features**: React app + Netlify Functions + hot reload
- **Benefits**: ✅ AI features work via local functions

## Port Explanation

When you run `netlify:dev`, you'll see multiple ports mentioned:

- **Port 8888**: Your main development server (frontend + functions) ← **Use this**
- **Port 5173**: Vite's internal server (ignore this)

**Always use http://localhost:8888** - that's where everything works together!

## API Endpoints

When running with Netlify:

- **Chat with AI**: `POST http://localhost:8888/.netlify/functions/chat`
  ```json
  {
    "message": "Bonjour, comment allez-vous?",
    "conversationHistory": [],
    "model": "gpt-4o"
  }
  ```

## Security Benefits ✅

- **API key is NOT exposed** in browser
- **API key runs on server** (Netlify Functions)
- **Users can't see or steal** your OpenAI API key
- **Safe to deploy publicly**

## Troubleshooting

### "OpenAI API key not configured" error:
- Check your `.env` file has `OPENAI_API_KEY=sk-...`
- Restart `npm run netlify:dev` after adding environment variables

### Functions not working:
- Make sure you're using `npm run netlify:dev` not just `npm run dev`
- Check that `netlify/functions/chat.js` exists
- Visit http://localhost:8888 (not 5173)

### CORS errors:
- Functions include CORS headers for local development
- Should work between localhost:8888 and the functions 