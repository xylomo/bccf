# Brier Creek Crossfit

## Description

Simple script that provides an API to tell you the schedule for crossfit. Will need some refactoring, but should be enough to get you started.

## Prereqs

NodeJS v8+

## Installing

Run the following commands:

```sh
git clone https://github.com/xylomo/bccf.git
npm install
npm run dev
```

## Routes

GET /api/calendar/today -> Gets todays workouts
GET /api/calendar/<date> -> Gets a workout by a day