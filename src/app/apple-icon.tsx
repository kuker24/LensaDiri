import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — the coral camera body at full tile size.
 *
 * Same construction as `icon.tsx`, scaled up: iOS masks its own corner radius,
 * so the coral fill runs edge to edge instead of insetting a squircle.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "linear-gradient(135deg, #FF9B79 0%, #E8724C 100%)",
      }}
    >
      {/* Soft optical ring */}
      <div
        style={{
          width: 102,
          height: 102,
          borderRadius: 999,
          background: "rgba(255,248,245,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Ceramic aperture cylinder */}
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 999,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Graphite lens core */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: "#1C1D20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* Sage iris glint */}
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 17,
                height: 17,
                borderRadius: 999,
                background: "#6BBF7A",
              }}
            />
            {/* Specular catchlight */}
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#FFFFFF",
              }}
            />
          </div>
        </div>
      </div>
      {/* Viewfinder dot */}
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 28,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: "#6BBF7A",
          border: "4px solid #FFFFFF",
        }}
      />
    </div>,
    { ...size },
  );
}
