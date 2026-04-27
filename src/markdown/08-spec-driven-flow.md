# Inside an FSAD Flow

*What happens when you direct agents instead of prompting*

FSAD — Full Stack Agentic Development — is built on a specific technical pattern: a spec-driven agentic flow that exists to compensate for the four constraints the single-shot prompt paradigm imposes. Where the model itself is stateless, bounded, tool-less, and probabilistic, the system *around* the model is stateful, curated, tool-rich, and verifiable. Nothing about how the LLM runs internally has changed. What's changed is what comes back to it on each call, and what gets done with each response.

---

## The flow

### 1. Inputs

Two distinct artifacts enter the system: **user intent** (what to build) and **spec.md** (criteria, examples, constraints). The spec is not an enrichment of the intent — it's a separate document that defines *done*. The intent says "ship a payments page;" the spec says "must accept Visa and Mastercard, must show a confirmation modal on success, must surface errors inline, here are three example happy-path flows." Without the spec, the system has no way to know it succeeded.

### 2. Orchestrator

The orchestrator is itself an LLM call — but a privileged one. Its job is to decompose intent into tasks, decide which agent runs each task, and manage the queue as work progresses. It does not implement the work. A typical decomposition for a feature might produce four to ten tasks (auth, ui, api, test, etc.), each scoped tightly enough that a single agent can complete it in one execution.

### 3. Context assembly

Every downstream agent call gets a freshly assembled context bundle — not a raw dump of the project, and not the same bundle every time. The orchestrator (or a context-assembly step) selects: the system prompt for this agent role, the relevant *slice* of the spec, the files this task will touch, skills the agent has access to, and prior results from related tasks. This is what makes the bounded-context constraint workable. You don't fight the context window; you decide what fits.

### 4. Agent execution

This is where the actual work happens, and it's structured as an inner loop. The LLM is called with the assembled context. It produces a response that contains text plus zero or more `tool_calls`. If there are tool calls, they execute (read a file, write a file, run a command, search documentation). The results are appended to the context, and the LLM is called again. This continues until the model returns a response with no tool calls — meaning it considers its work on this task complete.

This loop is the structural parallel to the decode loop inside the model itself. In single-shot, each iteration produces one token; the loop exits on EOS. In agentic execution, each iteration produces one tool call worth of work; the loop exits when the agent produces no more calls. Same recursive shape, different unit. The agentic loop is built *on top of* the decode loop, not instead of it.

### 5. Verifier

A separate agent — a separate LLM call with a different system prompt and toolset — checks the implementor's output against the spec. The split matters because an agent that just produced work is optimistic about that work; it has reasons to believe each decision it made. A verifier reading the output cold, with the spec as ground truth, has a cleaner signal. On pass, the flow continues. On fail, control returns to the orchestrator with feedback, which decides whether to re-task the implementor, refine the spec, or escalate.

The fail loop is what makes the system iterative without restart. The spec, the context, and the prior results all persist; only the failed task is reattempted.

### 6. Persistent memory

State lives in files, not in the model. The substrate — `spec.md`, `context/`, `skills/`, `memory/`, `results/` — is read and written throughout the flow. The orchestrator updates the task queue. Implementors write code and notes. The verifier records pass/fail decisions. The next agent call assembles fresh context from this same substrate. Nothing depends on the model remembering anything between calls, because nothing needs the model to.

This is why FSAD treats markdown as the primary directive medium: the substrate has to be human-readable so a human can audit it, edit it, and refine it. It also has to be machine-readable so agents can parse it. Markdown is the cheapest format that satisfies both constraints.

---

## What this enables

Each capability here closes one of the four single-shot constraints:

- **Stateful** — memory persists across calls. The model is still stateless on each call, but the system isn't. Yesterday's decisions, last hour's verifier output, the prior task's results are all available because they were written to files that get re-read.
- **Managed context** — the curated bundle replaces the raw dump. Each agent gets only what it needs for its task, freeing budget for actual work. This is the discipline that lets bounded-context models do unbounded jobs.
- **Tool use** — the LLM emits tool calls, the system executes them, results return to context. Reading, writing, executing, and searching all become first-class operations. The model is no longer just describing actions; it is directing them.
- **Verifiable** — the separate verifier agent provides a signal independent of the implementor's optimism. Pass means the spec was met, not that the agent thinks it was.

---

## Why FSAD prescribes this shape

The single-shot diagram shows the mechanism. The FSAD flow shows the scaffolding. The pattern works for the same reason team-based engineering works: clear roles, written contracts, verifiable handoffs, and persistent state. The orchestrator is a tech lead. Implementors are engineers. The verifier is QA. The spec is the design doc. Memory is the codebase plus the wiki.

What changes with agents is throughput and cost structure. A four-task feature that would have taken a small team a week can be decomposed and dispatched across implementors running in parallel. The verifier catches deviations the same way a code review would. The spec carries intent forward so that no individual call has to reconstruct it.

The model itself is the same. The work is the same. What's different is that the work is now structured for delegation — to humans, to agents, or to a mix of both — and that is the entire point.
