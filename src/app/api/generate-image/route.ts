import { NextRequest, NextResponse } from 'next/server';
import { tokenManager } from "@/lib/google-auth";

// Helper function to extract the main subject/concept from brief content
function extractMainSubject(briefContent: string, textContent?: string): { subject: string; style: string; visualConcept: string } {
  const content = briefContent.toLowerCase();
  
  // Try to extract title or main topic from the brief
  let subject = '';
  let visualConcept = '';
  
  // Look for specific keywords/topics that indicate the main subject
  // Technology & AI related
  if (content.includes('copilot') || content.includes('ai assistant') || content.includes('chatbot')) {
    subject = 'AI assistant robot, friendly chatbot character';
    visualConcept = 'cute robot helper, digital assistant mascot, friendly AI character with speech bubble';
  } else if (content.includes('artificial intelligence') || content.includes(' ai ') || content.includes('machine learning')) {
    subject = 'artificial intelligence, neural network';
    visualConcept = 'glowing brain with circuits, AI chip, neural network visualization';
  } else if (content.includes('automation') || content.includes('workflow')) {
    subject = 'automation, workflow optimization';
    visualConcept = 'gears and cogs in motion, streamlined process flow, efficiency symbols';
  } else if (content.includes('cloud') || content.includes('azure') || content.includes('aws')) {
    subject = 'cloud computing, cloud services';
    visualConcept = 'fluffy cloud with data icons, cloud server illustration, connected cloud network';
  } else if (content.includes('security') || content.includes('protection') || content.includes('cyber')) {
    subject = 'cybersecurity, data protection';
    visualConcept = 'shield with lock, security padlock, protected data vault';
  } else if (content.includes('analytics') || content.includes('data') || content.includes('insights')) {
    subject = 'data analytics, business intelligence';
    visualConcept = 'colorful charts and graphs, data visualization, analytics dashboard elements';
  }
  // Business & Marketing related
  else if (content.includes('sale') || content.includes('discount') || content.includes('offer')) {
    subject = 'sale, promotional offer';
    visualConcept = 'shopping bag with discount tag, sale burst icon, gift box with ribbon';
  } else if (content.includes('launch') || content.includes('new product') || content.includes('introducing')) {
    subject = 'product launch, new release';
    visualConcept = 'rocket launching, gift box opening with sparkles, new product showcase';
  } else if (content.includes('celebration') || content.includes('anniversary') || content.includes('milestone')) {
    subject = 'celebration, achievement';
    visualConcept = 'confetti and balloons, trophy or medal, celebration party elements';
  } else if (content.includes('team') || content.includes('collaboration') || content.includes('together')) {
    subject = 'teamwork, collaboration';
    visualConcept = 'people working together, connected hands, team collaboration illustration';
  } else if (content.includes('growth') || content.includes('success') || content.includes('achievement')) {
    subject = 'business growth, success';
    visualConcept = 'upward arrow, growing plant from coins, climbing chart, success mountain peak';
  } else if (content.includes('innovation') || content.includes('creative') || content.includes('idea')) {
    subject = 'innovation, creative ideas';
    visualConcept = 'glowing lightbulb, brain with gears, creative spark illustration';
  } else if (content.includes('customer') || content.includes('service') || content.includes('support')) {
    subject = 'customer service, support';
    visualConcept = 'friendly support agent, headset icon, helping hands illustration';
  } else if (content.includes('training') || content.includes('learning') || content.includes('education')) {
    subject = 'learning, education, training';
    visualConcept = 'open book with light, graduation cap, knowledge tree, learning symbols';
  } else if (content.includes('health') || content.includes('wellness') || content.includes('fitness')) {
    subject = 'health and wellness';
    visualConcept = 'healthy heart, wellness symbols, fitness icons, healthy lifestyle elements';
  } else if (content.includes('environment') || content.includes('sustainability') || content.includes('green')) {
    subject = 'sustainability, eco-friendly';
    visualConcept = 'green leaf, earth with plants, recycling symbols, eco-friendly icons';
  } else if (content.includes('finance') || content.includes('money') || content.includes('investment')) {
    subject = 'finance, investment';
    visualConcept = 'money growth chart, piggy bank, investment portfolio, financial success';
  } else if (content.includes('mobile') || content.includes('app') || content.includes('smartphone')) {
    subject = 'mobile technology, app';
    visualConcept = 'smartphone with app icons, mobile device illustration, digital touchscreen';
  } else if (content.includes('connect') || content.includes('network') || content.includes('communication')) {
    subject = 'connectivity, communication';
    visualConcept = 'connected nodes, network illustration, communication symbols';
  }
  // If textContent (banner headline) is provided, use it for additional context
  else if (textContent) {
    subject = textContent;
    visualConcept = `visual representation of "${textContent}", symbolic illustration`;
  }
  // Default fallback
  else {
    subject = 'business, professional';
    visualConcept = 'modern business illustration, professional corporate imagery';
  }
  
  // Determine style based on tone in the brief
  let style = 'modern clipart style, clean vector illustration';
  if (content.includes('formal') || content.includes('corporate') || content.includes('professional')) {
    style = 'professional corporate illustration, sleek and modern design';
  } else if (content.includes('friendly') || content.includes('fun') || content.includes('playful')) {
    style = 'friendly cartoon style, colorful and approachable clipart, cute illustration';
  } else if (content.includes('premium') || content.includes('luxury') || content.includes('elegant')) {
    style = 'hyper-realistic 3D render, premium high-quality visualization, photorealistic';
  } else if (content.includes('tech') || content.includes('digital') || content.includes('modern')) {
    style = 'modern tech illustration, sleek digital art style, futuristic clipart';
  } else if (content.includes('motivat') || content.includes('inspir') || content.includes('energetic')) {
    style = 'dynamic energetic illustration, bold and inspiring visual style';
  }
  
  return { subject, style, visualConcept };
}

// This API endpoint will generate an image based on a text prompt
export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { prompt, userId, department, briefContent, textContent, customPrompt } = requestBody;

    if (!prompt && !briefContent && !customPrompt) {
      return NextResponse.json({ error: 'Prompt, brief content, or custom prompt is required' }, { status: 400 });
    }

    // Generate 3 variations for foreground images
    const sampleCount = 3; 
    const aspectRatio = "4:3"; // Better for foreground images

    // Get fresh access token from token manager
    let accessToken: string;
    try {
      accessToken = await tokenManager.getAccessToken();
      console.log("Successfully obtained access token");
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

    // Build the image prompt based on brief content, department, or custom prompt
    let imagePrompt: string;
    
    if (customPrompt) {
      // User provided a custom prompt - enhance it with style requirements
      imagePrompt = `Create a clipart or hyper-realistic illustration of: ${customPrompt}. 
      
Requirements:
- Style: Either clean vector clipart OR hyper-realistic 3D render (choose what fits best for the subject)
- The image should be a single, clear focal point object or character
- Isolated on a pure white or transparent background
- No background elements, scenery, or environment
- Use brand accent colors #1162A2 blue color and #CB1F35 (vibrant red) where appropriate
- Make it visually appealing and professional
- ABSOLUTELY NO text, letters, numbers, words, or typography in the image`;
    } else if (briefContent) {
      // Extract the main subject and visual concept from the brief
      const { subject, style, visualConcept } = extractMainSubject(briefContent, textContent);
      const deptContext = department || 'marketing';
      
      // Create a detailed prompt for clipart or hyper-realistic images related to the brief
      imagePrompt = `Create a ${style} image of: ${visualConcept}. 
      
Main subject: ${subject}. 

Requirements:
- Style: Either clean vector clipart OR hyper-realistic 3D render (choose what fits best)
- The image should be a single, clear focal point object or character
- Isolated on a pure white or transparent background
- No background elements, scenery, or environment
- Use brand accent colors #1162A2 blue color and #CB1F35 (vibrant red) where appropriate
- Make it visually appealing and professional for a ${deptContext} campaign
- The image should immediately convey the concept of "${subject}"
- ABSOLUTELY NO text, letters, numbers, words, or typography in the image`;
    } else {
      // Fallback to the provided prompt if no brief content
      imagePrompt = `Create a clipart or hyper-realistic illustration of: ${prompt}. 
      
Requirements:
- Style: Clean vector clipart OR hyper-realistic 3D render
- Single clear focal point, isolated on white background
- No background elements or scenery
- Use brand colors #1162A2 blue color and #CB1F35 (red) as accents
- Professional and suitable for ${department || 'business'} marketing
- ABSOLUTELY NO text, letters, or typography in the image`;
    }

    console.log('Generated image prompt:', imagePrompt);

    // Build request body
    const requestPayload = {
      instances: [{ prompt: imagePrompt }],
      parameters: {
        sampleCount,
        aspectRatio,
        // Add parameters for better foreground image generation
        negativePrompt: "background, scenery, environment, landscape, multiple unrelated objects, cluttered composition, busy scene, textured background, patterned background, colored background, gradient background, text, letters, words, writing, typography, fonts, watermarks, signatures, labels, captions, blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs",
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
