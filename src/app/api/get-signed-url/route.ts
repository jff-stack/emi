import { NextResponse } from "next/server";

/**
 * @description API route to get a signed URL for ElevenLabs Conversational AI
 * This keeps the API key secure on the server side
 *
 * @endpoint GET /api/get-signed-url
 * @returns { signedUrl: string } - The signed URL for starting a conversation
 */
export async function GET() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    // Validate environment variables
    if (!apiKey) {
        console.error("ELEVENLABS_API_KEY is not configured");
        return NextResponse.json(
            { error: "ElevenLabs API key not configured" },
            { status: 500 }
        );
    }

    if (!agentId) {
        console.error("NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not configured");
        return NextResponse.json(
            { error: "ElevenLabs Agent ID not configured" },
            { status: 500 }
        );
    }

    try {
        // Request signed URL from ElevenLabs
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
            {
                method: "GET",
                headers: {
                    "xi-api-key": apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API error:", response.status, errorText);
            return NextResponse.json(
                { error: `ElevenLabs API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return the signed URL
        return NextResponse.json({ signedUrl: data.signed_url });
    } catch (error) {
        console.error("Failed to get signed URL:", error);
        return NextResponse.json(
            { error: "Failed to get signed URL from ElevenLabs" },
            { status: 500 }
        );
    }
}
