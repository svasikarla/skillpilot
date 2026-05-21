export interface LearningResource {
  title: string
  provider: string
  url: string
  format: 'course' | 'docs' | 'tutorial' | 'book'
  cost: 'free' | 'paid'
  est_hours: number
}

// Static map: skill name (lowercase) → best free/cheap learning resource
const RESOURCES: Record<string, LearningResource> = {
  'python': { title: 'Python for Everybody', provider: 'Coursera (U Michigan)', url: 'https://www.coursera.org/specializations/python', format: 'course', cost: 'free', est_hours: 8 },
  'pytorch': { title: 'Deep Learning with PyTorch', provider: 'fast.ai', url: 'https://course.fast.ai', format: 'course', cost: 'free', est_hours: 20 },
  'tensorflow / jax': { title: 'TensorFlow Developer Certificate', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/courses/tensorflow-developer-professional-certificate/', format: 'course', cost: 'paid', est_hours: 40 },
  'scikit-learn': { title: 'ML with scikit-learn', provider: 'scikit-learn docs', url: 'https://scikit-learn.org/stable/tutorial/index.html', format: 'docs', cost: 'free', est_hours: 6 },
  'openai api': { title: 'ChatGPT Prompt Engineering for Developers', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/', format: 'course', cost: 'free', est_hours: 2 },
  'anthropic / claude api': { title: 'Build Apps with Claude API', provider: 'Anthropic Docs', url: 'https://docs.anthropic.com/en/docs/get-started', format: 'docs', cost: 'free', est_hours: 3 },
  'prompt engineering': { title: 'Prompt Engineering Guide', provider: 'DAIR.AI', url: 'https://www.promptingguide.ai', format: 'tutorial', cost: 'free', est_hours: 4 },
  'function calling / tools': { title: 'Function Calling with OpenAI', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/', format: 'course', cost: 'free', est_hours: 2 },
  'gpt-4 / gpt-4o': { title: 'OpenAI API Quickstart', provider: 'OpenAI Docs', url: 'https://platform.openai.com/docs/quickstart', format: 'docs', cost: 'free', est_hours: 2 },
  'llama / mistral / phi': { title: 'Run LLMs Locally with Ollama', provider: 'Ollama Docs', url: 'https://ollama.com/docs', format: 'docs', cost: 'free', est_hours: 3 },
  'system prompt design': { title: 'System Prompts & Instructions', provider: 'Anthropic Docs', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts', format: 'docs', cost: 'free', est_hours: 2 },
  'langchain': { title: 'LangChain for LLM App Development', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/', format: 'course', cost: 'free', est_hours: 3 },
  'llamaindex': { title: 'Building RAG with LlamaIndex', provider: 'LlamaIndex Docs', url: 'https://docs.llamaindex.ai/en/stable/getting_started/starter_example/', format: 'docs', cost: 'free', est_hours: 4 },
  'langgraph': { title: 'AI Agents with LangGraph', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/', format: 'course', cost: 'free', est_hours: 3 },
  'autogen / crewai': { title: 'Multi AI Agent Systems with CrewAI', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/multi-ai-agent-systems-with-crewai/', format: 'course', cost: 'free', est_hours: 3 },
  'rag pipelines': { title: 'Building & Evaluating Advanced RAG', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/building-evaluating-advanced-rag/', format: 'course', cost: 'free', est_hours: 3 },
  'pgvector': { title: 'pgvector GitHub + Examples', provider: 'pgvector', url: 'https://github.com/pgvector/pgvector', format: 'docs', cost: 'free', est_hours: 2 },
  'pinecone': { title: 'Pinecone Learn', provider: 'Pinecone', url: 'https://www.pinecone.io/learn/', format: 'tutorial', cost: 'free', est_hours: 3 },
  'weaviate': { title: 'Weaviate Academy', provider: 'Weaviate', url: 'https://weaviate.io/developers/academy', format: 'course', cost: 'free', est_hours: 4 },
  'chroma / faiss': { title: 'Vector Databases & Embeddings', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/building-applications-vector-databases/', format: 'course', cost: 'free', est_hours: 2 },
  'embedding models': { title: 'Sentence Transformers Docs', provider: 'HuggingFace', url: 'https://www.sbert.net', format: 'docs', cost: 'free', est_hours: 3 },
  'react agents': { title: 'Building AI Agents', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/building-agentic-rag-with-llamaindex/', format: 'course', cost: 'free', est_hours: 2 },
  'openai assistants api': { title: 'Assistants API Overview', provider: 'OpenAI Docs', url: 'https://platform.openai.com/docs/assistants/overview', format: 'docs', cost: 'free', est_hours: 3 },
  'n8n / zapier ai': { title: 'n8n AI Nodes Guide', provider: 'n8n Docs', url: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain/', format: 'docs', cost: 'free', est_hours: 4 },
  'multi-agent systems': { title: 'Multi-Agent with AutoGen', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/ai-agentic-design-patterns-with-autogen/', format: 'course', cost: 'free', est_hours: 3 },
  'lora / qlora': { title: 'Fine-Tuning LLMs with LoRA', provider: 'HuggingFace', url: 'https://huggingface.co/blog/lora', format: 'tutorial', cost: 'free', est_hours: 5 },
  'supervised fine-tuning': { title: 'Finetuning Large Language Models', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/finetuning-large-language-models/', format: 'course', cost: 'free', est_hours: 2 },
  'dpo / rlhf': { title: 'Reinforcement Learning from Human Feedback', provider: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/short-courses/reinforcement-learning-from-human-feedback/', format: 'course', cost: 'free', est_hours: 3 },
  'peft': { title: 'PEFT Docs', provider: 'HuggingFace', url: 'https://huggingface.co/docs/peft/index', format: 'docs', cost: 'free', est_hours: 4 },
  'hugging face trl': { title: 'TRL — Fine-Tuning Guide', provider: 'HuggingFace', url: 'https://huggingface.co/docs/trl/index', format: 'docs', cost: 'free', est_hours: 5 },
  'mlflow': { title: 'MLflow Quickstart', provider: 'MLflow Docs', url: 'https://mlflow.org/docs/latest/getting-started/intro-quickstart/', format: 'docs', cost: 'free', est_hours: 4 },
  'weights & biases': { title: 'W&B Courses', provider: 'Weights & Biases', url: 'https://www.wandb.courses', format: 'course', cost: 'free', est_hours: 4 },
  'langsmith / langfuse': { title: 'LangSmith Evaluation Guide', provider: 'LangChain', url: 'https://docs.smith.langchain.com/evaluation', format: 'docs', cost: 'free', est_hours: 3 },
  'vllm / tgi (model serving)': { title: 'vLLM Quickstart', provider: 'vLLM Docs', url: 'https://docs.vllm.ai/en/latest/getting_started/quickstart.html', format: 'docs', cost: 'free', est_hours: 4 },
  'docker': { title: 'Docker for ML Engineers', provider: 'Docker Docs', url: 'https://docs.docker.com/guides/python/', format: 'docs', cost: 'free', est_hours: 6 },
  'ci/cd for ml': { title: 'MLOps Fundamentals on GCP', provider: 'Google Cloud Skills', url: 'https://www.cloudskillsboost.google/course_templates/27', format: 'course', cost: 'free', est_hours: 8 },
  'pytorch (vision)': { title: 'PyTorch Vision Tutorial', provider: 'PyTorch Docs', url: 'https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html', format: 'tutorial', cost: 'free', est_hours: 4 },
  'object detection (yolo)': { title: 'Ultralytics YOLO Docs', provider: 'Ultralytics', url: 'https://docs.ultralytics.com', format: 'docs', cost: 'free', est_hours: 5 },
  'diffusion models (sd/flux)': { title: 'Diffusion Models from Scratch', provider: 'HuggingFace', url: 'https://huggingface.co/blog/annotated-diffusion', format: 'tutorial', cost: 'free', est_hours: 6 },
  'clip / vision-language': { title: 'CLIP Paper + OpenAI Code', provider: 'OpenAI', url: 'https://openai.com/research/clip', format: 'tutorial', cost: 'free', est_hours: 4 },
  'huggingface transformers': { title: 'HuggingFace NLP Course', provider: 'HuggingFace', url: 'https://huggingface.co/learn/nlp-course/chapter1/1', format: 'course', cost: 'free', est_hours: 12 },
  'text classification': { title: 'Text Classification with HF', provider: 'HuggingFace', url: 'https://huggingface.co/docs/transformers/tasks/sequence_classification', format: 'docs', cost: 'free', est_hours: 3 },
  'pandas / polars': { title: 'Pandas Getting Started', provider: 'Pandas Docs', url: 'https://pandas.pydata.org/docs/getting_started/index.html', format: 'docs', cost: 'free', est_hours: 5 },
  'pyspark': { title: 'PySpark Tutorial', provider: 'Databricks Academy', url: 'https://www.databricks.com/learn/training/catalog', format: 'course', cost: 'free', est_hours: 10 },
  'sql': { title: 'SQL for Data Science', provider: 'Kaggle Learn', url: 'https://www.kaggle.com/learn/intro-to-sql', format: 'course', cost: 'free', est_hours: 5 },
  'dbt': { title: 'dbt Learn — Fundamentals', provider: 'dbt Labs', url: 'https://learn.getdbt.com/courses/dbt-fundamentals', format: 'course', cost: 'free', est_hours: 5 },
  'airflow / prefect': { title: 'Intro to Airflow', provider: 'Astronomer', url: 'https://academy.astronomer.io/path/airflow-101', format: 'course', cost: 'free', est_hours: 6 },
  'feature engineering': { title: 'Feature Engineering for ML', provider: 'Kaggle Learn', url: 'https://www.kaggle.com/learn/feature-engineering', format: 'course', cost: 'free', est_hours: 5 },
  'fastapi': { title: 'FastAPI Tutorial', provider: 'FastAPI Docs', url: 'https://fastapi.tiangolo.com/tutorial/', format: 'docs', cost: 'free', est_hours: 4 },
  'aws sagemaker': { title: 'AWS ML Learning Plan', provider: 'AWS Skill Builder', url: 'https://explore.skillbuilder.aws/learn/public/learning_plan/view/28/machine-learning-learning-plan', format: 'course', cost: 'free', est_hours: 20 },
  'gcp vertex ai': { title: 'Vertex AI Skills Boost', provider: 'Google Cloud', url: 'https://www.cloudskillsboost.google/paths/17', format: 'course', cost: 'free', est_hours: 15 },
  'azure ml': { title: 'Azure AI Fundamentals', provider: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/paths/get-started-with-artificial-intelligence-on-azure/', format: 'course', cost: 'free', est_hours: 8 },
}

export function getResourceForSkill(skillName: string): LearningResource | null {
  return RESOURCES[skillName.toLowerCase()] ?? null
}
