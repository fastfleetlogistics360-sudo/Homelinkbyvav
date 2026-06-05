import { type MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomeLink by V-A.V",
    short_name: "HomeLink",
    description: "Request a Home. Get Matched Fast.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#04132d",
    icons: [
      {
        src: "/images/homelink-logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/images/homelink-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
