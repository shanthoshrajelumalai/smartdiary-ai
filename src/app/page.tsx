"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Leaf,
  TrendingDown,
  TrendingUp,
  IndianRupee,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Award,
  Layers,
  ChevronRight,
  Info,
  MapPin,
  Clock,
  Volume2,
} from "lucide-react";
import {
  SAMPLE_FARMS,
  FarmRecord,
  AdvisoryLogRecord,
  OptimizedTmrIngredient,
  fetchRecentLogs,
  logAdvisoryResult,
  isFirebaseConfigured,
} from "@/lib/firebase";

const DISTRICTS = [
  "Coimbatore",
  "Salem",
  "Erode",
  "Tiruppur",
  "Namakkal",
  "Dindigul",
];

const BREEDS = [
  "Crossbred Jersey",
  "Crossbred HF",
  "Native/Kangayam",
  "Murrah / Local Buffalo",
];

const FEED_OPTIONS = [
  "Paddy Straw (Un-chaffed)",
  "Sorghum Stubble / Dry Kadbi",
  "Groundnut Oil Cake",
  "Green Fodder (Local Grass / Maize)",
  "Commercial Cattle Pellets",
  "De-oiled Rice Bran (DORB)",
  "Cottonseed Meal",
];

export default function Home() {
  // Form State
  const [district, setDistrict] = useState<string>("Coimbatore");
  const [breed, setBreed] = useState<string>("Crossbred Jersey");
  const [herdSize, setHerdSize] = useState<number>(8);
  const [dailyMilkYield, setDailyMilkYield] = useState<number>(14.5);
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([
    "Paddy Straw (Un-chaffed)",
    "Commercial Cattle Pellets",
    "Green Fodder (Local Grass / Maize)",
  ]);
  const [farmerName, setFarmerName] = useState<string>("R. Murugesan");

  // Output State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeLang, setActiveLang] = useState<"en" | "ta">("en");
  const [copied, setCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Active AI Result State
  const [result, setResult] = useState<{
    methaneReduction: number;
    costSaving: number;
    milkYieldBoost: number;
    optimizedTmr: OptimizedTmrIngredient[];
    explanationEn: string;
    explanationTa: string;
    isMockFallback?: boolean;
  } | null>({
    methaneReduction: 24.5,
    costSaving: 165,
    milkYieldBoost: 1.8,
    optimizedTmr: [
      { ingredient: "Super Napier (CO-5) Silage", percentage: 45, weight_kg: 18.0 },
      { ingredient: "Sorghum Stover (Chopped)", percentage: 20, weight_kg: 8.0 },
      { ingredient: "Groundnut Oil Cake", percentage: 15, weight_kg: 6.0 },
      { ingredient: "De-oiled Rice Bran", percentage: 12, weight_kg: 4.8 },
      { ingredient: "TANUVAS Mineral Mixture & Bypass Fat", percentage: 8, weight_kg: 3.2 },
    ],
    explanationEn:
      "Replacing 40% untreated paddy straw with silage and balanced bypass fat cuts enteric methane emissions by ~25% while increasing digestibility. Feeding 150g rumen bypass fat daily improves energy density without inhibiting rumen cellulolytic bacteria.",
    explanationTa:
      "வழக்கமான வைக்கோலை குறைத்து, CO-5 கோ-புல் சைலேஜ் மற்றும் டானுவாஸ் தாது உப்பு கலவை சேர்ப்பதால் மாட்டின் செரிமானம் மேம்பட்டு, மீத்தேன் வாயு வெளியேற்றம் 24.5% குறைகிறது. இதன் மூலம் தினசரி 1.8 லிட்டர் வரை கூடுதல் பால் உற்பத்தி பெறலாம்.",
    isMockFallback: true,
  });

  // Recent Logs State
  const [logs, setLogs] = useState<AdvisoryLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  // Load Initial Logs
  useEffect(() => {
    async function loadData() {
      try {
        const fetched = await fetchRecentLogs(6);
        setLogs(fetched);
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoadingLogs(false);
      }
    }
    loadData();
  }, []);

  const handleToggleFeed = (feedItem: string) => {
    if (selectedFeeds.includes(feedItem)) {
      setSelectedFeeds(selectedFeeds.filter((item) => item !== feedItem));
    } else {
      setSelectedFeeds([...selectedFeeds, feedItem]);
    }
  };

  const handleLoadSampleFarm = (farm: FarmRecord) => {
    setFarmerName(farm.farmerName);
    setDistrict(farm.district);
    setBreed(farm.breed);
    setHerdSize(farm.herdSize);
    setDailyMilkYield(farm.dailyMilkYieldLiters);

    // Map feeds
    const matched = FEED_OPTIONS.filter((opt) =>
      farm.currentFeedMix.some((f) => opt.toLowerCase().includes(f.toLowerCase()))
    );
    setSelectedFeeds(matched.length > 0 ? matched : ["Paddy Straw (Un-chaffed)", "Commercial Cattle Pellets"]);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/advisors/feed-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district,
          breed,
          herdSize,
          dailyMilkYieldLiters: dailyMilkYield,
          currentFeedMix: selectedFeeds,
        }),
      });

      if (!response.ok) {
        throw new Error("Advisory generation failed");
      }

      const data = await response.json();

      const newResult = {
        methaneReduction: data.methane_reduction_percentage,
        costSaving: data.cost_saving_per_day_inr,
        milkYieldBoost: data.milk_yield_boost_liters,
        optimizedTmr: data.optimized_tmr,
        explanationEn: data.explanation_en,
        explanationTa: data.explanation_ta,
        isMockFallback: data.isMockFallback,
      };

      setResult(newResult);

      // Save to Firestore or Local fallback
      const savedLog = await logAdvisoryResult({
        queryData: {
          farmerName: farmerName || "Anonymous TN Farmer",
          district,
          breed,
          herdSize,
          dailyMilkYieldLiters: dailyMilkYield,
          currentFeedMix: selectedFeeds,
        },
        methaneReductionPct: newResult.methaneReduction,
        optimizedTmr: newResult.optimizedTmr,
        costSavingInr: newResult.costSaving,
        milkYieldBoostLiters: newResult.milkYieldBoost,
        explanationEn: newResult.explanationEn,
        explanationTa: newResult.explanationTa,
        timestamp: new Date().toISOString(),
      });

      setLogs((prev) => [savedLog, ...prev.slice(0, 5)]);
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy =
      activeLang === "en" ? result.explanationEn : result.explanationTa;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextToSpeech = () => {
    if (!result || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = activeLang === "en" ? result.explanationEn : result.explanationTa;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = activeLang === "en" ? "en-IN" : "ta-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Color map for TMR ingredients
  const getIngredientColor = (idx: number) => {
    const colors = [
      "bg-emerald-500",
      "bg-teal-500",
      "bg-amber-500",
      "bg-cyan-500",
      "bg-emerald-400",
      "bg-indigo-400",
    ];
    return colors[idx % colors.length];
  };

  return (
    <main className="min-h-screen text-slate-100 pb-16">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 border-b border-emerald-900/40 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
              <Leaf className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                  SmartDairy AI
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
                  v1.0 MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Inspired by Kumaraguru Institutions & Environmental Defense Fund (EDF) Field Initiative
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Gemini 2.5 Flash</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-medium">Cloud Run Ready</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{isFirebaseConfigured ? "Firestore Live" : "Local State Ready"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 2. HERO IMPACT BANNER */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Builder Cup 2026 • Sustainability & Social Impact Track</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Methane Reduction & Precision Feed Optimizer
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Empowering smallholder dairy farmers across Tamil Nadu with localized Total Mixed Ration (TMR) formulations. Cut enteric methane intensity, boost milk yield, and slash feeding costs using native agro-byproducts.
              </p>
            </div>

            {/* Quick Demo Farm Bar */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl md:min-w-[300px] flex flex-col justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Quick Test Bench (Judges Demo)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_FARMS.map((farm) => (
                  <button
                    key={farm.farmId}
                    type="button"
                    onClick={() => handleLoadSampleFarm(farm)}
                    className="text-left text-xs p-2 rounded-lg bg-slate-800/60 hover:bg-emerald-950/50 hover:border-emerald-500/40 border border-slate-700/60 transition group"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                      {farm.farmerName}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{farm.district}</span>
                      <span className="text-emerald-400 font-mono">{farm.dailyMilkYieldLiters}L</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-800/80">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">1,500+</div>
                <div className="text-xs text-slate-400">Entrepreneurs Screened in TN</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">6 Districts</div>
                <div className="text-xs text-slate-400">Coimbatore, Salem, Erode, Tiruppur...</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">3-Fold Impact</div>
                <div className="text-xs text-slate-400">Higher Yield • Lower Cost • -25% Methane</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. MAIN DASHBOARD: TWO COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: INTERACTIVE FEED & METHANE OPTIMIZER */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800">
              <div className="flex items-center justify-between pb-5 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    Herd & Feed Regime Profiler
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Input current farm metrics to compute enteric methane baseline
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadSampleFarm(SAMPLE_FARMS[0])}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze();
                }}
                className="space-y-5 pt-5"
              >
                {/* Farmer Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Farmer / Enterprise Name
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="e.g. Murugesan Farm"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                  />
                </div>

                {/* District Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    District (Tamil Nadu)
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition cursor-pointer"
                  >
                    {DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist} District
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cattle Breed */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Predominant Cattle Breed
                  </label>
                  <select
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition cursor-pointer"
                  >
                    {BREEDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Herd Size & Milk Yield Dual Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Herd Size */}
                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-300">Herd Size</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {herdSize} cattle
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={herdSize}
                      onChange={(e) => setHerdSize(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Daily Milk Yield */}
                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-300">Daily Milk Yield</span>
                      <span className="text-sm font-bold text-teal-400 font-mono">
                        {dailyMilkYield} L/day
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={35}
                      step={0.5}
                      value={dailyMilkYield}
                      onChange={(e) => setDailyMilkYield(parseFloat(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Current Feed Mix Checkboxes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Current Feed Ration Mix</span>
                    <span className="text-[11px] text-slate-400">Select all present</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FEED_OPTIONS.map((feed) => {
                      const isChecked = selectedFeeds.includes(feed);
                      return (
                        <button
                          key={feed}
                          type="button"
                          onClick={() => handleToggleFeed(feed)}
                          className={`text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 border transition ${
                            isChecked
                              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                              isChecked
                                ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold"
                                : "border-slate-600 bg-slate-800"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{feed}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full relative group overflow-hidden py-3.5 px-6 rounded-2xl font-bold text-slate-950 text-sm shadow-xl transition-all duration-300 disabled:opacity-60 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_auto] hover:bg-right glow-emerald-strong"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Consulting Gemini 2.5 Flash...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>Analyze & Optimize Ration</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: REAL-TIME GEMINI AI ADVISORY OUTPUT */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key="result-panel"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* KPI Top Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Methane Card */}
                    <div className="glass-panel p-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400 flex items-center gap-1">
                          <Leaf className="w-3.5 h-3.5" />
                          Methane Cut
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                          Enteric CH4
                        </span>
                      </div>
                      <div className="text-3xl font-black text-emerald-400 font-mono">
                        -{result.methaneReduction}%
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Intensity reduction per Liter of milk produced
                      </p>
                    </div>

                    {/* Cost Saving Card */}
                    <div className="glass-panel p-5 rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs uppercase font-semibold tracking-wider text-teal-400 flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5" />
                          Daily Savings
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                          ₹ / Day
                        </span>
                      </div>
                      <div className="text-3xl font-black text-teal-300 font-mono">
                        ₹{result.costSaving}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        ~₹{(result.costSaving * 30).toLocaleString()} projected monthly savings
                      </p>
                    </div>

                    {/* Yield Boost Card */}
                    <div className="glass-panel p-5 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs uppercase font-semibold tracking-wider text-cyan-400 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Milk Yield Boost
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                          L / Animal
                        </span>
                      </div>
                      <div className="text-3xl font-black text-cyan-300 font-mono">
                        +{result.milkYieldBoost} L
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Higher fat & SNF retention in butterfat
                      </p>
                    </div>
                  </div>

                  {/* Visual Ration Breakdown: Progress Bar + Table */}
                  <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        Recommended Total Mixed Ration (TMR) Formulation
                      </h3>
                      <span className="text-xs text-slate-400">Target: 100% Balanced Dry Matter</span>
                    </div>

                    {/* Horizontal Stacked Progress Bar */}
                    <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-800 p-0.5 gap-0.5">
                      {result.optimizedTmr.map((item, idx) => (
                        <div
                          key={idx}
                          style={{ width: `${item.percentage}%` }}
                          title={`${item.ingredient}: ${item.percentage}%`}
                          className={`${getIngredientColor(idx)} h-full rounded-sm transition-all hover:opacity-85`}
                        />
                      ))}
                    </div>

                    {/* Ration Ingredient Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">TMR Component</th>
                            <th className="py-2.5 px-3 text-center">Share (%)</th>
                            <th className="py-2.5 px-3 text-right">Daily Feed / Cow</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {result.optimizedTmr.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition">
                              <td className="py-2.5 px-3 font-medium text-slate-200 flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${getIngredientColor(idx)}`} />
                                <span>{item.ingredient}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                                {item.percentage}%
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                                {item.weight_kg} kg
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI Advisory Box with Language Toggle */}
                  <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 bg-slate-900/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm text-slate-200">
                          Gemini 2.5 Flash Field Advisory
                        </span>
                        {result.isMockFallback && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Scientific Preset
                          </span>
                        )}
                      </div>

                      {/* Language Toggle + Actions */}
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
                          <button
                            type="button"
                            onClick={() => setActiveLang("en")}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              activeLang === "en"
                                ? "bg-emerald-500 text-slate-950"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveLang("ta")}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              activeLang === "ta"
                                ? "bg-emerald-500 text-slate-950"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            தமிழ் (Tamil)
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleTextToSpeech}
                          title="Listen to advisory"
                          className={`p-2 rounded-xl border transition ${
                            isSpeaking
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
                              : "bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800"
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleCopy}
                          title="Copy guidance"
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line font-normal">
                      {activeLang === "en" ? result.explanationEn : result.explanationTa}
                    </p>

                    <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
                      <Info className="w-3.5 h-3.5" />
                      <span>
                        Recommended feeding protocol: Chop forages to 2–3 cm length and mix with mineral premix to prevent selective sorting.
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 4. LIVE FIRESTORE LOGS / HISTORY TABLE */}
        <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Recent Advisory & Optimization Logs</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Synchronized with Firebase Firestore (with local in-memory fallback)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-logged across Tamil Nadu dairy clusters</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Farmer / Farm</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Breed & Herd</th>
                  <th className="py-3 px-4 text-center">Methane Cut</th>
                  <th className="py-3 px-4 text-center">Savings / Day</th>
                  <th className="py-3 px-4 text-right">Yield Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading advisory logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No advisory logs generated yet. Use the optimizer above to create one!
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {log.queryData.farmerName || "TN Rural Dairy"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                          {log.queryData.district}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {log.queryData.breed} ({log.queryData.herdSize} heads)
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold">
                          -{log.methaneReductionPct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-teal-400">
                        ₹{log.costSavingInr}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-cyan-400">
                        +{log.milkYieldBoostLiters || 1.5} L
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. FOOTER */}
        <footer className="border-t border-slate-800/60 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            SmartDairy AI • AI Builder Cup 2026 • Sustainability & Social Impact
          </div>
          <div className="flex items-center gap-4">
            <span>Kumaraguru Institutions & EDF Field Partner</span>
            <span>•</span>
            <span>Next.js 14 App Router</span>
            <span>•</span>
            <span>Google Cloud Run</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
