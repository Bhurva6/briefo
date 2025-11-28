import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from "@/lib/google-auth";

// This API endpoint will generate an image based on a text prompt
export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { prompt, userId, department, briefContent, textContent } = requestBody;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Generate 3 variations for foreground images
    const sampleCount = 3; 
    const aspectRatio = "4:3"; // Better for foreground images

    // Get fresh access token from token manager
    let accessToken: string;
    try {
      accessToken = await tokenManager.getAccessToken();
    } catch (error) {
      console.error("Failed to get access token:", error);
      return NextResponse.json({ error: "Failed to authenticate with Google Cloud" }, { status: 401 });
    }

    // Google Cloud/Vertex AI config
    const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || '';
    const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    const MODEL_VERSION = "imagen-4.0-generate-preview-06-06";

    if (!PROJECT_ID) {
      return NextResponse.json({ error: "Google Cloud project not configured" }, { status: 500 });
    }

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_VERSION}:predict`;

    // Enhanced prompt for foreground images with white background
    const enhancedPrompt = `${prompt}. Create an isolated object or illustration on a plain white background. The subject should be clearly defined with no background elements. Make it suitable for banner graphics related to ${department || 'business'}. Style: clean, professional, isolated on white background. Use brand colors #FEC736 (yellow/orange) and #CB1F35 (red) as primary colors. No text or lettering allowed in the image.`;

    // Build request body
    const requestPayload = {
      instances: [{ prompt: enhancedPrompt }],
      parameters: {
        sampleCount,
        aspectRatio,
        // Add parameters for better foreground image generation
        negativePrompt: "background, scenery, environment, multiple objects, cluttered, busy, textured background, patterned background, colored background, text, letters, words, writing, typography, fonts",
        personGeneration: "allow_adult",
      },
    };

    // Call Vertex AI
    const vertexRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    // Handle auth errors by retrying with fresh token
    if (vertexRes.status === 401) {
      console.log("Authentication failed, refreshing token and retrying...");
      tokenManager.invalidateToken();
      
      try {
        const freshToken = await tokenManager.getAccessToken();
        const retryRes = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        if (!retryRes.ok) {
          const error = await retryRes.text();
          return NextResponse.json({ error: `Retry failed: ${error}` }, { status: 500 });
        }

        const data = await retryRes.json();
        const result = await processAndUploadImages(data, prompt, userId);
        
        return result;
      } catch (retryError) {
        console.error("Token refresh retry failed:", retryError);
        return NextResponse.json({ error: "Authentication failed after retry" }, { status: 401 });
      }
    }

    if (!vertexRes.ok) {
      const error = await vertexRes.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await vertexRes.json();
    const result = await processAndUploadImages(data, prompt, userId);
    
    return result;
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}

// This function is adapted from the generate-image route
async function processAndUploadImages(data: any, prompt: string, userId?: string) {
  try {
    console.log("Processing Vertex AI response:", JSON.stringify(data, null, 2));
    
    if (!data.predictions || !Array.isArray(data.predictions)) {
      console.error("Invalid response format from Vertex AI:", data);
      throw new Error("Invalid response format from Vertex AI");
    }

    // Validate each prediction has required image data
    for (let i = 0; i < data.predictions.length; i++) {
      const pred = data.predictions[i];
      if (!pred.bytesBase64Encoded) {
        console.error(`Prediction ${i} missing image data:`, pred);
        throw new Error(`Missing image data in prediction ${i}`);
      }
    }

    // Return base64 data URLs directly instead of uploading to R2
    const images = data.predictions.map((pred: any) => {
      const dataUrl = `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`;
      
      return {
        url: dataUrl,
        dataUrl: dataUrl,
        prompt: pred.prompt || prompt,
      };
    });

    console.log(`Successfully processed ${images.length} images`);
    return NextResponse.json({ images, success: true });
  } catch (error) {
    console.error("Failed to process images:", error);
    return NextResponse.json({ error: "Failed to process images" }, { status: 500 });
  }
}
