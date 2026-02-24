/**
 * Telemetry Receiver - Vercel Edge Function
 * Receives and logs telemetry data from CHAGOK deployments
 *
 * Deploy: vercel --prod
 * Endpoint: https://chagok-telemetry.vercel.app/api
 */

import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

interface TelemetryData {
  d?: string; // domain
  h?: string; // host hash
  p?: string; // path
  m?: string; // method
  s?: number; // status
  t?: number | string; // timestamp
  u?: string; // user agent
  l?: string; // language
  r?: string; // referrer
  v?: string; // version
}

// In-memory store (use Redis/DB in production)
const reports: TelemetryData[] = [];

export default async function handler(req: NextRequest) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  // Handle GET (pixel tracking)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const m = url.searchParams.get('m');

    if (m) {
      try {
        const decoded = atob(m);
        const data: TelemetryData = JSON.parse(decoded);

        // Log to console (captured by Vercel logs)
        console.log('[TELEMETRY]', JSON.stringify({
          ...data,
          received_at: new Date().toISOString(),
          ip: req.headers.get('x-forwarded-for') || 'unknown',
        }));

        reports.push(data);
      } catch (e) {
        // Silent fail for invalid data
      }
    }

    // Return 1x1 transparent GIF
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(gif, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Handle POST (beacon/fetch)
  if (req.method === 'POST') {
    try {
      const data: TelemetryData = await req.json();

      console.log('[TELEMETRY]', JSON.stringify({
        ...data,
        received_at: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      }));

      reports.push(data);

      return NextResponse.json(
        { status: 'ok' },
        { status: 200, headers: corsHeaders }
      );
    } catch (e) {
      return NextResponse.json(
        { status: 'error' },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  return NextResponse.json(
    { status: 'method not allowed' },
    { status: 405, headers: corsHeaders }
  );
}
