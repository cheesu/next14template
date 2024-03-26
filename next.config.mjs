/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/:path*/",
        destination: `${process.env.NEXT_PUBLIC_DEV_BASE_URL}/:path*/`,
      },
    ];
  },
  trailingSlash: true,
};

export default nextConfig;
