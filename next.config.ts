import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
const nextConfig = (phase: string): NextConfig => ({
	reactStrictMode: true,
	outputFileTracingRoot: process.cwd(),
	// Keep production builds from replacing files used by the running dev server.
	distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});
export default nextConfig;
