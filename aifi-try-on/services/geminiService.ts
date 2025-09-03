
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { UploadedImage, GeneratedResult } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateStyledImage = async (
  personImage: UploadedImage,
  clothingImage: UploadedImage
): Promise<GeneratedResult> => {
  try {
    const prompt = `As an AI virtual stylist, your task is to perform a virtual try-on.
- The first image is the person.
- The second image is the clothing.
Your goal is to generate a new, realistic, and family-friendly image of the person from the first image wearing the clothes from the second image.
Please ensure the final image is appropriate for all audiences and adheres to safety guidelines.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: personImage.base64,
              mimeType: personImage.mimeType,
            },
          },
          {
            inlineData: {
              data: clothingImage.base64,
              mimeType: clothingImage.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // The response.text accessor is a convenient way to get the text output.
    const responseText = response.text;

    // Find the image part in the response
    let imagePartFound = null;
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imagePartFound = part.inlineData;
          break; // Found an image, no need to look further.
        }
      }
    }

    if (imagePartFound) {
      const base64ImageBytes: string = imagePartFound.data;
      return {
        image: `data:${imagePartFound.mimeType};base64,${base64ImageBytes}`,
        // Include any text that might have come with the image (e.g., description)
        text: responseText,
      };
    }

    // If no image is returned, investigate why.
    const finishReason = response?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`Image generation stopped. Reason: ${finishReason}. This might be due to safety policies. Please try different images.`);
    }

    if (responseText) {
      // If the model returned text instead of an image, show it to the user.
      throw new Error(`The AI could not generate an image and responded with: "${responseText}"`);
    }

    // Fallback error if no image and no other information is available.
    throw new Error("API did not return an image. The reason is unknown. Please try again later.");

  } catch (error) {
    console.error("Error generating image with Gemini API:", error);

    let finalErrorMessage = "이미지 생성 중 알 수 없는 오류가 발생했습니다.";

    if (error instanceof Error) {
      // The SDK might throw an error where the message is a JSON string.
      const errorMessageContent = error.message;
      try {
        const parsedError = JSON.parse(errorMessageContent);
        if (parsedError.error) {
          const { message, status } = parsedError.error;
          if (status === 'INVALID_ARGUMENT' || (message && message.includes('Unable to process input image'))) {
            finalErrorMessage = '업로드된 이미지 중 하나를 처리할 수 없습니다. 다른 이미지를 사용해 보세요. 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.';
          } else {
            finalErrorMessage = `API 오류: ${message} (${status})`;
          }
        } else {
           // It's a valid JSON but not the expected error format.
           finalErrorMessage = errorMessageContent;
        }
      } catch (e) {
        // Not a JSON error message, treat as plain text.
        finalErrorMessage = errorMessageContent;
      }
    }

    // Re-throw a new error with a user-friendly message
    // that the UI component can display directly.
    throw new Error(finalErrorMessage);
  }
};
