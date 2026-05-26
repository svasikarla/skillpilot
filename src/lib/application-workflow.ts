export interface WorkflowStep {
  id: string
  title: string
  description: string
  checks: string[]         // checkbox items
  tip?: string             // platform-specific tip
  actionLabel?: string     // optional CTA button label
  actionHref?: string      // CTA href (relative)
  isProposalStep?: boolean // renders proposal generator inline
}

export interface Workflow {
  platform: string
  steps: WorkflowStep[]
}

const UPWORK: Workflow = {
  platform: 'Upwork',
  steps: [
    {
      id: 'prereqs',
      title: 'Prerequisites',
      description: 'Confirm you have the basics in place before spending Connects.',
      checks: [
        'I have an Upwork account',
        'My profile completeness is 100%',
        'I have enough Connects for this job',
      ],
      tip: 'Upwork profiles with a 100% completeness score appear higher in client searches.',
    },
    {
      id: 'profile_check',
      title: 'Profile review',
      description: "Check the signals Upwork clients see before they read your proposal.",
      checks: [
        'My title contains at least one specific skill keyword (e.g. "LLM Engineer | RAG Systems")',
        'My overview opens with what I do for clients — not "I am a…"',
        'At least one portfolio item has a measurable outcome (%, $, time saved)',
        'My hourly rate is competitive for my skill set',
      ],
      tip: 'Upwork buries profiles whose overview starts with "I am" or "I have". Start with a client-facing outcome.',
      actionLabel: 'Audit your profile',
      actionHref: '/audit',
    },
    {
      id: 'proposal_requirements',
      title: 'Proposal requirements',
      description: "Upwork's norms before you write a single word.",
      checks: [
        'I have read the full job description — not just the title',
        'I know the client\'s hire rate and avg rating (visible in job post)',
        'I have identified one specific detail I can reference in my hook',
      ],
      tip: 'Ideal length: 100–150 words for projects under $5K. First 2 lines are visible in preview — make them count.',
    },
    {
      id: 'proposal',
      title: 'Draft your proposal',
      description: 'Generate a tailored proposal using your profile and this job.',
      checks: [
        'My proposal opens with a specific reference to their job (not generic)',
        'My past result includes a number (%, $, time saved, accuracy improvement)',
        'Ends with a single focused question for the client',
      ],
      isProposalStep: true,
    },
    {
      id: 'submission',
      title: 'Submission checklist',
      description: 'Final checks before hitting send.',
      checks: [
        'Correct number of Connects confirmed',
        'Relevant portfolio items attached',
        'Proposed rate matches or exceeds my target',
        'No typos in client\'s company name',
      ],
    },
    {
      id: 'followup',
      title: 'After submitting',
      description: 'What to do (and not do) after your proposal is sent.',
      checks: [
        'Marked this application as Submitted in my tracker',
        'Set a reminder to check back in 5 days',
      ],
      tip: 'Do NOT follow up on Upwork — it reads as desperate. If no response after 5 days, move on.',
    },
  ],
}

const TOPTAL: Workflow = {
  platform: 'Toptal',
  steps: [
    {
      id: 'prereqs',
      title: 'Screening prerequisites',
      description: 'Toptal requires passing a multi-stage vetting process before you can apply to any job.',
      checks: [
        'I have submitted an application to join Toptal\'s network',
        'I have passed or scheduled the initial screening call',
        'I have completed the technical assessment for my skill area',
      ],
      tip: 'Toptal accepts roughly 3% of applicants. Only apply once you have strong production AI/ML project evidence.',
    },
    {
      id: 'profile_check',
      title: 'Profile completeness',
      description: 'Toptal clients expect a formal, senior-level profile.',
      checks: [
        'My profile shows 3+ years of professional AI/ML experience',
        'Each portfolio project has quantified outcomes',
        'My bio is written in third person and leads with results',
      ],
    },
    {
      id: 'proposal_requirements',
      title: 'Application requirements',
      description: 'Toptal expects a formal technical summary — not a cover letter.',
      checks: [
        'I understand the client\'s technical problem specifically',
        'I can articulate my approach in technical terms',
        'I have a relevant portfolio project in the same domain',
      ],
      tip: 'Toptal clients are CTOs and tech leads. Lead with architecture decisions and past technical outcomes, not soft skills.',
    },
    {
      id: 'proposal',
      title: 'Draft your proposal',
      description: 'Generate a Toptal-style technical summary.',
      checks: [
        'Opening names the core technical challenge',
        'Includes a past result with a specific metric',
        'Ends with a technical clarification question',
      ],
      isProposalStep: true,
    },
    {
      id: 'submission',
      title: 'Submission checklist',
      description: 'Final checks.',
      checks: [
        'Rate is set at or above Toptal\'s AI/ML market rate ($120–$160/hr)',
        'Availability window confirmed',
        'LinkedIn profile link included if requested',
      ],
    },
    {
      id: 'followup',
      title: 'After submitting',
      description: 'Toptal matches are handled by their account team.',
      checks: ['Application logged in tracker', 'Respond to any Toptal matcher message within 24 hours'],
      tip: 'Toptal matchers often reach out within 48 hours for strong profiles. Respond promptly — slow replies reduce match priority.',
    },
  ],
}

const CONTRA: Workflow = {
  platform: 'Contra',
  steps: [
    {
      id: 'prereqs',
      title: 'Prerequisites',
      description: 'Contra is portfolio-first — your profile IS your application.',
      checks: ['I have a Contra profile', 'My profile has at least 2 portfolio projects with outcomes'],
      tip: 'Contra is commission-free. Clients expect personality and specific past work.',
    },
    {
      id: 'profile_check',
      title: 'Profile review',
      description: 'Contra clients want to see WHO you are, not just what you know.',
      checks: [
        'My bio has a personal, founder-to-founder tone',
        'Portfolio items show the problem solved, not just the tools used',
        'Rate is set competitively ($50–$180/hr for AI/ML)',
      ],
    },
    {
      id: 'proposal_requirements',
      title: 'Proposal norms',
      description: 'Contra favours short, direct, personality-driven proposals.',
      checks: [
        'I know the client\'s background (check their Contra profile)',
        'I can reference something specific about their project',
      ],
      tip: 'Shorter is better on Contra. A 3-sentence proposal that shows you read their project beats a 200-word template.',
    },
    {
      id: 'proposal',
      title: 'Draft your proposal',
      description: 'Generate a Contra-style proposal.',
      checks: ['Opens with something specific from their posting', 'Ends with an open question'],
      isProposalStep: true,
    },
    {
      id: 'submission',
      title: 'Submission checklist',
      description: 'Final checks.',
      checks: ['Proposed rate matches target', 'Availability confirmed'],
    },
    {
      id: 'followup',
      title: 'After submitting',
      description: 'Follow-up guidance.',
      checks: ['Application logged in tracker'],
      tip: 'A polite follow-up after 3–4 days is acceptable on Contra — the platform has a more personal tone.',
    },
  ],
}

const DEFAULT_WORKFLOW = (platform: string): Workflow => ({
  platform,
  steps: [
    {
      id: 'prereqs',
      title: 'Prerequisites',
      description: `Confirm you have an account on ${platform} and your profile is complete.`,
      checks: [`I have an account on ${platform}`, 'My profile is complete and up to date'],
    },
    {
      id: 'profile_check',
      title: 'Profile review',
      description: 'Review your profile from a client\'s perspective.',
      checks: ['Profile has measurable outcomes in portfolio', 'Rate is competitive for my skill set'],
      actionLabel: 'Audit your profile',
      actionHref: '/audit',
    },
    {
      id: 'proposal_requirements',
      title: 'Proposal requirements',
      description: `Read the job description fully and identify the client's core need.`,
      checks: ['I have read the full job description', 'I know what specific problem the client needs solved'],
    },
    {
      id: 'proposal',
      title: 'Draft your proposal',
      description: 'Generate a tailored proposal.',
      checks: ['Opens with a specific reference to this job', 'Includes one measurable past result', 'Ends with a focused question'],
      isProposalStep: true,
    },
    {
      id: 'submission',
      title: 'Submission checklist',
      description: 'Final checks before submitting.',
      checks: ['Proposed rate confirmed', 'Relevant portfolio items attached or linked'],
    },
    {
      id: 'followup',
      title: 'After submitting',
      description: 'Track and follow up.',
      checks: ['Application logged in tracker as Submitted'],
    },
  ],
})

const WORKFLOWS: Record<string, Workflow> = {
  Upwork:  UPWORK,
  Toptal:  TOPTAL,
  Contra:  CONTRA,
}

export function getWorkflow(platform: string): Workflow {
  return WORKFLOWS[platform] ?? DEFAULT_WORKFLOW(platform)
}
