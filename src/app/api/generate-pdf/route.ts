import { NextRequest, NextResponse } from "next/server";

// Server-side only: hardcode the production backend URL.
// This avoids any issues with stale NEXT_PUBLIC_* env vars baked into builds.
const BACKEND_URL = "https://priceshield-api-376030619262.us-central1.run.app";

export async function POST(request: NextRequest) {
  const targetUrl = `${BACKEND_URL}/api/v1/public/generate-pdf`;

  try {
    const body = await request.json();

    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`PDF proxy: backend returned ${backendResponse.status}:`, errorText);
      return NextResponse.json(
        { error: "PDF generation failed on backend" },
        { status: backendResponse.status }
      );
    }

    const pdfBuffer = await backendResponse.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
