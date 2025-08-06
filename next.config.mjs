/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 환경변수가 설정되지 않은 경우 빈 배열 반환
    if (!process.env.NEXT_PUBLIC_DEV_BASE_URL) {
      return [];
    }
    return [
      {
        source: "/:path*/",
        destination: `${process.env.NEXT_PUBLIC_DEV_BASE_URL}/:path*/`,
      },
    ];
  },
  trailingSlash: true,
  experimental: {
    // WebAssembly 지원 활성화 (Next.js 15에서는 기본 지원)
  },
  webpack: (config, { isServer }) => {
    // WebAssembly 모듈 처리
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // WASM 파일 처리 규칙 추가
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // WASM 파일을 asset으로 처리
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name].[hash][ext]',
      },
    });
    
    // Node.js 모듈 polyfill 처리 (브라우저에서 fs, path 등)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
