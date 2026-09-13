import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Raster favicon for browsers that prefer PNG over SVG.
 *
 * This mirrors `public/brand/favicon.svg` — the coral camera body with a
 * ceramic aperture, graphite lens, and sage viewfinder dot. Satori renders
 * gradients and border radii but not SVG filters, so the source drop shadow is
 * dropped rather than approximated; at 32px it would not survive anyway.
 */
export default function Icon() {
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
        borderRadius: 8,
      }}
    >
      {/* Ceramic aperture cylinder */}
      <div
        style={{
          width: 14,
          height: 14,
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
            width: 9,
            height: 9,
            borderRadius: 999,
            background: "#1C1D20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Sage iris glint */}
          <div
            style={{
              width: 3.5,
              height: 3.5,
              borderRadius: 999,
              background: "#6BBF7A",
              transform: "translate(1.5px, -1.5px)",
            }}
          />
        </div>
      </div>
      {/* Viewfinder dot */}
      <div
        style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "#6BBF7A",
          border: "1px solid #FFFFFF",
        }}
      />
    </div>,
    { ...size },
  );
}
