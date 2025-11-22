export enum CropStatus {
  PLANNED = 'Planned',
  GROWING = 'Growing',
  HARVESTED = 'Harvested'
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
  location: string;
}

export interface PestAlert {
  pestName: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  prevention: string;
}

export interface FertilizerRecommendation {
  stage: string;
  fertilizer: string;
  quantity: string;
  reason: string;
}

export interface MarketPrice {
  crop: string;
  currentPrice: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  history: { date: string; price: number }[];
  region: string;
}

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  area: number; // in acres
  location: string;
  sowingDate: string;
  expectedHarvestDate: string;
  status: CropStatus;
  notes?: string;
}

export interface RotationPlan {
  currentCrop: string;
  suggestedNextCrops: {
    cropName: string;
    reason: string;
    benefits: string[];
  }[];
}

export interface CropSuggestion {
  cropName: string;
  variety: string;
  reason: string;
  estimatedYield: string;
  marketOutlook: string;
  suitabilityScore: number; // 0-100
}