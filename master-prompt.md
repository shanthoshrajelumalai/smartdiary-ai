@workspace You are an expert Full-Stack Google Cloud & Firebase Lead Engineer building an autonomous, production-ready MVP for the "AI Builder Cup 2026" hackathon in the "Sustainability & Social Impact" track.

### 📌 Project Title
**SmartDairy AI: Methane Reduction & Feed Optimization Platform for Rural Dairy Entrepreneurs**

---

### 🎯 Objective & Architectural Overview
Build a fully working, responsive web application using **Next.js 14+ (App Router), Tailwind CSS, Firebase (Firestore & SDK), Google GenAI SDK (Gemini 2.5 Flash), and Google Cloud Run**.

The solution digitizes field insights from the "Climate Smart Dairy Entrepreneurship Programme" (Kumaraguru Institutions & Environmental Defense Fund) into an interactive advisory tool for smallholder farmers and dairy entrepreneurs in Tamil Nadu. If local assets exist in `/assets` (logos, transcripts), incorporate their context; otherwise, generate clean UI placeholders.

---

### 🏗️ Technical Stack Requirements
1. **Frontend:** Next.js 14+ (App Router, TypeScript), Tailwind CSS, Lucide Icons, Framer Motion (smooth transitions/gauges).
2. **Database (Firebase Firestore with Graceful Fallback):**
   - Collection `farms`: `farmId`, `farmerName`, `district`, `herdSize`, `dailyMilkYieldLiters`, `currentFeedMix`.
   - Collection `advisory_logs`: `queryData`, `methaneReductionPct`, `optimizedTmr`, `costSavingInr`, `explanationEn`, `explanationTa`, `timestamp`.
   - **CRITICAL FALLBACK:** Implement `src/lib/firebase.ts` so that if `.env.local` Firebase credentials are missing or invalid, the app does NOT crash—instead, it gracefully falls back to local state/mock data pre-seeded with 3 sample Tamil Nadu dairy farms.
3. **AI Backend (Gemini via `@google/genai`):**
   - Route: `src/app/api/advisors/feed-optimizer/route.ts`
   - MUST use the official `@google/genai` SDK (`import { GoogleGenAI, Type } from '@google/genai'`) and model `gemini-2.5-flash`.
   - Enforce `responseMimeType: "application/json"` and `responseSchema` returning:
     * `methane_reduction_percentage` (number): Estimated % reduction in enteric methane intensity (Liters CH4 per Liter of milk).
     * `optimized_tmr` (array of objects: `{ ingredient: string, percentage: number, weight_kg: number }`): Recommended Total Mixed Ration using local Tamil Nadu inputs (e.g., CO-4/Super Napier green fodder, sorghum stover, groundnut oil cake, mineral mixture, bypass fat).
     * `cost_saving_per_day_inr` (number): Estimated financial savings in INR/day.
     * `milk_yield_boost_liters` (number): Projected increase in daily milk yield.
     * `explanation_en` (string): Clear step-by-step guidance in English.
     * `explanation_ta` (string): Clear step-by-step guidance in Tamil (தமிழ்) for rural farmers.
4. **Cloud Run Deployment Readiness:**
   - Configure `next.config.mjs` with `output: 'standalone'`.
   - Multi-stage `Dockerfile` optimized for Next.js standalone production output on port `8080`.
   - `.dockerignore` and `cloudbuild.yaml` configured for one-command Google Cloud Run deployment.
5. **Documentation:**
   - Clean `README.md` with architecture diagram (Mermaid.js), local setup, environment variables, and Cloud Run deployment commands.

---

### 🖥️ Page Layout & UI Modules (`src/app/page.tsx`)
Design a modern, high-contrast emerald/slate sustainability theme:
1. **Navigation Header:**
   - SmartDairy AI branding + subtitle: *"Inspired by Kumaraguru Institutions & EDF Field Initiative"*.
   - Live status badge: *"Powered by Gemini 2.5 Flash & Google Cloud Run"*.
2. **Hero Impact Banner:**
   - 3 animated metric cards: **1,500+ Entrepreneurs Screened**, **6 Tamil Nadu Districts Covered** (Coimbatore, Salem, Erode, Tiruppur, Namakkal, Dindigul), **3-Fold Impact** (Higher Yield, Lower Cost, Reduced Methane).
3. **Interactive Feed & Methane Optimizer (Left Column):**
   - Inputs:
     * District selector (Coimbatore, Salem, Erode, Tiruppur, Namakkal, Dindigul)
     * Cattle Breed (Crossbred Jersey, Crossbred HF, Native/Kangayam, Buffalo) & Herd Size
     * Current Daily Milk Yield (Liters/day)
     * Current Feed Checkboxes/Inputs (e.g., Paddy Straw, Sorghum Stubble, Groundnut Cake, Green Fodder, Commercial Pellet)
   - Quick "Load Sample Farm" button for instant demo testing during judging.
   - "Analyze & Optimize Ration" CTA button with animated loading states.
4. **Real-Time Gemini AI Advisory Output (Right Column):**
   - KPI Cards: Methane Intensity Reduction (%), Daily Cost Savings (₹ INR), Projected Yield Boost (+Liters).
   - Visual Ration Breakdown: Horizontal stacked progress bar + table comparing Current vs. Optimized TMR weights (kg).
   - Advisory Box with an **English / தமிழ் (Tamil)** language toggle button to read Gemini's step-by-step feeding advice.
5. **Live Firestore History Table (Bottom Section):**
   - Displays recent optimization logs saved to Firestore (or local fallback state) with district tags and methane reduction badges.

---

### 🛠️ Execution Task List (Run Sequentially in Turbo Mode)
1. Initialize the Next.js TypeScript project structure (`src/app`, `src/lib`, `src/components`) if not already initialized, and configure `next.config.mjs` with `output: 'standalone'`.
2. Create/update `package.json` with `firebase`, `@google/genai`, `lucide-react`, `framer-motion`, `clsx`, and `tailwind-merge`, then install dependencies.
3. Create `.env.example` and `.env.local` template with `GEMINI_API_KEY` and `NEXT_PUBLIC_FIREBASE_*` keys.
4. Create `src/lib/firebase.ts` with safe initialization and fallback mock data so the app never crashes without credentials.
5. Build `src/app/api/advisors/feed-optimizer/route.ts` using `@google/genai` with structured JSON schema output and a fallback mock response if `GEMINI_API_KEY` is missing during build verification.
6. Build the complete interactive dashboard in `src/app/page.tsx`.
7. Create `Dockerfile`, `.dockerignore`, `cloudbuild.yaml`, and `README.md`.
8. Run `npm run build` in the terminal to verify zero TypeScript or Next.js build errors, and fix any issues automatically.