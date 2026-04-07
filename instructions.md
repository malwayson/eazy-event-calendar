Create a production-ready React library in TypeScript named @malwayson/eazy-event-calendar.

Goal:
Build an installable calendar library inspired by modern event calendar products, with shadcn-style UI patterns, but structured as a reusable npm package.

Requirements:

- Use React + TypeScript.
- Package the library with tsup.
- Output ESM, CJS, and .d.ts files.
- Keep react and react-dom as peerDependencies.
- Use a modular architecture.
- Expose a clean public API from src/index.ts.
- Follow a headless-first design where business logic is reusable, with optional styled UI components.

Features:

- Calendar views: month, week, day, year, list.
- Event CRUD support.
- Recurring events, multi-day events, all-day events.
- Event search and color filters.
- Keyboard shortcuts and accessible navigation.
- Responsive layout.
- Dark mode friendly styling.
- Optional animations with framer-motion.
- API hooks for fetchEvents, onCreate, onUpdate, onDelete.

Tech choices:

- date-fns for date utilities
- Radix primitives where useful
- Tailwind-compatible class structure
- class-variance-authority for variants
- react-hook-form + zod for forms
- optional command palette and dialog patterns inspired by shadcn/ui

Project structure:
src/
components/
hooks/
lib/
styles/
types/
index.ts

Generate:

1. package.json
2. tsup.config.ts
3. tsconfig.json
4. src/index.ts
5. core shared types
6. a base EventCalendar component
7. one working MonthView
8. one hook for navigation
9. one CSS file with minimal library-safe styles
10. example usage in a demo snippet

Important constraints:

- Do not hardcode app-specific business logic.
- Keep styles override-friendly.
- Export types for all public props.
- Use controlled/uncontrolled patterns where appropriate.
- Avoid depending on Next.js-specific APIs.
- Make the library usable in Vite, Next.js, and CRA-like environments.
