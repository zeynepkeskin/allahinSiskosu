# AllahinSiskosu.com Product Requirements Document (PRD)

## Overview

**AllahinSiskosu.com** is an AI-powered calorie and nutrition tracking web application built with **Next.js**, **Vercel**, **Supabase**, and an LLM API.

Users describe what they ate in natural language. The AI converts that description into structured nutrition data (JSON). The application stores the meal, visualizes progress, tracks calorie goals, and recommends whether a user should eat a particular food based on their remaining calorie budget.

---

# Goals

- Make calorie tracking effortless.
- Use AI to parse messy food descriptions.
- Track calories and macronutrients over time.
- Recommend portions based on user goals.
- Provide charts and actionable nutrition insights.

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

---

# Main Pages

## Dashboard

Displays:

- Today's calories
- Remaining calories
- Macro summary
- Weekly calorie chart
- Weight trend
- Today's meals
- Quick add meal

## Add Meal

Workflow:

1. User enters free-form meal text.
2. AI returns structured nutrition JSON.
3. Preview appears.
4. User confirms.
5. Meal is saved.

## Recommendations

User enters food they want to eat.

Application displays:

- Calories
- Macros
- Remaining calories
- Recommendation:
  - Eat it
  - Eat half
  - Skip
- Buttons:
  - I Ate This
  - Delete

## Progress

Charts:

- Calories
- Weight
- Protein
- Fat
- Carbs

## Profile

User information and calculated goals.

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
- Add Meal
- Recommendations
- Progress
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

- AI meal parser

## Phase 5

- Save/edit/delete meals

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
- Meal photo recognition
- Water tracker
- Exercise tracker
- Meal planner
- Grocery lists
- Favorite meals
- Social features

---

# Suggested Folder Structure

```text
app/
├── (auth)
├── dashboard
├── meals
├── recommendations
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

- Fast meal logging (<30 seconds)
- Accurate AI parsing
- Clear progress visualization
- Helpful recommendations
- Mobile-friendly experience
