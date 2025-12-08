import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from "@/lib/google-auth";

// Brand colors for backgrounds - ONLY these three colors allowed
const BRAND_COLORS = {
  white: '#FFFFFF',
  teal: '#1162A2',
  red: '#E2001F'
};

// Generate different background style prompts using ONLY the three brand colors
function getBackgroundPrompts(): string[] {
  return [
    // Solid white with subtle red accent at edges
    `Create a simple, elegant background in clean white color (hex #FFFFFF) with a very subtle red (hex #E2001F) accent line or curve only at the very bottom edge. ONLY use these exact colors: white #FFFFFF, teal #1162A2, and red #E2001F. No other colors allowed. The background should be plain and clean with no patterns, no complex designs, no textures in the main area. Absolutely no text, no letters, no words. Minimalist and professional. The red accent should be subtle and elegant.`,
    
    // Gradient from white to teal with red accent
    `Create a beautiful gradient background smoothly transitioning from clean white (#FFFFFF) to soft teal (#1162A2) with a subtle red (#E2001F) accent stripe or decorative element at the lower edge or corner. ONLY use these exact three colors: #FFFFFF, #1162A2, #E2001F. No other colors allowed whatsoever. No patterns, no textures, no objects, and absolutely no text or typography. Keep it minimal with clean, sophisticated gradients. The red adds a professional accent touch.`,
    
    // White base with teal and red geometric accents at edges
    `Create a minimal, modern background in clean white (#FFFFFF) as the main color, with teal (#1162A2) and red (#E2001F) geometric accent shapes or curves ONLY at the lower left corner, lower right corner, or bottom edge. ONLY use these exact three colors: white #FFFFFF, teal #1162A2, red #E2001F. Absolutely NO other colors. No patterns in the main area, no textures, no objects, no text, no letters. The accent design should be simple - minimal waves, curves, or geometric shapes. Professional, elegant, and brand-compliant.`,
  ];
}

// This API endpoint generates background images with brand colors
export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { style, customPrompt } = requestBody; // Optional: 'solid', 'gradient', 'accent' or customPrompt

    // Generate 3 variations for background images (or 1 for custom prompt)
    const sampleCount = customPrompt ? 3 : 1; // Generate 3 for custom, 1 per preset prompt
    const aspectRatio = "16:9"; // Better for banner backgrounds

    // Get fresh access token from token manager
    let accessToken: string;
    try {
      accessToken = await tokenManager.getAccessToken();
      console.log("Successfully obtained access token for background generation");
    } catch (error) {
      console.error("Failed to get access token:", error);
      return NextResponse.json({ 
        error: "Failed to authenticate with Google Cloud", 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 401 });
    }

    // Google Cloud/Vertex AI config
    const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || '';
    const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    const MODEL_VERSION = process.env.MODEL || "imagen-3.0-fast-generate-001";

    if (!PROJECT_ID) {
      return NextResponse.json({ error: "Google Cloud project not configured" }, { status: 500 });
    }

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_VERSION}:predict`;

    // Get background prompts - either custom or preset
    let backgroundPrompts: string[];
    
    if (customPrompt) {
      // User provided a custom prompt - enhance it with brand color requirements
      const enhancedCustomPrompt = `Create a background image based on: ${customPrompt}. 
      
STRICT COLOR REQUIREMENTS - ONLY use these exact three brand colors:
- White: #FFFFFF
- Teal: #1162A2  
- Red: #E2001F

NO other colors allowed whatsoever. The background should be elegant and professional.
No text, no letters, no words, no typography, no complex objects, no people.
Keep it minimal and suitable for a banner background.`;
      
      backgroundPrompts = [enhancedCustomPrompt];
    } else {
      backgroundPrompts = getBackgroundPrompts();
    }
    
    // Generate images for each prompt
    const allImages: any[] = [];
    
    for (const bgPrompt of backgroundPrompts) {
      const requestPayload = {
        instances: [{ prompt: bgPrompt }],
        parameters: {
          sampleCount,
          aspectRatio,
          negativePrompt: "text, letters, words, writing, typography, fonts, logos, icons, people, faces, animals, objects, complex patterns, busy designs, detailed illustrations, photographs, realistic images, 3D renders, blue, green, purple, pink, orange, teal, cyan, magenta, brown, black, gray, rainbow, multicolor, neon colors, bright colors outside brand palette",
          personGeneration: "dont_allow",
        },
      };

      try {
        // Call Vertex AI
        let vertexRes = await fetch(url, {
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
          accessToken = await tokenManager.getAccessToken();
          
          vertexRes = await fetch(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestPayload),
          });
        }

        if (!vertexRes.ok) {
          const error = await vertexRes.text();
          console.error("Vertex AI error for background:", error);
          continue; // Skip this prompt and try the next one
        }

        const data = await vertexRes.json();
        
        if (data.predictions && Array.isArray(data.predictions)) {
          for (const pred of data.predictions) {
            if (pred.bytesBase64Encoded) {
              const dataUrl = `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`;
              allImages.push({
                url: dataUrl,
                dataUrl: dataUrl,
                style: bgPrompt.includes('solid') ? 'solid' : bgPrompt.includes('gradient') ? 'gradient' : 'accent',
              });
            }
          }
        }
      } catch (error) {
        console.error("Error generating background image:", error);
        continue; // Skip this prompt and try the next one
      }
    }

    if (allImages.length === 0) {
      return NextResponse.json({ error: "Failed to generate any background images" }, { status: 500 });
    }

    console.log(`Successfully generated ${allImages.length} background images`);
    return NextResponse.json({ images: allImages, success: true });

  } catch (error) {
    console.error('Error generating background images:', error);
    return NextResponse.json({ error: 'Failed to generate background images' }, { status: 500 });
  }
}
