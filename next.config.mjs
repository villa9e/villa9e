/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'zjhsggnmwvwlhiocmfrn.supabase.co',
      'img.youtube.com',
      'i.ytimg.com',
      'cdn.meshy.ai',
      'assets.meshy.ai',
    ],
  },
  // Allow 3D model files and Meshy CDN
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['three', '@react-three/rapier'],
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
