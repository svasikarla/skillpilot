import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const platforms = [
  // ─── TIER 1 ───────────────────────────────────────────────────────────────
  {
    name: 'Upwork', slug: 'upwork', url: 'https://upwork.com',
    platform_type: 'marketplace', trust_tier: 1, trust_score: 85,
    rate_min_aiml: 30, rate_max_aiml: 150, payment_model: 'escrow',
    has_escrow: true, has_id_verification: true, typical_time_to_pay: '5 business days',
    setup_guide: `## Upwork Profile Setup Guide

**Title** — The single most important field. Format: \`[Primary Role] | [Top 2 Skills]\`
Example: \`LLM Engineer | RAG Systems | LangChain\` — not \`AI/ML Developer\`.

**Overview** — Do NOT start with "I am". Start with what you do for clients:
\`I build RAG pipelines that make enterprise documents searchable and auditable...\`
Aim for 200–300 words. Include: your top 3 skills, one past measurable result, what type of client you work best with.

**Hourly Rate** — For LLM/RAG skills: $75–$120/hr is the tested sweet spot. Below $65 signals inexperience; above $150 narrows your pipeline significantly when starting out.

**Portfolio** — Each item needs: a title, what problem it solved, and a measurable outcome. "Built RAG pipeline" < "Reduced document retrieval time by 60% for a legal firm using LangChain + pgvector."

**Skills Section** — Add 10–15 skills. Upwork's search prioritises exact keyword matches. Include: Python, LangChain, RAG, OpenAI API, LLM, etc.

**Specialised Profiles** — Create a second profile for a specific niche (e.g., "LLM Fine-tuning Specialist"). You can have 2 profiles pointing to different markets.

**Profile Video** — Profiles with a 60-second intro video receive 30% more invitations (Upwork data). Worth 30 minutes of your time.`,

    application_guide: `## Upwork Application Workflow

### Step 1 — Prerequisites
- Active account with verified payment method
- Profile completeness: aim for 100%
- JSS (Job Success Score): if you're new, your first 5 jobs set your score — be selective

### Step 2 — Read the job signals before applying
Check: client hire rate, average rating they give freelancers, proposals submitted, days since posted.
Ideal: hire rate > 60%, posted < 48 hours ago, < 20 proposals so far.

### Step 3 — Proposal rules for Upwork
- **Length**: 100–150 words for jobs under $5K. Clients scan.
- **Structure**: Hook → Your qualification → Past result → One question
- **First 2 lines** are the preview — make them count. Start with something specific from their job.
- Do NOT start with: "Hi/Hello", "I am an expert", template language
- Do NOT: list your skills in bullet form, ask multiple questions, write more than 200 words

### Step 4 — Generate your proposal
Use the proposal generator for a tailored draft.

### Step 5 — Submission checklist
- [ ] Opens with a specific reference to their posting (not generic)
- [ ] Contains one past result with a number (%, $, time saved)
- [ ] Ends with a single focused question
- [ ] Correct number of Connects available
- [ ] Relevant portfolio items attached

### Step 6 — After submitting
- Check for responses within 48–72 hours
- If no response after 5 days: move on. Do NOT follow up on Upwork — it reads as desperate.`,

    platform_tips: `## Tips for AI/ML Freelancers on Upwork

**Niche down**: "LLM Engineer specialising in RAG for legal/finance" beats "AI developer" in search.

**Use Connects wisely**: Bid on jobs posted < 24 hours. Early proposals get more views.

**Client signals to look for**:
- Payment method verified ✓
- Hire rate > 55% ✓
- Has given 4.5+ ratings to past freelancers ✓
- "Looking for long-term" in description = potential retainer ✓

**Rate strategy**: Start at $80/hr. Once you have 3 jobs with 5-star JSS, raise to $100+/hr. Never go below $65/hr for LLM work — it devalues you and attracts bad clients.

**Boosts**: Use "Boosted proposals" (costs extra Connects) for high-value jobs ($5K+).`,

    red_flags: `## Upwork Red Flags

- Client requests contact via WhatsApp/Telegram before hiring — violates ToS and signals scam
- "We'll pay you outside Upwork for this first project" — immediate block
- No hire history + high budget = likely fishing for free ideas in proposals
- Job reposted multiple times without hires = either unrealistic expectations or testing the market for free
- "Fixed price: $5,000" for a 3-month RAG project = severely underpriced — they don't know the market`,
  },

  {
    name: 'Toptal', slug: 'toptal', url: 'https://toptal.com',
    platform_type: 'talent_network', trust_tier: 1, trust_score: 95,
    rate_min_aiml: 100, rate_max_aiml: 250, payment_model: 'escrow',
    has_escrow: true, has_id_verification: true, typical_time_to_pay: 'weekly',
    setup_guide: `## Toptal Profile Setup — AI/ML

Toptal vets the top 3% of applicants. The screening process has 5 stages:

1. **Language & personality screen** (30 min call)
2. **Technical screening** (timed coding test — Python, algorithms, ML fundamentals)
3. **Live technical interview** (90 min with a senior Toptal engineer)
4. **Test project** (paid, ~20 hours)
5. **Trial engagement** (2-week contract with a real client)

**Before applying**: Be confident in Python algorithms, system design, and at least 2 of: LLM APIs, RAG pipelines, MLOps, fine-tuning. Prepare for LeetCode medium/hard questions.

**Profile after acceptance**: Clients search by skills and view your profile like a resume. Lead with your most impressive result. Every skill you list should be defensible in an interview.`,

    application_guide: `## Toptal Application Process

Toptal is a talent network — clients request you specifically or you are matched by Toptal's team.

### For direct applications (when a client reaches out):
- Respond within 2 hours — Toptal measures this
- Prepare a brief technical summary of your relevant experience
- Be ready for a 30-minute "match call" with both the client and a Toptal rep

### Application tone for Toptal
Unlike Upwork, Toptal clients expect a formal, detailed technical summary — not a brief pitch.
Include: your architectural decisions on past projects, trade-offs you made, and how you measured success.`,

    platform_tips: `## Tips for AI/ML on Toptal

- **Specialisation pays**: Toptal clients pay $120–$200/hr for LLM engineers. Positioning as "LLM infrastructure" rather than "AI developer" attracts better-matched clients.
- **Response time matters**: Toptal's algorithm ranks freelancers partly by response speed. Aim < 2 hours.
- **Rates**: Don't undersell. Toptal clients expect senior rates. $140/hr is the median for experienced LLM engineers.`,

    red_flags: `## Toptal Red Flags

- Any message asking you to apply "outside Toptal" — report immediately
- Test projects that seem more like real deliverables (> 40 hours) — raise with Toptal support`,
  },

  {
    name: 'Arc.dev', slug: 'arc-dev', url: 'https://arc.dev',
    platform_type: 'talent_network', trust_tier: 1, trust_score: 88,
    rate_min_aiml: 60, rate_max_aiml: 200, payment_model: 'direct',
    has_escrow: false, has_id_verification: true, typical_time_to_pay: '30 days net',
    setup_guide: `## Arc.dev Profile Setup

Arc.dev focuses on remote-first tech companies. AI/ML engineers with LLM experience are in high demand here.

**Profile priority**: Lead with your GitHub link and project examples. Arc.dev clients are technical and will click through.

**Skills**: Be specific — "LLM fine-tuning with LoRA" beats "machine learning".

**Screening**: Arc.dev conducts a technical review before surfacing you to clients. Takes 1–2 weeks.`,

    application_guide: `## Arc.dev Application Process

Arc.dev uses a matching model — you create a profile and they match you to relevant opportunities.

When matched, you receive an invitation to apply. The application includes:
1. Why you're a fit for this specific role
2. Code sample or GitHub link relevant to their stack
3. Your availability and rate

**Key**: Arc.dev clients favour engineers who can demonstrate they've shipped to production — not just trained models.`,

    platform_tips: `## Tips for AI/ML on Arc.dev

- Companies posting on Arc.dev are often Series A–C startups building AI products — they want production-ready engineers
- Mention deployment experience (Modal, BentoML, FastAPI) alongside model work
- Response time is tracked; aim to respond to matches within 24 hours`,

    red_flags: `## Arc.dev Red Flags
- Direct requests to skip Arc.dev's process — report to Arc support`,
  },

  {
    name: 'Contra', slug: 'contra', url: 'https://contra.com',
    platform_type: 'marketplace', trust_tier: 1, trust_score: 82,
    rate_min_aiml: 50, rate_max_aiml: 180, payment_model: 'direct',
    has_escrow: false, has_id_verification: true, typical_time_to_pay: '3–5 business days',
    setup_guide: `## Contra Profile Setup

Contra is commission-free (0% fee to freelancers) and portfolio-first. Your profile is essentially a landing page.

**Portfolio section**: Your most important asset on Contra. Add 3–5 projects with screenshots, descriptions, and outcomes. Contra's algorithm surfaces profiles with complete portfolios.

**Rate**: Be explicit about your hourly and project rates. Contra attracts clients who value quality over price.

**Identity verification**: Contra verifies all freelancers — adds a trust signal clients notice.`,

    application_guide: `## Contra Application Process

Applications on Contra are called "proposals." The platform encourages short, direct pitches.

Structure: what you bring → one relevant result → what working with you looks like → your question for them.

Contra's community tends to value authenticity over polish — write like a professional, not a marketing brochure.`,

    platform_tips: `## Tips for AI/ML on Contra

- 0% commission means your $100/hr rate is your actual take-home
- Clients on Contra tend to be designers, founders, and product people — they respond to clear, non-jargon explanations of what you build
- "AI consultant" profiles do well here — position yourself as a strategic partner, not just an implementer`,

    red_flags: `## Contra Red Flags
- Requests to pay outside Contra before work begins`,
  },

  {
    name: 'Braintrust', slug: 'braintrust', url: 'https://usebraintrust.com',
    platform_type: 'talent_network', trust_tier: 1, trust_score: 87,
    rate_min_aiml: 75, rate_max_aiml: 200, payment_model: 'direct',
    has_escrow: false, has_id_verification: true, typical_time_to_pay: 'net 30',
    setup_guide: `## Braintrust Profile Setup

Braintrust is talent-owned — fees are paid by clients only (0% to freelancers).

**Vetting**: Braintrust reviews all applications. Acceptance takes 1–2 weeks. Technical skills are assessed.

**Profile**: LinkedIn-style but focused on contract work. Highlight enterprise or scale-up experience — Braintrust's client base is Fortune 500 and well-funded startups.

**Skills**: Focus on what enterprise clients search for: "GenAI", "LLM", "AI integration", "RAG", "production ML".`,

    application_guide: `## Braintrust Application Process

Braintrust matches you to roles that fit your profile. You can also apply directly to posted jobs.

For AI/ML roles: emphasise production scale, stakeholder communication, and ability to work independently across time zones. Enterprise clients want engineers who can navigate ambiguity.`,

    platform_tips: `## Tips for AI/ML on Braintrust

- Enterprise clients pay well ($120–$200/hr for senior LLM engineers) but have slower hiring cycles — expect 2–4 weeks from match to start
- BTRST token rewards are a bonus, not a reason to choose Braintrust
- Work independently and communicate proactively — enterprise clients value these over raw technical skill`,

    red_flags: `## Braintrust Red Flags
- Braintrust clients rarely contact you directly — if someone claims to be a Braintrust client outside the platform, verify through the dashboard`,
  },

  // ─── TIER 2 ───────────────────────────────────────────────────────────────
  {
    name: 'Freelancer.com', slug: 'freelancer-com', url: 'https://freelancer.com',
    platform_type: 'marketplace', trust_tier: 2, trust_score: 65,
    rate_min_aiml: 20, rate_max_aiml: 100, payment_model: 'milestone',
    has_escrow: true, has_id_verification: false, typical_time_to_pay: '5–10 business days',
    setup_guide: `## Freelancer.com Profile Setup

Freelancer.com is a high-volume marketplace with intense price competition. For AI/ML work, positioning as a specialist is essential.

**Title**: Be specific — "LLM Engineer | RAG | LangChain" rather than "AI Developer"
**Skills**: Add 20 skills (their max) covering your full stack
**Portfolio**: Upload code screenshots or architecture diagrams with results
**Certifications**: Freelancer offers paid skill tests — the "Python" and "Machine Learning" tests add a badge that can increase trust`,

    application_guide: `## Freelancer.com Bidding Process

Bids are proposals. Keep them under 100 words. The preview (first 2 lines) is what clients see in the bid list.

**Always use milestone payments** — never accept a project without milestones in place. This is the only protection against non-payment.

Avoid bidding on jobs with 50+ bids unless you have a very specific differentiator.`,

    platform_tips: `## Tips for AI/ML on Freelancer.com

- Filter for "Fixed Price" jobs > $500 — these attract more serious clients
- "Skill Certification" badges increase response rates significantly for new accounts
- Be extremely cautious of "test task" requests — always agree on payment before any work`,

    red_flags: `## Freelancer.com Red Flags

- Client asks to communicate on WhatsApp before project starts — high scam signal
- "We'll award you the project if you complete a small test first" (unpaid test = spec work)
- No milestone set up — never start work without escrow milestone funded`,
  },

  {
    name: 'Fiverr Pro', slug: 'fiverr-pro', url: 'https://pro.fiverr.com',
    platform_type: 'marketplace', trust_tier: 2, trust_score: 72,
    rate_min_aiml: 50, rate_max_aiml: 200, payment_model: 'escrow',
    has_escrow: true, has_id_verification: true, typical_time_to_pay: '14 days (new), 7 days (level 2+)',
    setup_guide: `## Fiverr Pro Profile Setup

Fiverr Pro is the vetted tier of Fiverr — clients are willing to pay premium rates for verified professionals.

**Gig structure**: Create 3–5 gigs targeting specific AI/ML deliverables:
- "I will build a RAG chatbot over your documents" ($500–$3K)
- "I will fine-tune a language model on your data" ($800–$5K)
- "I will build an LLM agent pipeline" ($300–$2K)

**Gig title**: Lead with the outcome, not the technology. "I will build a document Q&A chatbot" beats "I will implement RAG with LangChain."

**Packages**: Offer 3 tiers (Basic/Standard/Premium). Premium tier should include support and revisions.`,

    application_guide: `## Fiverr Pro Order Process

Clients order directly from your gig or send a custom offer. Respond to all inquiries within 24 hours (Fiverr tracks response rate).

Before starting: clarify the full scope in Fiverr messages (this is your contract). Use Requirements step to gather all inputs.`,

    platform_tips: `## Tips for AI/ML on Fiverr Pro

- Niche gigs outperform generic ones: "RAG for legal firms" > "AI chatbot"
- Demo video in gig gallery increases conversion significantly
- Fiverr's algorithm rewards completed orders and 5-star reviews — first 10 reviews are critical`,

    red_flags: `## Fiverr Red Flags

- Request to communicate outside Fiverr before ordering — against ToS
- "I'll pay you more outside Fiverr" — instant report
- Suspiciously large order from new buyer with no history — request partial payment upfront`,
  },

  {
    name: 'Turing', slug: 'turing', url: 'https://turing.com',
    platform_type: 'talent_network', trust_tier: 2, trust_score: 75,
    rate_min_aiml: 40, rate_max_aiml: 150, payment_model: 'direct',
    has_escrow: false, has_id_verification: true, typical_time_to_pay: 'bi-weekly',
    setup_guide: `## Turing Profile Setup

Turing focuses on long-term contracts (3–12 months) with US tech companies. Their vetting includes automated tests.

**Vetting process**:
1. Automated coding test (Python, algorithms)
2. AI-assessed communication test
3. Technical deep dive with a Turing engineer

**Best for**: Engineers seeking stable, full-time-equivalent contracts rather than project-to-project work.`,

    application_guide: `## Turing Matching Process

Turing matches you to roles using their AI system. You don't apply directly — you complete the vetting and then get matched.

When matched: expect a 30-minute intro call with the client's tech lead. Prepare to discuss your most relevant production project in detail.`,

    platform_tips: `## Tips for AI/ML on Turing

- Focus on production experience: Turing clients are US companies building real products
- LLM and MLOps skills are in high demand — highlight deployment and monitoring experience
- Turing contracts are typically 40h/week — not suitable for freelancers seeking flexibility`,

    red_flags: `## Turing Red Flags
- No legitimate Turing role requires payment to unlock`,
  },

  // ─── TIER 3: RLHF/EVAL ──────────────────────────────────────────────────
  {
    name: 'Outlier (Scale AI)', slug: 'outlier', url: 'https://outlier.ai',
    platform_type: 'rlhf_eval', trust_tier: 3, trust_score: 78,
    rate_min_aiml: 15, rate_max_aiml: 66, payment_model: 'direct',
    has_escrow: false, has_id_verification: true, typical_time_to_pay: 'weekly (Stripe)',
    setup_guide: `## Outlier / Scale AI Profile Setup

Outlier specialises in LLM evaluation, code review, and RLHF data generation. High volume of work available.

**Sign up at outlier.ai**: Apply for "AI Training" projects. Approval takes 3–14 days.

**Best project types for AI/ML practitioners**:
- Code generation & review tasks ($40–$66/hr for senior engineers)
- LLM response evaluation
- Reasoning chain annotation

**Requirements**: Strong English, domain expertise, ability to evaluate model outputs critically.`,

    application_guide: `## Outlier Task Process

Work is task-based. Log in, claim tasks, complete within the time window, submit for review.

**Quality matters**: Your acceptance rate determines task availability. Aim > 90% acceptance.

**Batches**: Some projects offer bulk task batches — check the dashboard daily.`,

    platform_tips: `## Tips for AI/ML on Outlier

- Code review tasks ($50–$66/hr) are the highest-paying category — apply specifically for these
- Volume varies significantly week to week — don't rely on this as your only income source
- Excellent for filling gaps between larger contracts`,

    red_flags: `## Outlier Red Flags
- Outlier/Scale AI never asks for payment to access tasks
- Be cautious of third-party "recruiters" offering Outlier work — apply directly only`,
  },

  {
    name: 'Mercor', slug: 'mercor', url: 'https://mercor.com',
    platform_type: 'talent_network', trust_tier: 3, trust_score: 72,
    rate_min_aiml: 30, rate_max_aiml: 150, payment_model: 'direct',
    has_escrow: false, has_id_verification: true, typical_time_to_pay: 'bi-weekly',
    setup_guide: `## Mercor Profile Setup

Mercor uses AI matching to connect contractors with AI/ML companies. Fast matching — often within days.

**Profile**: LinkedIn-import available. Supplement with specific AI/ML projects.

**Interview**: Mercor conducts a short AI-assessed interview (video). Speak clearly about your technical projects.`,

    application_guide: `## Mercor Matching Process

Submit your profile → AI screening → matched to relevant clients → intro call → start.

Typical timeline: 3–7 days from application to first match.`,

    platform_tips: `## Tips for AI/ML on Mercor

- Mercor is well-connected to AI startups and research labs — good for cutting-edge work
- Rates vary widely ($30–$150/hr) — negotiate based on your skill level and the client's funding stage`,

    red_flags: `## Mercor Red Flags
- Legitimate Mercor clients don't require upfront payment or test tasks outside the platform`,
  },

  // ─── TIER 4: COMPETITIONS ────────────────────────────────────────────────
  {
    name: 'Kaggle', slug: 'kaggle', url: 'https://kaggle.com/competitions',
    platform_type: 'competition', trust_tier: 4, trust_score: 90,
    rate_min_aiml: 0, rate_max_aiml: 0, payment_model: 'prize',
    has_escrow: false, has_id_verification: false, typical_time_to_pay: '30–60 days post-competition',
    setup_guide: `## Kaggle Competition Setup

No profile setup required beyond a Kaggle account. Your competition history is your portfolio.

**AI/ML value**: Top Kaggle placements (top 10%) are a credibility signal on Upwork and Toptal profiles. Include competition names and rankings in your portfolio.

**Types worth entering**:
- Tabular / structured data (your best win probability)
- NLP competitions (relevant for LLM skills)
- Computer vision (if that's your niche)`,

    application_guide: `## Kaggle Competition Strategy

1. Join 2 weeks before deadline (most notebooks and discussions are public by then)
2. Start from a top public notebook and iterate
3. Focus on ensembling and feature engineering in the final week
4. Team merges can significantly improve your ranking`,

    platform_tips: `## Tips for Kaggle

- Prize money is taxable; plan accordingly
- Kaggle medals (gold/silver/bronze) are recognised industry signals
- Use competitions to learn new domains quickly — the prize is secondary to the portfolio signal`,

    red_flags: `## Kaggle Notes
- Prize competitions are legitimate — Kaggle is owned by Google
- Watch for unofficial "competitions" on other sites that mimic Kaggle — verify the organiser`,
  },

  {
    name: 'HackerOne', slug: 'hackerone', url: 'https://hackerone.com',
    platform_type: 'bounty', trust_tier: 4, trust_score: 88,
    rate_min_aiml: 500, rate_max_aiml: 25000, payment_model: 'prize',
    has_escrow: false, has_id_verification: true, typical_time_to_pay: '30–90 days',
    setup_guide: `## HackerOne AI Bug Bounty Setup

Major AI companies (Anthropic, Meta, Google, OpenAI) run bug bounty programs on HackerOne.

**Scope**: AI/ML-specific bugs include:
- Prompt injection vulnerabilities
- Model extraction / inference attacks
- Training data memorisation leaks
- Safety filter bypasses

**Getting started**: Create a HackerOne account, verify identity, browse public programs from AI companies. Read each program's scope carefully.`,

    application_guide: `## HackerOne Submission Process

1. Find a vulnerability within program scope
2. Document it clearly: description, reproduction steps, impact assessment
3. Submit via HackerOne's form
4. Triage team reviews (1–30 days depending on program)
5. If valid: bounty awarded

**Key**: Clear, reproducible reports get paid faster. Include a proof-of-concept.`,

    platform_tips: `## Tips for AI Bug Bounties

- AI safety bugs (jailbreaks, prompt injection affecting safety-critical systems) pay the highest bounties
- Follow AI company security blogs to understand what they consider in-scope
- Duplicate submissions pay nothing — move fast when you find something`,

    red_flags: `## HackerOne Notes
- Never disclose a vulnerability publicly before the company has patched it (responsible disclosure)
- Targeting systems outside the defined program scope may be illegal`,
  },
]

async function seed() {
  console.log(`Seeding ${platforms.length} platforms…`)

  const { error } = await supabase
    .from('platforms')
    .upsert(platforms, { onConflict: 'slug', ignoreDuplicates: false })

  if (error) {
    console.error('Error seeding platforms:', error.message)
    process.exit(1)
  }

  const { count } = await supabase
    .from('platforms')
    .select('*', { count: 'exact', head: true })

  console.log(`Done. Platforms table now has ${count} rows.`)
}

seed()
