
import { GoogleGenAI } from "@google/genai";
import { Company } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove "data:image/jpeg;base64,"
            const data = result.split(',')[1];
            resolve({
                inlineData: {
                    data,
                    mimeType: file.type,
                }
            });
        };
        reader.onerror = (error) => reject(error);
    });
}

export const generateChatResponse = async (
  prompt: string,
  imageFile: File | null,
  company: Company
): Promise<string> => {
  try {

    const systemInstruction = `You are an expert social media manager and brand assistant for "${company.name}".
Your responses must strictly adhere to the brand's persona and be in Spanish.
Brand Details:
- Description: ${company.description}
- Products: ${company.products}
- Target Audience: ${company.targetAudience}
- Tone of Voice: ${company.toneOfVoice}
- Contact Info: ${company.contact}

Your tasks are:
1. Answer any questions about the brand based on the details provided.
2. If an image is provided, analyze it and use it as the primary context for your response.
3. Generate creative content like social media post descriptions, content ideas, or ad copy based on the user's request and the provided image.

**Output Format for Social Media Posts:**
- **Language:** Always respond in Spanish.
- **Length:** The post description must be a maximum of 500 characters.
- **Emojis:** Use relevant emojis to make the content more engaging.
- **Call to Action (CTA):** Include a clear call to action. If relevant, use the contact information provided above.
- **Hashtags:** Add a few relevant hashtags at the end.

Keep your answers concise, engaging, and perfectly aligned with the brand's tone.`;
    
    const contents: any = {
        parts: [{ text: prompt }],
        role: "user"
    };

    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        contents.parts.unshift(imagePart); // Add image before the text prompt
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("The API did not return a valid text response.");
    }

    return text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate content: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the response.");
  }
};
