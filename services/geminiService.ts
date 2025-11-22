import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Crop, WeatherData, PestAlert, FertilizerRecommendation, MarketPrice, RotationPlan, CropSuggestion } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const modelId = 'gemini-2.5-flash';

// Schema Definitions

const pestAlertSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      pestName: { type: Type.STRING },
      severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
      description: { type: Type.STRING },
      prevention: { type: Type.STRING }
    },
    required: ['pestName', 'severity', 'description', 'prevention']
  }
};

const fertilizerSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      stage: { type: Type.STRING },
      fertilizer: { type: Type.STRING },
      quantity: { type: Type.STRING },
      reason: { type: Type.STRING }
    },
    required: ['stage', 'fertilizer', 'quantity', 'reason']
  }
};

const rotationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    currentCrop: { type: Type.STRING },
    suggestedNextCrops: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cropName: { type: Type.STRING },
          reason: { type: Type.STRING },
          benefits: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['cropName', 'reason', 'benefits']
      }
    }
  },
  required: ['currentCrop', 'suggestedNextCrops']
};

const marketSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      crop: { type: Type.STRING },
      currentPrice: { type: Type.NUMBER },
      unit: { type: Type.STRING },
      trend: { type: Type.STRING, enum: ['up', 'down', 'stable'] },
      region: { type: Type.STRING },
      history: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            price: { type: Type.NUMBER }
          }
        }
      }
    }
  }
};

const suggestionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      cropName: { type: Type.STRING },
      variety: { type: Type.STRING },
      reason: { type: Type.STRING },
      estimatedYield: { type: Type.STRING },
      marketOutlook: { type: Type.STRING },
      suitabilityScore: { type: Type.NUMBER },
    },
    required: ['cropName', 'variety', 'reason', 'estimatedYield', 'marketOutlook', 'suitabilityScore']
  }
};

const harvestDateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    harvestDate: { type: Type.STRING, description: "YYYY-MM-DD" },
    daysToMaturity: { type: Type.INTEGER }
  },
  required: ['harvestDate']
};

// API Calls

export const getPestAlerts = async (crop: Crop, weather: WeatherData): Promise<PestAlert[]> => {
  try {
    const prompt = `Analyze pest and disease risks for ${crop.name} in ${crop.location}. 
    Current weather: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.rainfall}mm rain.
    Return a list of potential pests/diseases with severity, description, and prevention measures.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pestAlertSchema,
      },
    });
    
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching pest alerts:", error);
    return [];
  }
};

export const getFertilizerRecommendations = async (crop: Crop): Promise<FertilizerRecommendation[]> => {
  try {
    const prompt = `Suggest a fertilizer schedule for ${crop.name} (Sown: ${crop.sowingDate}). 
    Provide 3-4 key stages (e.g., Basal, Vegetative, Flowering). Include quantity per acre and reasoning.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: fertilizerSchema,
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching fertilizer recs:", error);
    return [];
  }
};

export const getRotationAdvice = async (prevCrop: string, plotSize: number, location: string): Promise<RotationPlan | null> => {
  try {
    const prompt = `I have just harvested ${prevCrop} on a ${plotSize} acre plot in ${location}. 
    Suggest optimal next crops for rotation to improve soil health and break pest cycles.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: rotationSchema,
      },
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Error fetching rotation advice:", error);
    return null;
  }
};

export const getMarketData = async (location: string): Promise<MarketPrice[]> => {
  try {
    const prompt = `Generate a list of current average market prices for common Indian crops (e.g., Wheat, Rice, Cotton, Onions, Tomatoes, Potatoes, Soybeans) in ${location} or the general region.
    
    IMPORTANT:
    - Return ONE entry per crop type (e.g., do not list "Nasik Onion" and "Pune Onion" separately, just "Onion" with an average price).
    - The 'region' field should be the State name or "All India Average".
    - Prices MUST be in Indian Rupee (INR) per Quintal.
    - Provide a 6-month price history trend.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: marketSchema,
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
};

export const getGeneralCropAdvice = async (crop: Crop, weather: WeatherData): Promise<string> => {
  try {
    const prompt = `Give a short, encouraging, and actionable daily tip for a farmer growing ${crop.name} in ${crop.location}. 
    Weather is ${weather.condition}, ${weather.temperature}°C. Plain text, max 2 sentences.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Keep monitoring your crops closely today.";
  } catch (error) {
    return "Unable to generate advice at this moment.";
  }
};

// --- New Features ---

const CROP_DURATION_FALLBACK: Record<string, number> = {
    'wheat': 120,
    'rice': 130,
    'paddy': 130,
    'corn': 100,
    'maize': 100,
    'cotton': 160,
    'sugarcane': 365,
    'potato': 90,
    'tomato': 80,
    'onion': 100,
    'soybean': 100,
    'chickpea': 100,
    'groundnut': 110,
    'mustard': 100
};

export const predictHarvestDate = async (cropName: string, sowingDate: string, location: string): Promise<string> => {
  // Quick local fallback calculation first to ensure responsiveness
  let estimatedDays = 120; // default
  const normalizedName = cropName.toLowerCase().trim();
  
  for (const [key, days] of Object.entries(CROP_DURATION_FALLBACK)) {
      if (normalizedName.includes(key)) {
          estimatedDays = days;
          break;
      }
  }

  const fallbackDate = new Date(sowingDate);
  fallbackDate.setDate(fallbackDate.getDate() + estimatedDays);
  const fallbackString = fallbackDate.toISOString().split('T')[0];

  try {
    if (!cropName || !sowingDate) return "";

    const prompt = `Calculate the expected harvest date for '${cropName}' sown on ${sowingDate} in or near '${location}'.
    Assume typical Indian growing season duration.
    Return a JSON object with 'harvestDate' (YYYY-MM-DD).`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: harvestDateSchema
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data.harvestDate || fallbackString;
  } catch (error) {
    console.error("Error predicting harvest date, using fallback:", error);
    return fallbackString;
  }
};

export const getSmartCropSuggestions = async (location: string, date: string): Promise<CropSuggestion[]> => {
  try {
    const prompt = `Suggest 3 best crops to sow in ${location} (India context) around ${date}.
    Consider: Seasons (Kharif/Rabi), profitability in INR, and weather.
    Return 3 distinct recommendations.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionSchema
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching crop suggestions:", error);
    return [];
  }
};

export const getLocationNameFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const prompt = `Identify the Indian city/district for: ${lat}, ${lng}. Return ONLY the name.`;
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text?.trim() || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch (error) {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
};