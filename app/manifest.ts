import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FluxTrack Laboratory Sample Tracking",
    short_name: "FluxTrack",
    description: "Fast laboratory sample issue reporting and traceability.",
    start_url: "/operator",
    display: "standalone",
    background_color: "#f5f7f4",
    theme_color: "#176b4d",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
