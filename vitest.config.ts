import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    server: {
      deps: {
        // Lucide React v1+ ships ESM-only; inline it so Vite can transform it
        inline: ['lucide-react'],
      },
    },
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/**/*.ts',
        'src/components/**/*.tsx',
      ],
      exclude: [
        // DB / auth infrastructure — require live connections
        'src/lib/db/**',
        'src/lib/supabase/**',
        // HTTP source adapters — pure fetch wrappers; tested via integration tests
        'src/lib/ingest/**',
        // Model-dependent — loads @xenova/transformers feature-extraction model at runtime
        'src/lib/embeddings.ts',
        // Supabase-query-dependent — require a live service-role connection
        'src/lib/rate-benchmarking.ts',
        'src/lib/roadmap.ts',
        // Static seed / taxonomy data
        'src/lib/skills-taxonomy.ts',
        'src/lib/learning-resources.ts',
        // shadcn/ui base components — vendor code
        'src/components/ui/**',
      ],
      thresholds: {
        // Honest global floor that guards against regression. The largest remaining
        // gap is JobCard.tsx (~51%); everything else is well covered.
        statements: 80,
        branches:   70,
        functions:  72,
        lines:      85,
        // Core business logic stays near-fully covered: matching.ts, reliability.ts and
        // parse-job-description.ts are ~100%. This guards the src/lib layer as a whole.
        'src/lib/**': {
          statements: 90,
          branches:   85,
          functions:  90,
          lines:      95,
        },
      },
    },
  },
})
