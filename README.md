# MarketPlace Application Frontend

## Overview

This repository is the frontend for a local marketplace experience where users can create accounts, browse nearby listings, upload item photos, post products for sale, and start conversations with sellers. The app is built with Expo Router and React Native so the same codebase can run on iOS, Android, and web.

## Core Features

| Area | What it does |
| --- | --- |
| Authentication | Supports email/password login, sign-up, Google OAuth, and GitHub OAuth. |
| Marketplace Feed | Loads listings from the backend, displays item cards, and filters by category and price range. |
| Listing Details | Opens item details in a modal with price, description, location, seller profile, and message action. |
| Post Item | Lets authenticated users create listings with title, price, category, description, location, and image upload. |
| Image Uploads | Uploads selected images to Supabase Storage and saves the public image URL with the listing. |
| Messaging | Creates or reuses conversations and supports paginated message loading and sending. |
| Profile | Shows signed-in user info, listing count, total listed value, owned listings, and listing deletion. |

## Tech Stack

| Layer | Tools |
| --- | --- |
| App Framework | Expo 54, React Native 0.81, React 19 |
| Navigation | Expo Router, React Navigation bottom tabs |
| Language | TypeScript |
| Auth Storage | React Native AsyncStorage |
| Media | Expo Image Picker, Supabase Storage |
| Backend Integration | Fetch API, deployed Heroku REST API |
| UI | React Native StyleSheet, Expo vector icons, native modals and lists |
| Quality | Expo ESLint, TypeScript configuration |

## Product Flow

1. Users sign up or log in with email/password, Google, or GitHub.
2. Auth data is persisted locally so the app can resolve the current user across screens.
3. The home feed pulls marketplace listings from the backend and supports browsing by category and price.
4. Users can post an item by uploading an image, adding details, and sending the listing to the API.
5. Buyers can open a listing, view seller information, and start a conversation from the item modal.
6. The inbox and conversation screens fetch conversation threads and messages for the logged-in user.
7. The profile screen summarizes the user's active listings and allows listing management.

## Project Structure

```text
app/
  (tabs)/
    index.tsx        # Login and OAuth entry point
    home.tsx         # Marketplace feed, filters, listing detail modal
    post-item.tsx    # Listing creation and image upload
    inbox.tsx        # Conversation list
    profile.tsx      # User profile and owned listings
  conversation.tsx   # Message thread screen
  sign-up.tsx        # Account creation flow

src/
  api/chat.ts        # Conversation and message API helpers
  types/chat.ts      # Shared chat types
  components/        # Reusable themed Expo starter components
  hooks/             # Theme and platform hooks

assets/images/       # App logo, icons, and fallback profile image
styles/              # Shared styling files
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Expo CLI through `npx expo`
- Optional: Xcode for iOS simulator or Android Studio for Android emulator

### Install

```bash
npm install
```

### Run Locally

```bash
npm run start
```

Then choose one of the Expo launch options:

- press `i` for iOS simulator
- press `a` for Android emulator
- press `w` for web
- scan the QR code with Expo Go for a device preview

### Useful Scripts

```bash
npm run start    # Start the Expo development server
npm run ios      # Run the native iOS app
npm run android  # Run the native Android app
npm run web      # Start the web build
npm run lint     # Run Expo lint checks
```

## Backend and Configuration Notes

This repository is the frontend client. It currently connects to a deployed demo API and a Supabase project from the app source. For production readiness, the API URL, basic auth header, OAuth client IDs, and Supabase keys should be moved into environment variables such as `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SUPABASE_URL`.

Because the backend is external to this repository, local testing requires that the deployed API remain available or that the API endpoints be updated to point at a compatible local backend.