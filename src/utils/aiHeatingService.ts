import { IPoint, IWall, IInteriorWall, IDoor, IWindow, HeatingPatternType } from '../types';
import { analyzeRoomHeatingPattern, RoomAnalysisResult } from './hvacAdvisor';

let storedApiKey: string = 'AQ.Ab8RN6I9uxBCTYeROjNdsgyfPxebKml06lMpJK1jZliWGxI_KQ';

export function setCustomGeminiApiKey(key: string) {
  storedApiKey = key.trim();
}

export function getCustomGeminiApiKey(): string {
  return storedApiKey;
}

export interface AIAssistedHeatingResult extends RoomAnalysisResult {
  isAIGenerated: boolean;
  aiComment?: string;
  recommendedStepSm?: number;
  circuitCount?: number;
  apiStatus?: string;
}

async function executeGeminiPrompt(prompt: string, apiKey: string): Promise<string> {
  const keyToUse = (apiKey || storedApiKey).trim();
  if (!keyToUse) {
    throw new Error('API Kalit kiritilmagan');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 250,
    },
  };

  const requests: Array<{ url: string; headers: Record<string, string> }> = [
    // 1. Siz bergan aniq cURL formati (Header orqali)
    {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': keyToUse,
      },
    },
    // 2. gemini-2.0-flash (Header orqali)
    {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': keyToUse,
      },
    },
    // 3. gemini-flash-latest URL query orqali
    {
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${keyToUse}`,
      headers: {
        'Content-Type': 'application/json',
      },
    },
    // 4. v1 rasmiy endpoint
    {
      url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${keyToUse}`,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  ];

  const errors: string[] = [];

  for (const req of requests) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        errors.push(errMsg);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      errors.push(e.name === 'AbortError' ? 'Timeout' : e.message);
    }
  }

  throw new Error(errors[0] || 'Google serveriga ulanib bo‘lmadi');
}

export async function fetchAIHeatingAdvice(
  roomName: string,
  roomType: string,
  roomPoints: IPoint[],
  walls: IWall[] = [],
  interiorWalls: IInteriorWall[] = [],
  doors: IDoor[] = [],
  windows: IWindow[] = [],
  compassAngle: number = 0,
  userApiKey?: string
): Promise<AIAssistedHeatingResult> {
  const localFallback = analyzeRoomHeatingPattern(
    roomPoints,
    walls,
    windows,
    interiorWalls,
    roomType,
    compassAngle
  );

  const fallbackResult: AIAssistedHeatingResult = {
    ...localFallback,
    isAIGenerated: false,
    aiComment: 'Lokal muhandislik algoritmi asosida hisoblandi.',
    recommendedStepSm: localFallback.recommendedPattern === 'border_zone' ? 12 : 15,
    circuitCount: Math.max(1, (interiorWalls || []).length + 1),
    apiStatus: 'Offline / Lokal Algoritm',
  };

  const keyToUse = userApiKey || storedApiKey;
  if (!keyToUse) {
    return fallbackResult;
  }

  try {
    const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (valid.length < 3) return fallbackResult;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of valid) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const widthM = (maxX - minX).toFixed(2);
    const heightM = (maxY - minY).toFixed(2);
    const areaM2 = (parseFloat(widthM) * parseFloat(heightM)).toFixed(1);

    const prompt = `HVAC muhandisi sifatida ushbu xona uchun Tyopliy Pol sxemasini tanlang:
Xona: ${roomName} (${roomType}), O'lcham: ${widthM}m x ${heightM}m, Maydon: ${areaM2}m², Ichki devorlar: ${interiorWalls.length}ta, Oynalar: ${windows.length}ta, Eshiklar: ${doors.length}ta.

Sxemalardan birini tanlang: "spiral", "double_snake", "single_snake", "border_zone".
FAQAT quyidagi JSON formatida qisqa javob qaytaring:
{
  "recommendedPattern": "spiral",
  "recommendedStepSm": 15,
  "circuitCount": 2,
  "rationale": "Xona maydoni va oynalar inobatga olingan holda optimal tanlov..."
}`;

    const rawText = await executeGeminiPrompt(prompt, keyToUse);
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const recPattern: HeatingPatternType = ['spiral', 'double_snake', 'single_snake', 'border_zone'].includes(parsed.recommendedPattern)
        ? parsed.recommendedPattern
        : fallbackResult.recommendedPattern;

      return {
        ...fallbackResult,
        recommendedPattern: recPattern,
        recommendedStepSm: parsed.recommendedStepSm || 15,
        circuitCount: parsed.circuitCount || fallbackResult.circuitCount,
        isAIGenerated: true,
        aiComment: parsed.rationale || 'Gemini AI tomonidan hisoblandi.',
        apiStatus: '✨ Gemini AI Online',
      };
    }
  } catch (err: any) {
    return {
      ...fallbackResult,
      isAIGenerated: false,
      apiStatus: `${err?.message || 'Tarmoq xatosi'}`,
    };
  }

  return fallbackResult;
}
