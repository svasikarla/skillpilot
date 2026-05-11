// Application workflow engine — builds a 6-step structured guide for any job application.
// Content comes from the platform's application_guide markdown; member context is injected
// at runtime to make each step actionable for the specific user.

export type StepType = 'prereq' | 'context' | 'instructions' | 'generator' | 'checklist' | 'followup'

export interface WorkflowStep {
  id:            string
  title:         string
  type:          StepType
  content:       string    // markdown — platform guide content
  memberContext: string    // member-specific callout injected above content
  checkItems:    string[]  // checkboxes user ticks inside this step
}

export interface Workflow {
  platformName:   string
  platformSlug:   string
  jobTitle:       string
  steps:          WorkflowStep[]
}

export interface WorkflowMemberContext {
  hasAccount:          boolean
  displayName:         string
  targetHourlyRate:    number | null
  yearsExperience:     number | null
  skillsMatched:       string[]
  skillsMissing:       string[]
  profileCompleteness: number   // 0–100 rough estimate
  portfolioCount:      number
}

// Parse H2/H3 sections from a markdown application guide into labelled blocks
function parseSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>()
  const chunks   = markdown.split(/^#{2,3}\s+/m)
  for (const chunk of chunks) {
    const nl  = chunk.indexOf('\n')
    if (nl === -1) continue
    const title   = chunk.slice(0, nl).trim()
    const content = chunk.slice(nl + 1).trim()
    if (title) sections.set(title.toLowerCase(), content)
  }
  return sections
}

function profileCompletenessNote(ctx: WorkflowMemberContext): string {
  const issues: string[] = []
  if (!ctx.hasAccount)        issues.push('you haven\'t marked this platform as having an account')
  if (ctx.portfolioCount < 2) issues.push('add more portfolio items to strengthen your profile')
  if (ctx.profileCompleteness < 70) issues.push('complete your profile before applying')
  if (issues.length === 0) return '✅ Profile looks ready — no blockers detected.'
  return `⚠️ Before applying: ${issues.join('; ')}.`
}

export function buildWorkflow(
  job: { id: string; title: string; extractedSkills: string[] | null },
  platform: { id: number; name: string; slug: string; applicationGuide: string | null; platformTips: string | null },
  member: WorkflowMemberContext,
): Workflow {
  const guide    = platform.applicationGuide ?? ''
  const sections = parseSections(guide)

  const rateNote = member.targetHourlyRate
    ? `Your target rate is **$${member.targetHourlyRate}/hr**.`
    : 'Set a target hourly rate in your profile settings.'

  const skillNote = member.skillsMatched.length
    ? `You match **${member.skillsMatched.length}** of ${(job.extractedSkills ?? []).length} required skills: ${member.skillsMatched.join(', ')}.`
    : 'No extracted skills matched — review the job description carefully.'

  const missingNote = member.skillsMissing.length
    ? `Missing skills: ${member.skillsMissing.join(', ')} — address these in your proposal or skip if you can learn on the job.`
    : ''

  const steps: WorkflowStep[] = [
    // ── Step 1: Prerequisites ──────────────────────────────────────────────
    {
      id:    'prereq',
      title: 'Prerequisites',
      type:  'prereq',
      content: sections.get('step 1') ?? sections.get('prerequisites') ?? `
Ensure the following before spending time on an application:
- Active account with a verified payment method
- Profile completeness as high as possible
- Review the job description for any hidden requirements (location, clearance, timezone)
`.trim(),
      memberContext: profileCompletenessNote(member),
      checkItems: [
        `Account on ${platform.name} with payment method verified`,
        'Job is still open (check posted date vs. today)',
        'I meet the hard requirements (location, clearance, etc.)',
      ],
    },

    // ── Step 2: Context gathering ──────────────────────────────────────────
    {
      id:    'context',
      title: 'Understand the Job',
      type:  'context',
      content: sections.get('step 2') ?? sections.get('context') ?? `
Read the full job description and note:
1. The **core deliverable** — what exactly are they paying for?
2. The **timeline** — short project, ongoing, unclear?
3. The **client** — what does their company do, and what's their industry?
4. **Red flags** — vague scope, no budget mentioned, rushed deadline with no detail.
`.trim(),
      memberContext: `${skillNote}${missingNote ? '\n' + missingNote : ''}`,
      checkItems: [
        'I understand the core deliverable',
        'Timeline is clear (or I\'ll ask in my proposal)',
        'Budget / rate is disclosed or estimable',
        'No red flags (scam patterns, upfront payment, etc.)',
      ],
    },

    // ── Step 3: Research & personalise ────────────────────────────────────
    {
      id:    'research',
      title: 'Research & Personalise',
      type:  'instructions',
      content: sections.get('step 3') ?? sections.get('research') ?? `
A personalised proposal doubles response rates. Spend 5–10 minutes on:
- **Company website** — what do they actually do? Quote it back.
- **Client reviews** (if marketplace) — how do they communicate? What do past contractors say?
- **Job history** — have they hired for this role before? What worked last time?
- **Competitors** — mention one challenge in their space to show you understand their world.
`.trim(),
      memberContext: `${rateNote} Research helps you justify your rate.`,
      checkItems: [
        'Reviewed client\'s company website or LinkedIn',
        'Read client\'s review history / past hiring patterns',
        'Found one specific detail to mention in my proposal',
      ],
    },

    // ── Step 4: Draft proposal ─────────────────────────────────────────────
    {
      id:    'generator',
      title: 'Draft Your Proposal',
      type:  'generator',
      content: sections.get('step 4') ?? sections.get('proposal') ?? `
Use the AI proposal generator below. Provide:
1. **Your unique value** — what specifically makes you the right person for this job?
2. **A relevant past result** — one specific measurable outcome from a similar project.
3. **Your question for the client** — one smart question that shows you've read the brief.

After generating, edit the proposal to feel natural. AI drafts are starting points, not final copy.
`.trim(),
      memberContext: `Platform style tip for **${platform.name}**: ${
        sections.get('platform tips') ??
        platform.platformTips?.split('\n')[0] ??
        'Lead with your most relevant result — clients scan the first 2 lines before deciding to read more.'
      }`,
      checkItems: [
        'Generated at least one proposal variant',
        'Personalised it with the research from Step 3',
        'First 2 lines hook the client without starting with "I"',
        'Included one past result with a number',
      ],
    },

    // ── Step 5: Pre-submit checklist ───────────────────────────────────────
    {
      id:    'checklist',
      title: 'Pre-Submit Checklist',
      type:  'checklist',
      content: sections.get('step 5') ?? sections.get('checklist') ?? `
Before submitting, verify:
- No grammar or spelling errors (use Grammarly or read aloud)
- Proposal length matches the platform's norms (Upwork: 150–200 words; Toptal: more detailed)
- Your rate is clearly stated or you've asked for budget clarity
- You've answered any screening questions in full
- Attachments (portfolio, case study) are added if relevant
`.trim(),
      memberContext: member.portfolioCount === 0
        ? '⚠️ You have no portfolio items — consider adding one before submitting.'
        : `✅ You have ${member.portfolioCount} portfolio item${member.portfolioCount > 1 ? 's' : ''} you can attach.`,
      checkItems: [
        'Proposal reviewed for typos (read aloud or used a tool)',
        'Rate is stated or budget clarification requested',
        'All screening questions answered',
        'Relevant portfolio item attached if the platform supports it',
        'Cover letter / proposal saved locally as backup',
      ],
    },

    // ── Step 6: Follow-up ─────────────────────────────────────────────────
    {
      id:    'followup',
      title: 'Follow-Up & Track',
      type:  'followup',
      content: sections.get('step 6') ?? sections.get('follow') ?? `
**If no response in 3–5 business days:**
Send a single short follow-up: *"Hi [name], just checking if you had a chance to review my proposal. Happy to answer any questions or jump on a quick call."* Do not send more than one follow-up.

**If invited to interview:**
- Prepare one mini-demo or walkthrough of a relevant portfolio project
- Have your rate breakdown ready ($X/hr because...)
- Confirm timezone and whether it's async or live

**Always log the outcome** in the tracker — wins and rejections teach you the most.
`.trim(),
      memberContext: 'Log this application in the Tracker tab immediately so you don\'t lose context.',
      checkItems: [
        'Application logged in Tracker (status: Applied)',
        'Calendar reminder set for follow-up in 4 business days',
        'Rate proposed is recorded',
      ],
    },
  ]

  return {
    platformName: platform.name,
    platformSlug: platform.slug,
    jobTitle:     job.title,
    steps,
  }
}
