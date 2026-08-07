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
- exercises (JSON array: id, name, sets, reps, weight_lb, rest_seconds, set_duration_seconds, sort_order)
- created_at
- updated_at

## workout_sessions

- id
- exercise_plan_id
- started_at
- completed_at
- status
- exercises (JSON array: id, name, planned_sets, planned_reps, completed_sets, weight_lb, rest_seconds, sort_order)
- created_at

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
- [x] Choose an eat date when saving and change it later
- [x] Delete meals
- [x] Confirm deletion

Deliverable

Persistent meal history.

Status: [x] Implemented — authenticated CRUD endpoints persist meals and items through RLS; the meal log supports saving parsed meals for a chosen date, browsing history, changing an eat's date, renaming meals, and confirmed deletion.

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
  exercise captures name, sets, reps, weight, and rest duration.
- Workout runner (`/exercises/[day]`): a distraction-free, mobile-friendly
  flow for the selected day’s workout.

Workout runner flow

1. User selects **Start** from a planned workout day.
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

- Start, pause, resume, skip rest, end workout, and complete set.
- Audio cues use the Web Audio API; spoken prompts use the Web Speech API.
- Provide a mute control and visual/text alternatives for every sound or voice
  cue. Audio must start only after a user interaction.
- Timers remain accurate after browser throttling by calculating remaining time
  from timestamps rather than decrementing state alone.
- Confirm ending an in-progress workout and record it as `ended_early`.

Tasks

- [x] Create the exercise-plan and workout-session migration.
- [x] Enable RLS and create profile-owned CRUD policies for all exercise tables.
- [x] Add strict Zod schemas, TypeScript types, and validation for plans,
      exercises, and session progress.
- [x] Implement authenticated plan CRUD API routes/server actions.
- [x] Build the seven-day weekly plan and exercise editor.
- [x] Build the workout-session creation and progress persistence flow.
- [x] Build the workout runner timer, set/rest state machine, and controls.
- [x] Add accessible beep and speech-cue utilities with mute support.
- [x] Add completed/ended-early session states.
- [x] Add navigation entry, empty states, loading states, and error handling.
- [ ] Apply the migration to Supabase, then test RLS isolation and session
      persistence against the linked project.

Deliverable

Users can plan strength workouts throughout the week and complete a guided,
saved workout with timed rests, cues, and history.

Status: [x] Implemented in the application. Apply the new Supabase migration
before using the feature in a deployed environment.

---

## Phase 14 — Exercise-Aware Health Views

Goal:
Make completed strength-training data a first-class part of the product without
estimating calories burned from a plan alone or changing the existing intake
calorie budget.

Scope and calculation rules

- Build a shared server-side workout-metrics utility from `workout_sessions`
  and their embedded `exercises` JSON arrays.
- Count only `completed` sessions in completion, consistency, set, rep, volume,
  and average-duration metrics. Keep `in_progress` and `ended_early` sessions
  visible in history where relevant.
- Calculate duration from `started_at` and `completed_at`.
- Calculate loaded volume as completed sets × planned reps × logged weight;
  bodyweight exercises contribute to completed sets and reps but not volume.
- Group sessions by the user's local calendar day consistently with meal and
  weight views.
- Keep the profile-derived `daily_calorie_goal` as an intake target. Do not add
  estimated exercise calories to remaining calories or food recommendations.

Tasks

- [x] Add reusable workout types and date helpers.
- [ ] Add aggregation tests.
- [x] Add dashboard workout context: today's plan/rest state, completion or
      in-progress status, a start/view action, weekly completed-workout days, and a
      training-consistency summary.
- [x] Expand Analytics from nutrition-only to nutrition-and-training insights:
      7- and 30-day completed workouts, workout days, planned-day consistency,
      completed sets, reps, loaded volume, average duration, and a weekly
      completion visualization alongside calorie trends.
- [x] Add a training summary to Progress next to weight trends, including the
      latest completed workout and current-week metrics without implying causation.
- [x] Add today's workout context and an exercise link to Recommendations and
      the meal-log workspace; preserve intake-only recommendation logic.
- [x] Update Profile help text to explain that activity level is a deliberate
      TDEE estimate and show recent workout frequency only as optional context.
- [x] Update the Analytics empty state for users who have meal data but no
      workout data, and the reverse.
- [ ] Add remaining loading and error states for mixed meal/workout data.
- [ ] Add automated coverage for local-day boundaries, bodyweight exercises,
      missing completion timestamps, mobile layouts, and RLS-scoped data reads.

Deliverable

Dashboard, analytics, progress, meal-related pages, and profile treat completed
strength workouts as relevant health context while calorie targets remain
consistent and auditable.

Status: [ ] Core implementation complete — completed strength-workout metrics
now appear across the health views and meal-related context while calorie
budgets stay intake-only. Automated coverage and remaining mixed-data UI states
are still pending.

---

## Phase 15 — Nutrition + Training Coach

Goal:
Expand the nutrition-only coach into a supportive coach that reflects both
logged meals and completed workouts from the previous seven days.

Tasks

- [x] Move the deterministic food-recommendation workflow into a separate
      "Can I eat this?" panel on Coach and retire the standalone navigation item.
- [x] Rename coach page and component copy from nutrition-only language to
      nutrition-and-training language.
- [x] Extend the authenticated coach API to fetch and aggregate completed
      workout data alongside meals and profile goal data.
- [x] Define and validate an expanded strict response schema with a training
      summary and integrated next steps, while retaining daily summary, weekly
      summary, strengths, improvements, and macro analysis.
- [x] Update the system prompt to use only supplied meal and workout data,
      identify limited logging, avoid medical advice and shame, and never invent
      activity, calorie expenditure, or causal weight claims.
- [x] Update the coach panel to render the training summary and explain the
      educational limits of the generated insights.
- [ ] Add automated coverage for no-meal, no-workout, sparse-data,
      completed-workout, and
      ended-early-workout scenarios.

Deliverable

Users receive validated, practical nutrition-and-training insights grounded
only in their saved meals and completed workout sessions.

Status: [ ] Core implementation complete — the coach now supports meal-only,
workout-only, and mixed logged data. Automated scenario coverage is pending.

---

## Phase 16 — Optional Explicit Activity Expenditure

Goal:
If product direction requires exercise to affect calorie recommendations, add
an explicit and auditable activity-expenditure model rather than deriving burn
from strength-plan prescriptions.

Tasks

- [ ] Decide and document whether the product should show intake-only targets,
      net balance, or both; define the user-facing terminology.
- [ ] Create an activity-log migration with activity type, date/time, duration,
      intensity, estimated calories, source, and confidence/estimation method.
- [ ] Add RLS policies, validation, CRUD APIs, and a clear manual-entry UI.
- [ ] Separate intake goal from net balance in dashboard, recommendations, and
      analytics; make any adjustment optional and clearly labelled.
- [ ] Add safeguards against double counting activity already represented by
      the user's profile activity-level TDEE estimate.
- [ ] Test estimates, manual edits, deleted activities, time zones, and all
      recommendation boundary cases.

Deliverable

Users can optionally log explicit activity expenditure and understand exactly
when it affects a displayed net balance or food recommendation.

---

## Phase 17 — Exercise Visual Guidance

Goal:
Make exercise selection easier to understand and give users a compact visual
form reference during a started workout, without adding a runtime third-party
image dependency.

Visual design and placement

- **Exercise planner:** A selected known exercise shows a compact muscle-map
  preview immediately below its name selector. The preview includes front,
  back, or both body views as required; primary muscles use the app's emerald
  accent and secondary muscles use a clearly distinct lighter treatment. A
  text list names the muscle groups so the visual is not the only source of
  information. No map is shown before a selection. Custom/unmapped exercises
  show a neutral unavailable state and do not receive inferred targeting.
- **Exercise selection:** Replace the native exercise dropdown with a reusable
  read-only input and browse button. Its modal flow selects a group first,
  then an exercise, then previews the candidate before the user explicitly
  confirms selection. The movement start/finish frame alternates every second;
  when both anatomy views apply, the muscle map shows them side by side.
- **Workout runner:** After **Begin workout** succeeds, render the current
  exercise's two labelled stills, **Start** and **Finish**, above the active
  set or rest controls. Keep the pair visible while resting and replace it as
  the active exercise changes. Do not add autoplaying video, controls, or
  extra network requests during a workout.
- **Responsive/accessibility:** On wide screens the frames may sit side by
  side; on narrow screens they stack or use a two-column layout with legible
  labels. Every frame has exercise- and position-specific alt text, images
  have explicit dimensions to prevent layout shift, color is never the sole
  indication of muscle targeting, and the unavailable state is announced as
  text.

Catalog and asset strategy

- Create a typed, versioned `exercise-catalog` keyed by the exact current
  exercise names. Each entry contains display name, category, primary muscles,
  secondary muscles, applicable body views, and local start/end asset paths.
- Use a reviewable SVG body-map component/layers for muscle highlighting;
  map catalog muscle identifiers to those layers rather than maintaining seven
  unrelated bitmap silhouettes. Category-level targets are a fallback only
  for category overviews, never a replacement for per-exercise mapping.
- Source two-frame exercise demonstrations from a dataset with documented
  reusable rights (the proposed Free Exercise DB is Unlicense/public-domain),
  download only reviewed frames into `public/exercises/`, and keep a small
  provenance manifest with original exercise identifier, source URL, license,
  and import date. Do not hotlink GitHub/CDN files in production.
- Review aliases and variations manually (for example, the app's "Dumbbell
  Bicep Curl" vs. a source's "Dumbbell Biceps Curl"). An asset may be used
  only after its exercise and target muscles are verified. Keep a visible
  fallback for the rare name with no safe match.
- This is presentation/catalog data, not user data: do not add muscle maps or
  asset URLs to exercise-plan JSON entries or workout-session snapshots in the first
  release. The runner resolves a stored exercise name through the catalog;
  document a future snapshot strategy if catalog versions ever need historical
  rendering guarantees.

Tasks

- [x] Audit all current exercise names and create the typed catalog plus alias
      table; record primary/secondary-muscle decisions for all supported names.
- [x] Select and document the reusable asset source; download and optimize the
      reviewed two-frame pairs locally, with a provenance/license manifest.
- [x] Add the layered SVG body-map component, muscle-to-layer mapping, text
      legend, and a non-color accessibility treatment.
- [x] Integrate the selected-exercise muscle-map preview into every planner
      row, including loading, unselected, custom, and unavailable states.
- [x] Integrate the two-frame current-exercise demonstration into the workout
      runner only after a workout has started; maintain it across set/rest and
      exercise transitions.
- [x] Add image sizing, responsive styling, reduced-data-friendly static
      delivery, and graceful missing-asset handling.
- [ ] Add tests for catalog coverage, aliases, body-view/muscle mappings,
      unselected and custom exercises, runner transitions, alt text, and mobile
      layout. Manually review form accuracy before release.

Deliverable

Known exercises show a precise muscle-target SVG while being planned and a
locally served, labelled two-frame demonstration during a started workout.
Custom or unmapped exercises remain fully usable with an honest visual-guidance
fallback.

Status: [ ] Core implementation complete — all supported exercises have a
reviewed muscle map and 46 have locally served two-frame demonstrations. Burpee
uses the explicit unavailable state until a matching, reusable pair is sourced;
automated and manual form-accuracy coverage remains pending.

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
