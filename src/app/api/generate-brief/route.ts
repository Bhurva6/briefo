import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Bharti AXA Life Insurance Company Information
const BHARTI_AXA_INFO = `
Bharti AXA Life Insurance Company Limited is a joint venture between Bharti Enterprises and AXA, a global leader in insurance and asset management.

Key Company Facts:
- 99.18% Claim Settlement Ratio (as per latest annual audited statistics submitted to IRDAI FY 2025)
- 24x7 Online Customer Portal
- 200+ Offices across India
- 86 Lac+ Happy Visitors (as on 30th September 2025)
- INR 18,186 Cr+ Assets Under Management (as on 30th September 2025)

Core Products and Services:
1. Protection Plans - Term Insurance, Critical Illness coverage
2. Savings Plans - Guaranteed Wealth Pro, Guaranteed Bachat Plan, Secure InstaIncome Plan, Income Laabh
3. Investment Plans - ULIP Plans (Dream Shield Plus, Growth Shield Plus, Wealth Pro)
4. Retirement Plans - Swabhimaan Retirement Plan
5. Child Education Plans
6. Health Insurance Plans

Key Brand Values:
- Trust and Reliability
- Customer-centric approach
- Innovation in insurance solutions
- Financial security and protection
- Long-term wealth creation

Brand Colors: White (#FFFFFF), Teal (#1162A2), Red (#E2001F)

Target Audience: Individuals and families seeking financial protection, savings, investment, and retirement planning.

Unique Selling Points:
- High claim settlement ratio
- Flexible and customizable plans
- Tax benefits under Section 80C and 80CCC
- Loan against policy facility
- 24x7 customer service
- Digital-first approach with online portals and mobile apps

Communication Guidelines:
- Professional and trustworthy tone
- Focus on financial security and family protection
- Emphasize guaranteed returns where applicable
- Highlight tax benefits and long-term savings
- Use customer testimonials and success stories
- Promote digital convenience and ease of access
`;

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

    const prompt = `You are creating marketing briefs for Bharti AXA Life Insurance Company Limited.

    ${BHARTI_AXA_INFO}
    
    Generate a detailed marketing brief for Bharti AXA Life Insurance based on the following information:
    
    Occasion Type: ${occasionType}
    Target Audience: ${targetAudience}
    Messaging Goal: ${messagingGoal}
    Call to Action: ${callToAction}
    Tone: ${tone}
    
    Please create a comprehensive marketing brief that includes:
    - Campaign objectives aligned with Bharti AXA's brand values
    - Key messages incorporating Bharti AXA's products and services
    - Target audience details specific to Bharti AXA's customer segments
    - Brand guidelines following Bharti AXA's communication standards
    - Call to action details optimized for Bharti AXA's digital channels
    - Product recommendations from Bharti AXA's portfolio
    - Visual guidelines using Bharti AXA's brand colors (White, Teal, Red)
    - Channel recommendations (digital, social media, etc.)
    - Success metrics relevant to insurance marketing
    
    Ensure the brief positions Bharti AXA as a trusted, customer-centric insurance provider with high claim settlement ratio and innovative products. Reference specific Bharti AXA plans and services where relevant.
    
    Make it professional and suitable for Bharti AXA's marketing team to use.`;

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
