import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const logoUrl = new URL("/logo.png", request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <img src={logoUrl} width="460" height="460" alt="Kampung Cetak" />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
