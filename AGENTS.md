<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Agent usage rules — ALWAYS follow these

## prompt-refiner — run BEFORE starting any task that is:
- Vague or uses words like "thoroughly", "completely", "review", "make it better", "fix"
- Missing a specific target file, framework choice, or output format
- Spanning multiple concerns without a stated priority
- A broad "do X for the whole app" request

Do NOT skip prompt-refiner to save time. A bad prompt produces bad output regardless of execution quality.

## token-optimizer — run BEFORE any task that will:
- Read more than 3 files to plan or execute
- Touch multiple features or pages at once
- Explore the codebase without a known starting point
- Risk repeating file reads already done in the session

Run token-optimizer AFTER prompt-refiner (so it works on the refined scope, not the original vague scope).

## Rule: both agents run in parallel when both apply
When a task is both vague AND multi-file, spawn prompt-refiner and token-optimizer simultaneously as a single parallel Agent call before doing any other work.
