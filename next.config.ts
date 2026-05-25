import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'zjhsggnmwvwlhiocmfrn.supabase.co'],
  },
  experimental: { serverComponentsExternalPackages: ['three'] },
};

export default nextConfig;
