import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

export interface FarmRecord {
  farmId: string;
  farmerName: string;
  district: string;
  breed: string;
  herdSize: number;
  dailyMilkYieldLiters: number;
  currentFeedMix: string[];
  thiScore?: number;
  ndviIndex?: number;
}

export interface OptimizedTmrIngredient {
  ingredient: string;
  percentage: number;
  weight_kg: number;
}

export interface VisualFodderAssessment {
  detected_roughage_quality: string;
  chaffing_status: string;
  lignin_risk_level: string;
  visual_recommendation: string;
}

export interface AdvisoryLogRecord {
  id?: string;
  queryData: {
    farmerName?: string;
    district: string;
    breed: string;
    herdSize: number;
    dailyMilkYieldLiters: number;
    currentFeedMix: string[];
    thiScore?: number;
    ndviIndex?: number;
  };
  methaneReductionPct: number;
  baselineYmFactor?: number;
  optimizedYmFactor?: number;
  annualCo2eTonnes?: number;
  carbonCreditInr?: number;
  optimizedTmr: OptimizedTmrIngredient[];
  costSavingInr: number;
  milkYieldBoostLiters?: number;
  visualFodderAssessment?: VisualFodderAssessment;
  heatStressAdvisory?: string;
  explanationEn: string;
  explanationTa: string;
  timestamp: string;
}

export interface BigQueryCarbonRecord {
  run_id: string;
  district: string;
  farmer_name: string;
  herd_size: number;
  daily_milk_yield_liters: number;
  methane_reduction_pct: number;
  daily_ch4_abated_grams: number;
  annual_ch4_abated_kg: number;
  annual_co2e_tonnes_saved: number;
  estimated_carbon_credit_inr: number;
  thi_score: number;
  ndvi_index: number;
  timestamp: string;
}

export const SAMPLE_FARMS: FarmRecord[] = [
  {
    farmId: "TN-CBE-101",
    farmerName: "R. Murugesan",
    district: "Coimbatore",
    breed: "Crossbred Jersey",
    herdSize: 8,
    dailyMilkYieldLiters: 14.5,
    currentFeedMix: ["Paddy Straw (Un-chaffed)", "Commercial Cattle Pellets", "Green Fodder (Local Grass / Maize)"],
    thiScore: 81.2,
    ndviIndex: 0.58,
  },
  {
    farmId: "TN-NAM-204",
    farmerName: "K. Lakshmi",
    district: "Namakkal",
    breed: "Native/Kangayam",
    herdSize: 5,
    dailyMilkYieldLiters: 6.2,
    currentFeedMix: ["Sorghum Stubble / Dry Kadbi", "Paddy Straw (Un-chaffed)", "Groundnut Oil Cake"],
    thiScore: 83.2,
    ndviIndex: 0.49,
  },
  {
    farmId: "TN-SLM-308",
    farmerName: "S. Palanisamy",
    district: "Salem",
    breed: "Crossbred HF",
    herdSize: 12,
    dailyMilkYieldLiters: 18.0,
    currentFeedMix: ["Paddy Straw (Un-chaffed)", "Commercial Cattle Pellets", "Sorghum Stubble / Dry Kadbi"],
    thiScore: 84.1,
    ndviIndex: 0.46,
  },
  {
    farmId: "TN-ERD-412",
    farmerName: "M. Soundararajan",
    district: "Erode",
    breed: "Crossbred Jersey",
    herdSize: 6,
    dailyMilkYieldLiters: 13.0,
    currentFeedMix: ["Green Fodder (Local Grass / Maize)", "Paddy Straw (Un-chaffed)", "De-oiled Rice Bran (DORB)"],
    thiScore: 85.0,
    ndviIndex: 0.62,
  },
  {
    farmId: "TN-TPR-519",
    farmerName: "V. Selvam",
    district: "Tiruppur",
    breed: "Native/Kangayam",
    herdSize: 7,
    dailyMilkYieldLiters: 7.5,
    currentFeedMix: ["Sorghum Stubble / Dry Kadbi", "Cottonseed Meal", "Paddy Straw (Un-chaffed)"],
    thiScore: 80.5,
    ndviIndex: 0.43,
  },
  {
    farmId: "TN-DGL-622",
    farmerName: "A. Chinnasamy",
    district: "Dindigul",
    breed: "Crossbred HF",
    herdSize: 10,
    dailyMilkYieldLiters: 16.5,
    currentFeedMix: ["Green Fodder (Local Grass / Maize)", "Groundnut Oil Cake", "Commercial Cattle Pellets"],
    thiScore: 81.0,
    ndviIndex: 0.65,
  },
];

export const INITIAL_ADVISORY_LOGS: AdvisoryLogRecord[] = [
  {
    id: "mock-log-1",
    queryData: {
      farmerName: "R. Murugesan",
      district: "Coimbatore",
      breed: "Crossbred Jersey",
      herdSize: 8,
      dailyMilkYieldLiters: 14.5,
      currentFeedMix: ["Paddy Straw (Un-chaffed)", "Commercial Cattle Pellets", "Green Fodder (Local Grass / Maize)"],
      thiScore: 81.2,
      ndviIndex: 0.58,
    },
    methaneReductionPct: 24.5,
    baselineYmFactor: 6.5,
    optimizedYmFactor: 4.8,
    annualCo2eTonnes: 9.8,
    carbonCreditInr: 14994,
    costSavingInr: 165,
    milkYieldBoostLiters: 1.8,
    visualFodderAssessment: {
      detected_roughage_quality: "High-Lignin Dry Paddy Straw Mixed with Pellets",
      chaffing_status: "Partially Chaffed (>10 cm length)",
      lignin_risk_level: "Moderate-High (ADF 44%)",
      visual_recommendation: "Chop roughage below 3 cm and mix with green silage to minimize rumen retention time.",
    },
    heatStressAdvisory: "THI is 81.2 (Moderate Heat Stress). Added 100g Sodium Bicarbonate and 150g Bypass Fat to protect milk fat percentage.",
    optimizedTmr: [
      { ingredient: "Super Napier (CO-5) Silage", percentage: 45, weight_kg: 18.0 },
      { ingredient: "Sorghum Stover (Chopped)", percentage: 20, weight_kg: 8.0 },
      { ingredient: "Groundnut Oil Cake", percentage: 15, weight_kg: 6.0 },
      { ingredient: "De-oiled Rice Bran", percentage: 12, weight_kg: 4.8 },
      { ingredient: "TANUVAS Mineral Mixture & Bypass Fat", percentage: 8, weight_kg: 3.2 },
    ],
    explanationEn: "Replacing 40% untreated paddy straw with silage and balanced bypass fat cuts enteric methane emissions by ~25% while increasing digestibility.",
    explanationTa: "வைக்கோல் அளவை குறைத்து, CO-5 கோ-புல் சைலேஜ் மற்றும் தாது உப்பு கலவை சேர்ப்பதால் மீத்தேன் வாயு வெளியேற்றம் 25% குறைகிறது மற்றும் பால் உற்பத்தி 1.8 லிட்டர் கூடுகிறது.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "mock-log-2",
    queryData: {
      farmerName: "K. Lakshmi",
      district: "Namakkal",
      breed: "Native/Kangayam",
      herdSize: 5,
      dailyMilkYieldLiters: 6.2,
      currentFeedMix: ["Sorghum Stubble / Dry Kadbi", "Paddy Straw (Un-chaffed)", "Groundnut Oil Cake"],
      thiScore: 83.2,
      ndviIndex: 0.49,
    },
    methaneReductionPct: 18.2,
    baselineYmFactor: 6.6,
    optimizedYmFactor: 5.1,
    annualCo2eTonnes: 4.9,
    carbonCreditInr: 7497,
    costSavingInr: 95,
    milkYieldBoostLiters: 1.2,
    visualFodderAssessment: {
      detected_roughage_quality: "Dry Sorghum Stover & Untreated Straw",
      chaffing_status: "Un-chaffed Coarse Kadbi",
      lignin_risk_level: "High (ADF 49%)",
      visual_recommendation: "Urea-molasses treatment (2% spray) recommended to soften cell wall lignification.",
    },
    heatStressAdvisory: "THI is 83.2 (High Heat Stress). Increased water trough salinity shade and mineral salts.",
    optimizedTmr: [
      { ingredient: "Chaffed Sorghum Stover + Urea-Molasses", percentage: 40, weight_kg: 10.0 },
      { ingredient: "Green Lucerne / Desmanthus", percentage: 30, weight_kg: 7.5 },
      { ingredient: "Groundnut Cake", percentage: 18, weight_kg: 4.5 },
      { ingredient: "Area Specific Mineral Mixture", percentage: 12, weight_kg: 3.0 },
    ],
    explanationEn: "Adding green leguminous fodder (Hedge Lucerne) balances crude protein and ruminal fermentation efficiency for native breeds.",
    explanationTa: "வேலி மசால் போன்ற பசுந்தீவனத்தை சோளத்தட்டையுடன் கலந்து கொடுப்பதன் மூலம் செரிமானம் எளிதாகி மீத்தேன் அளவு கணிசமாக குறைகிறது.",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "mock-log-3",
    queryData: {
      farmerName: "S. Palanisamy",
      district: "Salem",
      breed: "Crossbred HF",
      herdSize: 12,
      dailyMilkYieldLiters: 18.0,
      currentFeedMix: ["Paddy Straw (Un-chaffed)", "Commercial Cattle Pellets", "Sorghum Stubble / Dry Kadbi"],
      thiScore: 84.1,
      ndviIndex: 0.46,
    },
    methaneReductionPct: 26.8,
    baselineYmFactor: 6.7,
    optimizedYmFactor: 4.7,
    annualCo2eTonnes: 16.4,
    carbonCreditInr: 25092,
    costSavingInr: 285,
    milkYieldBoostLiters: 2.1,
    visualFodderAssessment: {
      detected_roughage_quality: "High Lignocellulose Paddy Stalks",
      chaffing_status: "Whole Dry Stalks",
      lignin_risk_level: "Severe (ADF 51%)",
      visual_recommendation: "Immediate mechanical chaffing required. Replace 50% with fermented CO-4 silage.",
    },
    heatStressAdvisory: "THI is 84.1 (Severe Heat Stress). Sub-acute ruminal acidosis risk is acute. Buffer with 150g Sodium Bicarbonate.",
    optimizedTmr: [
      { ingredient: "CO-4 Super Napier Silage", percentage: 46, weight_kg: 22.0 },
      { ingredient: "Cottonseed Cake & Groundnut Meal", percentage: 22, weight_kg: 10.5 },
      { ingredient: "Treated Paddy Straw (Chaffed)", percentage: 16, weight_kg: 7.6 },
      { ingredient: "De-oiled Rice Bran", percentage: 10, weight_kg: 4.8 },
      { ingredient: "TANUVAS Bypass Fat & Rumen Buffer", percentage: 6, weight_kg: 2.8 },
    ],
    explanationEn: "High-producing HF crossbreds in Salem achieve rapid methane mitigation through energy-dense silage and bypass fat buffers.",
    explanationTa: "சேலம் மாவட்ட அதிக பால் தரும் கலப்பின மாடுகளுக்கு சைலேஜ் மற்றும் புறவழி கொழுப்பு வழங்குவது வெப்ப அயற்சியைத் தணித்து மீத்தேனைக் குறைக்கும்.",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "mock-log-4",
    queryData: {
      farmerName: "M. Soundararajan",
      district: "Erode",
      breed: "Crossbred Jersey",
      herdSize: 6,
      dailyMilkYieldLiters: 13.0,
      currentFeedMix: ["Green Fodder (Local Grass / Maize)", "Paddy Straw (Un-chaffed)", "De-oiled Rice Bran (DORB)"],
      thiScore: 85.0,
      ndviIndex: 0.62,
    },
    methaneReductionPct: 22.4,
    baselineYmFactor: 6.4,
    optimizedYmFactor: 4.9,
    annualCo2eTonnes: 7.2,
    carbonCreditInr: 11016,
    costSavingInr: 140,
    milkYieldBoostLiters: 1.6,
    visualFodderAssessment: {
      detected_roughage_quality: "Moist Local Grass & Whole Straw",
      chaffing_status: "Uneven Lengths (5-12 cm)",
      lignin_risk_level: "Moderate (ADF 38%)",
      visual_recommendation: "Maintain 2-3 cm chaffing uniformity to prevent selective forage sorting by cattle.",
    },
    heatStressAdvisory: "THI is 85.0 (Severe Heat Stress in Erode basin). Boost night-time feeding schedule and increase water availability.",
    optimizedTmr: [
      { ingredient: "Green Napier & Maize Fodder", percentage: 44, weight_kg: 15.0 },
      { ingredient: "Chaffed Paddy Straw", percentage: 20, weight_kg: 6.8 },
      { ingredient: "Groundnut Oil Cake", percentage: 18, weight_kg: 6.1 },
      { ingredient: "Rice Bran & Maize Flour", percentage: 12, weight_kg: 4.1 },
      { ingredient: "TANUVAS Mineral Premix", percentage: 6, weight_kg: 2.0 },
    ],
    explanationEn: "Erode river basin benefits from high NDVI green availability; pairing this with precision chaffing curbs rumen protozoal methane.",
    explanationTa: "பவானி ஆற்றுப்படுகை பசுந்தீவனத்தை சரியான அளவில் நறுக்கி வழங்குவதால் மீத்தேன் வாயு 22.4% குறைகிறது.",
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
];

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

try {
  if (
    typeof window !== "undefined" ||
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("your_firebase_api_key"))
  ) {
    if (firebaseConfig.apiKey && firebaseConfig.projectId && !firebaseConfig.apiKey.includes("your_")) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      isFirebaseConfigured = true;
    }
  }
} catch (error) {
  console.warn("Firebase initialization warning (falling back to local memory):", error);
  isFirebaseConfigured = false;
}

export { app, db, isFirebaseConfigured };

// Fallback in-memory cache for client sessions
let localLogsState: AdvisoryLogRecord[] = [...INITIAL_ADVISORY_LOGS];

export async function fetchFarms(): Promise<FarmRecord[]> {
  if (!isFirebaseConfigured || !db) {
    return SAMPLE_FARMS;
  }
  try {
    const farmsCol = collection(db, "farms");
    const snapshot = await getDocs(farmsCol);
    if (snapshot.empty) {
      return SAMPLE_FARMS;
    }
    return snapshot.docs.map((doc) => ({
      farmId: doc.id,
      ...(doc.data() as Omit<FarmRecord, "farmId">),
    }));
  } catch (err) {
    console.warn("Using sample farms due to Firestore error:", err);
    return SAMPLE_FARMS;
  }
}

export async function logAdvisoryResult(log: Omit<AdvisoryLogRecord, "id">): Promise<AdvisoryLogRecord> {
  const newRecord: AdvisoryLogRecord = {
    ...log,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  // Also stream to simulated BigQuery carbon ledger
  await logToBigQueryAnalytics({
    run_id: newRecord.id || `log-${Date.now()}`,
    district: log.queryData.district,
    farmer_name: log.queryData.farmerName || "TN Rural Farmer",
    herd_size: log.queryData.herdSize,
    daily_milk_yield_liters: log.queryData.dailyMilkYieldLiters,
    methane_reduction_pct: log.methaneReductionPct,
    daily_ch4_abated_grams: Math.round(log.queryData.herdSize * 42.5),
    annual_ch4_abated_kg: Math.round((log.queryData.herdSize * 42.5 * 365) / 1000),
    annual_co2e_tonnes_saved: log.annualCo2eTonnes || Number(((log.queryData.herdSize * 42.5 * 365 * 84) / 1000000).toFixed(2)),
    estimated_carbon_credit_inr: log.carbonCreditInr || Math.round(((log.queryData.herdSize * 42.5 * 365 * 84) / 1000000) * 1530),
    thi_score: log.queryData.thiScore || 82.0,
    ndvi_index: log.queryData.ndviIndex || 0.54,
    timestamp: newRecord.timestamp,
  });

  if (!isFirebaseConfigured || !db) {
    localLogsState = [newRecord, ...localLogsState];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("smartdairy_advisory_logs", JSON.stringify(localLogsState));
      } catch {
        // ignore storage quota issues
      }
    }
    return newRecord;
  }

  try {
    const colRef = collection(db, "advisory_logs");
    const docRef = await addDoc(colRef, {
      ...log,
      createdAt: serverTimestamp(),
    });
    return { ...newRecord, id: docRef.id };
  } catch (err) {
    console.warn("Firestore write failed, saving to local state:", err);
    localLogsState = [newRecord, ...localLogsState];
    return newRecord;
  }
}

export async function fetchRecentLogs(limitCount = 10): Promise<AdvisoryLogRecord[]> {
  if (!isFirebaseConfigured || !db) {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("smartdairy_advisory_logs");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, limitCount);
          }
        }
      } catch {
        // fallback
      }
    }
    return localLogsState.slice(0, limitCount);
  }

  try {
    const colRef = collection(db, "advisory_logs");
    const q = query(colRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    if (snap.empty) {
      return localLogsState.slice(0, limitCount);
    }
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        queryData: data.queryData,
        methaneReductionPct: data.methaneReductionPct,
        baselineYmFactor: data.baselineYmFactor,
        optimizedYmFactor: data.optimizedYmFactor,
        annualCo2eTonnes: data.annualCo2eTonnes,
        carbonCreditInr: data.carbonCreditInr,
        optimizedTmr: data.optimizedTmr,
        costSavingInr: data.costSavingInr,
        milkYieldBoostLiters: data.milkYieldBoostLiters,
        visualFodderAssessment: data.visualFodderAssessment,
        heatStressAdvisory: data.heatStressAdvisory,
        explanationEn: data.explanationEn,
        explanationTa: data.explanationTa,
        timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn("Firestore read failed, returning local logs:", err);
    return localLogsState.slice(0, limitCount);
  }
}

/**
 * BigQuery Carbon Streamer Simulation
 * Formats every optimization into IPCC Tier-2 schema for regional carbon accounting.
 */
export async function logToBigQueryAnalytics(record: BigQueryCarbonRecord): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem("smartdairy_bigquery_stream");
      const list: BigQueryCarbonRecord[] = existing ? JSON.parse(existing) : [];
      list.unshift(record);
      localStorage.setItem("smartdairy_bigquery_stream", JSON.stringify(list.slice(0, 50)));
    } catch {
      // Local storage fallback
    }
  }
}

export interface RegionalCarbonSummary {
  totalFarms: number;
  totalCattle: number;
  totalCh4AbatedKgYear: number;
  totalCo2eTonnesYear: number;
  totalCarbonCreditInrYear: number;
  districtBreakdown: Array<{
    district: string;
    farmsCount: number;
    cattleCount: number;
    ch4AbatedKg: number;
    co2eTonnes: number;
    carbonCreditInr: number;
    avgMethaneCutPct: number;
  }>;
}

/**
 * Aggregates logs across Tamil Nadu dairy cooperatives (FPOs)
 * using IPCC Tier-2 and GWP-20 conversion metrics.
 */
export function computeRegionalCarbonAggregates(logs: AdvisoryLogRecord[]): RegionalCarbonSummary {
  const dataset = logs && logs.length > 0 ? logs : INITIAL_ADVISORY_LOGS;

  let totalFarms = dataset.length;
  let totalCattle = 0;
  let totalCh4AbatedKgYear = 0;
  let totalCo2eTonnesYear = 0;
  let totalCarbonCreditInrYear = 0;

  const districtMap: Record<
    string,
    {
      farmsCount: number;
      cattleCount: number;
      ch4AbatedKg: number;
      co2eTonnes: number;
      carbonCreditInr: number;
      sumMethanePct: number;
    }
  > = {};

  const TN_DISTRICTS = ["Coimbatore", "Salem", "Erode", "Tiruppur", "Namakkal", "Dindigul"];
  for (const d of TN_DISTRICTS) {
    districtMap[d] = {
      farmsCount: 0,
      cattleCount: 0,
      ch4AbatedKg: 0,
      co2eTonnes: 0,
      carbonCreditInr: 0,
      sumMethanePct: 0,
    };
  }

  for (const log of dataset) {
    const d = log.queryData.district;
    const herd = log.queryData.herdSize || 5;
    totalCattle += herd;

    // Daily CH4 abatement in grams per cow (IPCC delta between untreated roughage & optimized TMR: ~38 to 46g/cow/day)
    const dailyCh4PerCowGrams = 42.0 * (log.methaneReductionPct / 24.0);
    const farmAnnualCh4Kg = (herd * dailyCh4PerCowGrams * 365) / 1000;
    
    // GWP-20 for enteric methane = 84x
    const co2eTonnes = log.annualCo2eTonnes || Number(((farmAnnualCh4Kg * 84) / 1000).toFixed(2));
    // Voluntary Carbon Credit @ $18/tCO2e (approx ₹1,530 / tCO2e)
    const creditInr = log.carbonCreditInr || Math.round(co2eTonnes * 1530);

    totalCh4AbatedKgYear += farmAnnualCh4Kg;
    totalCo2eTonnesYear += co2eTonnes;
    totalCarbonCreditInrYear += creditInr;

    if (!districtMap[d]) {
      districtMap[d] = {
        farmsCount: 0,
        cattleCount: 0,
        ch4AbatedKg: 0,
        co2eTonnes: 0,
        carbonCreditInr: 0,
        sumMethanePct: 0,
      };
    }

    districtMap[d].farmsCount += 1;
    districtMap[d].cattleCount += herd;
    districtMap[d].ch4AbatedKg += farmAnnualCh4Kg;
    districtMap[d].co2eTonnes += co2eTonnes;
    districtMap[d].carbonCreditInr += creditInr;
    districtMap[d].sumMethanePct += log.methaneReductionPct;
  }

  const districtBreakdown = Object.entries(districtMap).map(([district, stats]) => ({
    district,
    farmsCount: stats.farmsCount,
    cattleCount: stats.cattleCount,
    ch4AbatedKg: Math.round(stats.ch4AbatedKg),
    co2eTonnes: Number(stats.co2eTonnes.toFixed(1)),
    carbonCreditInr: stats.carbonCreditInr,
    avgMethaneCutPct: stats.farmsCount > 0 ? Number((stats.sumMethanePct / stats.farmsCount).toFixed(1)) : 22.5,
  }));

  return {
    totalFarms,
    totalCattle,
    totalCh4AbatedKgYear: Math.round(totalCh4AbatedKgYear),
    totalCo2eTonnesYear: Number(totalCo2eTonnesYear.toFixed(1)),
    totalCarbonCreditInrYear: Math.round(totalCarbonCreditInrYear),
    districtBreakdown,
  };
}
