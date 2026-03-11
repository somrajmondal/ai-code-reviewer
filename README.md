# CodeLens — AI Code Review Platform

> Paste any code. Get an instant, structured AI review covering bugs, security vulnerabilities, performance issues, and style — streamed live token-by-token.

**Live Demo:** (https://ai-code-reviewer-sage-eight.vercel.app/)
**Stack:** Flask · React 18 · OpenAI GPT-4o · Vercel

---

## Features

- **Real-time streaming** — reviews stream token-by-token via Server-Sent Events
- **5 focus modes** — Full Review, Bugs, Security, Performance, Style
- **File upload** — upload `.py`, `.js`, `.ts`, `.sql` and more; language is auto-detected
- **Review history** — last 20 reviews saved per session (in-memory, no account required)
- **Export to Markdown** — download any review as a `.md` file
- **AI rewrite** — GPT-4o suggests an improved version of the most problematic section
- **Rate limiting** — 10 requests/min per IP, 100/min globally (no Redis required)
- **25+ tests** — pytest suite covering API validation, rate limiter, history store, prompts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Flask 3.0, Python 3.11 |
| AI | OpenAI GPT-4o (streaming) |
| Frontend | React 18, vanilla CSS |
| Deployment | Vercel (hobby tier) |
| Testing | pytest |

---

## Project Structure

```
codelens-pro/
├── backend/
│   ├── app.py                  ← Flask app factory
│   ├── routes/
│   │   ├── review.py           ← POST /api/review (streaming SSE)
│   │   ├── history.py          ← GET/DELETE /api/history/:sid
│   │   └── meta.py             ← GET /api/health, /api/languages, /api/focuses
│   ├── utils/
│   │   ├── rate_limiter.py     ← Sliding-window rate limiter (no Redis)
│   │   ├── prompts.py          ← System prompt + user prompt builder
│   │   └── history_store.py    ← In-memory session/review store
│   ├── test_app.py             ← 25+ pytest tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js              ← Root layout (split-pane)
│   │   ├── context/AppContext.jsx ← Global state (languages, focuses, history)
│   │   ├── hooks/useReview.js  ← Streaming state machine
│   │   ├── utils/api.js        ← fetch + SSE reader + export
│   │   └── components/
│   │       ├── layout/Sidebar.jsx   ← Review history sidebar
│   │       ├── review/CodeEditor.jsx ← Editor with file upload
│   │       ├── review/ReviewPanel.jsx ← Tabbed results view
│   │       └── ui/                  ← ScoreRing, IssueCard, StreamPreview
│   └── package.json
├── vercel.json
└── README.md
```

---

## Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY
python app.py
# → http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

The React dev server proxies `/api/*` to Flask automatically.

---

## Run Tests

```bash
cd backend
pytest test_app.py -v
```

Expected: **25 tests pass**

---

## Deploy to Vercel

```bash
# 1. Build React
cd frontend && npm run build

# 2. Install Vercel CLI
npm i -g vercel

# 3. Add OpenAI key to Vercel
vercel secrets add openai_api_key sk-your-key-here

# 4. Deploy from project root
cd .. && vercel --prod
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Health check + uptime |
| `GET`  | `/api/languages` | Supported languages list |
| `GET`  | `/api/focuses` | Available focus modes |
| `POST` | `/api/review` | Stream SSE code review |
| `POST` | `/api/session` | Create review session |
| `GET`  | `/api/history/:sid` | Get session history |
| `GET`  | `/api/history/:sid/:rid` | Get single review |
| `DELETE` | `/api/history/:sid` | Clear session history |

### POST /api/review

**Request body:**
```json
{
  "code":       "def foo(): ...",
  "language":   "python",
  "focus":      "all",
  "filename":   "main.py",
  "session_id": "uuid"
}
```

**Response:** `text/event-stream`
```
data: {"token": "{\n"}
data: {"token": "  \"language\""}
...
data: [DONE]
```

---

## Architecture Decisions

**Streaming over polling** — SSE gives a better UX than polling. The frontend reads `response.body.getReader()` directly, parsing `data:` lines from each chunk. This handles partial-chunk boundaries correctly.

**No database** — Review history lives in a Python `OrderedDict` (max 500 sessions × 20 reviews). For production: swap with Redis or Postgres.

**Rate limiting without Redis** — A sliding-window counter per IP using `collections.deque`. Evicts expired timestamps on each check. Works on Vercel serverless with the caveat that limits reset between cold starts.

**Structured prompt output** — GPT-4o is instructed to return strict JSON only. The frontend accumulates tokens and parses once `[DONE]` arrives, enabling live preview without premature parsing.

---

## Assumptions & Limitations

- Session history resets on Vercel cold starts (no persistent storage)
- Rate limits are per-instance (not distributed across Vercel replicas)
- Max code size: 10,000 characters
- OpenAI responses can occasionally exceed Vercel's 10-second function timeout — consider Vercel Edge Functions for production
