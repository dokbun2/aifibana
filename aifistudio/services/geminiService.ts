
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. Please provide a valid API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY" });

interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

interface TextPart {
  text: string;
}

export interface EditImageResult {
    base64Image: string | null;
    text: string | null;
}

export const editImage = async (
  images: { data: string; mimeType: string }[],
  prompt: string
): Promise<EditImageResult> => {
  try {
    const imageParts: ImagePart[] = images.map(img => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType,
      },
    }));
    const textPart: TextPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [...imageParts, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let base64Image: string | null = null;
    let text: string | null = null;
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            base64Image = part.inlineData.data;
        } else if (part.text) {
            text = part.text;
        }
    }
    
    if (!base64Image) {
        throw new Error("API did not return an image. It might have been blocked.");
    }

    return { base64Image, text };

  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while editing the image.");
  }
};
