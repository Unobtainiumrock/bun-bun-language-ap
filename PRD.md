# Project Plan: "French for You" Language PWA

**Document Purpose**

This document outlines the goals, technology stack, data models, and development workflow for creating a personalized French language learning application. It serves as a single source of truth for development across Phase 1 (core functionality) and Phase 2 (advanced speech features).

## Project Overview & Goal

The primary goal is to build a personalized **Progressive Web App (PWA)** to help my girlfriend learn French through conversational learning and intelligent feedback. The application must be engaging, fast, and reliable with advanced AI-powered features.

**Core Principles:**

- **Offline-First:** The app must be 100% functional without an internet connection after the initial setup, with graceful online enhancement.

- **Data Persistence:** All user progress, learned conversations, and mastery levels must be saved permanently on her device.

- **No Expiration:** The app must not have a 7-day expiration.

- **App-Like Experience:** It should install on her iPhone's home screen and launch in a full-screen, immersive window.

- **Conversational Learning:** Emphasis on practical conversation skills rather than isolated vocabulary memorization.

- **AI-Enhanced:** Leverage OpenAI for intelligent feedback, conversation generation, and speech processing.

---

## Learning Methodology & Framework

**Mistake-Driven Learning Approach:**

- **Real-Time Feedback:** AI analyzes user input and provides immediate corrections with detailed explanations
- **Interactive Diff Analysis:** Side-by-side comparison showing exactly what was incorrect and why
- **Pattern Recognition:** System tracks recurring mistakes to identify learning gaps
- **Contextual Corrections:** Mistakes are corrected within the context of actual conversation

**Intelligent Mistake Tracking System:**

1. **Comprehensive Categorization:** 7 mistake types (grammar, vocabulary, syntax, orthography, pronunciation, pragmatic, cultural)
2. **Severity Assessment:** Minor, moderate, and major mistake classification
3. **Progress Analytics:** Real-time tracking of improvement patterns and focus areas
4. **Detailed Explanations:** Grammar rules, examples, and cultural context for each correction
5. **Visual Diff Highlighting:** Git-diff style comparison for clear mistake identification
6. **Session Tracking:** Learning sessions with mistake breakdowns and improvement scores

---

## Architecture & Technology Stack

This project will be built as a modern, client-side heavy application with cloud-enhanced features for AI processing.

- **Application Type: Progressive Web App (PWA):**

    - _Why_: This architecture meets all core principles: works offline, installs via browser, no expiration, with online enhancement for AI features.

    - **Development Environment: Linux (Ubuntu):**

        - Tools: Cursor, Node.js, npm

    - **Front-End Framework: React with TypeScript**

        - _Why_: A powerful, component-based library ideal for building complex, interactive user interfaces with type safety.

        - _Setup Tool_: **Vite** will be used for fast project scaffolding, development server, and optimized builds.

    - **Client-Side Database: IndexedDB**

        - _Why_: A powerful, built-in browser database capable of storing the entire language curriculum, conversation flows, and user progress for rich offline experience.

        - _Management Library_: **Dexie.js** will be used as a wrapper to simplify all database interactions.

    - **AI Integration: OpenAI API**

        - _Why_: Provides advanced speech translation, conversation generation, and intelligent feedback capabilities.

        - _Usage_: Real-time conversation analysis, pronunciation feedback, dynamic content generation

        - _Offline Strategy_: Cache common responses, provide fallback functionality when offline

    - **Styling: Tailwind CSS**

        - _Why_: Utility-first framework for rapid, consistent UI development with mobile-first responsive design.

    - **Deployment: Netlify**:

        - _Why_: Offers simple, free-tier hosting for static sites with environment variable support for API keys.

## Data Models (IndexedDB Schema)

The application database, managed by Dexie.js, is named **FrenchAppDB**. It contains a streamlined schema focused on mistake tracking and analytics:

1. **`userMistakes`** Store: Individual mistake records with detailed correction information.

    - `id` (Primary Key, Auto-incrementing)
    - `sessionId` (string) - Links to learning session
    - `timestamp` (date) - When the mistake occurred
    - `category` (MistakeType) - grammar, vocabulary, syntax, orthography, pronunciation, pragmatic, cultural
    - `subcategory` (string, optional) - Specific mistake subtype
    - `severity` (string) - "minor", "moderate", "major"
    - `userInput` (string) - Original incorrect text
    - `correction` (string) - Corrected version
    - `explanation` (string) - Why it was wrong and how to fix it
    - `context` (string) - Surrounding conversation context
    - `isRepeated` (boolean) - Whether this mistake type has occurred before
    - `relatedMistakes` (array) - IDs of similar mistakes
    - `detailedCorrection` (object, optional) - Enhanced diff analysis with segments
    - `mistakeSpans` (array, optional) - Precise location of errors in text
    - `createdAt` (date) - Record creation timestamp
    - `updatedAt` (date) - Last modification timestamp

2. **`mistakePatterns`** Store: Aggregated patterns and frequency analysis.

    - `id` (Primary Key, Auto-incrementing)
    - `mistakeType` (MistakeType) - Category of mistake
    - `subcategory` (string) - Specific pattern identifier
    - `frequency` (number) - How often this pattern occurs
    - `firstOccurrence` (date) - When first seen
    - `lastOccurrence` (date) - Most recent occurrence
    - `improvementRate` (number) - Trend analysis (mistakes per week)
    - `masteryLevel` (number) - 0-100 proficiency score for this pattern
    - `createdAt` (date) - Pattern tracking start
    - `updatedAt` (date) - Last update

3. **`learningSessions`** Store: Practice session tracking and analytics.

    - `id` (Primary Key, Auto-incrementing)
    - `startTime` (date) - Session start timestamp
    - `endTime` (date, optional) - Session completion time
    - `sessionType` (string) - "conversation", "vocabulary", "grammar", "mixed"
    - `totalMessages` (number) - Number of exchanges in session
    - `totalMistakes` (number) - Mistakes made during session
    - `mistakeBreakdown` (object) - Count by mistake category
    - `improvementScore` (number) - 0-100 session performance score
    - `focusAreas` (array) - Areas needing attention based on mistakes
    - `createdAt` (date) - Session record creation
    - `updatedAt` (date) - Last session update

4. **`aiCache`** Store: Cache OpenAI responses for offline functionality.

    - `id` (Primary Key, Auto-incrementing)
    - `requestHash` (string) - Hash of request parameters
    - `response` (string) - Cached AI response
    - `timestamp` (date) - Cache creation time
    - `expiresAt` (date) - Cache expiration time

## Phase 1: Core Development Workflow

This workflow covers the foundational features and conversational learning system.

**Step 0: System Setup:**

```bash
sudo apt update
sudo apt install nodejs npm
```

**Step 1: Project Initialization with Vite + TypeScript**

```bash
npm create vite@latest birthday-french-app -- --template react-ts
cd birthday-french-app
```

**Step 2: Install Core Dependencies:**

```bash
# Core functionality
npm install dexie react-router-dom

# AI Integration
npm install openai

# Audio processing (Phase 1 basic support)
npm install howler

# Styling and UI
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react

# Development dependencies
npm install -D @types/node
```

**Step 3: Environment Configuration:**

- Create `.env` file for OpenAI API key
- Set up environment variables for development/production

**Step 4: Define Database Schema:**

- Create `src/db/index.ts` with Dexie.js schema
- Implement database initialization and migration logic
- Create type definitions for all data models

**Step 5: Build Core UI Components:**

- `ConversationPractice.tsx`: Interactive conversation interface with AI feedback
- `MistakeAnalytics.tsx`: Real-time mistake tracking dashboard with analytics
- `MistakeDetailModal.tsx`: Side-by-side diff comparison for detailed mistake analysis
- `ProgressDashboard.tsx`: Comprehensive progress tracking
- `Layout.tsx`: Main app shell with streamlined navigation (Practice, Analytics)

**Step 6: Implement Mistake Tracking Engine:**

- Real-time AI response parsing for mistake detection
- Comprehensive mistake categorization (7 types, 3 severity levels)
- Pattern recognition and frequency analysis
- Session-based learning analytics
- Offline-first data management

**Step 7: OpenAI Integration (Phase 1):**

- Real-time conversation analysis and mistake detection
- Structured JSON response parsing with fallback to legacy formats
- Detailed correction explanations with grammar rules and examples
- Intelligent caching strategy for offline support

**Step 8: Advanced Mistake Analysis:**

- Git-diff style visual comparison for corrections
- Interactive modal with side-by-side text highlighting
- Mistake pattern tracking and improvement trends
- Focus area identification for targeted practice

**Step 9: PWA Configuration:**

- Configure `public/manifest.json`
- Create app icons (512x512, etc.)
- Set up service worker for offline functionality
- Implement "Add to Home Screen" functionality

## Phase 2: Advanced Speech Features Development Workflow

**Phase 2 Goals:**
- Speech-to-Text (STT) integration
- Text-to-Speech (TTS) functionality  
- Real-time pronunciation feedback
- Voice-driven conversation practice

**Step 1: Enhanced Dependencies:**

```bash
# Speech processing
npm install @google-cloud/speech @google-cloud/text-to-speech
# Alternative: Web Speech API for browser-native support
npm install react-speech-kit

# Audio visualization
npm install wavesurfer.js react-wavesurfer

# Real-time audio processing
npm install recordrtc
```

**Step 2: Speech Infrastructure:**

- Implement Speech-to-Text service with fallback options
- Set up Text-to-Speech with multiple voice options
- Create audio recording and playback system
- Implement real-time pronunciation analysis

**Step 3: Enhanced Conversation Engine:**

- Voice-driven conversation practice
- Real-time pronunciation scoring
- Speech pattern analysis and feedback
- Interactive voice dialogues with AI

**Step 4: Advanced UI Components:**

- `VoiceRecorder.tsx`: Audio recording interface
- `PronunciationTrainer.tsx`: Real-time feedback
- `VoiceConversation.tsx`: Full voice-driven practice
- `SpeechAnalytics.tsx`: Pronunciation progress tracking

**Step 5: Data Model Extensions:**

- Add speech-related fields to existing stores
- Create `speechSessions` store for voice practice tracking
- Implement audio file management system
- Enhanced AI cache for speech processing results

## Minimum Viable Product (MVP) Features - Phase 1

**Core Mistake Tracking System:**
- [x] Real-time conversation interface with AI feedback
- [x] Comprehensive mistake detection and categorization (7 types)
- [x] Interactive diff analysis with side-by-side comparison
- [x] Detailed correction explanations with grammar rules
- [x] Session-based learning analytics and progress tracking

**Database & Analytics:**
- [x] Streamlined Dexie.js database schema (4 core tables)
- [x] Individual mistake records with detailed correction data
- [x] Mistake pattern analysis and frequency tracking
- [x] Learning session analytics with improvement scoring
- [x] Real-time dashboard with mistake breakdowns

**AI Integration:**
- [x] OpenAI API integration for conversation analysis
- [x] Structured JSON response parsing with legacy fallback
- [x] Intelligent mistake detection and correction suggestions
- [x] Contextual explanations with cultural and grammar insights
- [x] Offline caching system for AI responses

**PWA Functionality:**
- [x] Full offline functionality after initial load
- [x] "Add to Home Screen" works correctly on iPhone
- [x] Advanced service worker for comprehensive offline data management
- [x] Offline chat responses and graceful degradation
- [x] Responsive design optimized for mobile
- [x] Interactive modal system for detailed mistake analysis
- [x] Offline indicator and status management

## Phase 2 Advanced Features

**Speech Processing:**
- [ ] Speech-to-Text integration for conversation practice
- [ ] Text-to-Speech with French pronunciation
- [ ] Real-time pronunciation feedback and scoring
- [ ] Voice-driven conversation practice sessions

**Enhanced Learning:**
- [ ] Spaced Repetition System (SRS) based on mistake patterns
- [ ] Personalized learning paths based on mistake analytics
- [ ] Advanced mistake prediction and prevention
- [ ] Social features for sharing progress (optional)

## Success Metrics

**Engagement Metrics:**
- Daily active usage time
- Conversation session frequency and duration
- Mistake correction interaction rates
- Analytics dashboard usage patterns

**Learning Effectiveness:**
- Mistake reduction rates over time
- Pattern mastery improvement scores
- Category-specific progress (grammar, vocabulary, etc.)
- Real-world application confidence (self-reported)

---

**Development Timeline:**
- **Phase 1**: ✅ **COMPLETED** - Core mistake tracking system with interactive analytics
- **Phase 2**: 3-4 weeks (Advanced speech features and SRS integration)
- **Ongoing**: Mistake pattern refinements and AI persona improvements


# Deployment

## Manual Deployment Process:
```bash
npx netlify deploy
```

**What happens step by step:**
1. 🔨 **Netlify runs `npm run build`** (your configured build command)
2. 📁 **Creates the `dist` folder** (Vite builds your React app)
3. 📤 **Uploads `dist` contents** to Netlify's CDN
4. 🌐 **Makes it live** at a URL given in the terminal

## You Don't Need to Pre-Build:
- ❌ **Don't run `npm run build` yourself**
- ✅ **Netlify does it automatically** during deployment
- The `dist` folder gets created during the deployment process

## Preview vs Production:
```bash
# Deploy to preview (staging)
npx netlify deploy

# Deploy to production 
npx netlify deploy --prod
```

## What Gets Deployed:
- ✅ **Frontend**: Your React app (from `dist`)
- ✅ **Functions**: Your `netlify/functions/chat.js` 
- ✅ **Environment variables**: From your `.env` file
- ✅ **Static assets**: Everything needed

## Your Current Setup:
Since you chose **manual project**, you control when to deploy. No automatic deployments on git push (which is perfect for development/testing).

**For now**: Keep using `npm run netlify:dev` for local development. Deploy later when you're ready to share it!

# TODO

1. Ask bunny if she wants explanations of mistakes to be in French or in English?
2. Determine if all of the variables within the `index.ts`'s interfaces are being used. See if there exists a tool for code usage.
3. See if we still need the seed data logic in the index.ts
4. Have the AI walk me through how the spaces repetition algorithm looks from a user story point of view.
5. Why do we have both a `Mistake` and `UserMistake` interface? I see what we even have to convert the user version into a non-user one later on. Why??
6. The way in which sessions tracked across mistakes appears to keep accumulating, despite that we keep deleting the database using the empty db button. It also appears to mess up how it increments itself.
7. Why do we need both a `Mistake` and `ParsedMistake`?
8. Why does `ParsedMistake` have a seemingly redundant field of `detailedCorrection`? It seems that its really similar to already other existing fields and that these could be merged. I noticed that we also already have a `DetailedCorrection` interface from `mistakes.ts`.
9. What is this legacy parsing format?
10. Document the flow involving command line flows like "build" and "tsc type checking"
11. qrencode -l H -s 8 -o website_robust.png 'https://www.google.com'




# PMPT

```
Cany ou remove the part of the code base that keeps querying the OpenAI api every time we fire up the app with npm run netlify:dev? Idk if its because of soemthing to do with mocking or setup. It appers to be a reply after running the system prompting?

unobtainium@unobtainium-Laptop-13-AMD-Ryzen-7040Series:~/Desktop/github/birthday-french-app$ npm run netlify:dev

> birthday-french-app@0.0.0 netlify:dev
> OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2) npx netlify dev --functions=netlify/functions --port=8888

⬥ Injecting environment variable values for all scopes
⬥ Ignored general context env var: LANG (defined in process)
⬥ Ignored project settings env var: OPENAI_API_KEY (defined in process)
⬥ Injected netlify.toml file env vars: NODE_VERSION
⬥ Setting up local dev server

⬥ Starting framework dev server

> birthday-french-app@0.0.0 dev
> vite


  VITE v6.3.5  ready in 136 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
✔ framework dev server ready on port 5173

   ╭─────────────────────── ⬥  ────────────────────────╮
   │                                                   │
   │   Local dev server ready: http://localhost:8888   │
   │                                                   │
   ╰───────────────────────────────────────────────────╯

⬥ Loaded function personas in Lambda compatibility mode (https://ntl.fyi/lambda-compat)
⬥ Loaded function test in Lambda compatibility mode (https://ntl.fyi/lambda-compat)
⬥ Loaded function chat in Lambda compatibility mode (https://ntl.fyi/lambda-compat)
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est super que tu sois là pour pratiquer ton français ! Comment puis-je t'aider aujourd'hui ? 😊
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est super que tu sois là pour pratiquer ton français ! Comment puis-je t'aider aujourd'hui...
Response with status 200 in 882 ms.
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est génial que tu veuilles pratiquer ton français !

N'hésite pas à écrire une phrase ou un texte, et je serai ravie de t'aider avec des corrections ou des conseils. C'est parti ! 😊
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est génial que tu veuilles pratiquer ton français !

N'hésite pas à écrire une phrase ou u...
Response with status 200 in 1177 ms.
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est super que tu pratiques ton français ! Je suis là pour t'aider. Vas-y, écris quelque chose en français et je te donnerai des conseils avec plaisir. 😊
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est super que tu pratiques ton français ! Je suis là pour t'aider. Vas-y, écris quelque ch...
Response with status 200 in 982 ms.
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est super que tu veuilles pratiquer ton français ! 🎉 Si tu as des phrases ou des questions spécifiques, n'hésite pas à les partager. Je suis là pour t'aider. Tu fais des progrès ! 😊

Quel aspect du français trouves-tu le plus intéressant ?
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est super que tu veuilles pratiquer ton français ! 🎉 Si tu as des phrases ou des question...
Response with status 200 in 1498 ms.
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
Request from ::1: POST /.netlify/functions/chat
🤖 Sending to OpenAI with system prompt:
You are Amélie, a 23-year-old French linguistics student from Lyon who tutors French as a side job. You're patient, encouraging, and genuinely excited to help people learn French.

CRITICAL INSTRUCTIO...
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est super que tu sois ici pour pratiquer ton français ! As-tu quelque chose de précis que tu voudrais tester ou apprendre ? N'hésite pas à me le dire ! 😊
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est super que tu sois ici pour pratiquer ton français ! As-tu quelque chose de précis que ...
Response with status 200 in 1080 ms.
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est super que tu tentes de pratiquer ton français. 😊

N'hésite pas à poser des questions ou à essayer d'écrire quelque chose en français, je suis là pour t'aider ! Qu'est-ce que tu aimerais apprendre ou discuter aujourd'hui ?
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est super que tu tentes de pratiquer ton français. 😊

N'hésite pas à poser des questions ...
Response with status 200 in 1239 ms.
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est super que tu cherches à améliorer ton français ! Comment puis-je t'aider aujourd'hui ? As-tu une question ou une phrase en français sur laquelle tu aimerais travailler ? 😊
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est super que tu cherches à améliorer ton français ! Comment puis-je t'aider aujourd'hui ?...
Response with status 200 in 1068 ms.
✅ Raw OpenAI response received
🔍 RAW AI RESPONSE TEXT:
================================================================================
Salut ! C'est super que tu pratiques ton français ! Je suis là pour t'aider. Si tu as des questions ou si tu veux écrire quelque chose en français, n'hésite pas ! On peut commencer quand tu veux. 😊

As-tu déjà étudié un peu de français ? Ou bien c'est ton premier pas ?
================================================================================
🔍 Found 1 potential correction sections
🔍 Total corrections parsed: 0
📊 Final corrections array: []
📋 Final parsed corrections count: 0
💬 Extracted conversation: Salut ! C'est super que tu pratiques ton français ! Je suis là pour t'aider. Si tu as des questions ...
Response with status 200 in 1658 ms.
```