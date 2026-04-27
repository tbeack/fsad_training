# Inside a Single-Shot Prompt

*What actually happens between request and response*

When someone types a prompt into an LLM and gets a response, what runs in between is a deterministic pipeline with one probabilistic step in the middle. Understanding this mechanism — and what it deliberately *doesn't* do — is the foundation for understanding why agentic, spec-driven workflows exist.

---

## The flow

### 1. Inputs

Two text streams enter the system: a **system prompt** (rules, persona, available tools) and a **user message** (the actual request). They're concatenated into a single sequence. The model sees one continuous text, not two separate fields.

### 2. Tokenizer

Text becomes integers. A byte-pair-encoding (BPE) tokenizer splits the input into tokens — sometimes whole words, often subwords or fragments. The vocabulary is fixed (typically around 150K entries). Token count, not character count, is what the model and the billing meter actually see.

### 3. Context window

The token sequence is loaded into a fixed-size buffer. This is the model's only working memory for this request. Everything — system prompt, conversation history, attached documents, the user's latest message — competes for the same finite budget. Anything that doesn't fit is truncated or summarized before the model sees it.

### 4. Forward pass

Tokens flow through the transformer:

- **Embed** — each token ID becomes a high-dimensional vector
- **N transformer blocks** — each block runs self-attention (every token attends to every prior token) followed by a feed-forward network. Modern frontier models stack roughly 50–100 of these blocks.
- **LM head** — the final hidden state is projected back to a probability distribution over the entire vocabulary

There are two phases inside this:

- **Prefill** — all input tokens are processed in one parallel pass; this builds the *KV cache*
- **Decode** — each subsequent generation step processes only one new token; the KV cache holds the prior computation

This split is why time-to-first-token differs from inter-token latency, and why streaming output works.

### 5. Sampler

The LM head produces logits — a score for every token in the vocabulary. The sampler turns this distribution into a single chosen token, controlled by **temperature** (how random) and **top-p** or **top-k** (how restrictive). This is the only probabilistic step in the entire pipeline.

### 6. The decode loop

Here's the key insight most "how an LLM works" explanations miss: there isn't *one* forward pass per response. There's one forward pass *per output token*.

The sampled token gets appended to the context. The model runs again. It samples another token. Appends it. Runs again. This continues until the model samples an end-of-sequence (EOS) token or hits the `max_tokens` ceiling.

This is why generation latency scales with output length. It's why the response streams in. And it's why the entire process is described as *autoregressive*: each step's output becomes part of the next step's input.

### 7. Detokenize → Response

Once generation halts, the accumulated token IDs are converted back to text and returned to the caller. The context window is then discarded. Nothing persists.

---

## What's not happening

The single-shot paradigm is defined as much by what it excludes as what it includes:

- **Stateless** — nothing persists between requests. The model has no memory of yesterday's conversation, last hour's analysis, or the prior token-budget that just closed.
- **Bounded context** — every token costs budget. Long histories, attached documents, system instructions, tools list, user message, model response all share one finite window.
- **No tools** — text goes in, text comes out. The model cannot fetch a URL, query a database, run code, or check a fact against a source. It can only describe doing those things.
- **Probabilistic** — the same prompt, run twice, can produce different outputs. Even at temperature zero, hardware non-determinism means strict reproducibility is not guaranteed.

---

## Why this matters

Each of these constraints is exactly what spec-driven, agentic workflows are designed to compensate for:

- **Statelessness** is closed by externalizing memory into files (`spec.md`, `context/`, `memory/`) that the orchestrator re-injects into each call.
- **Bounded context** is managed by a coordinator that decides what to load when, rather than dumping everything in.
- **No tools** is closed by tool use — calls to retrieval, code execution, file systems, APIs — orchestrated around the model.
- **Probabilistic outputs** are bounded by a separate verifier agent that checks the implementor's work against the spec.

The single-shot diagram shows the mechanism. The spec-driven diagram shows the scaffolding built around it. Both are accurate. The second is what production systems actually look like.
