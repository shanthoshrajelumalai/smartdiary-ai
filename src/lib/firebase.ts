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
}

export interface OptimizedTmrIngredient {
  ingredient: string;
  percentage: number;
  weight_kg: number;
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
  };
  methaneReductionPct: number;
  optimizedTmr: OptimizedTmrIngredient[];
  costSavingInr: number;
  milkYieldBoostLiters?: number;
  explanationEn: string;
  explanationTa: string;
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
    currentFeedMix: ["Paddy Straw", "Commercial Pellet", "Green Fodder"],
  },
  {
    farmId: "TN-NAM-204",
    farmerName: "K. Lakshmi",
    district: "Namakkal",
    breed: "Native/Kangayam",
    herdSize: 5,
    dailyMilkYieldLiters: 6.2,
    currentFeedMix: ["Sorghum Stubble", "Paddy Straw", "Groundnut Cake"],
  },
  {
    farmId: "TN-SLM-308",
    farmerName: "S. Palanisamy",
    district: "Salem",
    breed: "Crossbred HF",
    herdSize: 12,
    dailyMilkYieldLiters: 18.0,
    currentFeedMix: ["Paddy Straw", "Commercial Pellet", "Sorghum Stubble"],
  },
  {
    farmId: "TN-ERD-412",
    farmerName: "M. Soundararajan",
    district: "Erode",
    breed: "Crossbred Jersey",
    herdSize: 6,
    dailyMilkYieldLiters: 13.0,
    currentFeedMix: ["Green Fodder", "Paddy Straw", "Rice Bran"],
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
      currentFeedMix: ["Paddy Straw", "Commercial Pellet", "Green Fodder"],
    },
    methaneReductionPct: 24.5,
    costSavingInr: 165,
    milkYieldBoostLiters: 1.8,
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
      currentFeedMix: ["Sorghum Stubble", "Paddy Straw", "Groundnut Cake"],
    },
    methaneReductionPct: 18.2,
    costSavingInr: 95,
    milkYieldBoostLiters: 1.2,
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
        optimizedTmr: data.optimizedTmr,
        costSavingInr: data.costSavingInr,
        milkYieldBoostLiters: data.milkYieldBoostLiters,
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
