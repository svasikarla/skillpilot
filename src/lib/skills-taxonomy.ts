export type SkillCluster =
  | 'LLM Core'
  | 'LLM Orchestration'
  | 'RAG'
  | 'Agents'
  | 'Fine-tuning'
  | 'MLOps'
  | 'Computer Vision'
  | 'Data Engineering'
  | 'Cloud ML'
  | 'Languages'

export interface SkillDef {
  name: string
  cluster: SkillCluster
}

export const SKILLS_TAXONOMY: SkillDef[] = [
  // LLM Core
  { name: 'OpenAI API',      cluster: 'LLM Core' },
  { name: 'Anthropic API',   cluster: 'LLM Core' },
  { name: 'Gemini API',      cluster: 'LLM Core' },
  { name: 'Mistral',         cluster: 'LLM Core' },
  { name: 'Llama',           cluster: 'LLM Core' },
  { name: 'vLLM',            cluster: 'LLM Core' },
  { name: 'Ollama',          cluster: 'LLM Core' },
  { name: 'TGI',             cluster: 'LLM Core' },
  { name: 'SGLang',          cluster: 'LLM Core' },

  // LLM Orchestration
  { name: 'LangChain',       cluster: 'LLM Orchestration' },
  { name: 'LlamaIndex',      cluster: 'LLM Orchestration' },
  { name: 'DSPy',            cluster: 'LLM Orchestration' },
  { name: 'Pydantic AI',     cluster: 'LLM Orchestration' },
  { name: 'Instructor',      cluster: 'LLM Orchestration' },
  { name: 'Haystack',        cluster: 'LLM Orchestration' },

  // RAG
  { name: 'pgvector',        cluster: 'RAG' },
  { name: 'Pinecone',        cluster: 'RAG' },
  { name: 'Qdrant',          cluster: 'RAG' },
  { name: 'Weaviate',        cluster: 'RAG' },
  { name: 'Chroma',          cluster: 'RAG' },
  { name: 'Milvus',          cluster: 'RAG' },
  { name: 'BM25',            cluster: 'RAG' },
  { name: 'Reranking',       cluster: 'RAG' },
  { name: 'HyDE',            cluster: 'RAG' },
  { name: 'ColBERT',         cluster: 'RAG' },
  { name: 'Voyage AI',       cluster: 'RAG' },
  { name: 'Cohere Embed',    cluster: 'RAG' },

  // Agents
  { name: 'LangGraph',       cluster: 'Agents' },
  { name: 'CrewAI',          cluster: 'Agents' },
  { name: 'AutoGen',         cluster: 'Agents' },
  { name: 'MCP',             cluster: 'Agents' },
  { name: 'OpenAI Agents SDK', cluster: 'Agents' },
  { name: 'Browser Use',     cluster: 'Agents' },

  // Fine-tuning
  { name: 'LoRA',            cluster: 'Fine-tuning' },
  { name: 'QLoRA',           cluster: 'Fine-tuning' },
  { name: 'PEFT',            cluster: 'Fine-tuning' },
  { name: 'TRL',             cluster: 'Fine-tuning' },
  { name: 'Unsloth',         cluster: 'Fine-tuning' },
  { name: 'Axolotl',         cluster: 'Fine-tuning' },
  { name: 'DPO',             cluster: 'Fine-tuning' },
  { name: 'RLHF',            cluster: 'Fine-tuning' },
  { name: 'KTO',             cluster: 'Fine-tuning' },

  // MLOps
  { name: 'MLflow',          cluster: 'MLOps' },
  { name: 'Weights & Biases',cluster: 'MLOps' },
  { name: 'Kubeflow',        cluster: 'MLOps' },
  { name: 'BentoML',         cluster: 'MLOps' },
  { name: 'Modal',           cluster: 'MLOps' },
  { name: 'Replicate',       cluster: 'MLOps' },
  { name: 'Docker',          cluster: 'MLOps' },
  { name: 'Kubernetes',      cluster: 'MLOps' },

  // Computer Vision
  { name: 'YOLO',            cluster: 'Computer Vision' },
  { name: 'SAM',             cluster: 'Computer Vision' },
  { name: 'CLIP',            cluster: 'Computer Vision' },
  { name: 'Diffusion Models',cluster: 'Computer Vision' },
  { name: 'ComfyUI',         cluster: 'Computer Vision' },
  { name: 'Detectron2',      cluster: 'Computer Vision' },
  { name: 'OpenCV',          cluster: 'Computer Vision' },

  // Data Engineering
  { name: 'dbt',             cluster: 'Data Engineering' },
  { name: 'Polars',          cluster: 'Data Engineering' },
  { name: 'DuckDB',          cluster: 'Data Engineering' },
  { name: 'Airflow',         cluster: 'Data Engineering' },
  { name: 'Dagster',         cluster: 'Data Engineering' },
  { name: 'Spark',           cluster: 'Data Engineering' },
  { name: 'Snowflake',       cluster: 'Data Engineering' },
  { name: 'Databricks',      cluster: 'Data Engineering' },

  // Cloud ML
  { name: 'AWS SageMaker',   cluster: 'Cloud ML' },
  { name: 'Google Vertex AI',cluster: 'Cloud ML' },
  { name: 'Azure ML',        cluster: 'Cloud ML' },
  { name: 'AWS Bedrock',     cluster: 'Cloud ML' },

  // Languages
  { name: 'Python',          cluster: 'Languages' },
  { name: 'TypeScript',      cluster: 'Languages' },
  { name: 'Rust',            cluster: 'Languages' },
  { name: 'SQL',             cluster: 'Languages' },
  { name: 'Julia',           cluster: 'Languages' },
]

export const CLUSTERS: SkillCluster[] = [
  'LLM Core', 'LLM Orchestration', 'RAG', 'Agents', 'Fine-tuning',
  'MLOps', 'Computer Vision', 'Data Engineering', 'Cloud ML', 'Languages',
]

export function getSkillsByCluster(): Record<SkillCluster, SkillDef[]> {
  const result = {} as Record<SkillCluster, SkillDef[]>
  for (const cluster of CLUSTERS) result[cluster] = []
  for (const skill of SKILLS_TAXONOMY) result[skill.cluster].push(skill)
  return result
}
