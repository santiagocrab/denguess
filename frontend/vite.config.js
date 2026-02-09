import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Exclude test files from processing
      exclude: /\.test\.(js|jsx|ts|tsx)$/,
    }),
  ],
  
  // Base path: '/' for all environments (Vercel handles routing)
  base: '/',
  
  // Development server config
  server: {
    port: 5173,
    host: true,
    open: false,
    hmr: {
      overlay: false, // Disable error overlay to prevent timeouts
    },
    fs: {
      strict: false, // Allow serving files outside root
    },
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  
  // Preview server (for testing production builds)
  preview: {
    port: 4173,
    host: true,
  },
  
  // Build optimizations
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for faster builds
    minify: 'esbuild', // Fastest minifier
    target: 'esnext', // Modern browsers
    cssCodeSplit: true, // Split CSS for better caching
    chunkSizeWarningLimit: 1000, // Increase warning limit
    
    rollupOptions: {
      output: {
        // Optimized chunk splitting for better caching
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor'
          }
          // Chart libraries
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'chart-vendor'
          }
          // Map libraries
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'map-vendor'
          }
          // Other large vendor libraries
          if (id.includes('node_modules/axios')) {
            return 'axios-vendor'
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'leaflet',
      'react-leaflet',
      'chart.js',
      'react-chartjs-2',
      'axios',
    ],
    // Don't force re-optimization unless needed
    force: false,
    esbuildOptions: {
      target: 'esnext',
    },
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src', // Optional: for cleaner imports
    },
  },
}))
