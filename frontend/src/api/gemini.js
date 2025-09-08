import { apiGet } from "../config/api"

const GEMINI_API_KEY = "AIzaSyCCzNKTnjCLy6ifIHrKUIZrdRlu-ee3cCA"

/* ───────────────────── 공통 유틸 ───────────────────── */

function toBase64Async(uri) {
  return new Promise((resolve, reject) => {
    fetch(uri)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result).split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      .catch(reject)
  })
}

function extractText(data) {
  const p = data?.candidates?.[0]?.content?.parts
  if (!Array.isArray(p)) return ""
  return p.map(x => x?.text).filter(Boolean).join("\n")
}
function stripToJson(text) {
  if (!text) return ""
  let t = String(text).replace(/```json|```/g, "").trim()
  const s = t.indexOf("{")
  const e = t.lastIndexOf("}")
  if (s !== -1 && e !== -1 && e > s) t = t.slice(s, e + 1)
  return t
}
function safeParse(text) {
  try {
    return JSON.parse(stripToJson(text))
  } catch {
    try {
      const only = String(text).split("\n").filter(l => /["{}\[\]:]/.test(l)).join("\n")
      return JSON.parse(only)
    } catch {
      return null
    }
  }
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min))
const round = (n) => Math.round(Number(n) || 0)
const safeInt = (v, def = 0) => (Number.isFinite(+v) ? round(+v) : def)

/* ───────────────────── 프롬프트 ───────────────────── */
/* 1) 분류 프롬프트: 최소한으로 dish + context만 판별 */
function classifyPrompt() {
  return `
너는 음식 사진 1장을 보고 아래 JSON으로만 응답한다.

규칙:
- context는 "packaged"(가공/포장 식품) 또는 "prepared"(조리 음식) 둘 중 하나만.
- dish는 한글 음식명으로만 간단히.

출력(JSON만):
{
  "dish": "한글 음식명",
  "context": "packaged" | "prepared"
}
`.trim()
}

/* 2) 가공식품(포장) 상세 프롬프트: 라벨 기반 정밀 계산 */
function packagedPrompt() {
  return `
너는 영양 추정기다. 음식 사진 1장을 보고 JSON으로만 응답해.

목표:
- 사진 속 포장 식품(라벨/영양성분표)이면 라벨 숫자를 최우선으로 사용하여 최종 칼로리를 산출한다.

출력 형식(JSON만, 설명/단위/마크다운 금지):
{
  "dish": "한글 음식명",
  "context": "packaged",
  "portion": {
    "unit": "봉지" | "개" | "g",
    "count": 정수(>=1),
    "grams": 정수(>0)
  },
  "panel": {
    "net_weight_g": 정수,
    "serving_size_g": 정수,
    "servings_per_container": 정수,
    "calories_per_serving": 정수,
    "per100g": { "calories": 정수, "protein": 정수, "fat": 정수, "carbs": 정수 }
  },
  "per100g": { "calories": 정수, "protein": 정수, "fat": 정수, "carbs": 정수 },
  "output": { "portion_grams": 정수(1~2000), "calories": 정수 }
}

라벨 계산 규칙:
1) calories_per_serving + serving_size_g가 있으면
   섭취 서빙 수 = portion.grams / serving_size_g (반올림, 최소 1)
   calories = calories_per_serving × 섭취 서빙 수.
2) 위가 없고 per100g만 있으면
   calories = per100g.calories × (portion.grams / 100).
3) 모든 수치는 반올림 정수.

dish는 한글만 사용. 어떤 경우에도 JSON 외 설명 금지.
`.trim()
}

/* (참고) 조리음식 프롬프트는 사용하지 않음: 조리면 API에서 조회 */

/* ───────────────────── Gemini 호출 ───────────────────── */

async function callGemini(base64, text) {
  const body = {
    contents: [{ parts: [{ text }, { inlineData: { mimeType: "image/jpeg", data: base64 } }] }],
    generationConfig: { temperature: 0.1 }
  }
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + GEMINI_API_KEY,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  )
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`Gemini 호출 실패: ${res.status} ${t}`)
  }
  const data = await res.json()
  return extractText(data)
}

/* ───────────────────── 스키마 보정 & 계산 ───────────────────── */

function coerceSchema(obj) {
  const dish = String(obj?.dish || "").trim()
  const context = (obj?.context === "packaged" || obj?.context === "prepared") ? obj.context : "prepared"

  const portion = {
    unit: String(obj?.portion?.unit || "").trim() || "개",
    count: safeInt(obj?.portion?.count, 1),
    grams: clamp(safeInt(obj?.portion?.grams, 0), 1, 2000),
  }

  const panel = obj?.panel ? {
    net_weight_g: safeInt(obj.panel.net_weight_g, 0),
    serving_size_g: safeInt(obj.panel.serving_size_g, 0),
    servings_per_container: safeInt(obj.panel.servings_per_container, 0),
    calories_per_serving: safeInt(obj.panel.calories_per_serving, 0),
    per100g: {
      calories: safeInt(obj.panel?.per100g?.calories, 0),
      protein: safeInt(obj.panel?.per100g?.protein, 0),
      fat: safeInt(obj.panel?.per100g?.fat, 0),
      carbs: safeInt(obj.panel?.per100g?.carbs, 0),
    }
  } : null

  const per100g = {
    calories: clamp(safeInt(obj?.per100g?.calories, panel?.per100g?.calories || 0), 0, 900),
    protein: clamp(safeInt(obj?.per100g?.protein, panel?.per100g?.protein || 0), 0, 150),
    fat: clamp(safeInt(obj?.per100g?.fat, panel?.per100g?.fat || 0), 0, 150),
    carbs: clamp(safeInt(obj?.per100g?.carbs, panel?.per100g?.carbs || 0), 0, 150),
  }

  const output = {
    portion_grams: clamp(safeInt(obj?.output?.portion_grams, portion.grams), 1, 2000),
    calories: clamp(safeInt(obj?.output?.calories, 0), 0, 2500),
  }

  return { dish, context, portion, panel, per100g, output }
}

function hasLabelNumbers(s) {
  const p = s.panel
  if (!p) return false
  const A = p.calories_per_serving > 0 && p.serving_size_g > 0
  const B = p.per100g?.calories > 0 && (p.net_weight_g > 0 || s.portion?.grams > 0)
  return A || B
}

function computeCalories(schema) {
  const s = coerceSchema(schema)
  const portionGrams = clamp(s.portion?.grams || s.output?.portion_grams || 0, 1, 2000)
  let calories = 0

  if (s.context === "packaged" && hasLabelNumbers(s)) {
    const p = s.panel
    if (p.calories_per_serving > 0 && p.serving_size_g > 0) {
      const servings = Math.max(1, round(portionGrams / p.serving_size_g))
      calories = round(p.calories_per_serving * servings)
    } else if (p.per100g?.calories > 0) {
      calories = round(p.per100g.calories * (portionGrams / 100))
    }
  }

  if (calories <= 0) {
    const c100 = s.per100g?.calories || 0
    calories = round(c100 * (portionGrams / 100))
  }

  calories = clamp(calories, 0, 2500)
  return { dish: s.dish || "알 수 없음", portion_grams: portionGrams, calories }
}

/* ───────────────────── 백엔드 검색 ───────────────────── */

async function searchFoodByName(name, page = 1, perPage = 10) {
  const path = `/api/food/public/search?name=${encodeURIComponent(name)}&page=${page}&perPage=${perPage}`
  return apiGet(path) // -> [{ foodNm, enerc }]
}
function pickBestMatch(name, list) {
  if (!Array.isArray(list) || list.length === 0) return null
  const q = String(name || "").replace(/\s+/g, "").toLowerCase()
  const m = list.find(x => String(x.foodNm || "").replace(/\s+/g, "").toLowerCase().includes(q))
  return m || list[0]
}

/* ───────────────────── 파이프라인 ───────────────────── */
/* 1) 이미지 → 분류(classify): dish, context만 획득
   2) context === 'packaged' → AI(라벨 상세)로 정밀 계산
   3) context === 'prepared' → 백엔드 API로 칼로리 조회
   4) 실패 시 보완: 서로의 경로로 폴백 시도 후 없으면 0 */

async function classifyImage(uri) {
  const base64 = await toBase64Async(uri)
  const text = await callGemini(base64, classifyPrompt())
  const parsed = safeParse(text)
  if (!parsed) return { dish: "알 수 없음", context: "prepared" }
  const dish = String(parsed?.dish || "알 수 없음").trim()
  const context = parsed?.context === "packaged" ? "packaged" : "prepared"
  return { dish, context }
}

async function analyzePackagedViaAI(uri) {
  const base64 = await toBase64Async(uri)
  const text = await callGemini(base64, packagedPrompt())
  const parsed = safeParse(text)
  if (!parsed) return { dish: "알 수 없음", calories: 0 }
  const res = computeCalories(parsed)
  return { dish: res.dish, calories: res.calories }
}

async function analyzePreparedViaAPI(dish) {
  try {
    const candidates = await searchFoodByName(dish, 1, 10)
    const item = pickBestMatch(dish, candidates)
    if (item && Number.isFinite(+item.enerc)) {
      return { dish: item.foodNm || dish, calories: round(+item.enerc) }
    }
  } catch (_) {}
  return { dish: dish || "알 수 없음", calories: 0 }
}

/* ───────────────────── 공개 API ───────────────────── */

export async function analyzeFoodImage(uri) {
  try {
    const { dish, context } = await classifyImage(uri)

    if (context === "packaged") {
      const ai = await analyzePackagedViaAI(uri)
      if (ai.calories > 0) return ai
      // 라벨 인식 실패 시 API 보완
      const api = await analyzePreparedViaAPI(dish)
      if (api.calories > 0) return api
      return { dish: ai.dish || dish, calories: 0 }
    } else {
      const api = await analyzePreparedViaAPI(dish)
      if (api.calories > 0) return api
      // API에 항목 없을 때 AI(라벨 없음이더라도 추정 프롬프트 재활용)로 대략치 보완
      const ai = await analyzePackagedViaAI(uri)
      if (ai.calories > 0) return ai
      return { dish: dish || "알 수 없음", calories: 0 }
    }
  } catch (e) {
    if (__DEV__) console.warn("[analyzeFoodImage] error:", e?.message || e)
    return { dish: "알 수 없음", calories: 0 }
  }
}
