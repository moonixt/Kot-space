import { NextResponse } from "next/server";

// Environment variables are secure in server components/API routes
const ENDPOINT_URL = process.env.LANGFLOW_ENDPOINT;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Forward the request to your actual endpoint

    const response = await fetch(`${ENDPOINT_URL}?stream=true`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.LANGFLOW_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Return the streamed response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
