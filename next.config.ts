import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // In dev, do not change!!
  //   output: "standalone",
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
