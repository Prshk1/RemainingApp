# Remaining

<p align="center">
	<img src="assets/Remaining%20Logo(BlackBG)-02.png" alt="Remaining logo" width="220" />
</p>

Remaining is an Expo-powered React Native app for tracking progress toward a fixed work-hour goal. It combines attendance logging, an active session timer, bonus-hour tracking, and journal attachments in an offline-first mobile experience.

## What It Does

Remaining is designed for people who need a simple way to answer one question: how many hours do I still have left?

The app helps users:

- Track time in and time out for each work session
- Monitor progress toward a required hour target
- Estimate a completion date based on work-day settings
- Log bonus or credited hours separately from attendance
- Add notes and photo attachments to attendance entries
- Keep working offline and sync selected records to Supabase when online

## Feature Highlights

### Dashboard Progress

The dashboard centers the app around remaining hours, percent complete, an estimated completion date, and the current timer state.

### Attendance Logging

Users can create attendance records through the built-in timer or by adding manual entries for past work.

### Bonus Hours

Bonus or credited time can be logged separately and counted alongside standard attendance totals.

### Journal and Photos

Each attendance record can include notes and attached photos, making it useful as both a time log and a lightweight work journal.

### Offline-First Data Model

Core app data is stored locally in SQLite, so the app remains usable without a network connection. When connectivity is available, the sync layer can push unsynced attendance, bonus, and timer-session records to Supabase.

## Screenshots

No app screenshots are checked into the repository yet.

Recommended GitHub screenshots for this README:

- Dashboard with the progress ring and active timer
- Attendance detail view with note and photo attachments
- Bonus-hours flow and goal configuration screens

## Tech Stack

- Expo 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- SQLite via `expo-sqlite`
- Secure local session storage via `expo-secure-store`
- Supabase client for cloud sync
- Expo media/file APIs for photo attachments and sharing

## Quick Start

### Prerequisites

- Node.js and npm
- An Expo-compatible development environment
- Expo Go or an Android/iOS simulator or device

### Install

```bash
npm install
```

### Run the App

```bash
npm start
```

Platform shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## Data and Sync Overview

Remaining currently uses a local-first architecture:

- User session data is stored on-device with SecureStore
- Core records are stored in SQLite
- Attendance, bonus, timer-session, goals, QR image, sync queue, and attachment tables are initialized locally at app startup
- Unsynced attendance, bonus, and timer-session rows can be pushed to Supabase by the background sync engine

The app is intentionally resilient offline. If sync fails, local usage is unaffected and sync can be retried later.

## Current Auth and Backend Status

- Authentication is currently implemented in offline-first local mode
- Supabase is present in the project for sync support
- The repository includes EAS build configuration for development, preview, and production profiles
- A Netlify functions folder exists, but no active functions are implemented in this repository at the moment

## Project Structure

```text
.
|-- components/        Reusable UI building blocks
|-- context/           App-wide state providers for auth, theme, attendance, timer, bonus, and settings
|-- navigation/        Tab and stack navigation setup
|-- screens/           Product screens such as dashboard, attendance, bonus, journal, and settings
|-- services/          SQLite database, repositories, Supabase client, and sync engine
|-- theme/             Color, spacing, and motion tokens
|-- utils/             Small shared utilities
```

## Build and Release

The app includes EAS configuration for managed builds.

If you plan to produce installable builds, review:

- `app.json` for Expo app metadata and plugin configuration
- `eas.json` for build profiles and CLI requirements

## Notes

- Photo permissions are configured for media picking and gallery saving
- The app uses a dark visual theme by default
- SQLite is initialized when the app loads, so there is no separate local database setup step

## License

This project is licensed under `0BSD`.
