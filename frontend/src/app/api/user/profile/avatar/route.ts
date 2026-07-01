/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextRequest, NextResponse } from "next/server";

// Server-side backend URL (not exposed to client)
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  try {
    const formData = await req.formData();
    const res = await fetch(`${BACKEND}/api/user/profile/avatar`, {
      method: "POST",
      headers: {
        Authorization: auth,
      },
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Could not reach backend. Please try again." },
      { status: 503 }
    );
  }
}
