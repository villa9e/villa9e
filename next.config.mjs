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
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
