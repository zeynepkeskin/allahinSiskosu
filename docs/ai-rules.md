# AI Rules

Always read PRD.md and development-plan.md before making changes.

General Rules

- Use TypeScript everywhere.
- Use Next.js App Router.
- Never use `any`.
- Validate all AI responses with Zod.
- Use Supabase for authentication and database.
- Never expose OpenAI API keys to the client.
- API routes perform all AI calls.

UI

- Tailwind CSS
- Mobile-first
- Components should be reusable.
- One component per file.

Database

- Never duplicate data.
- Always use foreign keys.
- Use UUID primary keys.

Code

- Small functions.
- Clear names.
- Add comments only when necessary.

Before finishing

- Run lint.
- Ensure TypeScript has no errors.
- Keep files under ~300 lines when practical.