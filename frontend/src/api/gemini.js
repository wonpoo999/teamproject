import { apiGet } from "../config/api"

const GEMINI_API_KEY = "AIzaSyAvca1r-SMD32rBnQ8S7f6o28FN1YpxfqU"

/* ───────────── 공통 유틸 (필요 최소) ───────────── */

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
const energyFromMacros = (p, f, c) => 4 * p + 9 * f + 4 * c

/* ───────────── Vision 추정(폴백): 칼로리만 리턴 ───────────── */

function visionPrompt(strict = false) {
  const base = `너는 영양 추정기다. 음식 사진을 보고 JSON으로만 응답해.
규칙:
- 키: dish(한국어 음식명), portion_grams(1~2000 정수, 1회 제공량 g), per100g(100g 당 수치: calories, protein, fat, carbs 모두 정수)
- dish는 반드시 한글 표기만 사용(외래어도 한글, 예: 파스타, 피자, 타코)
- per100g 수치는 일반적인 영양 데이터 상식 범위로 추정
- 설명·단위·코멘트·마크다운 금지. JSON만 출력.
- 만약에 모르겠으면 네이버에 검색을 해서라도 정확한 값을 출력해
형식:
{
  "dish": "김치볶음밥",
  "portion_grams": 350,
  "per100g": { "calories": 180, "protein": 4, "fat": 6, "carbs": 27 }
}`
  const extra = strict ? `\n추가: dish에 알파벳이 포함되면 안 된다. 숫자는 모두 정수만 사용.` : ""
  return base + extra
}

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

function coerceShape(obj) {
  const dish = typeof obj?.dish === "string" ? obj.dish.trim() : ""
  const portion_grams = Number.isFinite(+obj?.portion_grams) ? +obj.portion_grams : 0
  const per100g = {
    calories: Number.isFinite(+obj?.per100g?.calories) ? +obj.per100g.calories : 0,
    protein: Number.isFinite(+obj?.per100g?.protein) ? +obj.per100g.protein : 0,
    fat: Number.isFinite(+obj?.per100g?.fat) ? +obj.per100g.fat : 0,
    carbs: Number.isFinite(+obj?.per100g?.carbs) ? +obj.per100g.carbs : 0,
  }
  return { dish, portion_grams, per100g }
}
function validShape(s) {
  if (!s) return false
  if (!s.dish) return false
  if (!Number.isFinite(s.portion_grams) || s.portion_grams <= 0) return false
  const p = s.per100g || {}
  return ["calories", "protein", "fat", "carbs"].every(k => Number.isFinite(p[k]))
}
function totalsFromShape({ portion_grams, per100g }) {
  const pg = clamp(round(portion_grams), 1, 2000)
  const per = {
    calories: clamp(round(per100g?.calories), 0, 900),
    protein: clamp(round(per100g?.protein), 0, 100),
    fat: clamp(round(per100g?.fat), 0, 100),
    carbs: clamp(round(per100g?.carbs), 0, 150),
  }
  const factor = pg / 100
  const protein = round(per.protein * factor)
  const fat = round(per.fat * factor)
  const carbs = round(per.carbs * factor)
  let calories = round(energyFromMacros(protein, fat, carbs))
  calories = clamp(calories, 0, 2500)
  return { portion_grams: pg, calories }
}

async function analyzeFoodImageWithGemini_Fallback(uri) {
  const base64 = await toBase64Async(uri)
  let t = await callGemini(base64, visionPrompt(false))
  let parsed = safeParse(t)
  let shaped = coerceShape(parsed)
  if (!validShape(shaped)) {
    t = await callGemini(base64, visionPrompt(true))
    parsed = safeParse(t)
    shaped = coerceShape(parsed)
  }
  if (!validShape(shaped)) {
    return { dish: "알 수 없음", calories: 0 }
  }
  const totals = totalsFromShape(shaped)
  return { dish: shaped.dish, calories: totals.calories }
}

/* ───────────── 라벨 OCR(제품명/제조사) ───────────── */

function labelPrompt() {
  return `음식 라벨/포장 사진에서 핵심만 JSON으로 추출해.
규칙:
- JSON만 출력
- 키: name(제품명, 한글 우선), manufacturer(제조사/브랜드, 한글 우선)
- 설명/단위/마크다운 금지
형식: {"name":"오리온 포카칩 오리지널","manufacturer":"오리온"}`
}
async function callGeminiForLabel(base64) {
  const body = {
    contents: [{ parts: [{ text: labelPrompt() }, { inlineData: { mimeType: "image/jpeg", data: base64 } }] }],
    generationConfig: { temperature: 0.1 }
  }
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + GEMINI_API_KEY,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  )
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`Gemini(Label) 실패: ${res.status} ${t}`)
  }
  const data = await res.json()
  const text = extractText(data)
  const parsed = safeParse(text) || {}
  return {
    name: String(parsed.name || "").trim(),
    manufacturer: String(parsed.manufacturer || "").trim(),
  }
}

/* ───────────── 백엔드 검색 (FoodDTO { foodNm, enerc }) ───────────── */

async function searchFoodByName(name, page = 1, perPage = 10) {
  const path = `/api/food/public/search?name=${encodeURIComponent(name)}&page=${page}&perPage=${perPage}`
  return apiGet(path) // -> [{ foodNm, enerc }]
}
function pickBestMatch(name, manufacturer, list) {
  if (!Array.isArray(list) || list.length === 0) return null
  const q = String(name || "").replace(/\s+/g, "").toLowerCase()
  const m = list.find(x => String(x.foodNm || "").replace(/\s+/g, "").toLowerCase().includes(q))
  return m || list[0]
}

/**
 * 공개 API: 이미지에서 "칼로리만" 계산해서 돌려줌
 * 1) 라벨 OCR → name
 * 2) 백엔드 검색 → enerc(kcal) 그대로 사용
 * 3) 실패 시 Vision 폴백(칼로리만)
 */
export async function analyzeFoodImage(uri) {
  try {
    const base64 = await toBase64Async(uri)
    const { name } = await callGeminiForLabel(base64)

    if (!name) {
      // OCR 실패 → 폴백
      return await analyzeFoodImageWithGemini_Fallback(uri)
    }

    const candidates = await searchFoodByName(name, 1, 10)
    const item = pickBestMatch(name, "", candidates)

    if (item && Number.isFinite(+item.enerc)) {
      return { dish: item.foodNm || name, calories: round(+item.enerc) }
    }

    return await analyzeFoodImageWithGemini_Fallback(uri)
  } catch (e) {
    if (__DEV__) console.warn("[analyzeFoodImage] fallback:", e?.message || e)
    return await analyzeFoodImageWithGemini_Fallback(uri)
  }
}
