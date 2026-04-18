# Ember Sports - Project Overview for Optimization

## Project Structure
```
ember_sports/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   └── HeroIllustration.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Booking.tsx
│   │   ├── MyBookings.tsx
│   │   └── Login.tsx
│   ├── hooks/
│   │   └── useTranslation.ts
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── en.json
│   │   └── zh.json
│   ├── styles/
│   │   └── index.css
│   ├── supabase/
│   │   └── client.ts
│   ├── App.tsx
│   └── index.tsx
├── index.html
├── package.json
├── webpack.config.js
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

## Tech Stack
- **Framework:** React 18.2 with TypeScript
- **Styling:** Tailwind CSS 3.3.5
- **Build Tool:** Webpack 5.89
- **Animations:** Framer Motion 11.16
- **Backend:** Supabase (Authentication & Database)
- **Routing:** React Router DOM 6.8
- **i18n:** react-i18next (English/Chinese)
- **Icons:** Lucide React
- **Deployment:** Vercel

## Key Features
1. **Multi-language Support** - English/Chinese toggle
2. **Court Booking System** - Interactive availability grid
3. **User Authentication** - Supabase Auth
4. **Payment Integration** - WeChat Pay, Alipay, Card (UI ready)
5. **Responsive Design** - Mobile-first approach
6. **Real-time Updates** - Supabase subscriptions

## Current Styling
- **Primary Color:** #f97316 (Orange)
- **Secondary Color:** #fb923c
- **Accent Color:** #fdba74
- **Hero Font:** Garamond/Baskerville serif with letter-spacing: 0.08em
- **Hero Text:** "Play Hard. Play Ember."

## Configuration Files

### package.json
- Dependencies: React, ReactDOM, React Router, Supabase, Framer Motion, i18next
- DevDependencies: Webpack, Babel, TypeScript, Tailwind CSS
- Scripts: dev, build, typecheck, vercel-build

### vercel.json
```json
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}],
  "installCommand": "pnpm install",
  "buildCommand": "pnpm run build"
}
```

### webpack.config.js
- Entry: ./src/index.tsx
- Output: dist/bundle.js
- Loaders: babel-loader (TSX/JS), css-loader, postcss-loader
- Plugins: HtmlWebpackPlugin

### tailwind.config.js
- Content paths: src/**/*.{js,jsx,ts,tsx}, index.html
- Custom colors: primary (#f97316), secondary (#fb923c), accent (#fdba74)

## Database Schema (Supabase)
Tables needed:
- users (managed by Supabase Auth)
- bookings (court_id, user_id, date, time_slot, status, created_at)
- courts (id, name, type, price_per_hour, is_active)

## API Integration Points
- Supabase Auth: signIn, signUp, signOut, onAuthStateChange
- Supabase Database: CRUD operations for bookings
- Payment Gateway: Airwallex (to be integrated)

## Routes
- `/` - Home page with hero and features
- `/booking` - Court booking interface
- `/my-bookings` - User's booking history
- `/login` - Authentication page

## Optimization Areas to Consider
1. **Performance:** Code splitting, lazy loading routes
2. **SEO:** Meta tags, server-side rendering consideration
3. **Accessibility:** ARIA labels, keyboard navigation
4. **Bundle Size:** Tree shaking, dependency optimization
5. **Caching:** Service workers, CDN strategy
6. **Images:** Optimization, lazy loading
7. **Database Queries:** Indexing, query optimization
8. **State Management:** Consider Redux/Zustand if complexity grows

## Current Issues/Notes
- Static HTML (index.html) contains hero section separately from React app
- React app uses HashRouter for routing
- Translation system supports EN/ZH with dynamic switching
- Payment UI exists but needs real gateway integration

## GitHub Repository
https://github.com/cosmiccoffeeaddict/Ember_Sports_Booking

## Live Site
https://ember-sports-booking-site.vercel.app/
