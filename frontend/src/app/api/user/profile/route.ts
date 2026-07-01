/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextRequest, NextResponse } from "next/server";

// Server-side backend URL (not exposed to client)
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  try {
    const res = await fetch(`${BACKEND}/api/user/profile`, {
      method: "GET",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      cache: "no-store",
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

export async function PUT(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const body = await req.json();
  try {
    const res = await fetch(`${BACKEND}/api/user/profile`, {
      method: "PUT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
