# AllahinSiskosu PRD

## Overview
AI-powered calorie and nutrition tracker built with Next.js, Vercel, Supabase, and OpenAI.

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres)
- Vercel
- OpenAI API
- Recharts
- Zod

## Core Features
- Authentication
- User profile & goals
- AI meal parsing
- Meal history
- Dashboard
- Charts
- Recommendations
- Weight tracking

## User Flow
Register → Complete profile → Add meal → Review AI results → Save → Dashboard → Progress

## Database
profiles, meals, meal_items, daily_weights.

## AI JSON Contract
```json
{
  "meal_name":"Lunch",
  "total_calories":650,
  "protein_g":35,
  "carbs_g":52,
  "fat_g":18,
  "foods":[
    {"name":"Chicken","serving":"150 g","calories":250,"protein_g":30,"carbs_g":0,"fat_g":8}
  ]
}
```

## API
- POST /api/ai/parse-meal
- POST /api/meals
- GET /api/meals
- DELETE /api/meals/:id
- PATCH /api/profile

## MVP
Authentication, AI meal parsing, meal saving, dashboard, recommendations.

## Future
Barcode scanning, photo recognition, water tracking, meal planning.
