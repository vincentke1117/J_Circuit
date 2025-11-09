# J-Circuit Repository Agent Guide

## Scope
These instructions apply to the entire repository unless overridden by nested `AGENTS.md` files.

## General Workflow
- Follow the product requirements defined in `task.md` and the v1.2 PRD when implementing features.
- Keep the project split into a web front end (React 18 with React Flow and Plotly/ECharts) and a Julia backend (Genie.jl or HTTP.jl).
- Favor type-safe, declarative code and avoid silent failure paths. Surface validation errors explicitly in JSON responses as specified by the PRD.

## Code Style
- Use TypeScript for the React frontend. Organize source under `web/` with feature-based folders (`canvas`, `simulation`, `ui`, etc.).
- Use Julia modules under `server/` with `src/` for logic and `test/` for automated checks. Keep functions pure where possible; isolate side effects at the HTTP layer.
- Document public APIs with concise module-level docstrings.

## Testing & Tooling
- Provide npm scripts for linting (`eslint`), type checking (`tsc`), and frontend unit tests (`vitest` or `jest`).
- Provide Julia `Pkg` environment with tests runnable via `julia --project=server -e 'using Pkg; Pkg.test()'`.
- Ensure integration between front end and back end is covered by at least one automated contract test once both halves exist.

## PR & Commit Guidance
- Keep commits focused and reference the related checklist items from `task.md`.
- Update documentation (`README.md`, `docs/`) whenever behavior or commands change.
- Before submitting a PR, run available tests and include their status in the summary.

## UX Notes
- Canvas interactions must respect the electrical rules from the PRD (ground requirement, no dangling nodes, etc.).
- Simulation responses must follow the standardized JSON envelope with `status`, `message`, and `data` keys.

