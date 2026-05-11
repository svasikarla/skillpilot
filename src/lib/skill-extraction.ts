import OpenAI from 'openai'
import { MODELS } from './config'
import { SKILLS_TAXONOMY } from './skills-taxonomy'

const CANONICAL_SKILLS = SKILLS_TAXONOMY.map(s => s.name)

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set — skill extraction unavailable')
  }
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

const SYSTEM_PROMPT = `You extract AI/ML skills from job descriptions.
Return ONLY a JSON array of skill names from this canonical list:
${CANONICAL_SKILLS.join(', ')}

Rules:
- Only include skills explicitly required or strongly implied
- Return [] if no canonical skills apply
- Do not invent skills not in the list
- Return valid JSON array only, no explanation`

export async function extractSkillsFromJob(description: string): Promise<string[]> {
  if (!description.trim()) return []
  const client = getClient()
  const res = await client.chat.completions.create({
    model:      MODELS.skillExtract,
    messages:   [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: description.slice(0, 4000) },
    ],
    temperature:     0,
    max_tokens:      256,
    response_format: { type: 'json_object' },
  })

  const raw = res.choices[0]?.message?.content ?? '[]'
  try {
    const parsed = JSON.parse(raw)
    const arr: string[] = Array.isArray(parsed) ? parsed : (parsed.skills ?? [])
    return arr.filter((s): s is string => typeof s === 'string' && CANONICAL_SKILLS.includes(s))
  } catch {
    return []
  }
}

// Batch extraction using OpenAI Batch API for cost efficiency
export async function extractSkillsBatch(
  jobs: Array<{ id: string; description: string }>
): Promise<Map<string, string[]>> {
  if (!jobs.length) return new Map()
  const client = getClient()

  // Build JSONL batch
  const batchLines = jobs.map(job => JSON.stringify({
    custom_id: job.id,
    method:    'POST',
    url:       '/v1/chat/completions',
    body:      {
      model:       MODELS.skillExtract,
      messages:    [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: job.description.slice(0, 4000) },
      ],
      temperature:     0,
      max_tokens:      256,
      response_format: { type: 'json_object' },
    },
  }))

  const jsonl = batchLines.join('\n')
  const blob  = new Blob([jsonl], { type: 'application/jsonl' })
  const file  = new File([blob], 'batch.jsonl', { type: 'application/jsonl' })

  const uploaded = await client.files.create({ file, purpose: 'batch' })

  const batch = await client.batches.create({
    input_file_id:     uploaded.id,
    endpoint:          '/v1/chat/completions',
    completion_window: '24h',
  })

  // Poll for completion (max 5 minutes in-process)
  let done = false
  let batchId = batch.id
  for (let i = 0; i < 30 && !done; i++) {
    await new Promise(r => setTimeout(r, 10_000))
    const status = await client.batches.retrieve(batchId)
    if (status.status === 'completed') { done = true; batchId = status.id }
    if (['failed', 'expired', 'cancelled'].includes(status.status)) break
  }

  if (!done) {
    console.warn('[skill-extraction] Batch did not complete within timeout')
    return new Map()
  }

  const batchStatus = await client.batches.retrieve(batchId)
  if (!batchStatus.output_file_id) return new Map()

  const outputFile = await client.files.content(batchStatus.output_file_id)
  const outputText = await outputFile.text()

  const results = new Map<string, string[]>()
  for (const line of outputText.split('\n').filter(Boolean)) {
    try {
      const row = JSON.parse(line)
      const id  = row.custom_id as string
      const raw = row.response?.body?.choices?.[0]?.message?.content ?? '[]'
      const parsed = JSON.parse(raw)
      const arr: string[] = Array.isArray(parsed) ? parsed : (parsed.skills ?? [])
      results.set(id, arr.filter((s): s is string => CANONICAL_SKILLS.includes(s)))
    } catch { /* skip malformed lines */ }
  }

  return results
}
