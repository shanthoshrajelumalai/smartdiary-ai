@workspace You are an expert Full-Stack Google Cloud & Firebase Lead Engineer upgrading our existing **SmartDairy AI** MVP into a championship-tier submission for the **AI Builder Cup 2026 (Sustainability & Social Impact Track)**.

### 🎯 Upgrade Objective
Enhance the current Next.js 14+ application (`src/app/page.tsx`, `src/app/api/advisors/feed-optimizer/route.ts`, `src/lib/firebase.ts`, and `README.md`) to incorporate the full suite of suggested Google Cloud capabilities—**Multimodal Vision Analysis, Geospatial/Climate Heat-Stress Intelligence (Earth Engine context), Tamil/English Voice Accessibility, IPCC Tier-2 Scientific Explainability, and BigQuery Carbon Credit Aggregation**—while strictly maintaining **100% zero-crash local/offline fallback** if cloud credentials or API keys are missing.

---

### 🚀 5 Core Feature Upgrades to Implement

#### 1. 📸 Multimodal "Snap-Your-Fodder" Vision Scanner (`gemini-2.5-flash` Multimodal)
- **Frontend (`src/app/page.tsx`):**
  - Inside the Left Column (Feed & Methane Optimizer form), add a **"Multimodal Fodder & Chaffing Scanner (Vision AI)"** dropzone/upload card.
  - Allow users to upload an image (`image/jpeg`, `image/png`, `image/webp`), convert it to Base64, and preview the thumbnail.
  - **CRITICAL DEMO FEATURE:** Add 2 one-click preset buttons for judges so they can test Vision AI without needing a cow photo on their laptop:
    1. *"🌾 Demo Preset: Untreated Long Paddy Straw"* (generates a lightweight synthetic/SVG data URI or preset metadata payload representing dry, unchaffed high-lignin straw).
    2. *"🌿 Demo Preset: Chaffed CO-4 Green Napier + Silage"* (represents well-chopped 2-3 cm green fodder mix).
- **Backend (`src/app/api/advisors/feed-optimizer/route.ts`):**
  - Accept optional `fodderImageBase64`, `fodderMimeType`, and `fodderPresetType` in the POST body.
  - If an image is provided, pass it as an `inlineData` part alongside the text prompt into `ai.models.generateContent({ model: 'gemini-2.5-flash', ... })`.
  - Add `visual_fodder_assessment` to the `responseSchema` (object containing `detected_roughage_quality: string`, `chaffing_status: string`, `lignin_risk_level: string`, and `visual_recommendation: string`).

#### 2. 🌡️ Geospatial Climate & Heat-Stress (THI) Intelligence Widget (Earth Engine / Climate Context)
- **Data & UI (`src/app/page.tsx`):**
  - Create a lookup map for the 6 Tamil Nadu districts (**Coimbatore, Salem, Erode, Tiruppur, Namakkal, Dindigul**) containing realistic agro-climatic metrics:
    - Ambient Temperature (°C), Relative Humidity (%), calculated **THI (Temperature-Humidity Index)**, **Heat Stress Risk Level** (Moderate / High / Severe), and **Satellite NDVI Green Fodder Availability Index** (simulated Earth Engine vegetation score, e.g., `0.42` to `0.68`).
  - Display a live **"🛰️ District Agro-Climatic & Earth Engine NDVI Monitor"** card that dynamically updates whenever the user changes the District selector.
- **AI Integration:**
  - Pass the district's `thiScore` and `ndviIndex` into `/api/advisors/feed-optimizer`.
  - Instruct Gemini (and the fallback engine) to adjust the ration for heat stress when `THI > 78` (e.g., adding Potassium/Sodium Bicarbonate rumen buffers and increasing rumen bypass fat to prevent heat-induced sub-acute ruminal acidosis and milk fat depression).
  - Return `heat_stress_advisory` (string) in the API JSON response and display it in the output panel.

#### 3. 🎙️ Bilingual Voice Input ("Speak to SmartDairy" in தமிழ் & English)
- **Frontend (`src/app/page.tsx`):**
  - Add a **"🎙️ Voice Input (தமிழ் / EN)"** bar at the top of the Herd & Diet Profiler form.
  - Use the browser Web Speech API (`window.SpeechRecognition` or `window.webkitSpeechRecognition`) with a language selector for `ta-IN` (Tamil) and `en-IN` (English).
  - Add a **"✨ Simulate Tamil Voice Command"** button for judges on unsupported browsers that populates the transcript: *"என்னிடம் ஈரோட்டில் 4 கலப்பின ஜெர்சி மாடுகள் உள்ளன, தினமும் 12 லிட்டர் பால் கறக்கிறது, வைக்கோல் மற்றும் கடலை புண்ணாக்கு போடுகிறேன்"* ("I have 4 Crossbred Jersey cows in Erode, yielding 12L milk/day, feeding paddy straw and groundnut cake") and automatically updates the District, Breed, Herd Size, Milk Yield, and Feed Checkboxes!
  - Keep and refine the existing **Text-to-Speech (`window.speechSynthesis`)** audio button on the Gemini output panel so farmers can listen to the advisory in Tamil (`ta-IN`) or English (`en-IN`).

#### 4. 📊 BigQuery Regional Carbon Credit & FPO Impact Aggregator
- **Backend & Lib (`src/lib/firebase.ts` & API Route):**
  - Add a simulated/optional **BigQuery Analytics Streamer** function (`logToBigQueryAnalytics`) that structures every optimization run into an IPCC/EDF carbon accounting schema (`district`, `herd_size`, `daily_ch4_abated_grams`, `annual_co2e_tonnes_saved`, `estimated_carbon_credit_inr`, `timestamp`). If `@google-cloud/bigquery` or GCP service credentials aren't configured, gracefully compute and aggregate from local/Firestore state.
- **Frontend (`src/app/page.tsx`):**
  - Add a **"🌍 BigQuery Regional Carbon Credit & FPO Aggregator"** section above the History Table.
  - Display 4 aggregated Cooperative/FPO metrics across all logged runs:
    1. **Total Enteric $CH_4$ Abated (kg/year)**
    2. **Carbon Equivalent Saved ($tCO_2e$/year — GWP-20 = 84x)**
    3. **Estimated Voluntary Carbon Credit Revenue (₹ INR/year for Farmer FPOs @ $18/tCO2e)**
    4. **District-wise Methane Intensity Leaderboard** (visual breakdown across Coimbatore, Erode, Salem, Namakkal, Tiruppur, Dindigul).

#### 5. 🧬 Scientific Explainability Modal (IPCC Tier-2 & TANUVAS Rumen Model)
- **Frontend (`src/app/page.tsx`):**
  - Add a **"🔬 View IPCC Tier-2 & TANUVAS Rumen Math"** badge/button next to the AI Advisory title that opens a clean collapsible drawer or modal.
  - Display the exact deterministic equations used to ground Gemini's output so judges see the scientific rigor:
    - Dry Matter Intake ($DMI$), Gross Energy Intake ($GEI$), and Methane Conversion Factor ($Y_m$) shifting from untreated paddy straw ($Y_m \approx 6.5\%$) to chaffed green fodder + TANUVAS mineral mixture + bypass fat ($Y_m \approx 4.8\%$).
    - Show the dynamically calculated $Y_m$ before vs. after for the current farm run.

---

### 🛠️ Execution Task List (Run Sequentially in Turbo Mode)
1. **Update `src/lib/firebase.ts`:**
   - Expand pre-seeded Tamil Nadu farm logs with carbon credit metrics (`annualCo2eTonnes`, `carbonCreditInr`, `thiScore`) and add a helper function to compute aggregated BigQuery-style regional carbon stats across districts.
2. **Upgrade `src/app/api/advisors/feed-optimizer/route.ts`:**
   - Update `@google/genai` `responseSchema` to include:
     - `methane_reduction_percentage` (number)
     - `baseline_ym_factor` (number, e.g. 6.5)
     - `optimized_ym_factor` (number, e.g. 4.8)
     - `annual_co2e_saved_tonnes` (number)
     - `estimated_annual_carbon_credit_inr` (number)
     - `visual_fodder_assessment` (object: `detected_roughage_quality`, `chaffing_status`, `lignin_risk_level`, `visual_recommendation`)
     - `heat_stress_advisory` (string)
     - `optimized_tmr` (array of `{ ingredient, percentage, weight_kg }`)
     - `cost_saving_per_day_inr` (number)
     - `milk_yield_boost_liters` (number)
     - `explanation_en` (string)
     - `explanation_ta` (string)
   - Support multimodal `inlineData` when `fodderImageBase64` is passed.
   - Update the deterministic fallback response so it calculates realistic values for all new fields if `GEMINI_API_KEY` is absent or rate-limited.
3. **Upgrade `src/app/page.tsx`:**
   - Integrate the **Voice Input bar (Tamil/EN + 1-click Demo Voice Simulator)**.
   - Integrate the **District Agro-Climatic THI & Earth Engine NDVI card**.
   - Integrate the **Multimodal Fodder Vision Scanner (with file upload + 2 instant demo preset buttons)**.
   - Render the **Visual Fodder Assessment card**, **Heat-Stress Rumen Buffer alert**, and **IPCC Tier-2 Scientific Formula Drawer** in the Right Column.
   - Render the **BigQuery Regional Carbon Credit & FPO Aggregator Dashboard** in the Bottom Section.
4. **Update `README.md`:**
   - Update the Mermaid.js system architecture diagram and feature documentation to highlight Multimodal Gemini Vision, Earth Engine/THI Climate Context, Bilingual Voice AI, and BigQuery Carbon Credit Analytics.
5. **Build & Verify:**
   - Run `npm run build` in the terminal to verify zero TypeScript, ESLint, or Next.js standalone build errors. Fix any type mismatches immediately.