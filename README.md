# SmartDairy AI: Methane Reduction & Feed Optimization Platform

> **AI Builder Cup 2026** — *Track: Sustainability & Social Impact*  
> Inspired by the **Climate Smart Dairy Entrepreneurship Programme** (Kumaraguru Institutions & Environmental Defense Fund - EDF).  
> 🌐 **Live Cloud Run Service:** [https://smartdairy-ai-954553665284.asia-south1.run.app](https://smartdairy-ai-954553665284.asia-south1.run.app)

---

## 🎯 Executive Summary

Enteric fermentation from dairy cattle is one of the single largest agricultural sources of atmospheric methane ($CH_4$), a short-lived climate pollutant over 80 times more potent than $CO_2$ over a 20-year timeline (GWP-20 = 84). In rural Tamil Nadu, traditional feeding practices reliant on un-chaffed paddy straw and unbalanced roughage lead to high methanogenesis, low feed conversion efficiency, and high production costs for smallholder farmers.

**SmartDairy AI** digitizes field research from the Kumaraguru & EDF initiative into a production-grade, dual-perspective AI advisory system. Powered by **Google Gemini 2.5 Flash Multimodal**, **Earth Engine Agro-Climatic Intelligence (Sentinel-3 THI & NDVI)**, and **BigQuery Carbon Accounting**, it:
1. Formulates precision **Total Mixed Rations (TMR)** using locally available Tamil Nadu crop residues, reducing enteric methane intensity by **18% to 28%** and boosting daily milk yields by **1.5 to 2.2 L/day**.
2. Operates across a **Dual-Perspective Architecture**: **Micro (Individual Smallholder Farmer)** for customized feed balancing, vernacular voice, and camera vision scanning, and **Macro (FPO Cooperative Hub)** for pooling 1,500+ rural farmers into an IPCC Tier-2 regional carbon credit ledger ($18/tCO₂e).
3. Features an interactive **Judges Guided Tour** for 1-click evaluation of all core innovations.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User["👨‍🌾 Dairy Farmer / FPO Executive / AI Cup Judge\n(Web & Mobile PWA Responsive)"]
    
    subgraph NavigationLayer ["🧭 Navigation & Perspective Framework"]
        PerspectiveScope["Perspective Scope Switcher\n• 🧑‍🌾 Individual Farmer (Micro)\n• 🏛️ FPO Cooperative Hub (Macro)"]
        JudgesTour["✨ Judges Guided Tour Engine\n• 5-Step Interactive Walkthrough\n• Auto Tab & Scope Synchronization\n• Welcome Popup with Skip / Stop"]
        ThemeEngine["🌓 Dynamic Theme Engine\n• Dark Mode / Light Mode (WCAG AAA)"]
    end

    subgraph Inputs ["Multimodal User Inputs"]
        VoiceInput["🎙️ Bilingual Voice Input (Web Speech API)\n• தமிழ் (ta-IN) / English (en-IN)\n• Slot-Filling Form Auto-Populator\n• 1-Click Simulated Tamil Voice Command"]
        VisionInput["📸 Multimodal Fodder Vision Scanner\n• Photorealistic Presets (Paddy Straw / Silage)\n• Client-Side Canvas Downscaling (Max 1200px)\n• Acid Detergent Fiber (ADF) & Lignin Risk Meter"]
        HerdForm["📝 Herd & Diet Profiler\n• 6 Districts, Breeds, Milk Yield, Crop Residues"]
    end

    subgraph ClimateContext ["🛰️ Agro-Climate & Geospatial Intelligence"]
        THIMonitor["🌡️ Sentinel-3 THI Heat Stress Monitor\n• Real-Time Kongu Weather & THI Thresholds\n• Auto-Triggered Rumen Buffers (NaHCO3 + Bypass Fat)"]
        EarthEngine["🌍 Earth Engine Simulated NDVI Canopy\n• Green Fodder Availability Index (0.43 - 0.65)"]
    end

    subgraph Frontend ["Next.js 14+ App Router (TypeScript, Tailwind & Framer Motion)"]
        UI["Interactive Dual-Mode Dashboard (src/app/page.tsx)"]
        KPIs["Impact KPIs & Precision TMR Breakdown\n• -28% CH4, ₹182/day Saved, +2.1L Yield"]
        ScientificModal["🔬 IPCC Tier-2 & TANUVAS Rumen Drawer\n• GEI, Ym Shift (6.5% → 4.8%), Rumen pH > 6.2"]
        BigQueryAggregator["📊 BigQuery Regional Carbon Dashboard\n• 1,500+ Farmers, 76.2 tCO2e Abated, ₹116k+ FPO Revenue"]
    end

    subgraph BackendAPI ["Cloud Run Microservices (/api)"]
        OptimizerAPI["/api/advisors/feed-optimizer\n(Structured JSON Engine & Resilient Fallback)"]
    end

    subgraph GoogleCloudAI ["Google GenAI (Vertex / AI Studio)"]
        Gemini["Gemini 2.5 Flash Multimodal\n• Text Prompt + Inline Fodder Image\n• Strict JSON Response Schema"]
    end

    subgraph DataTier ["Google Cloud Data Tier"]
        Firestore[("Cloud Firestore\n• advisory_logs\n• farms")]
        BigQuery[("BigQuery Streaming Table\nsmartdairy_analytics.carbon_accounting_logs")]
        LocalFallback["Resilient In-Memory & LocalStorage Store"]
    end

    User --> NavigationLayer
    NavigationLayer --> Inputs
    Inputs --> UI
    THIMonitor & EarthEngine --> UI
    UI -->|POST JSON with Multimodal Image & Climate Metrics| OptimizerAPI
    OptimizerAPI -->|Multimodal Parts + Rumen Prompts| Gemini
    Gemini -->|Calculated TMR, Vision Assessment, Carbon Metrics| OptimizerAPI
    OptimizerAPI -->|Structured Response JSON| UI
    UI --> KPIs & ScientificModal & BigQueryAggregator
    UI -->|Stream Logs| Firestore & BigQuery
    Firestore & BigQuery -.->|Zero-Crash Fallback| LocalFallback
```

---

## 🚀 7 Core Architectural Innovations

### 1. 🧭 Judges Guided Interactive Tour & First-Time Visitor Guide
- **Quick Evaluation Experience**: Specifically engineered for AI Builder Cup 2026 evaluators.
- **Top Bar & Sidebar Launchers**: Clickable via the prominent **`Judges Tour`** button in the top navbar (with animated glowing indicator) and the **`Judges Guided Tour`** card in the left sidebar drawer.
- **First-Time Welcome Modal ("Skip Popup")**: Unobtrusive welcome card offering a 60-second guided overview or a 1-click **"Skip for now"** dismiss option (persisted in `localStorage`).
- **5-Step Automated Walkthrough**:
  - *Step 1: Dual-Perspective Framework* (Farmer vs FPO Hub).
  - *Step 2: Bilingual Voice Input* (Tamil speech recognition & form auto-fill).
  - *Step 3: Gemini 2.5 Precision TMR & 4 Impact KPIs* (-28% CH₄, ₹182/day saved).
  - *Step 4: Sentinel-3 THI & Multimodal Fodder Scanner* (Auto-switches to `Climate & Vision` tab with photorealistic presets and ADF meter).
  - *Step 5: BigQuery Regional Carbon Ledger & FPO MRV* (Auto-switches to `Carbon Dashboard` with FPO Hub perspective).
- **Flexible Navigation**: Features **Next Step**, **Back**, **Skip / Stop Tour**, interactive jump dots (`● ○ ○ ○ ○`), keyboard shortcuts (`Esc`, `←`, `→`), and completion toast.

### 2. 🏛️ Dual-Perspective Framework: Micro (Farmer) vs. Macro (FPO Hub)
- **Individual Farmer Mode (Micro View)**:
  - Tailored for grassroots smallholder dairy farmers and rural livestock entrepreneurs.
  - Focuses on individual cattle breeds (Crossbred Jersey, Crossbred HF, Kangayam, Murrah), daily milk yield, and current feed mix.
  - Generates custom dry matter balanced rations, daily rupee savings, and individual methane abatement metrics.
- **FPO Cooperative / Regional Hub (Macro View)**:
  - Designed for dairy farmer producer organizations (e.g., Aavin, Kongu Milk Cooperatives, EDF regional clusters).
  - Aggregates over 1,500 smallholder farms across 6 agro-climatic districts.
  - Provides an **IPCC Tier-2 Regional Carbon Ledger** tracking collective $CH_4$ abated, $tCO_2e$ saved (GWP-20 = 84), and voluntary carbon credit monetization at **$18/tCO₂e** (~₹1,530/tonne).

### 3. 📸 Multimodal Fodder Vision Scanner (`gemini-2.5-flash`)
- **Photorealistic Agricultural Presets**:
  - `Untreated Long Paddy Straw (Raw, Un-chaffed)` — high-lignin baseline fodder.
  - `Chopped Super Napier CO-5 Silage` — ideal 2–3 cm fermented roughage.
- **Client-Side Canvas Downscaling**: Automatically downscales uploaded phone photos to a maximum dimension of 1200px (JPEG 0.85 quality) to ensure fast, failure-proof uploads without HTTP 413 payload crashes.
- **Visual Fiber & Lignification Assessment**:
  - **Chaff length detection** (>10 cm long un-chaffed vs. optimal 2–3 cm chop).
  - **Acid Detergent Fiber (ADF) & Lignin Risk Meter** (e.g., ADF 44% vs 28%).
  - Provides actionable vernacular instructions to reduce rumen retention time and limit methanogenic archaea growth.

### 4. 🎙️ Bilingual Voice Input (தமிழ் / English) in Herd Profiler
- Integrated directly above the **Herd & Feed Profiler** form to bridge rural literacy barriers.
- Utilizes the browser **Web Speech API** supporting Tamil (`ta-IN`) and Indian English (`en-IN`).
- **1-Click Simulated Tamil Voice Command**:
  > *"என்னிடம் ஈரோட்டில் 4 கலப்பின ஜெர்சி மாடுகள் உள்ளன, தினமும் 12 லிட்டர் பால் கறக்கிறது, வைக்கோல் மற்றும் கடலை புண்ணாக்கு போடுகிறேன்"*
- Automatically parses spoken natural language and auto-populates District (`Erode`), Breed (`Crossbred Jersey`), Herd Size (`4`), Daily Milk Yield (`12 L`), and Feed Mix (`Paddy Straw`, `Groundnut Oil Cake`) in real-time.
- Includes speech synthesis text-to-speech audio reader in Tamil and English for the generated advisory.

### 5. 🌡️ Sentinel-3 THI Heat Stress & Earth Engine Agro-Climate
- Dynamic agro-climatic lookup across 6 Tamil Nadu dairy districts: **Coimbatore, Salem, Erode, Tiruppur, Namakkal, Dindigul**.
- Evaluates ambient Temperature, Relative Humidity, **Temperature-Humidity Index (THI)**, and **NDVI Green Biomass Canopy Score** (0.43 to 0.65).
- Automatically triggers dietary heat stress mitigations when $\text{THI} \ge 78$ (e.g., adding 100–150g Sodium Bicarbonate buffer and 150g rumen bypass fat to protect rumen pH > 6.2 and prevent milk fat depression).

### 6. 📊 BigQuery Regional Carbon Accounting & FPO Aggregator
- Formats every advisory run into a verifiable **IPCC Tier-2 carbon accounting schema** (`smartdairy_analytics.carbon_accounting_logs`).
- Aggregates cooperative metrics:
  1. **Total Enteric $CH_4$ Abated (kg/year)**
  2. **Carbon Equivalent Saved ($tCO_2e$/year — GWP-20 = 84x standard)**
  3. **Voluntary Carbon Credit Revenue (₹ INR/year for FPO members @ $18/tCO₂e)**
  4. **District-wise Methane Intensity Leaderboard** with live ranking across Tamil Nadu districts.

### 7. 🌓 Sleek Dark & Light Themes with Responsive Drawer Navigation
- **Light & Dark Theme Switcher**: Toggleable anytime via the top header bar or sidebar drawer. Carefully crafted with WCAG AAA contrast ratios, vibrant emerald/teal accents, and crisp typography.
- **Responsive Drawer Navigation**:
  - Persistent desktop sidebar with quick access to Perspective Scopes, Farmer Workflows, Cooperative Hub, and 1-Click Demo Farms.
  - Smooth mobile slide-out sandwich drawer with animated backdrop.

---

## 🔬 Scientific Explainability (IPCC Tier-2 & TANUVAS Equations)

Accessible directly via the **"IPCC Formulas"** button in the header:

1. **IPCC Tier-2 Enteric Fermentation Model**:
   $$\text{CH}_4\text{ (kg/animal/day)} = \frac{\text{GEI (MJ/day)} \times (Y_m / 100)}{55.65\text{ MJ/kg}}$$
   - $\text{GEI}$: Gross Energy Intake (~125–150 MJ/cow/day based on DMI 10–14 kg/day).
   - $Y_m$: Methane conversion factor (% of gross energy converted to methane in the rumen).

2. **$Y_m$ Transition**:
   - *Untreated Paddy Straw Baseline*: $Y_m \approx 6.5\% - 6.8\%$ (High lignin, ADF > 48%, slow passage rate).
   - *Optimized TMR with Silage & Bypass Fat*: $Y_m \approx 4.7\% - 4.9\%$ (Propionate pathway shift reduces hydrogen availability).

3. **Carbon Valuation**:
   - Short-lived climate pollutant standard: $\text{GWP-20} = 84\times \text{ biogenic } CH_4$.
   - Voluntary carbon credit benchmark: $\$18/\text{tCO}_2\text{e} \approx ₹1,530/\text{tonne}$.

4. **TANUVAS Rumen Buffer Chemistry (Heat Stress Mitigation)**:
   $$\text{NaHCO}_3 + \text{H}^+ \rightarrow \text{Na}^+ + \text{H}_2\text{O} + \text{CO}_2\uparrow \quad (\text{Maintains Rumen pH} > 6.2)$$

---

## 🛡️ 100% Zero-Crash Local & Offline Fallback Architecture

The platform guarantees uninterrupted evaluation:
- If `GEMINI_API_KEY` is not provided or API quotas are exhausted, the system serves deterministic scientific calculation presets based on Tamil Nadu Veterinary and Animal Sciences University (TANUVAS) nutritional tables.
- If Firebase Firestore or BigQuery credentials are not configured, state is maintained in-memory and synchronized to `localStorage`.
- All demo presets, voice simulations, and tour flows function out-of-the-box with zero configuration required.

---

## ⚡ Quick Start for Judges & Developers

### 1. Prerequisites
- Node.js 18+ or 20+ (Node 20+ recommended)
- npm

### 2. Clone and Install
```bash
git clone <repo-url>
cd smartdairy-ai
npm install
```

### 3. Environment Variables (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

```env
# Google Gemini API Key (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Optional)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live dashboard.

---

## 🏆 3-Minute Judges Evaluation Walkthrough

When reviewing SmartDairy AI, follow this recommended 3-minute sequence:

1. **Launch the Judges Tour**:
   - Click the **"Judges Tour"** button in the top navigation bar or the floating welcome prompt.
   - Click **"Next Step"** through all 5 steps to watch the dashboard automatically switch perspectives and tabs in real-time.
2. **Test Bilingual Voice Input (தமிழ்)**:
   - On the `AI Optimizer` tab, click **"Simulate Tamil Voice Command"** in the Herd & Feed Profiler card.
   - Watch the Tamil phrase instantly parse into District, Breed, Herd Size, Milk Yield, and Feeds without any typing.
3. **Test the Multimodal Fodder Scanner**:
   - Switch to the `Climate & Vision` tab.
   - Click the **"Untreated Paddy Straw"** preset, then click **"Run Multimodal Vision Diagnostic"**.
   - Review the Acid Detergent Fiber (ADF) & Lignin meter and the tailored chaffing instructions.
4. **Inspect the Regional Carbon Ledger**:
   - Toggle to **"🏛️ FPO Cooperative / Regional Hub"** in the top perspective banner.
   - View the BigQuery regional carbon ledger aggregating 1,500+ rural smallholders and the district leaderboard.
5. **Toggle Theme**:
   - Click the Sun/Moon toggle to inspect the high-contrast Light Theme and sleek Dark Theme.

---

## 🐳 Docker & Cloud Deployment

### Local Docker Build & Run
```bash
# Build container image
docker build -t smartdairy-ai:latest .

# Run on port 8080
docker run -p 8080:8080 -e GEMINI_API_KEY="your_api_key" smartdairy-ai:latest
```
Visit [http://localhost:8080](http://localhost:8080).

### Deploy to Google Cloud Run
```bash
gcloud run deploy smartdairy-ai \
  --source . \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY="your_gemini_api_key"
```

---

## 🧪 Tech Stack Summary

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 14+ (App Router, Standalone Mode) | High-performance React server & client components |
| **Language** | TypeScript | Full end-to-end type safety |
| **Styling & UI** | Tailwind CSS + Framer Motion | Glassmorphism, micro-animations, responsive navigation drawer |
| **Themes** | Custom CSS Variables | WCAG AAA compliant Dark & Light modes |
| **AI / Multimodal** | `@google/genai` (Gemini 2.5 Flash) | Multimodal roughage vision diagnostic & structured JSON TMR formulation |
| **Voice AI** | Web Speech API | Dual-dialect speech recognition (`ta-IN`, `en-IN`) + Tamil slot-filling parser |
| **Image Pipeline** | HTML5 Canvas Client-Side Downscaling | Max 1200px compression to prevent upload payload errors |
| **Geospatial & Climate** | Sentinel-3 THI & Earth Engine NDVI | Dynamic agro-climatic lookup across 6 Tamil Nadu dairy districts |
| **Carbon Analytics** | IPCC Tier-2 Accounting & BigQuery Aggregator | GWP-20 = 84 methane factor, $18/tCO₂e carbon monetization |
| **Database** | Firebase Firestore | `advisory_logs` and `farms` collection with local fallback |
| **Guided Tour** | Custom React + Framer Motion Engine | 5-step automated walkthrough with state synchronization |
| **Container & Cloud** | Docker, Google Cloud Run, Cloud Build | Serverless deployment on `asia-south1` |

---

## 🤝 Acknowledgments
- **Kumaraguru Institutions & Environmental Defense Fund (EDF)** for their foundational field research under the *Climate Smart Dairy Entrepreneurship Programme* in Tamil Nadu.
- **Tamil Nadu Veterinary and Animal Sciences University (TANUVAS)** for dairy nutrition guidelines, roughage fiber benchmarks, and rumen buffer chemistry.
