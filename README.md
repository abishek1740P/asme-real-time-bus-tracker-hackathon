# ASME Real-Time Bus Tracker

A full-stack real-time bus tracking application built with Node.js (Express) backend and a Next.js frontend. This README provides an overview of the project structure and guidance for contributors.

---

## Project Structure

- `backend/` - Express server, API controllers, models, routes, and socket logic.
  - `app.js`, `server.js` - server entry points
  - `config/` - database and configuration helpers
  - `controllers/` - request handlers for resources (bus, user, ticket, etc.)
  - `models/` - Mongoose models
  - `routes/` - Express route definitions
  - `middleware/` - auth and role middleware
  - `sockets/` - socket.io handlers (location updates, real-time events)
  - `utils/` - helper utilities (firebase, geo utils, notifications)

- `frontend/` - Next.js application (app router), components, pages, and client-side libraries.
  - `src/app/` - Next.js app routes and layouts
  - `src/components/` - reusable UI components
  - `src/lib/` - client libraries (API, sockets, Firebase)
  - `public/` - static assets and service worker

- `documentation.md` - project-level documentation and notes

---

## Getting Started

Prerequisites:
- Node.js 18+ and npm or yarn
- MongoDB instance (local or cloud)

1. Clone the repository

```bash
git clone <repo-url>
cd asme-real-time-bus-tracker-hackathon
```

2. Backend setup

```bash
cd backend
npm install
# create .env or set environment variables as needed (MONGO_URI, JWT_SECRET, etc.)
node server.js
```

3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

---

## Contributing

We welcome contributions from everyone. Please follow the guidelines below to help us keep the project healthy and maintainable.

- **Code of Conduct**: Be respectful and constructive. Report abusive behavior by opening an issue.
- **Issues**: Before opening an issue, search existing issues and the `documentation.md` for related information. For bug reports, include steps to reproduce, expected behavior, and screenshots if applicable.
- **Feature Requests**: Describe the problem, proposed solution, and any alternatives considered.

### Branching & PR workflow

- Fork the repository and create a feature branch from `master`:

```bash
git checkout -b feat/short-description
```

- Keep changes focused and scoped to a single problem or feature.
- Write clear commit messages and use conventional commits when possible.
- Push branch to your fork and open a Pull Request against `master` on the main repo.
- In the PR description, include what you changed, why, and any migration or configuration steps.
- Address review comments and keep the branch up-to-date with `master`.

### PR review checklist

- Tests (if applicable) pass locally.
- New code follows existing style and patterns.
- `README.md` or `documentation.md` updated if the change affects setup or usage.
- No sensitive information (API keys, service account files) committed.

### Coding Guidelines

- Follow existing project conventions and structure.
- Keep functions small and focused; break large components into smaller ones.
- Add unit tests for new backend logic where practical.

---

## Reporting Security Issues

If you discover a security vulnerability, please do not open a public issue. Instead, contact the maintainers privately with details and reproduction steps.

---

## License

This project uses the default repository license (see GitHub repo settings). If you want to add an explicit license file, open a PR.

---

Thank you for contributing! If you'd like, I can also add a `CONTRIBUTING.md` file or update `documentation.md` with more detailed setup steps.
