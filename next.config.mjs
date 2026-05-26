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
    serverComponentsExternalPackages: ['three'],
  },
};

export default nextConfig;
