/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'zjhsggnmwvwlhiocmfrn.supabase.co',
      'img.youtube.com',
      'i.ytimg.com',
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['three', '@react-three/rapier'],
  },
  // Allow WASM imports (required for @react-three/rapier physics engine)
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    if (isServer) {
      config.output.webassemblyModuleFilename = 'chunks/[id].wasm';
      config.plugins.push(new (require('webpack').optimize.LimitChunkCountPlugin)({ maxChunks: 1 }));
    }
    return config;
  },
};

export default nextConfig;
