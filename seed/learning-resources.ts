import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// skill_name → resource data (skill_id resolved at runtime)
const RESOURCES: Array<{
  skill_name: string
  title:      string
  url:        string
  provider:   string
  format:     string
  est_hours:  number
  cost:       'free' | 'paid'
}> = [
  // LLM Core
  { skill_name: 'OpenAI API',    title: 'OpenAI API Quickstart',                               url: 'https://platform.openai.com/docs/quickstart',                                                              provider: 'OpenAI',           format: 'docs',   est_hours: 2,  cost: 'free' },
  { skill_name: 'Anthropic API', title: 'Anthropic Documentation',                             url: 'https://docs.anthropic.com/',                                                                               provider: 'Anthropic',        format: 'docs',   est_hours: 3,  cost: 'free' },
  { skill_name: 'vLLM',         title: 'vLLM Quickstart',                                     url: 'https://docs.vllm.ai/en/latest/getting_started/quickstart.html',                                           provider: 'vLLM',             format: 'docs',   est_hours: 4,  cost: 'free' },
  { skill_name: 'Ollama',       title: 'Ollama Getting Started',                              url: 'https://ollama.com/blog/getting-started',                                                                   provider: 'Ollama',           format: 'docs',   est_hours: 2,  cost: 'free' },
  { skill_name: 'Mistral',      title: 'Mistral AI Documentation',                           url: 'https://docs.mistral.ai/',                                                                                  provider: 'Mistral AI',       format: 'docs',   est_hours: 3,  cost: 'free' },
  { skill_name: 'TGI',          title: 'Text Generation Inference Documentation',             url: 'https://huggingface.co/docs/text-generation-inference/index',                                              provider: 'HuggingFace',      format: 'docs',   est_hours: 4,  cost: 'free' },

  // LLM Orchestration
  { skill_name: 'LangChain',    title: 'LangChain for LLM Application Development',           url: 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/',                    provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },
  { skill_name: 'LlamaIndex',   title: 'Building and Evaluating Advanced RAG',                url: 'https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/',                              provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },
  { skill_name: 'DSPy',         title: 'DSPy Documentation',                                  url: 'https://dspy.ai/',                                                                                          provider: 'DSPy',             format: 'docs',   est_hours: 5,  cost: 'free' },
  { skill_name: 'Haystack',     title: 'Haystack Tutorials',                                  url: 'https://haystack.deepset.ai/tutorials',                                                                     provider: 'deepset',          format: 'course', est_hours: 6,  cost: 'free' },
  { skill_name: 'Instructor',   title: 'Instructor Documentation',                            url: 'https://python.useinstructor.com/',                                                                         provider: 'Instructor',       format: 'docs',   est_hours: 3,  cost: 'free' },

  // RAG
  { skill_name: 'pgvector',     title: 'Building Systems with the ChatGPT API',               url: 'https://www.deeplearning.ai/short-courses/building-systems-with-chatgpt/',                                 provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },
  { skill_name: 'Pinecone',     title: 'Building Applications with Vector Databases',         url: 'https://www.deeplearning.ai/short-courses/building-applications-vector-databases/',                        provider: 'DeepLearning.AI',  format: 'course', est_hours: 2,  cost: 'free' },
  { skill_name: 'Weaviate',     title: 'Weaviate Academy',                                    url: 'https://weaviate.io/developers/academy',                                                                    provider: 'Weaviate',         format: 'course', est_hours: 8,  cost: 'free' },
  { skill_name: 'Qdrant',       title: 'Qdrant Documentation',                                url: 'https://qdrant.tech/documentation/',                                                                        provider: 'Qdrant',           format: 'docs',   est_hours: 4,  cost: 'free' },
  { skill_name: 'Chroma',       title: 'Getting Started with ChromaDB',                       url: 'https://docs.trychroma.com/getting-started',                                                               provider: 'Chroma',           format: 'docs',   est_hours: 3,  cost: 'free' },

  // Agents
  { skill_name: 'LangGraph',    title: 'AI Agents in LangGraph',                              url: 'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/',                                        provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },
  { skill_name: 'CrewAI',       title: 'Multi AI Agent Systems with crewAI',                  url: 'https://www.deeplearning.ai/short-courses/multi-ai-agent-systems-with-crewai/',                            provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },
  { skill_name: 'AutoGen',      title: 'AI Agentic Design Patterns with AutoGen',             url: 'https://www.deeplearning.ai/short-courses/ai-agentic-design-patterns-with-autogen/',                       provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },

  // Fine-tuning
  { skill_name: 'LoRA',         title: 'Finetuning Large Language Models',                    url: 'https://www.deeplearning.ai/short-courses/finetuning-large-language-models/',                              provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },
  { skill_name: 'Unsloth',      title: 'Unsloth Documentation',                               url: 'https://docs.unsloth.ai/',                                                                                  provider: 'Unsloth',          format: 'docs',   est_hours: 4,  cost: 'free' },
  { skill_name: 'PEFT',         title: 'PEFT Documentation',                                  url: 'https://huggingface.co/docs/peft',                                                                          provider: 'HuggingFace',      format: 'docs',   est_hours: 5,  cost: 'free' },

  // MLOps
  { skill_name: 'MLflow',       title: 'MLflow Quickstart',                                   url: 'https://mlflow.org/docs/latest/quickstart.html',                                                           provider: 'MLflow',           format: 'docs',   est_hours: 5,  cost: 'free' },
  { skill_name: 'Weights & Biases', title: 'W&B Courses',                                     url: 'https://www.wandb.courses/',                                                                                provider: 'Weights & Biases', format: 'course', est_hours: 8,  cost: 'free' },
  { skill_name: 'LLMOps',       title: 'LLMOps',                                              url: 'https://www.deeplearning.ai/short-courses/llmops/',                                                        provider: 'DeepLearning.AI',  format: 'course', est_hours: 3,  cost: 'free' },
  { skill_name: 'Docker',       title: 'Docker for Beginners',                                url: 'https://docker-curriculum.com/',                                                                            provider: 'docker-curriculum', format: 'docs',  est_hours: 6,  cost: 'free' },
  { skill_name: 'Kubernetes',   title: 'Kubernetes Basics',                                   url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',                                                   provider: 'CNCF',             format: 'docs',   est_hours: 5,  cost: 'free' },
  { skill_name: 'FastAPI',      title: 'FastAPI Tutorial',                                    url: 'https://fastapi.tiangolo.com/tutorial/',                                                                    provider: 'FastAPI',          format: 'docs',   est_hours: 6,  cost: 'free' },

  // Computer Vision / Deep Learning
  { skill_name: 'PyTorch',      title: 'Practical Deep Learning for Coders',                  url: 'https://course.fast.ai/',                                                                                   provider: 'fast.ai',          format: 'course', est_hours: 30, cost: 'free' },
  { skill_name: 'TensorFlow',   title: 'TensorFlow Developer Certificate Prep',               url: 'https://www.tensorflow.org/certificate',                                                                    provider: 'Google',           format: 'course', est_hours: 40, cost: 'paid' },
  { skill_name: 'HuggingFace',  title: 'HuggingFace NLP Course',                              url: 'https://huggingface.co/learn/nlp-course',                                                                   provider: 'HuggingFace',      format: 'course', est_hours: 20, cost: 'free' },
  { skill_name: 'Triton',       title: 'Triton Inference Server Documentation',               url: 'https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/index.html',                  provider: 'NVIDIA',           format: 'docs',   est_hours: 8,  cost: 'free' },

  // Data Engineering
  { skill_name: 'Apache Spark', title: 'Lakehouse Fundamentals',                              url: 'https://www.databricks.com/learn/training/lakehouse-fundamentals',                                          provider: 'Databricks',       format: 'course', est_hours: 10, cost: 'free' },
  { skill_name: 'dbt',          title: 'dbt Fundamentals',                                    url: 'https://courses.getdbt.com/courses/fundamentals',                                                          provider: 'dbt Labs',         format: 'course', est_hours: 5,  cost: 'free' },
  { skill_name: 'Airflow',      title: 'Astronomer Academy — Apache Airflow',                 url: 'https://academy.astronomer.io/',                                                                            provider: 'Astronomer',       format: 'course', est_hours: 8,  cost: 'free' },

  // Cloud ML
  { skill_name: 'AWS SageMaker', title: 'AWS Machine Learning Specialty',                     url: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/',                               provider: 'AWS',              format: 'course', est_hours: 40, cost: 'paid' },
  { skill_name: 'GCP Vertex AI', title: 'ML with Google Cloud',                               url: 'https://www.cloudskillsboost.google/paths/17',                                                             provider: 'Google Cloud',     format: 'course', est_hours: 20, cost: 'free' },
  { skill_name: 'Azure ML',     title: 'Microsoft Azure AI Fundamentals',                     url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/',                      provider: 'Microsoft',        format: 'course', est_hours: 15, cost: 'free' },

  // Languages
  { skill_name: 'Python',       title: 'Neural Networks: Zero to Hero',                       url: 'https://karpathy.ai/zero-to-hero.html',                                                                     provider: 'Andrej Karpathy', format: 'video',  est_hours: 24, cost: 'free' },
  { skill_name: 'SQL',          title: 'Advanced SQL — Kaggle Learn',                         url: 'https://www.kaggle.com/learn/advanced-sql',                                                                 provider: 'Kaggle',          format: 'course', est_hours: 4,  cost: 'free' },
  { skill_name: 'Rust',         title: 'The Rust Programming Language',                       url: 'https://doc.rust-lang.org/book/',                                                                           provider: 'rust-lang.org',   format: 'book',   est_hours: 20, cost: 'free' },
]

async function seed() {
  // Fetch all skills
  const { data: skills, error: skillErr } = await supabase
    .from('skills')
    .select('id, name')

  if (skillErr || !skills) {
    console.error('Failed to fetch skills — run seed:skills first:', skillErr?.message)
    process.exit(1)
  }

  const nameToId = new Map(skills.map(s => [s.name, s.id]))
  const missing: string[] = []

  const rows = RESOURCES.flatMap(r => {
    const skill_id = nameToId.get(r.skill_name)
    if (!skill_id) { missing.push(r.skill_name); return [] }
    return [{ skill_id, title: r.title, url: r.url, provider: r.provider, format: r.format, est_hours: r.est_hours, cost: r.cost }]
  })

  if (missing.length > 0) {
    console.warn('Skills not found in DB (skipped):', missing.join(', '))
  }

  const { error } = await supabase.from('learning_resources').upsert(rows, { onConflict: 'url' })
  if (error) { console.error('Error seeding resources:', error.message); process.exit(1) }

  const { count } = await supabase.from('learning_resources').select('*', { count: 'exact', head: true })
  console.log(`Done. learning_resources has ${count} rows.`)
}

seed()
