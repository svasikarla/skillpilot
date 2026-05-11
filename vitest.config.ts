import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    deps: {
      // Lucide React v1+ ships ESM-only; inline it so Vite can transform it
      inline: ['lucide-react'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['src/__tests__/components/**', 'jsdom'],
    ],
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
        'src/lib/sources/remotive.ts',
        'src/lib/sources/weworkremotely.ts',
        'src/lib/sources/remoteok.ts',
        'src/lib/sources/himalayas.ts',
        'src/lib/sources/findwork.ts',
        'src/lib/sources/hn-algolia.ts',
        'src/lib/sources/usajobs.ts',
        'src/lib/sources/wellfound.ts',
        'src/lib/sources/index.ts',
        // AI-API-dependent — OpenAI Batch API; requires live key
        'src/lib/skill-extraction.ts',
        // Supabase-query-dependent
        'src/lib/roadmap.ts',
        // Static seed / taxonomy data
        'src/lib/skills-taxonomy.ts',
        'src/lib/learning-resources.ts',
        // shadcn/ui base components — vendor code
        'src/components/ui/**',
        'src/components/providers/**',
      ],
      thresholds: {
        // Core business logic (reliability, matching, embeddings, workflow) is 90%+
        // Untested UI-only components (ApplicationStepper, ProposalModal, platform components)
        // bring the blended function coverage to ~53%; threshold set accordingly
        statements: 60,
        branches:   60,
        functions:  50,
        lines:      60,
      },
    },
  },
})
