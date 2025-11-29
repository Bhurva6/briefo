import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { occasionType, targetAudience, messagingGoal, callToAction, tone } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Generate a detailed marketing brief based on the following information:

Occasion Type: ${occasionType}
Target Audience: ${targetAudience}
Messaging Goal: ${messagingGoal}
Call to Action: ${callToAction}
Tone: ${tone}

Please create a comprehensive marketing brief that includes:
- Campaign objectives
- Key messages
- Target audience details
- Brand guidelines (tone and style)
- Call to action details
- Any other relevant information for creating effective marketing materials

Make it professional and suitable for a marketing team to use.`;

    const result = await model.generateContent(prompt);
    const briefContent = result.response.text();

    return NextResponse.json({ briefContent });
  } catch (error) {
    console.error('Error generating brief:', error);
    return NextResponse.json(
      { error: 'Failed to generate brief' },
      { status: 500 }
    );
  }
}
