import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel natively supports Next.js — NÃO usar output: "standalone"
  // pois conflita com o sistema de build da Vercel.

  typescript: {
    ignoreBuildErrors: true,
  },

  // Nota: "eslint" foi removido pois não é mais suportado no Next.js 16.
  // O lint é ignorado automaticamente durante o build na Vercel.

  reactStrictMode: false,

  // Permite imagens externas usadas no projeto
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "z-cdn.chatglm.cn",
      },
    ],
  },
};

export default nextConfig;
