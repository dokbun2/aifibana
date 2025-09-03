import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ imageUrl: string; text: string }> => {
  try {
    const fullPrompt = `You are an expert image editor. Your task is to edit the provided image based on the following instruction. You must output the edited image. Do not reply with text only.
Instruction: "${prompt}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          { text: fullPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let imageUrl = "";
    let text = "";

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }

    if (!imageUrl) {
        const fallbackText = text || response.text || "이미지가 생성되지 않았습니다. 모델이 요청을 거부했을 수 있습니다.";
        throw new Error(fallbackText);
    }
    
    return { imageUrl, text };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    throw new Error(`이미지 편집에 실패했습니다: ${errorMessage}`);
  }
};
