import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { briefContent, department, templateConstraints } = await request.json();

    console.log('API called with department:', department);
    console.log('Brief content length:', briefContent?.length);

    if (!briefContent) {
      return NextResponse.json(
        { error: 'Brief content is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured. Please check server configuration.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const userPrompt = `You are an expert marketing copywriter. Based on the following marketing brief, generate creative copy variations for a banner announcement. For each section, provide 3 different creative options that adhere to the guidelines, tone, and objectives stated in the brief.

Marketing Brief:
${briefContent}

Department: ${department}

Template Character Limits:
${templateConstraints ? Object.entries(templateConstraints).map(([field, constraint]) => {
  const limit = constraint as any;
  const charLimit = limit?.max_chars ? `${limit.max_chars} characters max` : '';
  const wordLimit = limit?.max_words ? `${limit.max_words} words max` : '';
  const limits = [charLimit, wordLimit].filter(Boolean).join(', ');
  
  switch(field) {
    case 'hero_title': return `- Hero Headline: ${limits}`;
    case 'hero_subtitle': return `- Hero Subheadline: ${limits}`;
    case 'heading': return `- Heading: ${limits}`;
    case 'subtitle': return `- Subtitle: ${limits}`;
    case 'benefit_bullets_title': return `- Benefit titles: ${limits} each`;
    case 'benefit_bullets_description': return `- Benefit descriptions: ${limits} each`;
    case 'quick_tip_text': return `- Quick tip: ${limits}`;
    case 'cta_heading': return `- CTA heading: ${limits}`;
    case 'cta_body': return `- CTA body: ${limits}`;
    case 'leader_message': return `- Leader message: ${limits}`;
    default: return `- ${field}: ${limits}`;
  }
}).join('\n') : 'No specific limits provided'}

IMPORTANT: You must respond ONLY with valid JSON. Do not include any explanations, markdown formatting, or additional text. Return ONLY the raw JSON object.

The JSON structure must be exactly:
{
  "hero_headline": ["option1", "option2", "option3"],
  "hero_subheadline": ["option1", "option2", "option3"],
  "product_descriptor": ["option1", "option2", "option3"],
  "benefits": [
    ["benefit1_v1", "benefit2_v1", "benefit3_v1", "benefit4_v1"],
    ["benefit1_v2", "benefit2_v2", "benefit3_v2", "benefit4_v2"],
    ["benefit1_v3", "benefit2_v3", "benefit3_v3", "benefit4_v3"]
  ],
  "quick_tip": ["option1", "option2", "option3"],
  "cta_primary": ["option1", "option2", "option3"],
  "cta_secondary": ["option1", "option2", "option3"],
  "leader_closing": ["option1", "option2", "option3"]
}

Requirements for the copy:
1. Matches the tone and personality specified in the brief
2. Is appropriate for the target audience mentioned in the brief
3. Is creative yet professional
4. Drives the stated campaign objective from the brief
5. Uses the call-to-action guidance from the brief
6. STRICTLY adheres to the character and word limits specified above for each field
7. CRITICAL: The hero_subheadline MUST be 8 words or fewer. Count the words carefully and ensure each subheadline option has exactly 8 words maximum. This is a strict requirement.

Return ONLY the JSON object, nothing else.`;

    console.log('Calling Gemini API...');

    const result = await model.generateContent(userPrompt);
    const generatedContent = result.response.text();

    console.log('Raw Gemini response:', generatedContent);

    // Try to parse JSON from the response
    let parsedContent;
    try {
      // Remove any markdown code blocks
      let cleanedContent = generatedContent.trim();
      
      // Try to extract JSON from markdown code blocks
      const jsonBlockMatch = cleanedContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonBlockMatch) {
        cleanedContent = jsonBlockMatch[1].trim();
      }
      
      // Try to find JSON object even if there's text before/after
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }
      
      parsedContent = JSON.parse(cleanedContent);
      console.log('Successfully parsed JSON:', parsedContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Content that failed to parse:', generatedContent);
      // Return raw content if parsing fails
      parsedContent = { 
        raw_content: generatedContent,
        error: 'Failed to parse API response as JSON'
      };
    }

    return NextResponse.json({
      success: true,
      generatedCopy: parsedContent,
      rawResponse: generatedContent
    });

  } catch (error) {
    console.error('Error generating copy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
