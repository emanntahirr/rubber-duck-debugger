# rubber-duck-debugger
a question first AI debugging assistant built on cloudflare workers that works on the command line.

---

## Overview
The rubber duck debugger is a CLI-driven, AI powered debugging assistant that enforces a two-phased debugging workflow:

1. Clarification first: the system asks targeted questions to better understand the problem
2. Analysis second: only after clarification will the assitant provide the likely causes of the bugs and debugging steps.

Unlike most AI chatbots that spit answers out without any indication from the user, this project is designed to support developer reasoning, mirroring the classic rubber duck debugging technique.

The service runs entirely at the edge using Cloudflare workers, workers AI, and Durable Objects for stateful session management.

---

### Design and Difference????
This project deliberately prevents premature analysis.

Key design principles I implemented:

- enforced clarification before analysis
- explicit, state-driven workflow
- CLI / infra-style tooling
- Determenistic behaviour across sessions

this tool is predictable, explainable, and closer to how real engineering support tools behave.

---

### Architecture
Cloudflare stack:

- Cloudflare Workers – request handling and orchestration

- Workers AI – LLM inference at the edge

- Durable Objects – per-session state and phase tracking

- TypeScript – strict typing

Each debugging session is isolated using a ``sessionID``, backed by a Durable Object that tracks:
- previous messages
- current workflow phase (clarification -> analysis)

---

### Workflow
For each session:

1. First request

- Stores the issue
- Responds with 1–2 clarifying questions
- No analysis allowed
2. Second request
- Transitions the session to analysis mode
- Returns:
    - likely causes
    - suggested next debugging steps
- No further questions allowed

This workflow is enforced both by:
- Durable Object state
- Output-constrained prompting

---

## Running locally
### Prerequisites
- Node.js (v18+ rec)
- A cloudflare account
- Wrangler CLI

--- 

### Clone the repository
```bash
git clone https://github.com/emanntahirr/rubber-duck-debugger.git
cd rubber-duck-debugger
```
---
### Install dependencies
```bash
npm install
```
---
### Authenticate with Cloudflare
```bash
npx wrangler login

```
---
### Start the local development server
```bash
npx wrangler dev
```
the worker will be available locally at
```arduino
http://localhost:8787
```
---
# Using the debugger (CLI)
### Start a new debugging session (clarification phase)
```bash
curl -X POST http://localhost:8787 \
    -H "Content-Type: application/json" \
    -d '{
    "sessionId": "duck-1",
    "message": "My Java backend intermittently returns 500 errors"
    }'
```
---
Respond to clarification
```bash
curl -X POST http://localhost:8787 \
    -H "Content-Type: application/json" \
    -d '{
    "sessionId": "duck-1",
    "message": "It mainly happens under heavy load and affects multiple endpoints"
    }'
```