import { SKILLS_TAXONOMY } from './skills-taxonomy'

// The app previously spoke three skill vocabularies that never intersected:
// users picked taxonomy names ('RAG Pipelines'), ingestion emitted its own
// labels ('RAG / Vector Search'), and learning resources used a third set.
// Exact-match skill scoring therefore returned ~0 for almost every real job.
// This module makes SKILLS_TAXONOMY names the single canonical vocabulary:
//   canonicalizeSkill  — raw tag/label → canonical taxonomy name
//   expandWithUmbrellas — user skills → + cluster umbrellas ('Pinecone' user
//                         also matches jobs tagged 'RAG Pipelines')
//   prepareUserSkills  — canonicalize + expand, for matching call sites

// Raw label (lowercase) → canonical taxonomy name. Covers legacy ingest
// labels (so pre-migration DB rows canonicalize), job-board tag spellings,
// and common shorthand.
const ALIASES: Record<string, string> = {
  // Core ML umbrellas
  'machine-learning': 'Machine Learning', ml: 'Machine Learning',
  'deep-learning': 'Deep Learning', dl: 'Deep Learning',
  'data-science': 'Data Science',
  // NLP / CV / data umbrellas
  'natural language processing': 'NLP', 'natural-language-processing': 'NLP',
  'computer-vision': 'Computer Vision', cv: 'Computer Vision',
  'data-engineering': 'Data Engineering',
  // Ops umbrellas
  mlops: 'MLOps / LLMOps', llmops: 'MLOps / LLMOps',
  // LLM work → Prompt Engineering umbrella
  llm: 'Prompt Engineering', llms: 'Prompt Engineering',
  'large language models': 'Prompt Engineering', 'large-language-models': 'Prompt Engineering',
  'llms / prompt engineering': 'Prompt Engineering',
  'generative ai': 'Prompt Engineering', 'generative-ai': 'Prompt Engineering',
  genai: 'Prompt Engineering', 'gen ai': 'Prompt Engineering',
  // RAG
  rag: 'RAG Pipelines', 'rag / vector search': 'RAG Pipelines',
  'retrieval augmented generation': 'RAG Pipelines',
  'vector search': 'RAG Pipelines', 'vector-search': 'RAG Pipelines',
  'vector database': 'RAG Pipelines', 'vector-database': 'RAG Pipelines',
  // Fine-tuning
  finetuning: 'Fine-tuning', 'fine tuning': 'Fine-tuning',
  // Hugging Face
  'hugging face': 'HuggingFace Transformers', 'hugging-face': 'HuggingFace Transformers',
  huggingface: 'HuggingFace Transformers', transformers: 'HuggingFace Transformers',
  // Cloud
  aws: 'Cloud (AWS/GCP/Azure)', gcp: 'Cloud (AWS/GCP/Azure)', azure: 'Cloud (AWS/GCP/Azure)',
  cloud: 'Cloud (AWS/GCP/Azure)', 'amazon web services': 'Cloud (AWS/GCP/Azure)',
  'google cloud': 'Cloud (AWS/GCP/Azure)',
  sagemaker: 'AWS SageMaker', 'vertex ai': 'GCP Vertex AI', 'vertex-ai': 'GCP Vertex AI',
  // Frameworks / languages
  tensorflow: 'TensorFlow / JAX', jax: 'TensorFlow / JAX',
  sklearn: 'Scikit-learn', 'scikit learn': 'Scikit-learn',
  javascript: 'TypeScript / JavaScript', typescript: 'TypeScript / JavaScript',
  js: 'TypeScript / JavaScript', node: 'TypeScript / JavaScript', nodejs: 'TypeScript / JavaScript',
  pandas: 'Pandas / Polars', polars: 'Pandas / Polars',
  spark: 'PySpark', airflow: 'Airflow / Prefect', prefect: 'Airflow / Prefect',
  k8s: 'Kubernetes', postgres: 'SQL', postgresql: 'SQL',
  // LLM vendors / models
  openai: 'OpenAI API', anthropic: 'Anthropic / Claude API', claude: 'Anthropic / Claude API',
  'gpt-4': 'GPT-4 / GPT-4o', gpt4: 'GPT-4 / GPT-4o', 'gpt-4o': 'GPT-4 / GPT-4o',
  gpt: 'GPT-4 / GPT-4o', chatgpt: 'GPT-4 / GPT-4o',
  llama: 'Llama / Mistral / Phi', mistral: 'Llama / Mistral / Phi',
  'prompt-engineering': 'Prompt Engineering',
  // Embeddings / agents / vision
  embeddings: 'Embedding Models', embedding: 'Embedding Models',
  agents: 'Multi-Agent Systems', 'ai agents': 'Multi-Agent Systems', agentic: 'Multi-Agent Systems',
  yolo: 'Object Detection (YOLO)', 'object detection': 'Object Detection (YOLO)',
  'stable diffusion': 'Diffusion Models (SD/FLUX)', diffusion: 'Diffusion Models (SD/FLUX)',
  sdxl: 'Diffusion Models (SD/FLUX)',
  wandb: 'Weights & Biases', 'weights & biases': 'Weights & Biases',
}

// Taxonomy names are canonical for themselves ('python' → 'Python').
const CANONICAL_BY_LOWER: Record<string, string> = Object.fromEntries(
  SKILLS_TAXONOMY.map(s => [s.name.toLowerCase(), s.name])
)

const CLUSTER_BY_NAME: Record<string, string> = Object.fromEntries(
  SKILLS_TAXONOMY.map(s => [s.name, s.cluster])
)

// Having any skill in a cluster implies its umbrella skill for matching.
const CLUSTER_UMBRELLAS: Record<string, string> = {
  'LLM Core':            'Prompt Engineering',
  'LLM Orchestration':   'Prompt Engineering',
  'RAG & Vector Search': 'RAG Pipelines',
  'Fine-tuning':         'Fine-tuning',
  'MLOps & LLMOps':      'MLOps / LLMOps',
  'Computer Vision':     'Computer Vision',
  'NLP':                 'NLP',
  'Data Engineering':    'Data Engineering',
}

// Cross-cluster implications: specialists match generalist job tags.
const EXTRA_IMPLICATIONS: Record<string, string[]> = {
  'Deep Learning':    ['Machine Learning'],
  'Data Science':     ['Machine Learning'],
  'Computer Vision':  ['Deep Learning', 'Machine Learning'],
  'NLP':              ['Machine Learning'],
  'Fine-tuning':      ['Deep Learning', 'Machine Learning'],
  'AWS SageMaker':    ['Cloud (AWS/GCP/Azure)'],
  'GCP Vertex AI':    ['Cloud (AWS/GCP/Azure)'],
  'Azure ML':         ['Cloud (AWS/GCP/Azure)'],
  'PyTorch (Vision)': ['PyTorch'],
}

/** Raw tag/label → canonical taxonomy name, or null when unrecognised. */
export function canonicalizeSkill(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  return CANONICAL_BY_LOWER[key] ?? ALIASES[key] ?? null
}

/** Canonicalize a list, dropping unrecognised entries and duplicates. */
export function canonicalizeSkills(raws: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of raws) {
    const canonical = canonicalizeSkill(raw)
    if (canonical && !seen.has(canonical)) {
      seen.add(canonical)
      result.push(canonical)
    }
  }
  return result
}

/**
 * User skills → canonical names plus implied umbrella skills, so a user who
 * knows Pinecone also matches jobs tagged with the generic 'RAG Pipelines'.
 * Unrecognised names are kept as-is (legacy profiles) rather than dropped.
 */
export function expandWithUmbrellas(skills: string[]): string[] {
  const out = new Set<string>()
  for (const raw of skills) {
    const name = canonicalizeSkill(raw) ?? raw
    out.add(name)
    const umbrella = CLUSTER_UMBRELLAS[CLUSTER_BY_NAME[name] ?? '']
    if (umbrella) out.add(umbrella)
    for (const implied of EXTRA_IMPLICATIONS[name] ?? []) out.add(implied)
  }
  return [...out]
}

/** Canonicalize + expand — what matching call sites should feed computeMatch. */
export function prepareUserSkills(skills: string[]): string[] {
  return expandWithUmbrellas(skills)
}
