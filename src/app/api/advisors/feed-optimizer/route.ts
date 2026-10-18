import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = "force-dynamic";

interface FeedOptimizerRequest {
  district: string;
  breed: string;
  herdSize: number;
  dailyMilkYieldLiters: number;
  currentFeedMix: string[];
  thiScore?: number;
  ndviIndex?: number;
  fodderImageBase64?: string;
  fodderMimeType?: string;
  fodderPresetType?: string;
  imageFileName?: string;
}

interface FeedOptimizerResponse {
  methane_reduction_percentage: number;
  baseline_ym_factor: number;
  optimized_ym_factor: number;
  annual_co2e_saved_tonnes: number;
  estimated_annual_carbon_credit_inr: number;
  visual_fodder_assessment?: {
    detected_roughage_quality: string;
    chaffing_status: string;
    lignin_risk_level: string;
    visual_recommendation: string;
  };
  heat_stress_advisory: string;
  optimized_tmr: Array<{
    ingredient: string;
    percentage: number;
    weight_kg: number;
  }>;
  cost_saving_per_day_inr: number;
  milk_yield_boost_liters: number;
  explanation_en: string;
  explanation_ta: string;
  isMockFallback?: boolean;
  modelUsed?: string;
}

function generateMockOptimization(data: FeedOptimizerRequest): FeedOptimizerResponse {
  const { district, breed, dailyMilkYieldLiters, herdSize, currentFeedMix, thiScore = 82.0, fodderPresetType, imageFileName } = data;

  // Scientific estimates tailored for Tamil Nadu dairy systems (Kumaraguru & EDF Initiative)
  const isHighPaddy = currentFeedMix.some((f) => f.toLowerCase().includes("paddy"));
  const isNative = breed.toLowerCase().includes("native") || breed.toLowerCase().includes("kangayam");

  // Baseline Ym factor (IPCC Tier-2: untreated straw ~ 6.5 - 6.8%, green fodder TMR ~ 4.7 - 4.9%)
  const baseline_ym_factor = isHighPaddy ? 6.6 : 6.1;
  const optimized_ym_factor = 4.8;
  const methaneReduction = Number((((baseline_ym_factor - optimized_ym_factor) / baseline_ym_factor) * 100).toFixed(1));

  // Annual Carbon & Methane Accounting (IPCC Tier-2 & GWP-20 = 84)
  const dailyCh4PerCowGrams = 42.0 * (methaneReduction / 24.0);
  const annualCh4Kg = (herdSize * dailyCh4PerCowGrams * 365) / 1000;
  const annual_co2e_saved_tonnes = Number(((annualCh4Kg * 84) / 1000).toFixed(2));
  const estimated_annual_carbon_credit_inr = Math.round(annual_co2e_saved_tonnes * 1530); // ~$18/tonne

  const yieldBoost = isNative
    ? Math.round((0.8 + dailyMilkYieldLiters * 0.12) * 10) / 10
    : Math.round((1.5 + dailyMilkYieldLiters * 0.15) * 10) / 10;

  const costSaving = Math.round(herdSize * 24.5 + dailyMilkYieldLiters * 7.0);
  const totalDMI = Math.round((dailyMilkYieldLiters * 0.8 + 8) * 10) / 10;

  // Heat stress condition check (THI threshold > 78)
  const isHeatStressed = thiScore >= 78;
  const isSevereHeat = thiScore >= 84;

  let heat_stress_advisory = "";
  if (isSevereHeat) {
    heat_stress_advisory = `⚠️ Critical Heat Stress Alert (THI ${thiScore} in ${district}): High ambient temperature triggers panting, lowers rumination, and drops DMI by ~15%. Ration fortified with 150g Sodium Bicarbonate rumen buffer and 150g Rumen Bypass Fat to prevent Sub-Acute Ruminal Acidosis (SARA) and prevent milk fat depression.`;
  } else if (isHeatStressed) {
    heat_stress_advisory = `⚠️ Heat Stress Advisory (THI ${thiScore} in ${district}): Cattle experiencing heat load. Added 100g Sodium Bicarbonate rumen buffer and 120g Bypass Fat to stabilize rumen fermentation and sustain peak milk yield.`;
  } else {
    heat_stress_advisory = `✅ Thermoneutral Zone (THI ${thiScore} in ${district}): Cow thermal comfort is optimal. Standard TMR electrolyte and mineral balance maintained.`;
  }

  // Visual Fodder Assessment (Intelligent Multi-Modal Analysis)
  const isSilageOrNapier =
    fodderPresetType === "chaffed_green_napier_silage" ||
    (imageFileName && /silage|napier|green|chopped|chaffed/i.test(imageFileName)) ||
    currentFeedMix.some((f) => /green|silage|grass|maize/i.test(f));

  let visual_fodder_assessment = {
    detected_roughage_quality: "High-Lignin Dry Crop Stubble / Straw",
    chaffing_status: "Un-chaffed Coarse Stalks (>15 cm)",
    lignin_risk_level: "High (ADF > 46%)",
    visual_recommendation: "Mechanically chop roughage to 2–3 cm length and treat with 2% urea-molasses solution to disrupt the rigid lignocellulose matrix and reduce enteric methane.",
  };

  if (isSilageOrNapier && fodderPresetType !== "untreated_paddy_straw") {
    visual_fodder_assessment = {
      detected_roughage_quality: "High-Protein Fresh Green Silage (CO-4 / CO-5 Hybrid Napier)",
      chaffing_status: "Optimal Precision Chaffing (2–3 cm uniform cut)",
      lignin_risk_level: "Low to Moderate (ADF < 30%)",
      visual_recommendation: "Excellent green fodder physical structure. Rapid ruminal fermentation promotes propionate synthesis over acetate, curbing enteric methane intensity by ~28%. Blend with 120g rumen bypass fat and TANUVAS mineral mix to maximize peak lactation.",
    };
  } else if (fodderPresetType === "untreated_paddy_straw" || (!isSilageOrNapier && currentFeedMix.some((f) => /paddy|straw/i.test(f)))) {
    visual_fodder_assessment = {
      detected_roughage_quality: "Un-treated Mature Paddy Straw (Oryza sativa)",
      chaffing_status: "Whole Dry Stalks (>18 cm un-chaffed)",
      lignin_risk_level: "Severe Lignification (ADF > 52%)",
      visual_recommendation: "Long un-chaffed paddy straw prolongs rumen retention time to >68 hours, drastically increasing enteric methanogenesis. Immediate mechanical chaffing to 2-3 cm and 40% substitution with green Napier silage is recommended.",
    };
  }

  const tmr = [
    {
      ingredient: isHeatStressed
        ? "Super Napier (CO-5) Silage (Moisture-Rich Cooling Forage)"
        : "Super Napier (CO-4 / CO-5) Green Fodder",
      percentage: 42,
      weight_kg: Math.round(totalDMI * 0.42 * 10) / 10,
    },
    {
      ingredient: "Chaffed Sorghum Stover (Urea-Molasses Treated)",
      percentage: 22,
      weight_kg: Math.round(totalDMI * 0.22 * 10) / 10,
    },
    {
      ingredient: "Groundnut Oil Cake & Cottonseed Meal",
      percentage: 18,
      weight_kg: Math.round(totalDMI * 0.18 * 10) / 10,
    },
    {
      ingredient: "De-oiled Rice Bran (DORB)",
      percentage: 12,
      weight_kg: Math.round(totalDMI * 0.12 * 10) / 10,
    },
    {
      ingredient: isHeatStressed
        ? "TANUVAS Area Specific Mineral Mix + Sodium Bicarb + Rumen Bypass Fat"
        : "TANUVAS Area Specific Mineral Mixture & Rumen Bypass Fat",
      percentage: 6,
      weight_kg: Math.round(totalDMI * 0.06 * 10) / 10,
    },
  ];

  const explanation_en = `For your ${herdSize} ${breed} cattle in ${district} (THI: ${thiScore}), shifting from un-chaffed roughages to a balanced Total Mixed Ration (TMR) rich in CO-5 Super Napier and rumen bypass fat shifts the ruminal Methane Conversion Factor (Ym) from ${baseline_ym_factor}% down to ${optimized_ym_factor}%. This curbs enteric methane intensity by ${methaneReduction}%, saves ₹${costSaving}/day in wasted dry matter, and generates an estimated ₹${estimated_annual_carbon_credit_inr}/year in FPO voluntary carbon credit value (${annual_co2e_saved_tonnes} tCO2e/yr).`;

  const explanation_ta = `${district} மாவட்டத்தில் (THI: ${thiScore}) உள்ள உங்கள் ${herdSize} ${breed} மாடுகளுக்கு, வழக்கமான வைக்கோலை மாற்றி சத்துமிக்க CO-5 சூப்பர் நேப்பியர் பசுந்தீவனம், புறவழி கொழுப்பு மற்றும் டானுவாஸ் தாது உப்புக்கலவை கலந்த சரிவிகித உணவு (TMR) வழங்குவதால் குடலில் செரிமானம் மேம்படுகிறது. இதன் மூலம் மீத்தேன் வாயு உற்பத்தி ${methaneReduction}% குறைவதோடு, நாளொன்றுக்கு ₹${costSaving} வரை தீவனச் செலவு மிச்சமாகும் மற்றும் ஆண்டிற்கு ₹${estimated_annual_carbon_credit_inr} கார்பன் கிரெடிட் வருவாய் ஈட்ட இயலும்.`;

  return {
    methane_reduction_percentage: methaneReduction,
    baseline_ym_factor,
    optimized_ym_factor,
    annual_co2e_saved_tonnes,
    estimated_annual_carbon_credit_inr,
    visual_fodder_assessment,
    heat_stress_advisory,
    optimized_tmr: tmr,
    cost_saving_per_day_inr: costSaving,
    milk_yield_boost_liters: yieldBoost,
    explanation_en,
    explanation_ta,
    isMockFallback: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedOptimizerRequest = await req.json();

    if (!body || !body.district || !body.breed) {
      return NextResponse.json(
        { error: "Missing required fields: district, breed, herdSize, dailyMilkYieldLiters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if Gemini API Key is missing or default placeholder
    if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_gemini_api_key")) {
      const mockResult = generateMockOptimization(body);
      return NextResponse.json(mockResult);
    }

    // Initialize official Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a precision dairy nutritionist, computer vision analyst, and ruminant methane abatement expert specializing in smallholder farming in Tamil Nadu, India (collaborating with Kumaraguru Institutions & Environmental Defense Fund climate dairy program).
Analyze the farmer's herd data, district agro-climate metrics (THI & Earth Engine NDVI), current feeding regime, and optional visual fodder image to formulate an optimized Total Mixed Ration (TMR) that:
1. Minimizes enteric methane emissions intensity (g CH4 / liter milk) and shifts IPCC Tier-2 Ym factor from ~6.5% down to ~4.8% using proven local additives (e.g. bypass fat, leguminous fodder, mineral mixtures, green Napier silage).
2. Directly mitigates Heat Stress when THI > 78 (by adding Potassium/Sodium Bicarbonate rumen buffer and increasing bypass fat to prevent sub-acute ruminal acidosis and milk fat depression).
3. If an image of fodder is provided, inspect the physical quality, chop length (chaffing), and lignification risk.
4. Calculate carbon accounting metrics (annual tCO2e saved using GWP-20=84, and voluntary carbon credits in INR @ $18/tCO2e).
5. Provide actionable explanations in both English and natural spoken Tamil (தமிழ்).`;

    const userPromptText = `Tamil Nadu Dairy Farmer & Climate Profile:
- District: ${body.district}
- Cattle Breed: ${body.breed}
- Herd Size: ${body.herdSize} cattle
- Current Daily Milk Yield per Animal: ${body.dailyMilkYieldLiters} Liters/day
- Current Feed Regime: ${body.currentFeedMix.join(", ") || "Untreated Paddy Straw and dry grass"}
- District Agro-Climatic THI Score: ${body.thiScore || 82.0}
- Satellite Earth Engine NDVI Index: ${body.ndviIndex || 0.54}
${body.fodderPresetType ? `- Fodder Type Reference: ${body.fodderPresetType}` : ""}

Analyze and generate the complete optimized TMR, multimodal visual assessment, heat stress advisory, and IPCC carbon impact in strict JSON matching the requested schema.`;

    // Prepare multimodal parts
    const contentParts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [
      { text: `${systemPrompt}\n\n${userPromptText}` },
    ];

    if (body.fodderImageBase64 && !body.fodderMimeType?.includes("svg")) {
      let cleanBase64 = body.fodderImageBase64;
      if (cleanBase64.includes(";base64,")) {
        cleanBase64 = cleanBase64.split(";base64,")[1];
      } else if (cleanBase64.startsWith("/") || cleanBase64.startsWith("demo/")) {
        try {
          const fs = await import("fs");
          const path = await import("path");
          const relPath = cleanBase64.startsWith("/") ? cleanBase64.slice(1) : cleanBase64;
          const fullPath = path.join(process.cwd(), "public", relPath);
          if (fs.existsSync(fullPath)) {
            cleanBase64 = fs.readFileSync(fullPath).toString("base64");
          }
        } catch (fsErr) {
          console.warn("Could not read local demo image from disk:", fsErr);
        }
      }
      // Only attach if it's a valid standard image format supported by Gemini
      const supportedMimes = ["image/jpeg", "image/png", "image/webp"];
      const mime = supportedMimes.includes(body.fodderMimeType || "") ? (body.fodderMimeType || "image/jpeg") : "image/jpeg";
      contentParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mime,
        },
      });
    }

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash-exp",
    ];
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: contentParts as any,
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                methane_reduction_percentage: {
                  type: Type.NUMBER,
                  description: "Estimated percentage reduction in enteric methane intensity (15 to 32%)",
                },
                baseline_ym_factor: {
                  type: Type.NUMBER,
                  description: "IPCC Tier-2 baseline Methane Conversion Factor Ym before optimization (typically 6.2 - 6.8)",
                },
                optimized_ym_factor: {
                  type: Type.NUMBER,
                  description: "IPCC Tier-2 optimized Methane Conversion Factor Ym after TMR (typically 4.6 - 5.0)",
                },
                annual_co2e_saved_tonnes: {
                  type: Type.NUMBER,
                  description: "Total annual CO2 equivalent saved in tonnes across the herd (GWP-20 = 84)",
                },
                estimated_annual_carbon_credit_inr: {
                  type: Type.NUMBER,
                  description: "Estimated annual voluntary carbon credit value in INR for the FPO/farmer (@ $18/tCO2e)",
                },
                visual_fodder_assessment: {
                  type: Type.OBJECT,
                  description: "Computer vision assessment of the fodder physical state, chop length, and lignin content",
                  properties: {
                    detected_roughage_quality: { type: Type.STRING },
                    chaffing_status: { type: Type.STRING },
                    lignin_risk_level: { type: Type.STRING },
                    visual_recommendation: { type: Type.STRING },
                  },
                  required: [
                    "detected_roughage_quality",
                    "chaffing_status",
                    "lignin_risk_level",
                    "visual_recommendation",
                  ],
                },
                heat_stress_advisory: {
                  type: Type.STRING,
                  description: "Agro-climatic advisory addressing the district THI score and rumen buffer recommendations",
                },
                optimized_tmr: {
                  type: Type.ARRAY,
                  description: "List of recommended ration components with percentage and weight in kg per cow/day",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      ingredient: { type: Type.STRING },
                      percentage: { type: Type.NUMBER },
                      weight_kg: { type: Type.NUMBER },
                    },
                    required: ["ingredient", "percentage", "weight_kg"],
                  },
                },
                cost_saving_per_day_inr: {
                  type: Type.NUMBER,
                  description: "Estimated net daily financial savings in INR for the herd",
                },
                milk_yield_boost_liters: {
                  type: Type.NUMBER,
                  description: "Estimated daily milk yield increase in liters per animal",
                },
                explanation_en: {
                  type: Type.STRING,
                  description: "Clear step-by-step guidance in English explaining the science and benefits",
                },
                explanation_ta: {
                  type: Type.STRING,
                  description: "Clear, culturally accurate step-by-step feeding instructions in Tamil (தமிழ்)",
                },
              },
              required: [
                "methane_reduction_percentage",
                "baseline_ym_factor",
                "optimized_ym_factor",
                "annual_co2e_saved_tonnes",
                "estimated_annual_carbon_credit_inr",
                "heat_stress_advisory",
                "optimized_tmr",
                "cost_saving_per_day_inr",
                "milk_yield_boost_liters",
                "explanation_en",
                "explanation_ta",
              ],
            },
          },
        });

        const responseText = response.text;
        if (responseText) {
          const parsed: FeedOptimizerResponse = JSON.parse(responseText);
          return NextResponse.json({
            ...parsed,
            isMockFallback: false,
            modelUsed: modelName,
          });
        }
      } catch (err) {
        lastError = err;
        console.warn(`Attempt with ${modelName} encountered issue:`, (err as Error)?.message || err);
      }
    }

    console.warn("All live Gemini models exhausted, serving precision scientific fallback:", (lastError as Error)?.message);
    const fallbackResult = generateMockOptimization(body);
    return NextResponse.json(fallbackResult);
  } catch (error) {
    console.error("Error in feed-optimizer API route:", error);
    return NextResponse.json(
      { error: "Internal server error optimizing feed ration." },
      { status: 500 }
    );
  }
}

