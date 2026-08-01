# DEVELOPMENT-PLAN.md

# AllahinSiskosu.com Development Plan

## Guiding Principles

- Build one complete, testable feature at a time.
- AI is only responsible for understanding food descriptions and generating nutrition summaries.
- All calculations (goals, calorie budgets, recommendations, analytics) are deterministic application logic.
- Never allow AI to write directly to the database.
- Validate every AI response with Zod before using it.

---

# Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Vercel
- Supabase (Database + Auth + Storage)
- OpenAI-compatible API
- TanStack Query
- React Hook Form
- Zod
- Recharts

---

# Recommended Folder Structure

```text
app/
├── (auth)
│   ├── login
│   └── register
├── dashboard
├── meals
├── recommendations
├── progress
├── profile
├── settings
├── api
│   ├── ai
│   ├── meals
│   ├── profile
│   └── recommendations
├── components
│   ├── ui
│   ├── dashboard
│   ├── meals
│   ├── charts
│   └── forms
├── hooks
├── lib
│   ├── ai.ts
│   ├── calculations.ts
│   ├── nutrition.ts
│   └── supabase.ts
├── schemas
├── types
└── utils
```

---

# Phase 0 — Project Setup

Goal:
Working project with authentication.

Tasks

- [x] Create Next.js project
- [x] Configure TypeScript
- [x] Configure Tailwind
- [x] Configure ESLint + Prettier
- [x] Initialize Git
- [x] Connect Vercel
- [x] Create Supabase project
- [x] Configure environment variables
- [x] Install dependencies
- [x] Configure Supabase Auth
- [x] Email sign up
- [x] Email login
- [x] Protected routes

Deliverable

- Users can create accounts and log in.

---

# Phase 1 — Database

Tables

## profiles

- id
- username
- email
- height_cm
- weight_kg
- target_weight
- birthday
- gender
- activity_level
- goal
- daily_calorie_goal

## meals

- id
- profile_id
- meal_name
- meal_time
- total_calories
- protein
- carbs
- fat
- fiber
- created_at

## meal_items

- id
- meal_id
- food_name
- serving
- calories
- protein
- carbs
- fat
- fiber
- sugar
- confidence

## daily_weights

- id
- profile_id
- weight
- date

## exercise_plans

- id
- profile_id
- day_of_week
- is_rest_day
- created_at
- updated_at

## plan_exercises

- id
- exercise_plan_id
- name
- sets
- reps
- weight_lb
- weight_display
- rest_seconds
- sort_order
- created_at
- updated_at

## workout_sessions

- id
- profile_id
- exercise_plan_id
- started_at
- completed_at
- status
- created_at

## workout_session_exercises

- id
- workout_session_id
- plan_exercise_id
- exercise_name
- planned_sets
- planned_reps
- completed_sets
- weight_display
- rest_seconds
- sort_order

Tasks

- [x] Create migrations
- [x] Enable Row Level Security
- [x] Create RLS policies
- [ ] Apply the migration to Supabase and test CRUD

Deliverable

Migration ready to apply. The final checkbox requires applying it to the linked Supabase project.

---

# Phase 2 — UI Skeleton

Pages

- Login
- Register
- Dashboard
- Add Meal
- Recommendations
- Progress
- Profile
- Settings

Reusable Components

- Navbar
- Sidebar
- Button
- Card
- Table
- Progress Bar
- Charts
- Modal
- Toast
- Spinner

Deliverable

Complete navigation and page layout.

---

# Phase 3 — User Onboarding

Collect

- Height
- Weight
- Birthday
- Gender
- Activity Level
- Goal
- Target Weight

Calculate

- BMI
- BMR
- TDEE
- Daily Calories

Store profile.

Deliverable

Personalized calorie target.

Status: [x] Implemented — profile details are validated, saved through RLS, and used to calculate BMI, BMR, TDEE, and a daily calorie target.

---

# Phase 4 — AI Meal Parser

Workflow

User text

↓

API Route

↓

AI

↓

Validated JSON

↓

Preview

↓

Save button

Tasks

- [x] API endpoint
- [x] System prompt
- [x] JSON schema
- [x] Zod validation
- [x] Error handling
- [x] Loading state
- [x] Nutrition preview

Deliverable

Natural language → structured meal.

Status: [x] Implemented. Set `OPENAI_API_KEY` in the server environment to enable live analysis.

---

# Phase 5 — Meal Management

Tasks

- [x] Save meal
- [x] Save meal items
- [x] Fetch meals
- [x] Edit meals
- [x] Delete meals
- [x] Confirm deletion

Deliverable

Persistent meal history.

Status: [x] Implemented — authenticated CRUD endpoints persist meals and items through RLS; the meal log supports saving parsed meals, browsing history, renaming meals, and confirmed deletion.

---

# Phase 6 — Dashboard

Widgets

- Today's Calories
- Remaining Calories
- Protein
- Carbs
- Fat
- Weekly Average

Charts

- Calories
- Weight
- Protein

Tables

- Today's Meals
- Recent Meals

Deliverable

Useful dashboard.

Status: [x] Implemented — the dashboard now summarizes today’s meals and macros, calorie budget, weekly average, a seven-day calorie chart, and today’s meal list from persisted Supabase data.

---

# Phase 7 — Recommendation Engine

Workflow

User enters food

↓

AI estimates nutrition

↓

Application compares with remaining calories

↓

Recommendation

Buttons

- I Ate This
- Delete

Rules

- Fits budget → Recommend
- Slightly over → Suggest reduced serving
- Far over → Suggest alternative or skip

Deliverable

Nutrition assistant.

Status: [x] Implemented — food descriptions use the validated meal estimator, while deterministic calorie-budget rules recommend the full serving, a reduced portion, or a lighter alternative. Users can save a checked food to today’s meal log or discard it.

---

# Phase 8 — Weight Tracking

Tasks

- Log weight
- Edit entries
- Delete entries
- Weekly graph
- Monthly graph

Deliverable

Weight history.

---

# Phase 8 status

Status: [x] Implemented — authenticated weight entries can be logged, updated, and deleted; the Progress page includes weekly and monthly trend views plus complete history.

---

# Phase 9 — Analytics

Metrics

- Daily calories
- Weekly average
- Monthly average
- Protein trends
- Carb trends
- Fat trends
- Highest calorie day
- Lowest calorie day
- Goal adherence

Charts

- Line
- Bar
- Pie

Deliverable

Nutrition insights.

Status: [x] Implemented — the Analytics page provides daily, weekly, and monthly calorie metrics; macro trends and distribution; a seven-day calorie chart; highest/lowest calorie days; and calorie-goal adherence from the last 30 days of saved meals.

---

# Phase 10 — Polish

- [x] Responsive UI
- [x] Mobile support
- [x] Dark mode
- [x] Skeleton loading
- [x] Animations
- [x] Better typography
- [x] Empty states
- [x] Error pages
- [x] Accessibility improvements

Deliverable

Production-quality UI.

Status: [x] Implemented — responsive navigation and layouts, persisted light/dark themes, shared loading skeletons, error recovery, motion-safe transitions, consistent typography, empty states, and stronger keyboard/focus support are now available across the app.

---

# Phase 11 — AI Nutrition Coach

- [x] Daily summary
- [x] Weekly summary
- [x] Nutrition strengths
- [x] Improvement suggestions
- [x] Macro analysis

Deliverable

AI-powered coaching.

Status: [x] Implemented — an authenticated AI Coach page generates validated, supportive daily and weekly nutrition insights from the last seven days of saved meals. The coach reports strengths, practical improvements, and macro analysis without writing to the database.

---

# Phase 12 — Future Features

- Barcode scanner
- Meal photo recognition
- Water tracker
- Meal planner
- Grocery lists
- Favorite meals
- Saved templates
- Social sharing

---

# Phase 13 — Exercises

Goal:
Let users build a weekly strength-training plan and complete a guided workout
with set, rest, audio, and speech cues.

Pages

- Exercises: seven-day weekly plan, with each day displayed as REST or an
  ordered exercise list.
- Exercise editor: add, edit, delete, and reorder exercises for a day; each
  exercise captures name, sets, reps, weight, optional display context (such
  as “25 lb per hand”), and rest duration.
- Workout runner (`/exercises/[day]`): a distraction-free, mobile-friendly
  flow for the selected day’s workout.

Workout runner flow

1. User selects **Start** from a non-REST day.
2. Create a workout session snapshot so later plan edits do not alter history.
3. Announce the exercise and prescription, e.g. “Bicep Curls with 25 pounds.
   Five sets of ten reps.”
4. Announce “First set” (then ordinal set names), play three short beeps and
   one long beep, and show the active-set controls.
5. When the user marks the set complete, announce completion and start the
   configured rest timer, e.g. “Completed. Now rest for 45 seconds.”
6. At rest completion, begin the next set with the same announcement and cue.
7. Continue through every exercise; save completed-set progress throughout and
   mark the session completed at the end.

Controls and behavior

- Start, pause, resume, skip rest, repeat set, end workout, and complete set.
- Audio cues use the Web Audio API; spoken prompts use the Web Speech API.
- Provide a mute control and visual/text alternatives for every sound or voice
  cue. Audio must start only after a user interaction.
- Timers remain accurate after browser throttling by calculating remaining time
  from timestamps rather than decrementing state alone.
- Support REST days with a clear rest-state UI and no Start action.
- Confirm ending an in-progress workout and record it as `ended_early`.

Tasks

- [x] Create the exercise-plan and workout-session migration.
- [x] Enable RLS and create profile-owned CRUD policies for all exercise tables.
- [x] Add strict Zod schemas, TypeScript types, and validation for plans,
  exercises, and session progress.
- [x] Implement authenticated plan CRUD API routes/server actions.
- [x] Build the seven-day weekly plan and exercise editor, including REST days
  and exercise ordering.
- [x] Build the workout-session creation and progress persistence flow.
- [x] Build the workout runner timer, set/rest state machine, and controls.
- [x] Add accessible beep and speech-cue utilities with mute support.
- [x] Add completed/ended-early session states.
- [x] Add navigation entry, empty states, loading states, and error handling.
- [ ] Apply the migration to Supabase, then test RLS isolation and session
  persistence against the linked project.

Deliverable

Users can plan their week as REST days or strength workouts and complete a
guided, saved workout with timed rests, cues, and history.

Status: [x] Implemented in the application. Apply the new Supabase migration
before using the feature in a deployed environment.

---

# Coding Standards

- Strict TypeScript
- Reusable components
- Server actions/API separation
- No duplicated business logic
- Validate external data
- Small focused commits
- Feature branches
- Environment variables only for secrets

---

# Testing Checklist

Each phase should include

- Functional testing
- Mobile testing
- Error handling
- Empty states
- Loading states
- Authentication checks
- Database validation
- Responsive layout testing

---

# Definition of Done

A phase is complete when:

- Feature works end-to-end
- UI is responsive
- Error handling exists
- Types are complete
- Database integration works
- No console errors
- Ready to deploy to Vercel
