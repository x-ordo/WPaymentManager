# CONTRIBUTING.md — CHAGOK

## *AI-Powered Paralegal System for Divorce Cases*

**Version:** v3.0
**Last Updated:** 2026-01-04
**Organization:** [ChagokLab](https://github.com/ChagokLab)

---

# Project History

## Founding

CHAGOK was founded on **November 17, 2025** as an AI-powered paralegal system for Korean divorce cases. The project was developed over 7 weeks of intensive development, evolving from an academic project into a production-ready legal tech platform.

## Development Statistics (Nov 2025 - Jan 2026)

| Metric | Value |
|--------|-------|
| Total Commits | 930 |
| Pull Requests Merged | 82 |
| Total Lines of Code | 164,821 |
| Test Files | 819 |
| Development Period | 7 weeks |

### Codebase Breakdown

| Component | Modules/Files |
|-----------|---------------|
| Backend API (FastAPI) | 38 modules |
| Frontend Pages (Next.js) | 50 pages |
| AI Worker (Lambda) | 70 modules |

## Founding Contributors

The following developers are the founding members who built CHAGOK from the ground up:

### Prometheus-P (x-ordo) — Project Lead & Frontend
- **Commits:** 517 (55.6%)
- **Role:** PM, Frontend Architecture, Claude Code Integration
- **Key Contributions:**
  - Next.js 14 App Router architecture
  - React Flow party relationship graph
  - Draft preview system
  - Claude Code workflow optimization

### vsun410 — Backend Lead
- **Commits:** 180 (19.4%)
- **Role:** Backend, API Design, Database
- **Key Contributions:**
  - FastAPI REST API design
  - PostgreSQL/DynamoDB schema
  - JWT authentication system
  - Case management service layer

### leaf446 — AI/ML Lead
- **Commits:** 141 (15.2%)
- **Role:** AI Worker, RAG Pipeline, Evidence Processing
- **Key Contributions:**
  - Evidence parser pipeline (text, image, audio, video, PDF)
  - Article 840 legal ground tagger
  - Qdrant vector search integration
  - OpenAI GPT-4o/Whisper integration

## Technical Achievements

### Architecture Milestones
- **Clean Architecture:** Three-tier system (Frontend → Backend → AI Worker) with strict dependency inversion
- **Event-Driven AI:** S3 event-triggered Lambda pipeline for asynchronous evidence processing
- **Case Isolation:** Per-case Qdrant vector collections (`case_rag_{case_id}`) ensuring data isolation

### Key Features Implemented
- Evidence ingestion pipeline supporting 6 file types
- KakaoTalk/SMS conversation parser with speaker diarization
- Party relationship graph with automatic extraction from precedents
- AI-powered draft document generation with evidence citations
- WCAG 2.2 accessibility compliance

### Infrastructure
- AWS deployment: CloudFront (CDN), Lambda (AI), RDS (PostgreSQL), DynamoDB, S3, Qdrant Cloud
- CI/CD: GitHub Actions with CodeQL security scanning
- Staging/Production environment separation

---

# GitHub Collaboration Rules (Team H · P · L)

## Purpose

This document provides the **minimum rules for fast collaboration** on the CHAGOK repository.

- Complex GitFlow: **FORBIDDEN**
- **main stability: TOP PRIORITY**
- **dev is a free Vibe Coding zone**
- Designed for GitHub beginners to follow directly

---

# Roles

- **H (Backend)**: FastAPI, RDS, API, deployment pipeline
- **L (AI)**: AI Worker, pipeline, RAG/embedding
- **P (Frontend/PM)**: React dashboard, UX, **PR approver (primary reviewer)**

---

# Branching Strategy

> **ABSOLUTE RULES**
> - Direct push to `main` branch: FORBIDDEN → PR only (Production deployment)
> - Direct push to `dev` branch: FORBIDDEN → PR only (Staging deployment)
> - All code changes must go through work branches (p-work, feat/*) via PR

Single pattern to remember:

```text
main  ←  dev  ←  feat/*
              ←  p-work (P developer only, Claude Code based)
```

## main
- Production/deployment branch
- **Direct push: FORBIDDEN**
- Changes only via **PR (dev → main)**
- If main breaks, lawyer service is immediately affected → Always keep "deployable state"

## dev
- Base branch for all development (Staging environment deployment)
- **Direct push: FORBIDDEN** — Changes only via **PR (p-work/feat/* → dev)**
- Vibe Coding, large refactoring, structural changes should be done in work branches then PR

## feat/*
- Work branch created as needed
- Examples: `feat/parser-unify`, `feat/ai-routing-v2`

## p-work (P developer only)
- P developer's **Claude Code based** work branch
- **All work done in p-work → merge to dev**

## exp/* (Optional)
- Personal test / throwaway code
- **Merge to main/dev: FORBIDDEN**

---

# Commit Rules

## Messages in English

For AI analysis/refactoring and change tracking, **always write in English**.

## Prefix Rules

```text
feat:     Feature addition
fix:      Bug fix
refactor: Structural change (no functional change)
docs:     Documentation only
chore:    Build/config/logging etc.
test:     Test addition/modification
```

### Examples

```text
feat: add unified text conversation parser
fix: wrong timestamp formatting in evidence ingestion
refactor: clean up ai worker pipeline structure
docs: update backend design document
chore: adjust logging level for lambda
```

---

# Daily Workflow

## H / L Common Routine

1. **Update dev**
```sh
git checkout dev
git pull origin dev
```

2. **Work + local test**
- Request code generation from AI → Apply code
- At minimum, confirm `pytest` or app startup

3. **Push to dev via PR**
```sh
git add .
git commit -m "feat: implement xxx"
git push origin feat/xxx
# Create PR: feat/xxx → dev
```

4. **When ready for deployment, create PR (dev → main)**
- When feature is sufficiently complete & tested, create PR

---

## P Routine (PR Approver / FE focused)

1. Work on UI/dashboard based on dev
2. Check dev status, if deployable, create or approve **PR (dev → main)**
3. Confirm main deployment pipeline works correctly

---

# Pull Request Rules

## Direction
- **Always `dev → main`**
  (Exception: documentation-only changes → see 5.4)

## Approver
- Default approver: **P (or designated Owner)**
- Purpose is **"check if it works / service impact"** rather than code quality review

## PR Template (Summary)

Write only these 3 things in PR description:

```md
# Summary
- One-line summary of implementation/fix

# Changed Files
- backend/app/...
- ai_worker/...
- frontend/src/...

# Impact
- FE impact: Yes/No
- Migration needed: Yes/No (e.g., DB schema changes)
```

## Documentation Exception

- Changes to **only documentation** (`docs/*.md`, `CONTRIBUTING.md`, `README.md`):
  - **Direct push to main allowed** (for hotfix documentation updates)
- If code is included, must use dev → main PR

---

# Conflict Resolution

### Principle: "Author or last modifier takes responsibility"

- Based on who wrote the code, who recently made major changes
- If no agreement, **person with more understanding** handles it

### Basic Procedure

```sh
git checkout dev
git pull origin dev
# Fix files with conflict markers
git add .
git commit
git push origin dev
```

### Checklist

- Check for shared schema/type changes (notify FE/H/L mutually)
- If needed:
  - Mark "breaking change" in PR comment
  - Update design documents in `docs/` together

---

# Deployment Rules

## main → Deployment Pipeline

- When merged to main, GitHub Actions runs:
  ```text
  dev → main PR merge
    → CI (tests)
    → CD (AWS deployment: BE/AI/FE)
  ```

- main state = "service state visible to lawyers"

## dev Environment

- If possible, connect to separate **staging environment**
- Staging failures are okay, but main failures require immediate response

---

# Repository Structure

```text
root/
├── .env                  # Unified env vars (Git excluded)
├── .env.example          # Env var template
├── backend/              # FastAPI backend (H)
│   ├── app/
│   │   ├── api/          # Routers
│   │   ├── core/         # Config, security, dependencies
│   │   ├── db/           # Models, schemas, session
│   │   ├── middleware/   # Security, error, audit logging
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business logic
│   │   ├── utils/        # S3, DynamoDB, Qdrant, OpenAI adapters
│   │   └── main.py       # FastAPI entrypoint
│   └── tests/
│
├── ai_worker/            # AI Lambda worker (L)
│   ├── handler.py        # Lambda entrypoint
│   ├── src/
│   │   ├── parsers/      # File type parsers
│   │   ├── analysis/     # Analysis engines
│   │   ├── service_rag/  # Legal knowledge RAG
│   │   ├── user_rag/     # Case-specific RAG
│   │   └── storage/      # DynamoDB, Qdrant storage
│   └── tests/
│
├── frontend/             # Next.js dashboard (P)
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities, API clients
│   │   └── types/        # TypeScript types
│   └── tests/
│
├── docs/                 # Design documents
│   ├── specs/            # PRD, Architecture, API Spec
│   ├── guides/           # Development guides
│   └── archive/          # Archive
│
├── .github/              # GitHub config
│   ├── workflows/        # CI/CD
│   └── PULL_REQUEST_TEMPLATE.md
│
├── CLAUDE.md             # AI agent rules
├── CONTRIBUTING.md       # → symlink to docs/CONTRIBUTING.md
└── README.md             # Project introduction
```

---

# Git Cheat Sheet

### Check current branch
```sh
git branch
```

### Move to dev
```sh
git checkout dev
```

### Get latest dev code
```sh
git pull origin dev
```

### Commit changes & push to dev
```sh
git add .
git commit -m "feat: ..."
git push origin dev
```

### Create PR
- GitHub web UI → **Compare & pull request** → Confirm `base: main`, `compare: dev` → **Create PR**

---

# Team Agreement

- **main never breaks.**
- **dev is space to freely break and fix.**
- **PR is not formality, it's the "last safety net protecting the service".**
- **AI is a tool to accelerate development, not an entity that takes responsibility.**

Within keeping these four, the rest is decided **flexibly**.

---

**END OF CONTRIBUTING.md**
