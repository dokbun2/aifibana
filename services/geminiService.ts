import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import type { UploadedImage, GeneratedResult, CompositeImageRequest, EditImageRequest } from '../types';

export const generateCompositeImage = async (
  ai: GoogleGenAI,
  request: CompositeImageRequest
): Promise<GeneratedResult> => {
  try {
    const { baseImage, overlayImage, prompt } = request;
    
    // 기본 프롬프트 구성
    const systemPrompt = `As an AI image composer, your task is to create a composite image based on the user's request.
${overlayImage ? '- The first image is the base image, and the second image should be composed into it.' : '- Use the provided image as a base for composition.'}
- User request: ${prompt}
- Create a realistic and creative composite image that fulfills the user's request.
- Ensure the result is family-friendly and adheres to safety guidelines.
- Pay attention to lighting, shadows, and perspective to make the composition look natural.`;

    const parts = [
      {
        inlineData: {
          data: baseImage.base64,
          mimeType: baseImage.mimeType,
        },
      },
    ];

    // 두 번째 이미지가 있으면 추가
    if (overlayImage) {
      parts.push({
        inlineData: {
          data: overlayImage.base64,
          mimeType: overlayImage.mimeType,
        },
      });
    }

    parts.push({
      text: systemPrompt,
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        }
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
        text: responseText,
        timestamp: Date.now(),
        type: 'composite',
      };
    }

    // If no image is returned, investigate why.
    const finishReason = response?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`이미지 합성이 중단되었습니다. 이유: ${finishReason}. 안전 정책 때문일 수 있습니다. 다른 이미지나 프롬프트를 시도해 보세요.`);
    }

    if (responseText) {
      // If the model returned text instead of an image, show it to the user.
      throw new Error(`AI가 이미지를 생성할 수 없어서 다음과 같이 응답했습니다: "${responseText}"`);
    }

    // Fallback error if no image and no other information is available.
    throw new Error("API에서 이미지를 반환하지 않았습니다. 이유를 알 수 없습니다. 나중에 다시 시도해 주세요.");

  } catch (error) {
    console.error("Error generating composite image with Gemini API:", error);
    
    if (error instanceof Error) {
      // Re-throw with the original message for user-friendly display
      throw new Error(error.message);
    }
    
    throw new Error("이미지 합성 중 알 수 없는 오류가 발생했습니다.");
  }
};

export const editImage = async (
  ai: GoogleGenAI,
  request: EditImageRequest
): Promise<GeneratedResult> => {
  try {
    const { baseImage, maskData, prompt } = request;
    
    // 기본 프롬프트 구성
    let systemPrompt = `As an AI image editor, your task is to edit the provided image based on the user's request.
- User request: ${prompt}
- Edit only the specified areas if a mask is provided
- Maintain the original image quality and style
- Create realistic and natural-looking edits
- Ensure the result is family-friendly and adheres to safety guidelines
- Pay attention to lighting, shadows, and perspective to make the edits look natural`;

    const parts = [
      {
        inlineData: {
          data: baseImage.base64,
          mimeType: baseImage.mimeType,
        },
      },
    ];

    // 마스크 데이터가 있으면 추가
    if (maskData) {
      parts.push({
        inlineData: {
          data: maskData,
          mimeType: 'image/png',
        },
      });
      systemPrompt += `\n- The second image is a mask showing the areas to edit (white areas should be edited, black areas should remain unchanged)`;
    }

    parts.push({
      text: systemPrompt,
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        }
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
        text: responseText,
        timestamp: Date.now(),
        type: 'edit',
      };
    }

    // If no image is returned, investigate why.
    const finishReason = response?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`이미지 편집이 중단되었습니다. 이유: ${finishReason}. 안전 정책 때문일 수 있습니다. 다른 이미지나 프롬프트를 시도해 보세요.`);
    }

    if (responseText) {
      // If the model returned text instead of an image, show it to the user.
      throw new Error(`AI가 이미지를 생성할 수 없어서 다음과 같이 응답했습니다: "${responseText}"`);
    }

    // Fallback error if no image and no other information is available.
    throw new Error("API에서 이미지를 반환하지 않았습니다. 이유를 알 수 없습니다. 나중에 다시 시도해 주세요.");

  } catch (error) {
    console.error("Error editing image with Gemini API:", error);
    
    if (error instanceof Error) {
      // Re-throw with the original message for user-friendly display
      throw new Error(error.message);
    }
    
    throw new Error("이미지 편집 중 알 수 없는 오류가 발생했습니다.");
  }
};