import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      esbuild: {
        loader: 'tsx',
        include: /\.[tj]sx?$/,
      },
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            '.js': 'jsx',
            '.ts': 'tsx',
            '.jsx': 'jsx',
            '.tsx': 'tsx',
          },
        },
      },
    };
});
