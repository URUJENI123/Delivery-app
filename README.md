# DELIVERY | Kigali's On-Demand Courier

A React Native mobile app for on-demand package delivery in Kigali, Rwanda. Built with Expo.

## Tech Stack

- **React Native** (0.85.3)
- **Expo** (SDK 56)
- **TypeScript**
- **React Navigation** (native-stack)
- **Expo Vector Icons** (Ionicons)

## Screens

| Screen | Description |
|--------|-------------|
| Splash | Animated intro with brand logo and loading indicator |
| Onboarding Step 1 | Personal information form (name, phone, email) |
| Onboarding Step 2 | Vehicle plate and Mobile Money number |
| Onboarding Step 3 | Document upload (ID, license, insurance, photo) + terms |
| Courier Dashboard | Online toggle, earnings view, available jobs, nearby map |
| Sender Dashboard | Active delivery card, quick actions, recent deliveries |
| Live Tracking | Real-time map with delivery status bottom sheet |
| Delivery Landing | Marketing page with features and service area |

## Design

The design is based on a Figma prototype. Color palette centers on dark espresso (`#1B1110`) and deep red (`#892020`) with peach (`#FFB3AD`) accents.

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android/iOS) or press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web browser

## Project Structure

```
src/
├── components/     # Shared UI components
├── navigation/     # Stack navigator setup
├── screens/        # All screen components
├── theme/          # Colors, typography, spacing
└── types/          # TypeScript type definitions
```
