export interface Skill {
  id: string    // kebab-case unique key
  name: string  // display name
  cluster: string
}

export const SKILL_CLUSTERS = [
  'Core ML',
  'LLM Core',
  'LLM Orchestration',
  'RAG & Vector Search',
  'Agents & Automation',
  'Fine-tuning',
  'MLOps & LLMOps',
  'Computer Vision',
  'NLP',
  'Data Engineering',
  'Languages & Frameworks',
] as const

export type SkillCluster = typeof SKILL_CLUSTERS[number]

export const SKILLS_TAXONOMY: Skill[] = [
  // ── Core ML ────────────────────────────────────────────────────────────────
  // Umbrella skills. Job boards tag listings with these generic terms, so they
  // must exist in the canonical vocabulary for matching to work (see
  // skills-canonical.ts, which also expands specific skills to these umbrellas).
  { id: 'machine-learning',    name: 'Machine Learning',        cluster: 'Core ML' },
  { id: 'deep-learning',       name: 'Deep Learning',           cluster: 'Core ML' },
  { id: 'data-science',        name: 'Data Science',            cluster: 'Core ML' },

  // ── LLM Core ───────────────────────────────────────────────────────────────
  { id: 'openai-api',          name: 'OpenAI API',              cluster: 'LLM Core' },
  { id: 'anthropic-api',       name: 'Anthropic / Claude API',  cluster: 'LLM Core' },
  { id: 'prompt-engineering',  name: 'Prompt Engineering',      cluster: 'LLM Core' },
  { id: 'function-calling',    name: 'Function Calling / Tools',cluster: 'LLM Core' },
  { id: 'gpt4',                name: 'GPT-4 / GPT-4o',          cluster: 'LLM Core' },
  { id: 'llama-mistral',       name: 'Llama / Mistral / Phi',   cluster: 'LLM Core' },
  { id: 'gemini',              name: 'Gemini',                  cluster: 'LLM Core' },
  { id: 'system-prompts',      name: 'System Prompt Design',    cluster: 'LLM Core' },
  { id: 'json-mode',           name: 'Structured Output / JSON Mode', cluster: 'LLM Core' },

  // ── LLM Orchestration ──────────────────────────────────────────────────────
  { id: 'langchain',           name: 'LangChain',               cluster: 'LLM Orchestration' },
  { id: 'llamaindex',          name: 'LlamaIndex',              cluster: 'LLM Orchestration' },
  { id: 'langgraph',           name: 'LangGraph',               cluster: 'LLM Orchestration' },
  { id: 'autogen',             name: 'AutoGen / CrewAI',        cluster: 'LLM Orchestration' },
  { id: 'semantic-kernel',     name: 'Semantic Kernel',         cluster: 'LLM Orchestration' },
  { id: 'haystack',            name: 'Haystack',                cluster: 'LLM Orchestration' },
  { id: 'vercel-ai-sdk',       name: 'Vercel AI SDK',           cluster: 'LLM Orchestration' },

  // ── RAG & Vector Search ────────────────────────────────────────────────────
  { id: 'rag-pipelines',       name: 'RAG Pipelines',           cluster: 'RAG & Vector Search' },
  { id: 'pgvector',            name: 'pgvector',                cluster: 'RAG & Vector Search' },
  { id: 'pinecone',            name: 'Pinecone',                cluster: 'RAG & Vector Search' },
  { id: 'weaviate',            name: 'Weaviate',                cluster: 'RAG & Vector Search' },
  { id: 'chroma-faiss',        name: 'Chroma / FAISS',          cluster: 'RAG & Vector Search' },
  { id: 'qdrant',              name: 'Qdrant',                  cluster: 'RAG & Vector Search' },
  { id: 'embedding-models',    name: 'Embedding Models',        cluster: 'RAG & Vector Search' },
  { id: 'hybrid-search',       name: 'Hybrid Search',           cluster: 'RAG & Vector Search' },

  // ── Agents & Automation ────────────────────────────────────────────────────
  { id: 'react-agents',        name: 'ReAct Agents',            cluster: 'Agents & Automation' },
  { id: 'openai-assistants',   name: 'OpenAI Assistants API',   cluster: 'Agents & Automation' },
  { id: 'browser-automation',  name: 'Browser Automation',      cluster: 'Agents & Automation' },
  { id: 'code-interpreter',    name: 'Code Interpreter',        cluster: 'Agents & Automation' },
  { id: 'n8n-zapier',         name: 'n8n / Zapier AI',         cluster: 'Agents & Automation' },
  { id: 'multi-agent',         name: 'Multi-Agent Systems',     cluster: 'Agents & Automation' },
  { id: 'mcp',                 name: 'MCP (Model Context Protocol)', cluster: 'Agents & Automation' },

  // ── Fine-tuning ────────────────────────────────────────────────────────────
  { id: 'fine-tuning',         name: 'Fine-tuning',             cluster: 'Fine-tuning' },
  { id: 'lora-qlora',          name: 'LoRA / QLoRA',            cluster: 'Fine-tuning' },
  { id: 'sft',                 name: 'Supervised Fine-tuning',  cluster: 'Fine-tuning' },
  { id: 'dpo-rlhf',           name: 'DPO / RLHF',              cluster: 'Fine-tuning' },
  { id: 'dataset-curation',    name: 'Dataset Curation',        cluster: 'Fine-tuning' },
  { id: 'peft',                name: 'PEFT',                    cluster: 'Fine-tuning' },
  { id: 'unsloth',             name: 'Unsloth',                 cluster: 'Fine-tuning' },
  { id: 'hf-trl',              name: 'Hugging Face TRL',        cluster: 'Fine-tuning' },

  // ── MLOps & LLMOps ────────────────────────────────────────────────────────
  { id: 'mlops-llmops',        name: 'MLOps / LLMOps',          cluster: 'MLOps & LLMOps' },
  { id: 'cloud-ml',            name: 'Cloud (AWS/GCP/Azure)',   cluster: 'MLOps & LLMOps' },
  { id: 'mlflow',              name: 'MLflow',                  cluster: 'MLOps & LLMOps' },
  { id: 'wandb',               name: 'Weights & Biases',        cluster: 'MLOps & LLMOps' },
  { id: 'langsmith',           name: 'LangSmith / LangFuse',    cluster: 'MLOps & LLMOps' },
  { id: 'vllm-tgi',            name: 'vLLM / TGI (Model Serving)', cluster: 'MLOps & LLMOps' },
  { id: 'docker',              name: 'Docker',                  cluster: 'MLOps & LLMOps' },
  { id: 'kubernetes',          name: 'Kubernetes',              cluster: 'MLOps & LLMOps' },
  { id: 'cicd-ml',             name: 'CI/CD for ML',            cluster: 'MLOps & LLMOps' },
  { id: 'monitoring-ml',       name: 'Model Monitoring / Drift',cluster: 'MLOps & LLMOps' },

  // ── Computer Vision ────────────────────────────────────────────────────────
  { id: 'computer-vision',     name: 'Computer Vision',         cluster: 'Computer Vision' },
  { id: 'pytorch-vision',      name: 'PyTorch (Vision)',        cluster: 'Computer Vision' },
  { id: 'object-detection',    name: 'Object Detection (YOLO)', cluster: 'Computer Vision' },
  { id: 'image-segmentation',  name: 'Image Segmentation',      cluster: 'Computer Vision' },
  { id: 'opencv',              name: 'OpenCV',                  cluster: 'Computer Vision' },
  { id: 'diffusion-models',    name: 'Diffusion Models (SD/FLUX)', cluster: 'Computer Vision' },
  { id: 'clip',                name: 'CLIP / Vision-Language',  cluster: 'Computer Vision' },
  { id: 'video-analysis',      name: 'Video Analysis',          cluster: 'Computer Vision' },

  // ── NLP ────────────────────────────────────────────────────────────────────
  { id: 'nlp',                 name: 'NLP',                     cluster: 'NLP' },
  { id: 'hf-transformers',     name: 'HuggingFace Transformers',cluster: 'NLP' },
  { id: 'text-classification', name: 'Text Classification',     cluster: 'NLP' },
  { id: 'ner',                 name: 'NER (Named Entity Recognition)', cluster: 'NLP' },
  { id: 'spacy',               name: 'spaCy',                   cluster: 'NLP' },
  { id: 'sentiment-analysis',  name: 'Sentiment Analysis',      cluster: 'NLP' },
  { id: 'text-generation',     name: 'Text Generation',         cluster: 'NLP' },
  { id: 'summarization',       name: 'Summarization',           cluster: 'NLP' },
  { id: 'translation',         name: 'Machine Translation',     cluster: 'NLP' },

  // ── Data Engineering ───────────────────────────────────────────────────────
  { id: 'data-engineering',    name: 'Data Engineering',        cluster: 'Data Engineering' },
  { id: 'pandas-polars',       name: 'Pandas / Polars',         cluster: 'Data Engineering' },
  { id: 'pyspark',             name: 'PySpark',                 cluster: 'Data Engineering' },
  { id: 'sql',                 name: 'SQL',                     cluster: 'Data Engineering' },
  { id: 'dbt',                 name: 'dbt',                     cluster: 'Data Engineering' },
  { id: 'airflow',             name: 'Airflow / Prefect',       cluster: 'Data Engineering' },
  { id: 'kafka',               name: 'Kafka',                   cluster: 'Data Engineering' },
  { id: 'feature-engineering', name: 'Feature Engineering',     cluster: 'Data Engineering' },
  { id: 'data-pipelines',      name: 'Data Pipelines',          cluster: 'Data Engineering' },

  // ── Languages & Frameworks ─────────────────────────────────────────────────
  { id: 'python',              name: 'Python',                  cluster: 'Languages & Frameworks' },
  { id: 'pytorch',             name: 'PyTorch',                 cluster: 'Languages & Frameworks' },
  { id: 'tensorflow',          name: 'TensorFlow / JAX',        cluster: 'Languages & Frameworks' },
  { id: 'sklearn',             name: 'Scikit-learn',            cluster: 'Languages & Frameworks' },
  { id: 'fastapi',             name: 'FastAPI',                 cluster: 'Languages & Frameworks' },
  { id: 'typescript',          name: 'TypeScript / JavaScript', cluster: 'Languages & Frameworks' },
  { id: 'aws-sagemaker',       name: 'AWS SageMaker',           cluster: 'Languages & Frameworks' },
  { id: 'gcp-vertex',          name: 'GCP Vertex AI',           cluster: 'Languages & Frameworks' },
  { id: 'azure-ml',            name: 'Azure ML',                cluster: 'Languages & Frameworks' },
]

export function getSkillsByCluster(): Record<string, Skill[]> {
  return SKILLS_TAXONOMY.reduce<Record<string, Skill[]>>((acc, skill) => {
    if (!acc[skill.cluster]) acc[skill.cluster] = []
    acc[skill.cluster].push(skill)
    return acc
  }, {})
}

export function getSkillNames(): string[] {
  return SKILLS_TAXONOMY.map(s => s.name)
}

export function findSkillByName(name: string): Skill | undefined {
  return SKILLS_TAXONOMY.find(s => s.name.toLowerCase() === name.toLowerCase())
}
