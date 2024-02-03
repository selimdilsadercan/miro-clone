/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.clerk.com"]
  },
  experimental: { missingSuspenseWithCSRBailout: false }
};

export default nextConfig;
