/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.01:8000/api/:path*", // Sesuaikan dengan port/endpoint backend kamu
      },
    ];
  },
};

module.exports = nextConfig;
