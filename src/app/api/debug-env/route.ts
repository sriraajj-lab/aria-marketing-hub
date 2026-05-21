import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AZURE_OPENAI_API_KEY: !!process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT || 'NOT SET',
    AZURE_OPENAI_MODEL: process.env.AZURE_OPENAI_MODEL || 'NOT SET',
    AZURE_ANTHROPIC_ENDPOINT: process.env.AZURE_ANTHROPIC_ENDPOINT || 'NOT SET',
    AZURE_ANTHROPIC_MODEL: process.env.AZURE_ANTHROPIC_MODEL || 'NOT SET',
    BRAIN_CROSS_VALIDATION: process.env.BRAIN_CROSS_VALIDATION || 'NOT SET',
  });
}
