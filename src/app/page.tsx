"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Leaf, TrendingDown, TrendingUp, IndianRupee, Cpu,
  Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw,
  Award, Layers, ChevronRight, Info, MapPin, Clock, Volume2,
  Mic, MicOff, Camera, UploadCloud, X, Activity, Globe,
  Thermometer, Satellite, Calculator, BookOpen, BarChart3,
  FlaskConical, Wind, Droplets, ChevronDown,
  Sun, Moon, User, Users, Building2, Menu,
} from "lucide-react";
import {
  SAMPLE_FARMS, FarmRecord, AdvisoryLogRecord, OptimizedTmrIngredient,
  VisualFodderAssessment, fetchRecentLogs, logAdvisoryResult,
  computeRegionalCarbonAggregates, isFirebaseConfigured,
} from "@/lib/firebase";

/* ─────────────────────────── CONSTANTS ─────────────────────────── */

const DISTRICTS = ["Coimbatore", "Salem", "Erode", "Tiruppur", "Namakkal", "Dindigul"];
const BREEDS = ["Crossbred Jersey", "Crossbred HF", "Native/Kangayam", "Murrah / Local Buffalo"];
const FEED_OPTIONS = [
  "Paddy Straw (Un-chaffed)",
  "Sorghum Stubble / Dry Kadbi",
  "Groundnut Oil Cake",
  "Green Fodder (Local Grass / Maize)",
  "Commercial Cattle Pellets",
  "De-oiled Rice Bran (DORB)",
  "Cottonseed Meal",
];

type TabId = "optimizer" | "climate" | "carbon" | "history";

const TABS: { id: TabId; label: string; subtitle: string; icon: React.ReactNode; badge?: string; scope: "farmer" | "cooperative"; scopeLabel: string }[] = [
  { id: "optimizer", label: "AI Optimizer",    subtitle: "Precision TMR formulation", icon: <Sparkles className="w-4 h-4" />,  scope: "farmer",      scopeLabel: "Farmer" },
  { id: "climate",   label: "Climate & Vision", subtitle: "THI & Multimodal scanner",  icon: <Satellite className="w-4 h-4" />, badge: "THI",      scope: "farmer", scopeLabel: "Farmer" },
  { id: "carbon",    label: "Carbon Dashboard", subtitle: "IPCC Tier-2 regional ledger", icon: <BarChart3 className="w-4 h-4" />,  badge: "BigQuery", scope: "cooperative", scopeLabel: "FPO Hub" },
  { id: "history",   label: "Advisory Logs",    subtitle: "Audit trail & farmer sync",   icon: <Clock className="w-4 h-4" />,     scope: "cooperative", scopeLabel: "FPO Hub" },
];

interface DistrictAgroClimate {
  tempC: number;
  humidityPct: number;
  thi: number;
  heatStressRisk: "Moderate" | "High" | "Severe";
  ndviScore: number;
  ndviStatus: string;
  dominantCropResidue: string;
}

const DISTRICT_CLIMATE: Record<string, DistrictAgroClimate> = {
  Coimbatore: { tempC: 32.5, humidityPct: 62, thi: 81.2, heatStressRisk: "Moderate", ndviScore: 0.58, ndviStatus: "Moderate Green Canopy (Kongu Foothills)", dominantCropResidue: "Paddy Straw & Maize Stover" },
  Salem:      { tempC: 35.0, humidityPct: 58, thi: 84.1, heatStressRisk: "Severe",   ndviScore: 0.46, ndviStatus: "Low-to-Moderate (Shevaroy Rain Shadow)",    dominantCropResidue: "Sorghum Kadbi & Tapioca Waste" },
  Erode:      { tempC: 34.2, humidityPct: 65, thi: 85.0, heatStressRisk: "Severe",   ndviScore: 0.62, ndviStatus: "High Green Biomass (Bhavani River Basin)",   dominantCropResidue: "Sugarcane Tops & Paddy Straw" },
  Tiruppur:   { tempC: 33.0, humidityPct: 55, thi: 80.5, heatStressRisk: "Moderate", ndviScore: 0.43, ndviStatus: "Arid Rainfed Belt (Kangayam Grassland)",     dominantCropResidue: "Sorghum Stover & Cotton Residues" },
  Namakkal:   { tempC: 34.0, humidityPct: 59, thi: 83.2, heatStressRisk: "High",     ndviScore: 0.49, ndviStatus: "Semi-Arid Mixed Cropping Zone",              dominantCropResidue: "Groundnut Haulms & Paddy Straw" },
  Dindigul:   { tempC: 31.8, humidityPct: 68, thi: 81.0, heatStressRisk: "Moderate", ndviScore: 0.65, ndviStatus: "Dense Agro-Forestry / Fodder Belt",           dominantCropResidue: "Maize Stover & Pulses Straw" },
};

const DEMO_PRESET_PADDY_PATH = "/demo/paddy_straw_raw.jpg";
const DEMO_PRESET_SILAGE_PATH = "/demo/napier_silage_chopped.jpg";

/* ─────────────────────────── RESULT TYPE ─────────────────────────── */

interface ResultState {
  methaneReduction: number;
  baselineYmFactor?: number;
  optimizedYmFactor?: number;
  annualCo2eTonnes?: number;
  carbonCreditInr?: number;
  costSaving: number;
  milkYieldBoost: number;
  visualFodderAssessment?: VisualFodderAssessment;
  heatStressAdvisory?: string;
  optimizedTmr: OptimizedTmrIngredient[];
  explanationEn: string;
  explanationTa: string;
  isMockFallback?: boolean;
  modelUsed?: string;
}

const DEFAULT_RESULT: ResultState = {
  methaneReduction: 24.5,
  baselineYmFactor: 6.5,
  optimizedYmFactor: 4.8,
  annualCo2eTonnes: 9.8,
  carbonCreditInr: 14994,
  costSaving: 165,
  milkYieldBoost: 1.8,
  visualFodderAssessment: {
    detected_roughage_quality: "High-Lignin Dry Paddy Straw Mixed with Pellets",
    chaffing_status: "Partially Chaffed (>10 cm length)",
    lignin_risk_level: "Moderate-High (ADF 44%)",
    visual_recommendation: "Chop roughage below 3 cm and mix with green silage to minimize rumen retention time and curb enteric methanogenesis.",
  },
  heatStressAdvisory: "THI is 81.2 (Moderate Heat Stress in Coimbatore). Cattle experience slight heat load. Ration fortified with 100g Sodium Bicarbonate rumen buffer and 150g Bypass Fat to protect milk fat percentage.",
  optimizedTmr: [
    { ingredient: "Super Napier (CO-5) Silage",          percentage: 45, weight_kg: 18.0 },
    { ingredient: "Sorghum Stover (Chopped)",             percentage: 20, weight_kg: 8.0  },
    { ingredient: "Groundnut Oil Cake",                   percentage: 15, weight_kg: 6.0  },
    { ingredient: "De-oiled Rice Bran",                   percentage: 12, weight_kg: 4.8  },
    { ingredient: "TANUVAS Mineral Mixture & Bypass Fat", percentage: 8,  weight_kg: 3.2  },
  ],
  explanationEn: "Replacing 40% untreated paddy straw with silage and balanced bypass fat shifts the ruminal Methane Conversion Factor (Ym) from 6.5% down to 4.8%. This cuts enteric methane emissions by 24.5% while increasing digestibility. Feeding 150g rumen bypass fat daily improves energy density without inhibiting rumen cellulolytic bacteria.",
  explanationTa: "வழக்கமான வைக்கோலை குறைத்து, CO-5 கோ-புல் சைலேஜ் மற்றும் டானுவாஸ் தாது உப்பு கலவை சேர்ப்பதால் மாட்டின் செரிமானம் மேம்பட்டு, மீத்தேன் வாயு வெளியேற்றம் 24.5% குறைகிறது. இதன் மூலம் தினசரி 1.8 லிட்டர் வரை கூடுதல் பால் உற்பத்தி பெறலாம்.",
  isMockFallback: true,
};

const TMR_COLORS = [
  { bg: "bg-emerald-500", dot: "#10b981" },
  { bg: "bg-teal-500",    dot: "#14b8a6" },
  { bg: "bg-amber-500",   dot: "#f59e0b" },
  { bg: "bg-cyan-500",    dot: "#06b6d4" },
  { bg: "bg-indigo-400",  dot: "#818cf8" },
  { bg: "bg-rose-500",    dot: "#f43f5e" },
];

/* ─────────────────────────── UI COMPONENTS ─────────────────────────── */

function KpiCard({ label, value, sub, color, icon, className = "" }: {
  label: string; value: string; sub?: string;
  color: "emerald" | "teal" | "cyan" | "amber";
  icon: React.ReactNode; className?: string;
}) {
  const colorMap = {
    emerald: {
      border: "border-emerald-500/30 dark:border-emerald-500/25",
      text: "text-emerald-700 dark:text-emerald-400",
      label: "text-emerald-800 dark:text-emerald-400",
      kpi: "kpi-emerald",
      bg: "bg-emerald-50/80 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:to-slate-900",
    },
    teal: {
      border: "border-teal-500/30 dark:border-teal-500/25",
      text: "text-teal-700 dark:text-teal-300",
      label: "text-teal-800 dark:text-teal-400",
      kpi: "kpi-teal",
      bg: "bg-teal-50/80 dark:bg-gradient-to-br dark:from-teal-950/40 dark:to-slate-900",
    },
    cyan: {
      border: "border-cyan-500/30 dark:border-cyan-500/25",
      text: "text-cyan-700 dark:text-cyan-300",
      label: "text-cyan-800 dark:text-cyan-400",
      kpi: "kpi-cyan",
      bg: "bg-cyan-50/80 dark:bg-gradient-to-br dark:from-cyan-950/40 dark:to-slate-900",
    },
    amber: {
      border: "border-amber-500/30 dark:border-amber-500/25",
      text: "text-amber-800 dark:text-amber-300",
      label: "text-amber-900 dark:text-amber-400",
      kpi: "kpi-amber",
      bg: "bg-amber-50/80 dark:bg-gradient-to-br dark:from-amber-950/30 dark:to-slate-900",
    },
  }[color];
  return (
    <div className={`${colorMap.kpi} rounded-2xl border ${colorMap.border} ${colorMap.bg} p-4 sm:p-5 flex flex-col gap-2 ${className}`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${colorMap.label}`}>
        {icon}{label}
      </div>
      <div className={`text-2xl sm:text-3xl font-black font-mono ${colorMap.text}`}>{value}</div>
      {sub && <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, action }: {
  icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "emerald" | "amber" | "teal" | "red" }) {
  const c = {
    slate:   "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300",
    emerald: "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400",
    amber:   "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400",
    teal:    "bg-teal-50 border-teal-300 text-teal-800 dark:bg-teal-500/10 dark:border-teal-500/30 dark:text-teal-400",
    red:     "bg-red-50 border-red-300 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${c}`}>
      {children}
    </span>
  );
}

function FormInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition";

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 p-5 space-y-3">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-2.5 w-20" />
    </div>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

export default function Home() {
  /* form state */
  const [district,        setDistrict]        = useState("Coimbatore");
  const [breed,           setBreed]           = useState("Crossbred Jersey");
  const [herdSize,        setHerdSize]        = useState(8);
  const [dailyMilkYield,  setDailyMilkYield]  = useState(14.5);
  const [farmerName,      setFarmerName]      = useState("R. Murugesan");
  const [selectedFeeds,   setSelectedFeeds]   = useState(["Paddy Straw (Un-chaffed)", "Commercial Cattle Pellets", "Green Fodder (Local Grass / Maize)"]);

  /* vision state */
  const [fodderImageBase64, setFodderImageBase64] = useState<string | null>(null);
  const [fodderMimeType,    setFodderMimeType]    = useState("image/jpeg");
  const [fodderPresetType,  setFodderPresetType]  = useState<string | null>(null);
  const [imageFileName,     setImageFileName]     = useState<string | null>(null);
  const [isDragging,        setIsDragging]        = useState(false);
  const [analysisPhase,     setAnalysisPhase]     = useState<string>("");
  const [lastAssessedSample,setLastAssessedSample]= useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* voice state */
  const [voiceLang,       setVoiceLang]       = useState<"ta-IN" | "en-IN">("ta-IN");
  const [isListening,     setIsListening]     = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceToast,      setVoiceToast]      = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  /* theme & view scope state */
  const [isDark,          setIsDark]          = useState(true);
  const [viewScope,       setViewScope]       = useState<"farmer" | "cooperative">("farmer");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  /* ui state */
  const [activeTab,     setActiveTab]     = useState<TabId>("optimizer");
  const [showMathModal, setShowMathModal] = useState(false);
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);
  const [activeLang,    setActiveLang]    = useState<"en" | "ta">("en");
  const [copied,        setCopied]        = useState(false);
  const [isSpeaking,    setIsSpeaking]    = useState(false);

  /* result state */
  const [result, setResult] = useState<ResultState | null>(DEFAULT_RESULT);

  /* logs state */
  const [logs,        setLogs]        = useState<AdvisoryLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const climate = DISTRICT_CLIMATE[district] || DISTRICT_CLIMATE["Coimbatore"];

  /* Initialize theme from localStorage */
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("smartdairy_theme") : null;
    if (saved === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    } else {
      setIsDark(true);
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (typeof document !== "undefined") {
        if (next) {
          document.documentElement.classList.remove("light");
          document.documentElement.classList.add("dark");
          document.body.classList.remove("light");
          document.body.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.classList.add("light");
          document.body.classList.remove("dark");
          document.body.classList.add("light");
        }
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("smartdairy_theme", next ? "dark" : "light");
      }
      return next;
    });
  };

  useEffect(() => {
    fetchRecentLogs(8).then(setLogs).catch(console.error).finally(() => setLoadingLogs(false));
  }, []);

  const regionalSummary = computeRegionalCarbonAggregates(logs);

  /* ── Handlers ── */
  const toggleFeed = (f: string) =>
    setSelectedFeeds(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const loadFarm = (farm: FarmRecord) => {
    setFarmerName(farm.farmerName); setDistrict(farm.district);
    setBreed(farm.breed); setHerdSize(farm.herdSize); setDailyMilkYield(farm.dailyMilkYieldLiters);
    const matched = FEED_OPTIONS.filter(o => farm.currentFeedMix.some(f => o.toLowerCase().includes(f.toLowerCase())));
    setSelectedFeeds(matched.length > 0 ? matched : ["Paddy Straw (Un-chaffed)", "Commercial Cattle Pellets"]);
  };

  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid image (JPG, PNG, or WebP).");
      return;
    }
    setImageFileName(file.name);
    setFodderMimeType("image/jpeg");
    setFodderPresetType(null);

    // Downscale client-side via canvas to max 1200px to ensure fast, failure-proof uploads
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setFodderImageBase64(compressed);
        } else {
          setFodderImageBase64(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const applyPreset = async (type: "paddy" | "silage") => {
    if (type === "paddy") {
      setImageFileName("Untreated_Paddy_Straw_Raw.jpg");
      setFodderMimeType("image/jpeg");
      setFodderPresetType("untreated_paddy_straw");
      // Instant visual update (0ms latency)
      setFodderImageBase64(DEMO_PRESET_PADDY_PATH);
      if (!selectedFeeds.includes("Paddy Straw (Un-chaffed)"))
        setSelectedFeeds(p => [...p, "Paddy Straw (Un-chaffed)"]);
      try {
        const res = await fetch(DEMO_PRESET_PADDY_PATH);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) setFodderImageBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch {
        setFodderImageBase64(DEMO_PRESET_PADDY_PATH);
      }
    } else {
      setImageFileName("Chaffed_Green_Napier_Silage.jpg");
      setFodderMimeType("image/jpeg");
      setFodderPresetType("chaffed_green_napier_silage");
      // Instant visual update (0ms latency)
      setFodderImageBase64(DEMO_PRESET_SILAGE_PATH);
      if (!selectedFeeds.includes("Green Fodder (Local Grass / Maize)"))
        setSelectedFeeds(p => [...p, "Green Fodder (Local Grass / Maize)"]);
      try {
        const res = await fetch(DEMO_PRESET_SILAGE_PATH);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) setFodderImageBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch {
        setFodderImageBase64(DEMO_PRESET_SILAGE_PATH);
      }
    }
  };

  const clearImage = () => {
    setFodderImageBase64(null);
    setFodderPresetType(null);
    setImageFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* voice */
  const parseVoice = useCallback((text: string) => {
    const l = text.toLowerCase();
    let d = district, b = breed, h = herdSize, y = dailyMilkYield;
    const feeds: string[] = [];
    if (l.includes("ஈரோடு") || l.includes("erode")) d = "Erode";
    else if (l.includes("சேலம்") || l.includes("salem")) d = "Salem";
    else if (l.includes("கோயம்புத்தூர்") || l.includes("coimbatore")) d = "Coimbatore";
    else if (l.includes("நாமக்கல்") || l.includes("namakkal")) d = "Namakkal";
    else if (l.includes("திருப்பூர்") || l.includes("tiruppur")) d = "Tiruppur";
    else if (l.includes("திண்டுக்கல்") || l.includes("dindigul")) d = "Dindigul";
    if (l.includes("ஜெர்சி") || l.includes("jersey")) b = "Crossbred Jersey";
    else if (l.includes("காங்கேயம்") || l.includes("kangayam")) b = "Native/Kangayam";
    else if (l.includes("hf") || l.includes("holstein")) b = "Crossbred HF";
    else if (l.includes("எருமை") || l.includes("buffalo")) b = "Murrah / Local Buffalo";
    const nums = text.match(/\d+(\.\d+)?/g);
    if (nums?.[0]) { const n = parseFloat(nums[0]); if (n >= 1 && n <= 50) h = Math.round(n); }
    if (nums?.[1]) { const n = parseFloat(nums[1]); if (n >= 2 && n <= 40) y = n; }
    if (l.includes("வைக்கோல்") || l.includes("straw") || l.includes("paddy")) feeds.push("Paddy Straw (Un-chaffed)");
    if (l.includes("கடலை") || l.includes("groundnut") || l.includes("cake")) feeds.push("Groundnut Oil Cake");
    if (l.includes("பசுந்தீவனம்") || l.includes("green") || l.includes("grass")) feeds.push("Green Fodder (Local Grass / Maize)");
    setDistrict(d); setBreed(b); setHerdSize(h); setDailyMilkYield(y);
    if (feeds.length > 0) setSelectedFeeds(feeds);
    setVoiceToast(`✓ Auto-filled: ${d} · ${b} · ${h} cows · ${y}L/day`);
    setTimeout(() => setVoiceToast(null), 4000);
  }, [district, breed, herdSize, dailyMilkYield]);

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Web Speech API not supported. Use Simulate Tamil Voice demo button."); return; }
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); return; }
    const r = new SR();
    r.lang = voiceLang; r.continuous = false; r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setVoiceTranscript(t); parseVoice(t); setIsListening(false); };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r; r.start();
  };

  const simulateTamil = () => {
    const demo = "என்னிடம் ஈரோட்டில் 4 கலப்பின ஜெர்சி மாடுகள் உள்ளன, தினமும் 12 லிட்டர் பால் கறக்கிறது, வைக்கோல் மற்றும் கடலை புண்ணாக்கு போடுகிறேன்";
    setVoiceTranscript(demo); parseVoice(demo);
  };

  /* analyze */
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisPhase("Scanning fodder chop length & physical structure...");
    const phaseTimer1 = setTimeout(() => {
      setAnalysisPhase("Estimating lignification index & ADF risk level...");
    }, 700);
    const phaseTimer2 = setTimeout(() => {
      setAnalysisPhase("Synthesizing IPCC Tier-2 ruminal methane impact...");
    }, 1400);

    try {
      const res = await fetch("/api/advisors/feed-optimizer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district, breed, herdSize, dailyMilkYieldLiters: dailyMilkYield,
          currentFeedMix: selectedFeeds, thiScore: climate.thi, ndviIndex: climate.ndviScore,
          fodderImageBase64: fodderImageBase64 || undefined,
          fodderMimeType: fodderMimeType || undefined,
          fodderPresetType: fodderPresetType || undefined,
          imageFileName: imageFileName || undefined,
        }),
      });
      if (!res.ok) throw new Error("API route returned error status");
      const data = await res.json();
      const newResult: ResultState = {
        methaneReduction: data.methane_reduction_percentage,
        baselineYmFactor: data.baseline_ym_factor || 6.5,
        optimizedYmFactor: data.optimized_ym_factor || 4.8,
        annualCo2eTonnes: data.annual_co2e_saved_tonnes || 9.8,
        carbonCreditInr: data.estimated_annual_carbon_credit_inr || 14994,
        costSaving: data.cost_saving_per_day_inr,
        milkYieldBoost: data.milk_yield_boost_liters,
        visualFodderAssessment: data.visual_fodder_assessment,
        heatStressAdvisory: data.heat_stress_advisory,
        optimizedTmr: data.optimized_tmr,
        explanationEn: data.explanation_en,
        explanationTa: data.explanation_ta,
        isMockFallback: data.isMockFallback,
        modelUsed: data.modelUsed,
      };
      setResult(newResult);
      setLastAssessedSample(fodderPresetType || imageFileName || "Uploaded Sample");
      const saved = await logAdvisoryResult({
        queryData: { farmerName: farmerName || "Anonymous TN Farmer", district, breed, herdSize, dailyMilkYieldLiters: dailyMilkYield, currentFeedMix: selectedFeeds, thiScore: climate.thi, ndviIndex: climate.ndviScore },
        methaneReductionPct: newResult.methaneReduction, baselineYmFactor: newResult.baselineYmFactor,
        optimizedYmFactor: newResult.optimizedYmFactor, annualCo2eTonnes: newResult.annualCo2eTonnes,
        carbonCreditInr: newResult.carbonCreditInr, optimizedTmr: newResult.optimizedTmr,
        costSavingInr: newResult.costSaving, milkYieldBoostLiters: newResult.milkYieldBoost,
        visualFodderAssessment: newResult.visualFodderAssessment,
        heatStressAdvisory: newResult.heatStressAdvisory,
        explanationEn: newResult.explanationEn, explanationTa: newResult.explanationTa,
        timestamp: new Date().toISOString(),
      });
      setLogs(p => [saved, ...p.slice(0, 7)]);
      if (activeTab === "optimizer") setActiveTab("optimizer");
    } catch (err) {
      console.warn("Using offline scientific fallback for fodder analysis:", err);
      const isNapier = fodderPresetType === "chaffed_green_napier_silage" || (imageFileName && /silage|napier|green/i.test(imageFileName));
      const fallbackResult: ResultState = {
        methaneReduction: isNapier ? 28.5 : 24.2,
        baselineYmFactor: isNapier ? 6.1 : 6.6,
        optimizedYmFactor: 4.8,
        annualCo2eTonnes: Number((((herdSize * 42.0 * (isNapier ? 28.5 : 24.2) / 24.0 * 365) / 1000 * 84) / 1000).toFixed(2)),
        carbonCreditInr: Math.round(Number((((herdSize * 42.0 * (isNapier ? 28.5 : 24.2) / 24.0 * 365) / 1000 * 84) / 1000).toFixed(2)) * 1530),
        costSaving: Math.round(herdSize * 24.5 + dailyMilkYield * 7.0),
        milkYieldBoost: 3.2,
        visualFodderAssessment: isNapier ? {
          detected_roughage_quality: "High-Protein Fresh Green Silage (CO-4 / CO-5 Hybrid Napier)",
          chaffing_status: "Optimal Precision Chaffing (2–3 cm uniform cut)",
          lignin_risk_level: "Low to Moderate (ADF < 30%)",
          visual_recommendation: "Excellent green fodder physical structure. Rapid ruminal fermentation promotes propionate synthesis over acetate, curbing enteric methane intensity by ~28%. Blend with 120g rumen bypass fat and TANUVAS mineral mix to maximize peak lactation.",
        } : {
          detected_roughage_quality: "Un-treated Mature Paddy Straw (Oryza sativa)",
          chaffing_status: "Whole Dry Stalks (>18 cm un-chaffed)",
          lignin_risk_level: "Severe Lignification (ADF > 52%)",
          visual_recommendation: "Long un-chaffed paddy straw prolongs rumen retention time to >68 hours, drastically increasing enteric methanogenesis. Immediate mechanical chaffing to 2-3 cm and 40% substitution with green Napier silage is recommended.",
        },
        heatStressAdvisory: `⚠️ Heat Stress Advisory (THI ${climate.thi} in ${district}): Cattle experiencing heat load. Added 100g Sodium Bicarbonate rumen buffer and 120g Bypass Fat to stabilize rumen fermentation and sustain peak milk yield.`,
        optimizedTmr: [
          { ingredient: "Super Napier (CO-5) Silage (Moisture-Rich Cooling Forage)", percentage: 42, weight_kg: 7.4 },
          { ingredient: "Chaffed Sorghum Stover (Urea-Molasses Treated)", percentage: 22, weight_kg: 3.9 },
          { ingredient: "Groundnut Oil Cake & Cottonseed Meal", percentage: 18, weight_kg: 3.2 },
          { ingredient: "De-oiled Rice Bran (DORB)", percentage: 12, weight_kg: 2.1 },
          { ingredient: "TANUVAS Area Specific Mineral Mix + Sodium Bicarb + Rumen Bypass Fat", percentage: 6, weight_kg: 1.1 },
        ],
        explanationEn: `For your ${herdSize} ${breed} cattle in ${district} (THI: ${climate.thi}), shifting from un-chaffed roughages to a balanced TMR curbs enteric methane intensity by ${isNapier ? 28.5 : 24.2}%.`,
        explanationTa: `${district} மாவட்டத்தில் உள்ள உங்கள் ${herdSize} ${breed} மாடுகளுக்கு, வழக்கமான வைக்கோலை மாற்றி சரிவிகித உணவு (TMR) வழங்குவதால் குடலில் செரிமானம் மேம்பட்டு மீத்தேன் வாயு குறைகிறது.`,
        isMockFallback: true,
      };
      setResult(fallbackResult);
      setLastAssessedSample(fodderPresetType || imageFileName || "Uploaded Sample");
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      setIsAnalyzing(false);
      setAnalysisPhase("");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(activeLang === "en" ? result.explanationEn : result.explanationTa);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleTTS = () => {
    if (!result || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(activeLang === "en" ? result.explanationEn : result.explanationTa);
    u.lang = activeLang === "en" ? "en-IN" : "ta-IN"; u.rate = 0.95;
    u.onend = () => setIsSpeaking(false); u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true); window.speechSynthesis.speak(u);
  };

  const thiColor = climate.thi >= 84 ? "text-red-400" : climate.thi >= 78 ? "text-amber-400" : "text-emerald-400";
  const thiBorderColor = climate.thi >= 84 ? "border-red-500/30" : climate.thi >= 78 ? "border-amber-500/30" : "border-emerald-500/30";
  const thiRisk = climate.heatStressRisk;

  /* ═══════════════════════════════════════════════════════════════ */
  /* NAVIGATION & DRAWER HANDLERS */
  /* ═══════════════════════════════════════════════════════════════ */

  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  const handleTabSelect = (tabId: TabId) => {
    setActiveTab(tabId);
    const tabObj = TABS.find(t => t.id === tabId);
    if (tabObj && tabObj.scope !== viewScope) {
      setViewScope(tabObj.scope);
    }
    setIsMobileNavOpen(false);
  };

  const handleScopeSelect = (scope: "farmer" | "cooperative") => {
    setViewScope(scope);
    if (scope === "farmer" && (activeTab === "carbon" || activeTab === "history")) {
      setActiveTab("optimizer");
    } else if (scope === "cooperative" && (activeTab === "optimizer" || activeTab === "climate")) {
      setActiveTab("carbon");
    }
  };

  /* Navigation Sidebar Content (shared between Desktop Sidebar & Mobile Drawer) */
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Mobile Header with Close button */}
        {isMobile && (
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-md flex-shrink-0">
                <Leaf className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                  SmartDairy AI
                </div>
                <div className="text-[10px] text-slate-500 leading-none">Tamil Nadu Dairy Intelligence</div>
              </div>
            </div>
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Close navigation drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Perspective Scope Switcher */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Perspective Scope
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
              {viewScope === "farmer" ? "Individual" : "Cooperative"}
            </span>
          </div>
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 gap-1">
            <button
              onClick={() => handleScopeSelect("farmer")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                viewScope === "farmer"
                  ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Farmer</span>
            </button>
            <button
              onClick={() => handleScopeSelect("cooperative")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                viewScope === "cooperative"
                  ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>FPO Hub</span>
            </button>
          </div>
        </div>

        {/* Navigation Tab Links */}
        <div className="space-y-4">
          {/* Group: Farmer Tools */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Farmer Workflows
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-mono">
                Micro
              </span>
            </div>
            {TABS.filter(t => t.scope === "farmer").map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? "nav-item-active"
                      : "nav-item-inactive"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      {tab.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate leading-tight">{tab.label}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{tab.subtitle}</div>
                    </div>
                  </div>
                  {tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      isActive
                        ? "bg-emerald-500/25 text-emerald-800 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Group: Cooperative & FPO Hub */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Cooperative &amp; FPO Hub
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-teal-50 text-teal-700 border border-teal-300 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20 font-mono">
                Macro
              </span>
            </div>
            {TABS.filter(t => t.scope === "cooperative").map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isActive
                      ? "nav-item-active"
                      : "nav-item-inactive"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isActive
                        ? "bg-teal-500/20 text-teal-700 dark:text-teal-300"
                        : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      {tab.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate leading-tight">{tab.label}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{tab.subtitle}</div>
                    </div>
                  </div>
                  {tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      isActive
                        ? "bg-teal-500/25 text-teal-800 dark:text-teal-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Demo Farm Quick-Pick */}
          <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Judges Demo Farms
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">1-Click Load</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SAMPLE_FARMS.map(f => {
                const isSelected = farmerName === f.farmerName;
                return (
                  <button
                    key={f.farmId}
                    onClick={() => {
                      loadFarm(f);
                      handleTabSelect("optimizer");
                    }}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate leading-tight">{f.farmerName.split(" ")[1] || f.farmerName}</div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">{f.district} &bull; {f.herdSize} cows</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
        {/* Current Agro-Climate Pill */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{district}</div>
              <div className="text-[10px] text-slate-500 font-mono">{climate.tempC}°C &bull; {climate.humidityPct}% RH</div>
            </div>
          </div>
          <Badge color={climate.thi >= 84 ? "red" : climate.thi >= 78 ? "amber" : "emerald"}>
            THI {climate.thi}
          </Badge>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 transition shadow-sm font-semibold"
        >
          <div className="flex items-center gap-2">
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-cyan-600" />}
            <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {isDark ? "Dark" : "Light"}
          </span>
        </button>

        {/* Live Status Indicator */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="pulse-dot animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {isFirebaseConfigured ? "Firestore Live" : "Local Mode"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">AI Cup &apos;26</span>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════ */
  /* RENDER */
  /* ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors">

      {/* ── MOBILE NAVIGATION DRAWER & BACKDROP (SANDWICH BAR) ── */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 bottom-0 left-0 w-[300px] max-w-[85vw] bg-white dark:bg-[#070d19] border-r border-slate-200 dark:border-slate-800 z-50 p-4 shadow-2xl mobile-drawer lg:hidden overflow-y-auto"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── DESKTOP SIDE NAVIGATION DRAWER (PERMANENT) ── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 sticky top-0 h-screen border-r border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#070d19]/95 backdrop-blur-xl z-40 p-4 app-sidebar overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800/80 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
            <Leaf className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                SmartDairy AI
              </span>
              <Badge color="emerald">v2.0</Badge>
            </div>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Kumaraguru × EDF Initiative</p>
          </div>
        </div>

        {renderSidebarContent(false)}
      </aside>

      {/* ── MAIN CONTENT VIEWPORT ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">

        {/* ── TOP HEADER BAR ── */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#060b14]/90 backdrop-blur-xl h-16 flex items-center justify-between px-4 sm:px-6 transition-colors">
          {/* Left: Mobile sandwich bar + logo / Desktop breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile Sandwich Bar (Hamburger) */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-sm"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Branding */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
                <Leaf className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                SmartDairy AI
              </span>
            </div>

            {/* Desktop Active Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                {viewScope === "farmer" ? "🧑‍🌾 Individual Farmer" : "🏛️ FPO Cooperative Hub"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {activeTabObj.icon}
                {activeTabObj.label}
              </span>
              <Badge color={activeTabObj.scope === "farmer" ? "emerald" : "teal"}>
                {activeTabObj.badge || activeTabObj.scopeLabel}
              </Badge>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* District Agro-climate chip */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
              <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-300">{district}</span>
              <span className="text-slate-400 dark:text-slate-600">&bull;</span>
              <span className={`font-mono font-bold ${climate.thi >= 84 ? "text-red-600 dark:text-red-400" : climate.thi >= 78 ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                THI {climate.thi}
              </span>
            </div>

            {/* IPCC Math button */}
            <button
              onClick={() => setShowMathModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>IPCC Formulas</span>
            </button>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/25 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="pulse-dot animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden md:inline">{isFirebaseConfigured ? "Firestore Live" : "Local Mode"}</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-sm"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-cyan-600" />}
            </button>
          </div>
        </header>

        {/* ── HERO BANNER ── */}
        <div className="hero-banner border-b border-slate-200 dark:border-slate-800/40 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-[#060b14] dark:via-[#071322] dark:to-[#060b14] transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge color="emerald"><Sparkles className="w-2.5 h-2.5" />AI Builder Cup 2026 · Sustainability Track</Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Methane Reduction &amp; Precision Feed Optimizer
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-medium">
                AI-powered TMR formulation for Tamil Nadu dairy systems · Gemini 2.5 Multimodal · Earth Engine THI · BigQuery Carbon Credits
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {[
                { v: "1,500+", l: "Entrepreneurs", c: "text-emerald-700 dark:text-emerald-400" },
                { v: "6 Districts", l: "Tamil Nadu", c: "text-teal-700 dark:text-teal-300" },
                { v: "IPCC Tier-2", l: "Carbon Science", c: "text-amber-700 dark:text-amber-400" },
              ].map(s => (
                <div key={s.l} className="text-center px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 min-w-[85px] shadow-sm">
                  <div className={`text-sm sm:text-base font-black font-mono ${s.c}`}>{s.v}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PERSPECTIVE BANNER ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-1 w-full">
          <div className="glass-card rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />Dashboard Perspective:
              </span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 gap-1">
                <button
                  onClick={() => handleScopeSelect("farmer")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${viewScope === "farmer"
                      ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md shadow-emerald-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
                >
                  <User className="w-3.5 h-3.5" />
                  🧑‍🌾 Individual Farmer Mode
                </button>
                <button
                  onClick={() => handleScopeSelect("cooperative")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${viewScope === "cooperative"
                      ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950 shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  🏛️ FPO Cooperative / Regional Hub
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-400 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-xl px-3 py-2">
              {viewScope === "farmer" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                  <span>Micro View: Personalized ration formulation &amp; vision scan for <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{farmerName}</strong> ({district} &bull; {herdSize} cows).</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 animate-pulse" />
                  <span>Macro View: Regional carbon credit pooling across <strong className="text-teal-700 dark:text-teal-300 font-bold">6 Districts &amp; 1,500+ Farmers</strong> for voluntary carbon buyers.</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1">
          <AnimatePresence mode="wait">

          {/* ═══════════════════ TAB 1: AI OPTIMIZER ═══════════════════ */}
          {activeTab === "optimizer" && (
            <motion.div key="optimizer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── LEFT PANEL: Input Form ── */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
                    <SectionHeader
                      icon={<Layers className="w-4 h-4" />}
                      title="Herd & Feed Profiler"
                      subtitle="Enter farm details or load a sample preset"
                      action={
                        <button onClick={() => loadFarm(SAMPLE_FARMS[0])} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition px-3 py-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700">
                          <RefreshCw className="w-3.5 h-3.5" />Reset
                        </button>
                      }
                    />

                    {/* Quick demo farms */}
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Award className="w-3 h-3 text-amber-500 dark:text-amber-400" />Quick Demo Farms (1-Click Load)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {SAMPLE_FARMS.slice(0, 4).map(farm => (
                          <button
                            key={farm.farmId}
                            onClick={() => loadFarm(farm)}
                            className="glass-card text-left p-2.5 rounded-xl transition hover:border-emerald-500/50"
                          >
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{farm.farmerName}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{farm.district}</span>
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">{farm.dailyMilkYieldLiters}L/d</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800/80" />

                    {/* Form fields */}
                    <form onSubmit={e => { e.preventDefault(); handleAnalyze(); }} className="space-y-4">
                      <FormInput label="Farmer / Enterprise Name">
                        <input type="text" value={farmerName} onChange={e => setFarmerName(e.target.value)} placeholder="e.g. Murugesan Dairy" className={inputCls} />
                      </FormInput>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormInput label="District (Tamil Nadu)">
                          <select value={district} onChange={e => setDistrict(e.target.value)} className={inputCls}>
                            {DISTRICTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </FormInput>

                        <FormInput label="Predominant Breed">
                          <select value={breed} onChange={e => setBreed(e.target.value)} className={inputCls}>
                            {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </FormInput>
                      </div>

                      {/* Sliders */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400">Herd Size</span>
                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">{herdSize} <span className="text-[10px] text-slate-500 font-normal">cows</span></span>
                          </div>
                          <input type="range" min={1} max={50} value={herdSize} onChange={e => setHerdSize(parseInt(e.target.value))} />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400">Daily Milk</span>
                            <span className="text-sm font-black text-teal-700 dark:text-teal-400 font-mono">{dailyMilkYield} <span className="text-[10px] text-slate-500 font-normal">L/d</span></span>
                          </div>
                          <input type="range" min={2} max={35} step={0.5} value={dailyMilkYield} onChange={e => setDailyMilkYield(parseFloat(e.target.value))} />
                        </div>
                      </div>

                      {/* Feed checkboxes */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] uppercase font-bold tracking-wider text-slate-700 dark:text-slate-400">Current Feed Mix</label>
                          <span className="text-[10px] text-slate-600 dark:text-slate-500 font-mono">{selectedFeeds.length} items</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {FEED_OPTIONS.map(feed => {
                            const on = selectedFeeds.includes(feed);
                            return (
                              <button key={feed} type="button" onClick={() => toggleFeed(feed)}
                                className={`text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 border transition-all
                                  ${on
                                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-200"
                                    : "bg-white border-slate-300 text-slate-700 hover:border-emerald-300 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700"}`}>
                                <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border flex-shrink-0 transition
                                  ${on ? "bg-emerald-600 border-emerald-500 text-white dark:bg-emerald-500 dark:border-emerald-400 dark:text-slate-950" : "border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"}`}>
                                  {on && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="truncate">{feed}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button type="submit" disabled={isAnalyzing}
                        className="btn-cta w-full py-3.5 rounded-2xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                        {isAnalyzing
                          ? <><RefreshCw className="w-4 h-4 animate-spin" />Analyzing with Gemini 2.5…</>
                          : <><Sparkles className="w-4 h-4" />Analyze &amp; Optimize Ration</>}
                      </button>
                    </form>
                  </div>
                </div>

                {/* ── RIGHT PANEL: AI Results ── */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-base">Advisory Recommendations</span>
                      {result && (
                        <Badge color={result.isMockFallback ? "slate" : "emerald"}>
                          {result.isMockFallback ? "IPCC Fallback" : "Gemini 2.5 Live"}
                        </Badge>
                      )}
                    </div>
                    <button onClick={() => setShowMathModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 font-medium transition self-start sm:self-auto">
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />IPCC Tier-2 Math
                    </button>
                  </div>

                  {/* 4 KPI Cards */}
                  {isAnalyzing ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                  ) : result ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <KpiCard
                        label="CH4 Cut" value={`-${result.methaneReduction}%`}
                        sub={`Ym ${result.baselineYmFactor}% → ${result.optimizedYmFactor}%`}
                        color="emerald" icon={<TrendingDown className="w-3 h-3" />}
                      />
                      <KpiCard
                        label="Daily Savings" value={`₹${result.costSaving}`}
                        sub={`~₹${(result.costSaving * 30).toLocaleString()}/month`}
                        color="teal" icon={<IndianRupee className="w-3 h-3" />}
                      />
                      <KpiCard
                        label="Yield Boost" value={`+${result.milkYieldBoost} L`}
                        sub="Butterfat & SNF boost"
                        color="cyan" icon={<TrendingUp className="w-3 h-3" />}
                      />
                      <KpiCard
                        label="Carbon Credits" value={`₹${(result.carbonCreditInr || 14994).toLocaleString()}`}
                        sub={`${result.annualCo2eTonnes || 9.8} tCO2e/yr`}
                        color="amber" icon={<Globe className="w-3 h-3" />}
                      />
                    </div>
                  ) : null}

                  {/* TMR Ration Card */}
                  {result && !isAnalyzing && (
                    <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-400" />
                          Optimized Total Mixed Ration (TMR)
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono">100% Balanced</span>
                      </div>

                      {/* Stacked bar */}
                      <div className="h-4 rounded-full overflow-hidden flex bg-slate-800 p-0.5 gap-px">
                        {result.optimizedTmr.map((item, i) => (
                          <div
                            key={i}
                            className={`${TMR_COLORS[i % TMR_COLORS.length].bg} h-full rounded-sm bar-segment first:rounded-l-full last:rounded-r-full`}
                            style={{ width: `${item.percentage}%` }}
                            title={`${item.ingredient}: ${item.percentage}%`}
                          />
                        ))}
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-900/80">
                            <tr className="border-b border-slate-800">
                              <th className="text-left py-2.5 px-3.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Ingredient</th>
                              <th className="text-center py-2.5 px-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Ratio</th>
                              <th className="text-right py-2.5 px-3.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Daily / Cow</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {result.optimizedTmr.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-800/30 transition">
                                <td className="py-2.5 px-3.5 text-slate-200 font-medium flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TMR_COLORS[i % TMR_COLORS.length].bg}`} />
                                  <span className="truncate">{item.ingredient}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center font-mono text-slate-400">{item.percentage}%</td>
                                <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400">{item.weight_kg} kg</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Gemini Advisory Card */}
                  {result && !isAnalyzing && (
                    <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4 border border-emerald-500/15">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-sm text-slate-200">Gemini Precision Advisory</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-0.5">
                            {(["en", "ta"] as const).map(lang => (
                              <button key={lang} onClick={() => setActiveLang(lang)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition
                                  ${activeLang === lang ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"}`}>
                                {lang === "en" ? "English" : "தமிழ்"}
                              </button>
                            ))}
                          </div>
                          <button onClick={handleTTS} title="Read advisory aloud"
                            className={`p-2 rounded-xl border transition text-sm
                              ${isSpeaking ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"}`}>
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button onClick={handleCopy} title="Copy to clipboard"
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition">
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                        {activeLang === "en" ? result.explanationEn : result.explanationTa}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-2 border-t border-slate-800/60">
                        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                        Tip: Mechanically chop dry roughage to 2–3 cm to prevent feed sorting and minimize rumen retention time.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ TAB 2: CLIMATE & VISION ═══════════════════ */}
          {activeTab === "climate" && (
            <motion.div key="climate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              <SectionHeader
                icon={<Satellite className="w-4 h-4" />}
                title="Agro-Climatic Intelligence & Multimodal Vision Scanner"
                subtitle="Live District THI · Earth Engine NDVI · Gemini 2.5 Vision Fodder Diagnostic · Bilingual Voice"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── THI & Climate Column ── */}
                <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      District Heat Stress &amp; THI Index
                    </h3>
                    <Badge color="teal">Sentinel-3 Context</Badge>
                  </div>

                  <FormInput label="Select District">
                    <select value={district} onChange={e => setDistrict(e.target.value)} className={inputCls}>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d} (THI: {DISTRICT_CLIMATE[d]?.thi})</option>)}
                    </select>
                  </FormInput>

                  {/* THI Gauge */}
                  <div className={`rounded-2xl border ${thiBorderColor} bg-slate-900/50 p-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Temperature-Humidity Index</span>
                      <span className={`text-3xl font-black font-mono ${thiColor}`}>{climate.thi}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${climate.thi >= 84 ? "bg-red-500" : climate.thi >= 78 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, Math.max(10, ((climate.thi - 60) / 35) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>&lt;72 Comfort</span><span>72–78 Mild</span><span>78–84 Moderate</span><span>&gt;84 Severe</span>
                    </div>
                    <div className="pt-1">
                      <Badge color={climate.thi >= 84 ? "red" : climate.thi >= 78 ? "amber" : "emerald"}>
                        {thiRisk} Heat Stress
                      </Badge>
                    </div>
                  </div>

                  {/* Ambient stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Ambient Temp</div>
                        <div className="text-base font-bold font-mono text-slate-200">{climate.tempC}°C</div>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Relative Humidity</div>
                        <div className="text-base font-bold font-mono text-slate-200">{climate.humidityPct}% RH</div>
                      </div>
                    </div>
                  </div>

                  {/* NDVI Card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />Earth Engine NDVI Canopy
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-400">{climate.ndviScore}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-500 via-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${climate.ndviScore * 100}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400">{climate.ndviStatus}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-emerald-400" />Dominant residue: {climate.dominantCropResidue}
                    </p>
                  </div>

                  {/* 6 Districts grid */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">All 6 TN Districts</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {DISTRICTS.map(d => {
                        const c = DISTRICT_CLIMATE[d];
                        const active = d === district;
                        return (
                          <button key={d} onClick={() => setDistrict(d)}
                            className={`p-2.5 rounded-xl border text-left transition
                              ${active ? "border-emerald-500/50 bg-emerald-950/30" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}>
                            <div className={`text-xs font-bold ${active ? "text-emerald-300" : "text-slate-300"}`}>{d}</div>
                            <div className={`text-[10px] font-mono font-bold mt-0.5 ${c.thi >= 84 ? "text-red-400" : c.thi >= 78 ? "text-amber-400" : "text-emerald-400"}`}>
                              THI {c.thi}
                            </div>
                            <div className="text-[9px] text-slate-500">NDVI {c.ndviScore}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bilingual Voice Assistant */}
                  <div className="rounded-2xl bg-emerald-50/70 dark:bg-gradient-to-br dark:from-slate-900 dark:to-emerald-950/20 border border-emerald-300 dark:border-emerald-500/25 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Bilingual Voice Input (தமிழ் / English)</span>
                      </div>
                      <Badge color="emerald">Tamil Nadu Dialect</Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Speak your cattle count, breed, milk yield, or fodder in Tamil or English to auto-populate the farm regime.
                    </p>
                    <div className="flex items-center gap-2">
                      <select value={voiceLang} onChange={e => setVoiceLang(e.target.value as any)}
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-900 dark:text-slate-300 focus:outline-none font-medium">
                        <option value="ta-IN">தமிழ் (IN)</option>
                        <option value="en-IN">English (IN)</option>
                      </select>
                      <button onClick={startListening}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition flex-shrink-0
                          ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950"}`}>
                        {isListening ? <><MicOff className="w-3.5 h-3.5" />Stop</> : <><Mic className="w-3.5 h-3.5" />Speak</>}
                      </button>
                    </div>
                    <button onClick={simulateTamil}
                      className="w-full py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-emerald-300 dark:border-slate-700 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />Simulate Tamil Voice Command (Demo)
                    </button>
                    {voiceTranscript && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-400 italic">
                        &ldquo;{voiceTranscript}&rdquo;
                      </div>
                    )}
                    <AnimatePresence>
                      {voiceToast && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 p-2 rounded-xl text-center font-bold">
                          {voiceToast}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Multimodal Fodder Vision Scanner Column ── */}
                <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5 border border-teal-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-teal-900 dark:text-teal-200 text-sm flex items-center gap-2">
                        <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />Multimodal Fodder Vision Scanner
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Deep computer vision analysis of roughage chop length, fiber coarseness &amp; lignin risk
                      </p>
                    </div>
                    <Badge color="teal">gemini-2.5-flash</Badge>
                  </div>

                  {/* Dropzone / Preview */}
                  {!fodderImageBase64 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f) processImageFile(f);
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group ${
                        isDragging
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 ring-4 ring-teal-500/20"
                          : "border-slate-300 hover:border-teal-500 dark:border-slate-700 dark:hover:border-teal-500/50 bg-slate-50 dark:bg-slate-950/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
                      }`}
                    >
                      <UploadCloud className="w-9 h-9 mx-auto text-slate-500 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mb-2" />
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
                        Snap or drag &amp; drop fodder photo
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                        High-res JPG, PNG, WebP · Auto-optimized via client canvas
                      </p>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden border border-teal-400 dark:border-teal-500/30 bg-white dark:bg-slate-950 shadow-sm">
                      <div className="relative">
                        <img src={fodderImageBase64} alt="Fodder Preview" className="w-full h-44 object-cover" />
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <button
                            onClick={clearImage}
                            title="Remove image"
                            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-red-600 text-white backdrop-blur-sm transition shadow-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {fodderPresetType && (
                          <div className="absolute bottom-2 left-2">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                              {fodderPresetType === "untreated_paddy_straw" ? "🌾 Test Sample: Paddy Straw" : "🌿 Test Sample: Napier Silage"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate max-w-[220px]">
                            {imageFileName || "Loaded Fodder Sample"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                              {lastAssessedSample === (fodderPresetType || imageFileName) ? "Scan Diagnosis Complete" : "Ready for Gemini 2.5 Vision Analysis"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] font-bold text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-300 transition"
                        >
                          Change Photo
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                      </div>
                    </div>
                  )}

                  {/* 1-Click Demo Presets with Real Photos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">
                        1-Click Judges Test Presets (Photorealistic)
                      </p>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        2 Field Samples
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() => applyPreset("paddy")}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden ${
                          fodderPresetType === "untreated_paddy_straw"
                            ? "bg-amber-50 border-amber-400 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500/60 dark:text-slate-100 ring-2 ring-amber-400/50 shadow-sm"
                            : "bg-white border-slate-300 hover:border-amber-400 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-amber-500/30"
                        }`}
                      >
                        <img src={DEMO_PRESET_PADDY_PATH} alt="Paddy Straw" className="w-14 h-14 rounded-xl object-cover border border-amber-300 dark:border-amber-500/40 flex-shrink-0 shadow-sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate flex items-center gap-1.5">
                            <span>Untreated Paddy Straw</span>
                            {fodderPresetType === "untreated_paddy_straw" && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium leading-tight">
                            ADF 52% &bull; Coarse stalks &bull; High lignin
                          </p>
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono font-bold">
                            Raw Crop Residue
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={() => applyPreset("silage")}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden ${
                          fodderPresetType === "chaffed_green_napier_silage"
                            ? "bg-emerald-50 border-emerald-400 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-500/60 dark:text-slate-100 ring-2 ring-emerald-400/50 shadow-sm"
                            : "bg-white border-slate-300 hover:border-emerald-400 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-emerald-500/30"
                        }`}
                      >
                        <img src={DEMO_PRESET_SILAGE_PATH} alt="Napier Silage" className="w-14 h-14 rounded-xl object-cover border border-emerald-300 dark:border-emerald-500/40 flex-shrink-0 shadow-sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate flex items-center gap-1.5">
                            <span>Chaffed Napier Silage</span>
                            {fodderPresetType === "chaffed_green_napier_silage" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium leading-tight">
                            2-3 cm &bull; Low lignin &bull; Rapid digestion
                          </p>
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                            Optimized Roughage
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* ── Prominent AI Analysis Trigger for Multimodal Scanner ── */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md ${
                        isAnalyzing
                          ? "bg-slate-800 text-slate-400 cursor-not-allowed opacity-90"
                          : fodderImageBase64
                          ? "btn-cta text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400/50 hover:scale-[1.01]"
                          : "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-500/25"
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950 dark:text-emerald-300" />
                          <span>{analysisPhase || "Gemini 2.5 Flash Vision Scanning Fodder..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>
                            {fodderImageBase64
                              ? "✨ Run Gemini 2.5 Multimodal Fodder Diagnosis"
                              : "✨ Run Multimodal Vision Diagnostic"}
                          </span>
                        </>
                      )}
                    </button>

                    {fodderImageBase64 ? (
                      <div className="flex items-center justify-between text-[11px] px-1 text-slate-500 font-medium">
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {imageFileName || "Fodder Photo Loaded"} (Ready)
                        </span>
                        <span className="font-mono text-slate-400">Gemini 2.5 Multimodal Vision</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                        Upload a photo above or pick a test preset, then click above to diagnose chop length &amp; lignin.
                      </p>
                    )}
                  </div>

                  {/* ── Vision Assessment Result Card (Directly Below CTA) ── */}
                  {result?.visualFodderAssessment && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-teal-300 dark:border-teal-500/30 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          Fodder Vision Assessment Result
                        </span>
                        <Badge color={result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("severe") || result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("high") ? "amber" : "emerald"}>
                          {result.visualFodderAssessment.lignin_risk_level}
                        </Badge>
                      </div>

                      {/* Lignin & ADF Risk Meter */}
                      <div className="bg-white dark:bg-slate-950/70 border border-teal-200 dark:border-teal-500/20 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Acid Detergent Fiber (ADF) &amp; Lignin Level</span>
                          <span className="font-mono font-bold text-teal-800 dark:text-teal-300">
                            {result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("52%") ? "52% ADF (Extreme)" : result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("30%") ? "28% ADF (Optimal)" : "42% ADF (Moderate)"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("severe") || result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("high")
                                ? "bg-gradient-to-r from-amber-400 to-red-500"
                                : "bg-gradient-to-r from-emerald-400 to-teal-500"
                            }`}
                            style={{
                              width: result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("52%")
                                ? "85%"
                                : result.visualFodderAssessment.lignin_risk_level.toLowerCase().includes("30%")
                                ? "35%"
                                : "60%",
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                          <span>&lt;32% Silage</span>
                          <span>38% Safe Cut</span>
                          <span>&gt;48% Heavy Lignification</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block">Roughage Quality</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{result.visualFodderAssessment.detected_roughage_quality}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block">Chaffing Status</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{result.visualFodderAssessment.chaffing_status}</span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold block mb-1">Dietary Recommendation</span>
                        <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                          {result.visualFodderAssessment.visual_recommendation}
                        </p>
                      </div>

                      {/* Direct Action: Jump to AI Optimizer */}
                      <button
                        onClick={() => setActiveTab("optimizer")}
                        className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <span>Apply Vision Diagnosis to Low-Methane Ration (TMR)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ TAB 3: CARBON DASHBOARD ═══════════════════ */}
          {activeTab === "carbon" && (
            <motion.div key="carbon" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              <SectionHeader
                icon={<BarChart3 className="w-4 h-4" />}
                title="BigQuery Regional Carbon Accounting & FPO Aggregator"
                subtitle="IPCC Tier-2 Enteric Accounting Schema · Tamil Nadu Cooperative Carbon Ledger · GWP-20 = 84×"
                action={<Badge color="emerald"><Database className="w-2.5 h-2.5" />smartdairy_analytics.carbon_accounting_logs</Badge>}
              />

              {/* 4 BigQuery KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="CH4 Abated / Year" value={`${regionalSummary.totalCh4AbatedKgYear.toLocaleString()} kg`}
                  sub="Direct enteric fermentation reduction" color="emerald" icon={<Wind className="w-3 h-3" />}
                />
                <KpiCard
                  label="CO2e Saved (GWP-20)" value={`${regionalSummary.totalCo2eTonnesYear.toLocaleString()} t`}
                  sub="84× biogenic methane factor" color="teal" icon={<Globe className="w-3 h-3" />}
                />
                <KpiCard
                  label="FPO Carbon Revenue" value={`₹${regionalSummary.totalCarbonCreditInrYear.toLocaleString()}`}
                  sub="@ $18/tCO2e (~₹1,530/t)" color="amber" icon={<IndianRupee className="w-3 h-3" />}
                />
                <KpiCard
                  label="Cattle Screened" value={`${regionalSummary.totalCattle} heads`}
                  sub={`Across ${regionalSummary.totalFarms} active farm logs`} color="cyan" icon={<Activity className="w-3 h-3" />}
                />
              </div>

              {/* District Leaderboard */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  District-wise Methane Intensity &amp; Carbon Leaderboard
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regionalSummary.districtBreakdown.map((item, i) => (
                    <div key={item.district} className="glass-card rounded-2xl p-4 space-y-3 hover:border-emerald-500/40 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                          <span className="font-bold text-sm text-slate-200">{item.district}</span>
                        </div>
                        <Badge color="emerald">-{item.avgMethaneCutPct}% CH4</Badge>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, item.avgMethaneCutPct * 3.5)}%` }} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-slate-600 dark:text-slate-400 font-medium">Farms / Cattle</div>
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-200">{item.farmsCount} · {item.cattleCount} cows</div>
                        </div>
                        <div>
                          <div className="text-slate-600 dark:text-slate-400 font-medium">CO2e Saved</div>
                          <div className="font-mono font-bold text-teal-700 dark:text-teal-300">{item.co2eTonnes} t</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">Est. FPO Carbon Credits</span>
                        <span className="font-mono font-bold text-amber-800 dark:text-amber-400 text-sm">₹{item.carbonCreditInr.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IPCC Science Explainer */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-emerald-500/15 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />IPCC Tier-2 Enteric Methodology
                  </h3>
                  <button onClick={() => setShowMathModal(true)}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 font-bold flex items-center gap-1 transition">
                    Full Equations <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Methane Factor (Ym)</p>
                    <div className="flex items-center gap-2 font-mono font-bold">
                      <span className="text-red-600 dark:text-red-400">6.5%</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">4.8%</span>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 leading-tight">IPCC Tier-2 gross energy loss converted into methane.</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">GWP-20 Factor</p>
                    <div className="font-mono font-bold text-teal-700 dark:text-teal-300">84× Biogenic CH4</div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 leading-tight">IPCC AR6 standard for short-lived climate pollutants.</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Carbon Credit Valuation</p>
                    <div className="font-mono font-bold text-amber-800 dark:text-amber-400">₹1,530 / tCO2e ($18)</div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-500 leading-tight">Voluntary carbon credit marketplace benchmark.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ TAB 4: ADVISORY LOGS ═══════════════════ */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              <SectionHeader
                icon={<Clock className="w-4 h-4" />}
                title="Recent Advisory &amp; Optimization Logs"
                subtitle="Synchronized with Firebase Firestore · Auto-logged across Tamil Nadu dairy clusters"
                action={<Badge color="slate"><Database className="w-2.5 h-2.5" />{isFirebaseConfigured ? "Firestore Live" : "Local Database"}</Badge>}
              />

              {/* Mobile cards view */}
              <div className="block sm:hidden space-y-3">
                {loadingLogs ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="glass-panel rounded-2xl p-4 space-y-2">
                      <div className="skeleton h-3 w-32" />
                      <div className="skeleton h-3 w-24" />
                      <div className="skeleton h-3 w-40" />
                    </div>
                  ))
                ) : logs.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">No logs yet. Run the optimizer to create one!</div>
                ) : logs.map((log, idx) => (
                  <div key={log.id || idx} className="glass-panel rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">{log.queryData.farmerName || "TN Rural Dairy"}</span>
                      <Badge color="slate">{log.queryData.district}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{log.queryData.breed} · {log.queryData.herdSize} cattle</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 text-center border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">CH4 Cut</div>
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">-{log.methaneReductionPct}%</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 text-center border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Daily Savings</div>
                        <div className="font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">₹{log.costSavingInr}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 text-center border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">CO2e / Year</div>
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-300 text-sm">{log.annualCo2eTonnes || 9.8} t</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 text-center border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">FPO Credits</div>
                        <div className="font-mono font-bold text-amber-800 dark:text-amber-400 text-sm">₹{(log.carbonCreditInr || 14994).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden sm:block glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        {["Farmer / Farm", "District", "Breed & Herd", "CH4 Cut", "Annual CO2e", "FPO Credits", "Savings / Day", "Yield Impact"].map(h => (
                          <th key={h} className="py-3.5 px-4 text-left text-slate-700 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                      {loadingLogs ? (
                        [...Array(4)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(8)].map((_, j) => (
                              <td key={j} className="py-4 px-4"><div className="skeleton h-3" style={{ width: `${60 + Math.random() * 40}%` }} /></td>
                            ))}
                          </tr>
                        ))
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-500 font-medium">
                            No advisory logs yet. Use the AI Optimizer to generate one!
                          </td>
                        </tr>
                      ) : logs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-200 whitespace-nowrap">
                            {log.queryData.farmerName || "TN Rural Dairy"}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge color="slate">{log.queryData.district}</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-400 font-medium">{log.queryData.breed} ({log.queryData.herdSize})</td>
                          <td className="py-3.5 px-4">
                            <Badge color="emerald">-{log.methaneReductionPct}%</Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-300">{log.annualCo2eTonnes || 9.8} t</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-800 dark:text-amber-400">₹{(log.carbonCreditInr || 14994).toLocaleString()}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">₹{log.costSavingInr}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-800 dark:text-cyan-400">+{log.milkYieldBoostLiters || 1.5} L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>SmartDairy AI &bull; AI Builder Cup 2026 &bull; Sustainability &amp; Social Impact Track</div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {["Kumaraguru Institutions × EDF", "Gemini 2.5 Multimodal", "BigQuery Carbon Ledger", "Google Cloud Run"].map((t, i, a) => (
              <React.Fragment key={t}>
                <span className="hover:text-slate-700 dark:hover:text-slate-400 transition cursor-default">{t}</span>
                {i < a.length - 1 && <span className="text-slate-300 dark:text-slate-800">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </footer>

      </div>

      {/* ── IPCC MATH MODAL ── */}
      <AnimatePresence>
        {showMathModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowMathModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">IPCC Tier-2 &amp; TANUVAS Rumen Chemistry</h3>
                </div>
                <button onClick={() => setShowMathModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs leading-relaxed text-slate-300">
                {[
                  {
                    color: "text-emerald-400", title: "1. IPCC Tier-2 Enteric Methane Equation",
                    code: "CH4 (kg/animal/day) = [ GEI (MJ/day) × (Ym / 100) ] / 55.65 MJ/kg",
                    body: <ul className="list-disc list-inside space-y-1.5 text-slate-400 mt-2">
                      <li><strong className="text-slate-200">GEI (Gross Energy Intake):</strong> ~125–150 MJ/cow/day based on DMI 10–14 kg/day</li>
                      <li><strong className="text-slate-200">Ym:</strong> % of gross energy converted to methane in the rumen</li>
                    </ul>
                  },
                  {
                    color: "text-amber-400", title: "2. Baseline vs. Optimized Ym Transition",
                    body: <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="p-3 rounded-xl bg-slate-900 border border-red-500/20">
                        <span className="text-[10px] text-red-400 font-bold uppercase block">Untreated Paddy Straw Baseline</span>
                        <div className="text-xl font-black font-mono text-red-300 mt-1">Ym ≈ 6.5 – 6.8%</div>
                        <p className="text-[10px] text-slate-500 mt-1">High lignin (ADF &gt;48%) slows passage rate, sustaining methanogenic archaea.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase block">Optimized TMR + Silage + Fat</span>
                        <div className="text-xl font-black font-mono text-emerald-300 mt-1">Ym ≈ 4.7 – 4.9%</div>
                        <p className="text-[10px] text-slate-500 mt-1">Propionate pathway + rumen bypass fat drops hydrogen availability.</p>
                      </div>
                    </div>
                  },
                  {
                    color: "text-cyan-400", title: "3. Carbon Accounting & Voluntary Carbon Credits",
                    body: <ul className="list-disc list-inside space-y-2 text-slate-400 mt-2">
                      <li><strong className="text-slate-200">GWP-20 = 84×</strong> biogenic methane (IPCC AR6 short-lived climate pollutants standard)</li>
                      <li><strong className="text-slate-200">Annual Abatement:</strong> Herd of {herdSize} cows saving ~42g CH4/day/cow = <strong className="text-emerald-300">{result?.annualCo2eTonnes || 9.8} tCO2e/year</strong></li>
                      <li><strong className="text-slate-200">Carbon Credit Valuation:</strong> $18/tCO2e (~₹1,530/tonne) → <strong className="text-amber-300">₹{(result?.carbonCreditInr || 14994).toLocaleString()}/year</strong></li>
                    </ul>
                  },
                  {
                    color: "text-teal-400", title: "4. TANUVAS Rumen Buffer Chemistry (Heat Stress)",
                    code: "NaHCO3 + H+ → Na+ + H2O + CO2 ↑  (Maintains Rumen pH > 6.2)",
                    body: <p className="text-slate-400 mt-2">When THI &gt;78, salivary bicarbonate output drops due to panting. Adding 100–150g Sodium Bicarbonate + 150g Rumen Bypass Fat prevents Sub-Acute Ruminal Acidosis (SARA) and protects milk fat percentage.</p>
                  },
                ].map(s => (
                  <div key={s.title} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className={`font-bold uppercase tracking-wider text-[11px] ${s.color}`}>{s.title}</div>
                    {s.code && <pre className="font-mono bg-slate-900 p-2.5 rounded-xl text-teal-300 text-[11px] overflow-x-auto whitespace-pre-wrap">{s.code}</pre>}
                    {s.body}
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6 pt-2">
                <button onClick={() => setShowMathModal(false)}
                  className="btn-cta w-full py-3 rounded-2xl font-bold text-slate-950 text-sm">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
