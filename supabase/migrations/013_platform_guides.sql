-- Phase 8: Populate platform guides, rates, and payment metadata
-- Run in Supabase SQL Editor after 012_add_embeddings.sql

UPDATE platforms SET
  rate_min_aiml = 60, rate_max_aiml = 150,
  payment_model = 'escrow', has_escrow = true,
  setup_guide = 'Complete your profile to 100% before bidding. Add a professional photo, verified payment method, and at least 3 portfolio items. Write a headline that mentions your AI/ML specialisation (e.g. "Senior ML Engineer | LLMs, RAG, PyTorch"). Pass the English fluency test and any relevant Upwork skill tests. Enable two-factor authentication — accounts without it are more likely to be suspended.',
  application_guide = 'Use Connects on jobs posted within 24 hours — early proposals score higher in search. Write a custom opening line referencing the specific client problem, not a template. Propose a milestone structure for fixed-price jobs. Keep your JSS (Job Success Score) above 90% by communicating proactively and requesting feedback after every contract.',
  guide_md = $guide$
## Upwork — Platform Guide for AI/ML Practitioners

### Overview
Upwork is the largest freelance marketplace with millions of active jobs. For AI/ML professionals, it offers high volume but also high competition. Most clients are SMEs and startups hiring for specific projects. Hourly rates for senior ML engineers typically range **$60–150/hr**; LLM specialists and AI architects can command **$120–200/hr**.

### Profile Setup
- Set your title to something specific: *"ML Engineer specialising in LLMs, RAG pipelines & model fine-tuning"*
- Upload a professional headshot — profiles with photos get 3× more invitations
- Complete every section (overview, skills, employment history, certifications) to reach **100% profile completeness**
- Add at least 3 portfolio items with measurable outcomes (*"Built RAG system reducing support ticket volume by 40%"*)
- Pass the Upwork English fluency test and any available AI/ML skill assessments
- Set an hourly rate 10–15% above your floor — clients expect to negotiate
- Verify your identity and payment method to unlock more visibility

### Finding & Applying
- Filter by **"Posted within 24 hours"** — first 5 proposals get significantly more views
- Target jobs with **$10k+ budgets** and clients with **payment verified** and **4.5+ star ratings**
- Write a personalised first line referencing the client's exact problem
- Propose a **milestone-based fixed-price contract** for projects under $5k — clients prefer clear deliverables
- Use a maximum of 2 proposals per day on new jobs rather than mass-bidding

### Payment & Contracts
- All payments are held in **escrow** and released on milestone approval
- Hourly contracts are protected by the Upwork Work Diary (requires screenshots every 10 min)
- **Never accept payment outside Upwork** — you lose all protection and risk account suspension
- Service fee: 20% on first $500 per client, 10% up to $10k, 5% thereafter

### Rates & Negotiation
| Role | Typical Range |
|------|--------------|
| Data Scientist | $60–100/hr |
| ML Engineer | $75–130/hr |
| LLM / GenAI Engineer | $90–160/hr |
| AI Architect | $120–200/hr |

Start proposals at your target rate; don't undersell on the first job with a new client — it anchors future negotiations.

### Red Flags
- Client asks to "start a small unpaid test task first"
- Payment method is not verified on job post
- Requests to communicate on WhatsApp, Telegram, or personal email before contract
- Job post asks for "ChatGPT wrapper" at "$5/hr"
- Clients with 0 reviews offering large fixed-price contracts

### Tips for Success
- Achieve **Top Rated** status (90%+ JSS, $1k+ earned) — it unlocks job invitations and profile boosts
- Build relationships with good clients and request long-term retainers
- Apply to **Expert-Vetted** jobs once eligible — less competition, higher budgets
- Track your JSS weekly; address negative feedback by resolving disputes before they close
$guide$
WHERE slug = 'upwork';

UPDATE platforms SET
  rate_min_aiml = 100, rate_max_aiml = 200,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'The Toptal screening process has 3 stages: (1) language & communication screen via chat, (2) technical interview — expect live coding in Python, ML theory (bias/variance, regularisation, embedding similarity), and system design for ML pipelines, (3) paid test project (~20hrs, $200–500). Prepare your portfolio with complex, production-scale work. Only apply if you have 3+ years of senior-level ML experience.',
  application_guide = 'Toptal matches you to clients after vetting — you do not apply to individual jobs. Keep your Toptal profile active and respond to match requests within 24 hours. Maintain a 4.8+ client rating to keep your account in good standing. Toptal clients often extend contracts so treat every engagement as a relationship investment.',
  guide_md = $guide$
## Toptal — Platform Guide for AI/ML Practitioners

### Overview
Toptal accepts only the **top 3% of applicants** through a multi-stage vetting process. Once accepted, you access a curated marketplace of high-budget, long-term contracts with enterprise and funded startup clients. AI/ML rates typically run **$100–200/hr**, often $150+ for GenAI work. Engagements are usually 3–12 month contracts, frequently extending to full-time equivalent hours.

### Getting Through the Screening
The screening has three stages — each is a filter, not a formality:

1. **Communication Screen**: 30-min chat to assess English fluency, professionalism, and remote-work readiness
2. **Technical Interview**: 90-min live session covering Python coding, ML concepts (regularisation, gradient descent, embedding similarity), and ML system design (design a recommendation engine, a RAG pipeline, etc.)
3. **Test Project**: A paid project (~$200–500) taking 15–20 hours. Real client work, assessed on code quality, communication, and deliverable quality

**Preparation**: Study ML system design, practice Python problem-solving on LeetCode (medium-hard), and have at least 2–3 complex ML projects you can discuss in depth.

### Profile & Matching
- After approval, Toptal's talent ops team matches you to clients based on skills, timezone, and availability
- Respond to match requests within 24 hours — slow responses reduce future matches
- Keep your availability status updated in your dashboard
- Rate your preferred hourly rate honestly — Toptal's matching algorithm considers client budget fit

### Payment & Contracts
- Toptal handles invoicing and payment on your behalf — you invoice Toptal, Toptal invoices the client
- Payments are **net-30** from invoice date
- Toptal takes a cut from the client side — you receive your agreed rate in full
- Contracts can be hourly or fixed-price per milestone

### Rates & Negotiation
| Role | Typical Range |
|------|--------------|
| ML Engineer | $100–150/hr |
| LLM / GenAI Specialist | $130–180/hr |
| AI Solutions Architect | $150–200/hr |

Rates are set during the matching call with a Toptal account manager. Push for your market rate — Toptal clients expect to pay premium prices.

### Red Flags
- Emails claiming to be from "Toptal recruitment" from non-toptal.com domains — these are scams
- Any request to work outside Toptal's platform after matching
- Test projects with scope creep beyond the agreed hours

### Tips for Success
- Treat the test project as your most important job interview — quality over speed
- Ask for a portfolio reference letter after every successful engagement
- Specialise in a hot niche (LLMs, computer vision, MLOps) — specialists get matched faster
- Build relationships with Toptal talent ops — they will think of you for premium opportunities
$guide$
WHERE slug = 'toptal';

UPDATE platforms SET
  rate_min_aiml = 70, rate_max_aiml = 140,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'Create a Contra portfolio with 3–5 detailed case studies. Each case study should describe the problem, your solution, the tech stack, and a measurable outcome. Add a professional bio, skills list, and hourly rate. Contra does not charge freelancer fees — your published rate is what you receive.',
  application_guide = 'Browse the Contra job board and send proposals with a personalised message referencing the client project. Keep proposals short (3–4 sentences): what you do, why you are a fit, and your rate. Clients can also find you via search — optimise your profile skills for discoverability. Use Contra invoicing for all payments to maintain platform protection.',
  guide_md = $guide$
## Contra — Platform Guide for AI/ML Practitioners

### Overview
Contra is a **commission-free** freelance platform for independent professionals. Unlike Upwork, Contra takes 0% of your earnings — what you charge is what you receive. The platform skews toward product, design, and engineering work at startups and funded companies. AI/ML demand is growing, particularly for contract engineers working on product AI features. Typical rates: **$70–140/hr**.

### Profile Setup
- Write a compelling bio that leads with your most impressive credential (*"Former Google Brain → now helping startups ship LLM products"*)
- Add 3–5 portfolio case studies with real outcomes and screenshots
- List your skills precisely — Contra's search matches clients to freelancers by skill tags
- Set an hourly rate that reflects your market value (no platform fee to account for)
- Connect your social profiles (GitHub, LinkedIn) to increase trust

### Finding & Applying
- Browse the job board at **contra.com/opportunities** and filter by category and rate range
- Applications are short — 3–4 focused sentences beat long cover letters on Contra
- Clients search Contra's freelancer directory directly — keeping your profile active and keyword-rich increases inbound enquiries
- Respond to messages within a few hours to keep response rate high

### Payment & Contracts
- All invoicing and payments happen through Contra's built-in tools
- No platform fee on either side — full rate to you, no markup to clients
- Milestone-based or hourly contracts supported
- Contra handles payment processing; funds available after client approval

### Rates & Negotiation
| Role | Typical Range |
|------|--------------|
| AI/ML Engineer | $70–120/hr |
| LLM Product Engineer | $90–140/hr |
| ML Research Contractor | $80–130/hr |

Since there are no fees, your listed rate is your actual rate. Price at your real market value.

### Red Flags
- Clients requesting to pay via bank transfer or crypto outside Contra
- Vague project descriptions with no budget range
- Requests to start work before a contract is created on the platform

### Tips for Success
- Update your availability status regularly — active profiles surface higher in client searches
- Use Contra's case study format for portfolio items — they convert better than links to external sites
- Build repeat client relationships; Contra's long-term contract feature enables ongoing retainers
- Share your Contra profile publicly — it functions as a portfolio site with a built-in hire flow
$guide$
WHERE slug = 'contra';

UPDATE platforms SET
  rate_min_aiml = 80, rate_max_aiml = 160,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'Braintrust requires an application and technical vetting before you can access client opportunities. Apply at braintrust.network/talent with your resume, LinkedIn, and GitHub. The vetting process typically takes 3–7 days and involves a technical assessment. Referrals from existing Braintrust members significantly speed up approval.',
  application_guide = 'After vetting, browse available roles in the Braintrust dashboard. When a match is found by Braintrust talent ops, you will receive an introduction to the client. Prepare a short slide deck or portfolio PDF with 2–3 relevant case studies to share with client introductions. Braintrust contracts are typically long-term (3–12 months) at fixed hourly rates.',
  guide_md = $guide$
## Braintrust — Platform Guide for AI/ML Practitioners

### Overview
Braintrust is a **talent-owned** decentralised talent network. Unlike traditional platforms, Braintrust charges **0% fees to freelancers** — the platform earns from a client-side fee. This means higher take-home pay for the same gross rate. Clients are typically mid-to-large enterprises and funded startups (Nestlé, Nike, Goldman Sachs have all hired via Braintrust). AI/ML demand is strong, with typical rates of **$80–160/hr**.

### Getting Vetted
- Apply at braintrust.network — the review process takes 3–7 business days
- Technical assessment includes Python/ML coding and potentially a brief video interview
- **Referrals from existing members** dramatically increase approval speed and rate
- Connect your GitHub to demonstrate real-world code quality

### Profile & Matching
- Complete your profile with skills, experience, and portfolio links
- Braintrust talent ops make initial client introductions — keep your availability and rate preferences updated
- Respond promptly to match introductions; slow responses reduce future match frequency
- Prepare a 1-page portfolio PDF for client introduction calls

### Payment & Contracts
- All contracts are hourly with bi-weekly invoicing
- Braintrust handles compliance, invoicing, and payment processing
- You receive your full agreed rate (Braintrust's fee is charged to the client, not you)
- Payments are reliable — enterprise clients pre-fund Braintrust escrow

### Rates & Negotiation
| Role | Typical Range |
|------|--------------|
| ML Engineer | $80–130/hr |
| GenAI / LLM Engineer | $100–160/hr |
| Data Scientist | $80–120/hr |
| AI Architect | $130–180/hr |

Because there is no freelancer fee, your net rate equals your gross rate. Price accordingly versus Upwork rates.

### Red Flags
- Contacts claiming to be Braintrust talent ops from non-braintrust.network domains
- Requests to work outside the Braintrust platform after introduction
- Job posts with rates far below market (Braintrust clients are vetted — low rates are a warning sign)

### Tips for Success
- Refer other qualified engineers — Braintrust rewards referrals with token incentives
- Engage in the Braintrust community forum; visibility in the community leads to more direct introductions
- Long-term contracts are the norm — invest in onboarding well with each client
- Keep skills and availability updated weekly; stale profiles receive fewer introductions
$guide$
WHERE slug = 'braintrust';

UPDATE platforms SET
  rate_min_aiml = 75, rate_max_aiml = 130,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'Gun.io requires passing a technical assessment focused on Python, algorithms, and system design. Apply at gun.io/apply with your resume and GitHub. The assessment is timed and includes coding challenges. Most AI/ML engineers with 3+ years of production experience pass on the first attempt.',
  application_guide = 'Gun.io sends weekly opportunity digests to vetted engineers matching their client demand. Review opportunities in your dashboard and express interest within 24 hours. Gun.io talent managers handle the client introduction. Maintain a strong profile with updated skills and portfolio — passive discoverability matters here.',
  guide_md = $guide$
## Gun.io — Platform Guide for AI/ML Practitioners

### Overview
Gun.io is a curated network for **senior software engineers**, with growing AI/ML demand. Clients are primarily US-based startups and scale-ups seeking long-term contractors. Vetting is required, but once approved you access a lower-competition marketplace than Upwork. Typical AI/ML rates: **$75–130/hr**.

### Getting Vetted
- Technical assessment: Python coding challenges + system design questions
- Most engineers with 3+ years of production ML experience pass the first attempt
- Submit your GitHub profile — code quality is assessed directly
- Application review takes 5–10 business days

### Finding Work
- Gun.io sends curated weekly digests matching your skills to open opportunities
- Express interest quickly — Gun.io roles have limited slots and fill fast
- Talent managers handle client introductions; your role is to do well in the client call
- Maintain an active profile (log in at least monthly) to stay in the matching pool

### Payment & Contracts
- Contracts are hourly, invoiced bi-weekly through Gun.io
- Gun.io handles compliance and payments
- Net-15 payment terms after invoice approval

### Rates & Negotiation
| Role | Typical Range |
|------|--------------|
| ML / AI Engineer | $75–120/hr |
| LLM Specialist | $95–130/hr |

### Tips for Success
- Update your skills list when you ship new projects or learn new frameworks
- Check the dashboard weekly — opportunities are not always emailed
- Build a relationship with your Gun.io account manager; they advocate for you with clients
$guide$
WHERE slug = 'gun-io';

UPDATE platforms SET
  rate_min_aiml = 30, rate_max_aiml = 80,
  payment_model = 'escrow', has_escrow = true,
  setup_guide = 'Create a detailed profile with specialisations clearly listed. Freelancer.com has high competition so differentiation matters. Add verifiable certifications, a strong portfolio, and bid on fixed-price jobs with clear deliverables to avoid scope creep. Keep your feedback rating above 4.5 to remain competitive.',
  application_guide = 'Filter jobs by "Fixed Price" and budget above $500 to find serious clients. Submit short, targeted proposals referencing the specific job requirements. Use milestone payments on all fixed-price work. Avoid bidding on jobs posted more than 3 days ago — they are usually already awarded.',
  guide_md = $guide$
## Freelancer.com — Platform Guide for AI/ML Practitioners

### Overview
Freelancer.com is a high-volume global marketplace with mixed quality. For AI/ML work, it attracts a wide range of clients from enterprise to individuals. Rates are generally lower than Upwork (typical AI/ML: **$30–80/hr**), but volume is very high, making it viable for building early portfolio work or targeting niche technical tasks. Scam risk is higher than Tier 1 platforms — vigilance is required.

### Profile Setup
- Complete every section to maximum — incomplete profiles are filtered out by many clients
- Add verifiable certifications (Coursera, DeepLearning.AI, AWS ML Specialty)
- List specific tools and frameworks, not just "Machine Learning"
- Set a competitive but not underselling hourly rate; adjust per-project

### Finding & Applying
- Use the **Fixed Price** filter — hourly tracking is less common on Freelancer
- Filter by **budget: $500+** to avoid low-quality one-off tasks
- Submit within the first hour of posting — proposals beyond the first 10 rarely win
- Personalise each proposal: reference the exact technology mentioned in the job post
- Propose **3–5 milestones** for every fixed-price contract; never take a lump-sum upfront

### Payment & Contracts
- Fixed-price projects use **milestone escrow** — funded by the client before work begins
- Hourly projects use automated time-tracking (screenshot-based, similar to Upwork)
- Freelancer takes 10% on fixed-price projects, 10% on hourly up to $500/client/month
- Only release milestones after delivering clear, agreed outcomes

### Red Flags
- Clients requesting to pay via PayPal, bank transfer, or crypto directly
- "Test task" requests before a contract is created
- Job posts with no budget or "will pay based on quality"
- Clients who want to "talk on WhatsApp first"
- Requests to download a custom software package for "collaboration"

### Tips for Success
- Achieve **Preferred Freelancer** status by maintaining 4.7+ rating and earning $1k+
- Target AI/ML jobs from US/UK/AU clients — higher budgets, more professional
- Always use Freelancer SafePay (milestone escrow) — never work without it
- Raise your rates gradually as your reviews accumulate
$guide$
WHERE slug = 'freelancer';

UPDATE platforms SET
  rate_min_aiml = 60, rate_max_aiml = 120,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'Remotive is a job board, not a marketplace — you apply directly to company career pages. Create a dedicated version of your resume tailored for remote AI/ML roles. Highlight asynchronous communication skills, remote portfolio work, and any open-source contributions. Remotive listings are pre-vetted so response rates are generally higher than mass job boards.',
  application_guide = 'Browse Remotive at remotive.com/jobs/machine-learning. Set up an email alert for your target roles. Apply directly via the company link — you interact with the employer, not Remotive. Tailor each application: reference the company product and explain how your ML experience directly applies. Follow up politely after 5–7 business days.',
  guide_md = $guide$
## Remotive — Platform Guide for AI/ML Practitioners

### Overview
Remotive is a **curated remote job board** focused on tech roles. Unlike marketplaces, it lists full-time and contract positions at real companies — you apply directly, Remotive is just the discovery channel. AI/ML listings are consistently high quality with typical contract rates of **$60–120/hr** and full-time salaries of $100–200k for senior roles.

### How It Works
Remotive is a job board, not a freelance marketplace. You browse listings, click through to the company's careers page, and apply directly. There is no profile, bidding, or rating system. Your resume and portfolio are your entire presentation.

### Finding Good Listings
- Browse at **remotive.com/jobs/machine-learning** — filter by job type (contract, full-time)
- Set up email alerts for "machine learning", "LLM engineer", "AI engineer"
- Check listing date — Remotive removes old listings but some linger; prioritise posts under 2 weeks old
- Remotive's editorial team curates listings, so average quality is higher than aggregators

### Applying
- Apply directly via the company link — this goes to the employer's ATS or email
- Customise your resume and cover letter for each application
- Emphasise: remote work experience, async communication, time zone flexibility
- Follow up after 5–7 business days with a short, professional email

### Rates & Compensation
| Role | Typical Contract Rate |
|------|----------------------|
| ML Engineer (contract) | $60–100/hr |
| LLM / AI Engineer | $80–120/hr |
| Data Scientist | $55–90/hr |

Full-time salaries listed on Remotive are usually $100–180k for senior AI/ML.

### Tips for Success
- Create a **one-page portfolio site** (GitHub Pages, Notion, or Contra) to link in applications
- Highlight open-source contributions or Kaggle rankings in your resume header
- Apply within the first week of posting — competition increases after 2 weeks
- Remotive has a paid membership ($17/mo) that surfaces exclusive listings not on the free tier
$guide$
WHERE slug = 'remotive';

UPDATE platforms SET
  rate_min_aiml = 50, rate_max_aiml = 100,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'RemoteOK is a job aggregator — no profile to create. Prepare a strong remote-optimised resume and personal portfolio site. Filter by AI/ML-relevant tags: "machine-learning", "ai", "python", "pytorch". Set up the RemoteOK email digest for daily AI/ML job alerts.',
  application_guide = 'Click through each listing to the company application page. Many listings link directly to company career pages or email addresses. Apply within the first 48 hours of posting for best results. For email-based applications, use a short 3-paragraph format: intro, fit, call to action.',
  guide_md = $guide$
## RemoteOK — Platform Guide for AI/ML Practitioners

### Overview
RemoteOK is a high-volume remote job aggregator publishing hundreds of new listings daily. Quality varies considerably — listings range from well-funded companies to individual contractors. For AI/ML, the **machine-learning** and **ai** tag filters cut through the noise effectively. Salary data is often listed, enabling quick rate filtering. Typical AI/ML rates: **$50–100/hr** for contract roles.

### How It Works
RemoteOK is an aggregator — no account or profile required. Browse listings, filter by tags, and apply directly to each company. RemoteOK earns from job posting fees from employers, so its incentive is listing volume, not quality curation.

### Finding Good Listings
- Use tag filters: **machine-learning**, **pytorch**, **ai**, **python** — accessible from the homepage
- Sort by **newest** to see freshly posted listings first
- Salary filter: set minimum to your floor rate — many listings include salary ranges
- Avoid listings with no company name or anonymous posting (higher scam rate)

### Common Issues
- **Duplicate listings**: the same job may appear 3–5 times — check the company before applying twice
- **Stale listings**: some employers forget to remove filled positions; check if the career page still shows the role
- **Broken apply links**: ~5% of listings have dead links — search the company name directly

### Tips for Success
- Subscribe to the **RemoteOK email digest** for daily AI/ML listings delivered to your inbox
- Cross-reference interesting companies on LinkedIn to verify legitimacy before applying
- Check employer reviews on Glassdoor for unfamiliar company names
$guide$
WHERE slug = 'remoteok';

UPDATE platforms SET
  rate_min_aiml = 55, rate_max_aiml = 110,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'Himalayas is a modern remote job board with strong AI/ML category coverage. No profile to create — prepare your resume and portfolio. Use the category filter for "Machine Learning & AI" and set up email alerts. Himalayas verifies company listings, so quality is generally good.',
  application_guide = 'Apply directly through Himalayas to the company career page. Himalayas shows full job descriptions without registration required. Prioritise listings from companies with full profiles on Himalayas (logo, description, team size) — these are more likely to be active hires.',
  guide_md = $guide$
## Himalayas — Platform Guide for AI/ML Practitioners

### Overview
Himalayas is a modern, well-designed remote job board with an emphasis on **company transparency**. Each company listing includes team size, funding stage, tech stack, and hiring locations. This makes it easier to evaluate opportunities before applying. AI/ML listings are strong, with typical contract rates of **$55–110/hr** and full-time salaries of $110–190k.

### Finding Good Listings
- Browse **himalayas.app/jobs/machine-learning** or use the AI/ML category
- Filter by job type (contract, full-time, part-time)
- Companies on Himalayas fill out detailed profiles — prefer listings where the company has a complete Himalayas page
- Set up email alerts for your preferred role and salary range

### Applying
- Applications go directly to the company's career system
- Himalayas shows company timezone, team size, and whether they sponsor visas — useful for filtering
- No need to create a Himalayas account to apply to most listings
- Personalise your application with reference to the company product — Himalayas clients tend to be intentional remote-first companies that value cultural fit

### Company Quality Signals
- Full company profile (logo, description, team size, funding) → higher quality posting
- Salary range listed → company is transparent, less likely to lowball
- Multiple open roles → actively hiring, faster process

### Tips for Success
- Use Himalayas' **salary insights** to benchmark your rate for a given role and company size
- Check the company's engineering blog before the interview — it signals preparation
- Himalayas listings skew toward growth-stage companies (Series A–C), which have larger AI/ML budgets than early-stage
$guide$
WHERE slug = 'himalayas';

UPDATE platforms SET
  rate_min_aiml = 65, rate_max_aiml = 120,
  payment_model = 'direct', has_escrow = false,
  setup_guide = 'Turing requires a technical vetting process: AI-powered coding assessments and a video interview. Apply at turing.com/developers. The AI assessment adapts to your performance — budget 2–3 hours. Have your GitHub and LinkedIn ready. Turing specialises in placing developers with US companies on long-term contracts, so present yourself as a long-term partner, not a short-term gig worker.',
  application_guide = 'After vetting, Turing matches you to US clients based on skills and timezone overlap. Matches happen within 1–3 weeks of approval. For each match, you have a 20-minute video call with the client team before acceptance. Maintain high performance ratings (4.7+) to receive future matches — Turing tracks velocity, code quality, and communication.',
  guide_md = $guide$
## Turing — Platform Guide for AI/ML Practitioners

### Overview
Turing uses AI to match vetted developers with US-based companies for **long-term remote contracts** (typically 6–12 months, often extending). The client base is primarily US startups and enterprises hiring for roles they would otherwise fill with full-time employees. AI/ML engineers typically earn **$65–120/hr**, with US-equivalent compensation for strong performers. Turing handles payroll, compliance, and benefits management.

### Vetting Process
1. **AI-powered coding assessment**: adaptive challenges in Python/ML, data structures, and algorithms (~90 min)
2. **Video interview**: communication skills and technical depth assessment with a Turing engineer
3. **Seniority calibration**: Turing assigns you a seniority level that determines which clients you are matched to

Prepare by practising Python coding problems (LeetCode medium), reviewing ML fundamentals, and ensuring your English communication is clear and professional.

### How Matching Works
- After vetting, Turing proactively matches you to clients — you do not browse a job board
- Matches are sent within 1–4 weeks; respond quickly (within 24 hours)
- Client preview calls are ~20 minutes — treat them as interviews
- You can reject matches without penalty if the project is not a fit

### Payment & Contracts
- Turing pays bi-weekly via bank transfer or Wise
- Contracts are full-time equivalent (40 hrs/week) or part-time (20 hrs/week)
- Turing handles invoicing, tax forms, and compliance with US labour laws
- Review the contract terms for IP assignment — standard for US client work

### Rates
| Seniority | Typical Range |
|-----------|--------------|
| Mid ML Engineer | $65–90/hr |
| Senior ML Engineer | $85–120/hr |
| Staff / Principal | $110–150/hr |

Rates are negotiated at the Turing level during vetting — flag if the calibration seems low.

### Tips for Success
- Treat your first Turing engagement as a trial period — deliver excellent work in the first 30 days
- Communicate blockers immediately — US clients expect proactive status updates
- Turing tracks your velocity and code quality metrics; consistent high performance leads to better matches
- After 6 months with a client, ask about conversion to a higher rate or extended engagement
$guide$
WHERE slug = 'turing';

NOTIFY pgrst, 'reload schema';
