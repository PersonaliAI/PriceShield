import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://priceshield-api-376030619262.us-central1.run.app";

export async function POST(request: NextRequest) {
  const targetUrl = `${API_BASE}/api/v1/public/generate-pdf`;

  try {
    const body = await request.json();

    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`PDF proxy: backend returned ${backendResponse.status} from ${targetUrl}:`, errorText);
      return NextResponse.json(
        { error: errorText, targetUrl },
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
    console.error(`PDF proxy error (target: ${targetUrl}):`, error);
    return NextResponse.json(
      { error: "Failed to generate PDF", targetUrl },
      { status: 500 }
    );
  }
}
