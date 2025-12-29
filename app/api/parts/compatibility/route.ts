import { NextRequest, NextResponse } from "next/server";

// POST - Check compatibility between parts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parts } = body;

    if (!parts || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: "Parts array is required" },
        { status: 400 }
      );
    }

    const issues: string[] = [];
    const compatible = true;

    // Find CPU and Motherboard
    const cpu = parts.find((p: any) => p.category === "CPU");
    const motherboard = parts.find((p: any) => p.category === "Motherboard");
    const rams = parts.filter((p: any) => p.category === "RAM");

    // Check CPU socket compatibility with motherboard
    if (cpu && motherboard) {
      // This is a simplified check - in reality, you'd need socket type data
      // For now, we'll just check if both exist
      // TODO: Add actual socket compatibility checking
    }

    // Check RAM type compatibility
    if (motherboard && rams.length > 0) {
      // Simplified check - would need actual RAM type data
      // TODO: Add RAM type compatibility checking
    }

    // Check RAM slots availability
    if (motherboard && rams.length > 4) {
      issues.push("Too many RAM modules selected. Most motherboards support up to 4 slots.");
    }

    return NextResponse.json({
      compatible: issues.length === 0,
      issues,
    });
  } catch (error: any) {
    console.error("Error checking compatibility:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

