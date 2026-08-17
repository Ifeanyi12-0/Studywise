# StudyWise AI

A starter university study platform powered by the OpenAI API.

## Features
- Paste course material or upload PDF lecture notes.
- Generate exam-focused summaries.
- Generate multiple-choice practice quizzes with answers and explanations.
- Generate an exam-preparation study plan.
- Responsive web UI.

## Run locally

1. Install Node.js 20+.
2. Open this folder in a terminal.
3. Run:
   npm install
4. Copy `.env.example` to `.env`.
5. Add your OpenAI API key to `.env`.
6. Run:
   npm start
7. Open http://localhost:3000

Never put the OpenAI API key in browser JavaScript. The server calls the OpenAI Responses API.

## Recommended production upgrades
- University/student authentication.
- Database for courses, materials, quiz attempts and progress.
- Object storage for uploaded documents.
- DOCX/PPTX support.
- Retrieval/search over large course libraries rather than sending the entire material on every request.
- Structured Outputs for production quiz JSON validation.
- Rate limits, moderation, usage limits and audit logging.
- Per-user deletion/export controls and a privacy policy.
- University SSO (Microsoft/Google) if selling to institutions.
