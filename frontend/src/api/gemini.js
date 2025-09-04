const GEMINI_API_KEY = "AIzaSyC_8usSHpppWNU2fnz7MgNFpUhzYAOnrIQ"; 

function toBase64Async(uri) {
  return new Promise((resolve, reject) => {
    fetch(uri)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

export async function analyzeFoodImageWithGemini(uri) {
  const base64 = await toBase64Async(uri);

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are a nutrition estimator. Given a food photo, respond ONLY in JSON:
{
  "dish": string,         
  "calories": number,     
  "protein": number,      
  "fat": number,          
  "carbs": number         
}`
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64,
            },
          },
        ],
      },
    ],
  };

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini 호출 실패: ${res.status} ${t}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  const jsonText = text.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonText);
}
