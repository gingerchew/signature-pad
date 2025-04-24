import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    target: ['ES2024'],
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SignaturePad',
      // the proper extensions will be added
      fileName: 'signature-pad',
    }
  },
})