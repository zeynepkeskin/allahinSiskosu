# AllahinSiskosu.com Product Requirements Document (PRD)

## Overview

**AllahinSiskosu.com** is an AI-powered nutrition and strength-training tracking web application built with **Next.js**, **Vercel**, **Supabase**, and an LLM API.

Users describe what they ate in natural language. The AI converts that description into structured nutrition data (JSON). The application stores eats and guided strength-workout sessions, visualizes nutrition and training progress, tracks calorie goals, and lets users check whether a particular food fits their remaining calorie budget from Coach.

---

# Goals

- Make calorie tracking effortless.
- Use AI to parse messy food descriptions.
- Track calories and macronutrients over time.
- Make planned and completed strength training visible alongside nutrition data.
- Show training consistency, completed sets, reps, loaded volume, and workout duration.
- Recommend portions based on user goals.
- Provide charts and actionable nutrition-and-training insights.

---

# Tech Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Hosting: Vercel
- Backend/API: Next.js API Routes
- Database/Auth: Supabase
- AI: OpenAI-compatible API
- Charts: Recharts
- Validation: Zod
- Forms: React Hook Form
- Data Fetching: TanStack Query

---

# High-Level Architecture

```text
User
  ↓
Next.js UI
  ↓
API Route
  ├── AI → Structured JSON
  └── Supabase → Storage/Auth
```

AI never writes directly to the database.

---

# Core Features

## Authentication

- Email authentication
- Protected dashboard
- Profile management

## User Profile

Collect:

- Height
- Weight
- Target Weight
- Birthday
- Gender
- Activity Level
- Goal (Lose / Maintain / Gain)

Automatically calculate:

- BMI
- BMR
- TDEE
- Daily Calorie Goal

Stores notification preferences used for evening logging reminders, including
whether reminders are enabled, the user-selected local reminder time, and the
user's IANA timezone.

## Notifications

Users can opt into an editable, whole-hour evening reminder (default: 8:00 PM
local time).
At the selected time, the app sends one Web Push notification when the user has
not logged an eat that day and/or has not completed a workout scheduled for a
non-REST day. A planned REST day never triggers a workout reminder.

Notifications use the browser Push API and a service worker, so they can be
delivered when the app tab is inactive or closed, subject to device and browser
push support. Notification permission is requested only after the user enables
the setting. Each browser/device keeps its own push subscription; a user may
have more than one active subscription.

A scheduled server-side job evaluates reminders using the stored timezone and
records the daily delivery event before sending. This prevents duplicate
reminders during overlapping scheduled runs. Expired subscriptions are removed.

---

# Main Pages

## Dashboard

Displays:

- Today's calories
- Remaining calories
- Macro summary
- Today's planned workout, rest-day state, or workout-completion state
- Weekly calorie and workout-completion view
- Training consistency summary
- Weight trend
- Today's eats
- Quick add eat
- Quick action to start or view today's workout

## Add Eat

Workflow:

1. User enters free-form eat text.
2. AI returns structured nutrition JSON.
3. Preview appears.
4. User confirms.
5. Eat is saved.

## Progress

Charts:

- Calories
- Weight
- Protein
- Fat
- Carbs

Displays a weekly training summary next to weight trends, including completed
workouts, training volume where available, and the latest completed workout.
The product must not imply that a workout caused a weight change.

Saving or editing a weight entry updates the profile's current weight from the
latest dated entry and recalculates the daily calorie goal when the rest of the
profile details are complete.

## Analytics

Analytics covers nutrition and completed strength workouts over 7- and 30-day
periods. It displays:

- Calorie and macro trends
- Calorie-goal adherence based on intake only
- Completed workouts and workout days
- Training consistency against planned non-rest days
- Completed sets, reps, loaded volume where weight is logged, and average
  completed-workout duration
- A weekly workout-completion visualization alongside the calorie trend

Incomplete and ended-early workouts remain visible in history but are not
counted as completed-workout metrics.

## Profile

User information and calculated goals.

## Exercises

Users create a reusable weekly strength-training plan, organized by day of the
week. Each day is either marked **REST** or contains an ordered list of
exercises. An exercise includes its name, set count, reps per set, weight, and
rest duration. For example: `Bicep Curls — 5 sets × 10 reps at 50 lb`.

The weekly view shows every day and its planned workout at a glance. Users can
add, edit, reorder, or remove exercises and can mark any day as REST.

Selecting **Start** opens a focused workout-runner page for that day's plan.
The runner guides the user through every set and rest interval with a visible
timer, progress indicator, audio beeps, and optional spoken prompts. Before an
exercise it announces, for example: “Bicep Curls with 25 pounds. Five sets of
ten reps.” It then announces each set, plays a three-short-beep and one-long-
beep start cue, announces completion, and counts down the configured rest
period (for example, “Completed. Now rest for 45 seconds.”) before the next
set. Users can pause, resume,
The start cue plays sequentially as three short beeps followed by a one-second
long beep. The final three seconds of rest each play one short beep. Starting
a new cue, muting, or ending a workout cancels pending speech and sounds.
After the opening countdown, the runner starts one randomly selected looping
soundtrack from the bundled tracks. Music has its own on/off control and stops
when the workout ends, a set is completed, or a spoken or beep cue begins.

Users can skip rests or end a workout. Completing or ending a workout records its
result in the workout history.

Workout sessions are first-class data throughout the product. The application
derives training metrics from completed sessions and their completed-set
snapshots. It does not infer calories burned from strength-plan data alone.

### Exercise visuals

Exercise guidance has two complementary, static visual treatments:

- **Planner muscle map:** When a user selects a known exercise in the exercise
  editor, they browse an exercise library by group and preview a candidate
  before confirming it. The preview alternates its two movement frames every
  second and shows all applicable body views side by side. On confirm,
  show a compact, accessible human-body SVG directly below that row's
  selector. Highlight primary muscles in emerald and secondary muscles in a
  lighter shade, show the relevant front and/or back view, and name the
  highlighted muscles in text. Before selection, show no anatomy image; for a
  custom exercise with no catalog match, show an honest unavailable message.
- **Workout demonstration:** Once the user starts a workout, show the active
  exercise's two still frames (start and finish) above the active-set/rest
  controls. The frames must be labelled, have descriptive alt text, preserve
  aspect ratio, and work on small screens. They remain visible during rest;
  they are not required on the pre-start screen.

Visuals are educational form references, not a substitute for professional
coaching or medical advice. The product must use a reviewed exercise catalog
that maps each supported exercise name to its primary/secondary muscles and
two demonstration frames. Assets are stored and served by the application,
not hotlinked at runtime. Each imported asset needs recorded source and usage
rights; the product must not use arbitrary web-search images.

## Coach

The coach reviews the last seven days of logged eats and completed workouts.
It provides a daily and weekly nutrition-and-training summary, observable
strengths, practical next steps, and macro analysis. It must use only supplied
data, state when logging is limited, avoid medical claims, and never invent
activity or calorie-burn estimates.

Coach also contains a separate **Can I eat this?** panel. The user enters a
food, sees its estimated calories and macros, and receives a deterministic
full-serving, reduced-serving, or skip recommendation based on today's
remaining intake-calorie budget and macro balance. When carbohydrate intake is
already high, the panel guides the user toward protein-rich choices. Workout
completion never increases the food budget. The user can save the full
estimated serving or discard it.

Coach also offers a **What should I eat now?** panel. It evaluates today's
logged calories and macros, then suggests a satisfying eat idea with estimated
nutrition and an explanation of how it supports the day's remaining balance.

---

# Database

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
- reminder_enabled
- reminder_time
- reminder_time_zone

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

One plan per user and day of week.

## plan_exercises

- id
- exercise_plan_id
- name
- sets
- reps
- weight_lb
- rest_seconds
- set_duration_seconds (optional)
- sort_order
- created_at
- updated_at

`weight_lb` stores the total loaded weight when applicable.
When set, `set_duration_seconds` makes each set timed; the workout runner
automatically begins rest when its countdown ends.

## workout_sessions

- id
- profile_id
- exercise_plan_id
- started_at
- completed_at
- status (completed / ended_early)
- created_at

## workout_session_exercises

- id
- workout_session_id
- plan_exercise_id
- exercise_name
- planned_sets
- planned_reps
- completed_sets
- weight_lb
- rest_seconds
- sort_order

The existing workout tables support the first exercise-aware analytics phase:
workout completion comes from `workout_sessions`; completed sets, reps, and
loaded volume come from `workout_session_exercises`; duration comes from
`started_at` and `completed_at`. Bodyweight exercises count toward sets and
reps but not loaded volume.

## push_subscriptions

- id
- profile_id
- endpoint (unique)
- p256dh
- auth
- created_at
- updated_at

Stores encrypted Web Push subscription credentials per browser/device. It is a
separate table rather than profile columns because subscriptions are not
one-to-one with users and can rotate or expire independently.

## event_log

- id
- profile_id
- event_type
- entity_type
- entity_id
- event_date
- metadata (JSON)
- created_at

Reusable, profile-owned audit log for application events. A `reminder_sent`
event uses `entity_type: profile`, the profile ID as `entity_id`, the user's
local date as `event_date`, and metadata describing the missing eat/workout,
scheduled reminder time, and timezone. A partial unique index permits only one
`reminder_sent` event per profile per local date.

---

# AI JSON Contract

```json
{
  "meal_name": "Lunch",
  "total_calories": 1045,
  "protein_g": 56,
  "carbs_g": 84,
  "fat_g": 44,
  "foods": [
    {
      "name": "Turkey Sandwich",
      "serving": "1 sandwich",
      "calories": 530,
      "protein_g": 34,
      "carbs_g": 45,
      "fat_g": 18
    }
  ]
}
```

Validate all AI responses with Zod before use.

---

# Recommendation Logic

Application logic (not AI):

```
remaining = dailyGoal - caloriesConsumed

if foodCalories <= remaining:
    Recommend eating the full serving
else:
    Recommend a reduced serving or suggest skipping
```

AI may optionally explain *why*.

`dailyGoal` is an intake goal, not a per-session net-calorie budget. A future
exercise-expenditure feature requires explicit activity logs (type, duration,
intensity, estimated calories, source/confidence, and date) before it may
affect food recommendations or show a net balance.

---

# UI

Design principles:

- Clean
- Minimal
- Card-based
- Responsive
- Plenty of whitespace

Navigation:

- Dashboard
- Add Eat
- Coach
- Analytics
- Progress
- Exercises
- Profile
- Settings

Colors:

- Emerald primary
- White cards
- Light gray background
- Orange accent

---

# Development Roadmap

## Phase 0

- Project setup
- Vercel
- Supabase
- Auth

## Phase 1

- Database schema

## Phase 2

- UI skeleton

## Phase 3

- User onboarding
- Goal calculations

## Phase 4

- AI eat parser

## Phase 5

- Save/edit/delete eats

## Phase 6

- Dashboard

## Phase 7

- Food recommendation engine

## Phase 8

- Weight tracking

## Phase 9

- Analytics

## Phase 10

- UI polish

## Phase 11

- AI nutrition coach

## Phase 12

Future enhancements:

- Barcode scanning
- Eat photo recognition
- Water tracker
- Eat planner
- Grocery lists
- Favorite eats
- Social features
- Expanded exercise visual catalog

---

# Suggested Folder Structure

```text
app/
├── (auth)
├── dashboard
├── meals
├── progress
├── profile
├── settings
├── api/
├── components/
├── lib/
├── hooks/
├── schemas/
├── types/
└── utils/
```

---

# Success Metrics

- Fast eat logging (<30 seconds)
- Accurate AI parsing
- Clear progress visualization
- Helpful recommendations
- Mobile-friendly experience
