import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true }) // Optional: for bundle analysis
  ],
  define: {
    // grab the version from package.json
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
  },
  root: '.',      
  base: './',     
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
    sourcemap: false,
    minify: 'esbuild'
  }
})