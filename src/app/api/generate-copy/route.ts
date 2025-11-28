import { NextRequest, NextResponse } from 'next/server';

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

    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured. Please check server configuration.' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert BFSI (Banking, Financial Services, and Insurance) specialized marketing copywriter with years of experience creating compelling, conversion-driven copy for financial institutions. You have a deep understanding of regulatory compliance, industry terminology, and what resonates with both internal stakeholders and customers in the financial sector.

Your expertise includes:
- Creating clear, concise, and engaging copy that adheres to brand guidelines
- Understanding the nuances of corporate communications in BFSI
- Balancing creativity with professionalism and compliance requirements
- Writing for diverse audiences from CXOs to frontline employees
- Crafting messaging that builds trust and drives action

When given a brief, you extract key information and generate multiple creative copy variations for different sections of the banner/communication, ensuring each piece aligns with the stated objectives, tone, and brand requirements.`;

    const userPrompt = `Based on the following marketing brief, generate creative copy variations for a banner announcement. For each section mentioned in the brief, provide 3 different creative options that adhere to the guidelines, tone, and objectives stated.

Brief:
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
2. Is appropriate for the target audience
3. Aligns with BFSI industry standards and compliance
4. Is creative yet professional
5. Drives the stated campaign objective
6. STRICTLY adheres to the character and word limits specified above for each field

Return ONLY the JSON object, nothing else.`;

    console.log('Calling Perplexity API...');
    console.log('API Key exists:', !!process.env.PERPLEXITY_API_KEY);
    console.log('API Key starts with:', process.env.PERPLEXITY_API_KEY?.substring(0, 8));

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity API error status:', response.status);
      console.error('Perplexity API error:', errorData);
      
      // Fallback: Generate mock data for testing
      console.log('Using mock data fallback...');
      const mockData = {
        hero_headline: [
          "Meet Your New AI Partner: ABSLI AI Copilot",
          "Work Smarter, Not Harder with ABSLI AI Copilot",
          "Your AI-Powered Productivity Partner is Here"
        ],
        hero_subheadline: [
          "Transform your work with intelligent AI assistance.",
          "Say goodbye to repetitive daily tasks now.",
          "Boost productivity with adaptive AI learning."
        ],
        product_descriptor: [
          "Your AI partner for emails, documents, meetings, and data analysis—all within the tools you use every day.",
          "An intelligent copilot integrated seamlessly into Outlook, Word, Excel, and Teams to accelerate your work.",
          "AI-powered assistance for daily tasks: from email drafting to data insights, all in one secure environment."
        ],
        benefits: [
          [
            "Summarize lengthy emails and documents into 3-5 actionable bullet points instantly",
            "Draft and refine emails, policy notes, and announcements in your preferred tone and style",
            "Transform rough notes and ideas into polished, presentation-ready slides",
            "Analyze Excel data to uncover key trends and recommend next steps"
          ],
          [
            "Cut through information overload—get instant summaries of long emails and documents",
            "Write better, faster—let AI draft messages that match your voice perfectly",
            "Create compelling presentations from your ideas in minutes, not hours",
            "Unlock insights hidden in your data with intelligent analysis and recommendations"
          ],
          [
            "Save hours weekly by getting instant summaries of complex emails and documents",
            "Communicate with confidence—AI-powered writing that reflects your professional tone",
            "Build impactful presentations effortlessly from your initial concepts",
            "Make data-driven decisions faster with AI-generated insights and trends"
          ]
        ],
        quick_tip: [
          "Your data stays secure within ABSLI's protected environment—feel confident using AI Copilot with internal projects and sensitive information.",
          "Rest assured: All your content remains within our secure ABSLI ecosystem. Use AI Copilot freely for internal work.",
          "Security first: AI Copilot operates entirely within ABSLI's secure infrastructure—your data never leaves our protected environment."
        ],
        cta_primary: [
          "Start using ABSLI AI Copilot today in Outlook, Word, Excel, and Teams. Explore its capabilities and discover how it saves you time.",
          "Ready to transform your workday? Launch ABSLI AI Copilot now in your favorite Microsoft apps and experience the difference.",
          "Begin your AI-powered journey today. Open ABSLI AI Copilot in Outlook, Word, Excel, or Teams and watch productivity soar."
        ],
        cta_secondary: [
          "Share your success stories—let us know how AI Copilot is helping you work smarter.",
          "Join the conversation—tell your colleagues how AI Copilot is changing your workday.",
          "Spread the word—share tips and use cases with your team to maximize everyone's productivity."
        ],
        leader_closing: [
          "I'm excited to see how you use AI Copilot to reimagine the way we work at ABSLI and unlock new levels of productivity.",
          "This is just the beginning of our AI journey. I can't wait to see the innovative ways you'll leverage Copilot to drive excellence at ABSLI.",
          "Together with AI Copilot, we're not just working differently—we're working better. Let's embrace this opportunity to innovate and excel."
        ]
      };
      
      return NextResponse.json({
        success: true,
        generatedCopy: mockData,
        rawResponse: 'Mock data generated due to API authentication failure. Please update your Perplexity API key.',
        warning: 'Using mock data - Perplexity API key is invalid or expired'
      });
    }

    console.log('Perplexity API response received');

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Raw Perplexity response:', generatedContent);

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
