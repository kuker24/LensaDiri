import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Raster favicon for browsers that prefer PNG over SVG. */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        borderRadius: 6,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          border: "1.5px solid #e2e2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 15,
            height: 15,
            borderRadius: 999,
            border: "1.25px solid rgba(226,226,226,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#e2e2e2",
            }}
          />
        </div>
      </div>
    </div>,
    { ...size },
  );
}
