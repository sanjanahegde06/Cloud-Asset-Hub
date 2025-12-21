/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
	// Next.js expects hostnames here (no scheme/port)
	allowedDevOrigins: ['localhost', '127.0.0.1', '10.239.198.120'],
}

module.exports = nextConfig