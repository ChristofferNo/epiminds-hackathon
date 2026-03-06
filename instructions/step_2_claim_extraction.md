# Agent Instructions – Scraper Improvements + Claim Pipeline

This document describes improvements that should be implemented in the scraper and backend pipeline.

The goal is to allow a user to start the frontend, enter a topic, press **Analyse**, and observe scraped articles and extracted claims printed in the backend console.

---

# 1. Use Gemini Lite for Claim Extraction

We have access to **the latest Gemini Lite model**.

Use:
The latest gemini lite model.

Use it in the **Claim Extraction Agent** to extract factual claims from scraped documents.

Expected behavior:

For each document:

Input:

- article title
- article text
- topic

Output:

- list of claims

Example format:

```json
{
  "url": "...",
  "title": "...",
  "claims": [
    "mRNA vaccines use messenger RNA to instruct cells to produce viral proteins",
    "The first widely used mRNA vaccines were developed for COVID-19",
    "mRNA vaccines do not alter human DNA"
  ]
}
```

# 2. Improve Title Extraction

Current title extraction sometimes returns empty strings.

Implement multiple fallback methods:

Step 1 — Standard HTML title
title = soup.title.string.strip() if soup.title and soup.title.string else ""

Step 2 — OpenGraph title fallback

If title is empty:
og_title = soup.find("meta", property="og:title")
if og_title:
title = og_title.get("content", "")

Step 3 — First H1 fallback
if not title:
h1 = soup.find("h1")
if h1:
title = h1.get_text().strip()

# 3. Remove More HTML Noise

Before extracting text remove common non-content elements.

Update the cleanup step to remove:
script
style
nav
header
footer
aside
form
noscript
svg

Example:
for tag in soup(["script","style","nav","header","footer","aside","form","noscript","svg"]):
tag.decompose()
This significantly reduces junk text.

# 4. Limit Document Length

To keep memory usage low and improve LLM performance:

Limit document length to: 2000 characters

# 5. Claim Extraction Strategy

Use Option A.

Process each document separately.

Pipeline:
topic
↓
scraper_agent
↓
claim_agent (per document)
↓
store claims

example:
Doc 1 → claims
Doc 2 → claims
Doc 3 → claims
Do NOT merge documents before claim extraction.

# 6. Frontend → Backend Flow

Full system should work like this:
Frontend
↓
enter topic
↓
click "Analyse"
↓
POST /topic
POST /run-scraper
POST /run-claims

# 7 Console Logging (Important)

When the user clicks Analyse, the backend should print useful logs.

Example expected console output:

Searching DuckDuckGo for: mRNA vaccines
Found 5 results

Scraping: wikipedia.org
Scraping: britannica.com
Scraping: clevelandclinic.org

Running claim extraction...

Document: mRNA vaccine - Wikipedia
Claims:

- mRNA vaccines use messenger RNA to instruct cells to produce proteins
- mRNA vaccines were widely deployed during COVID-19

Document: Cleveland Clinic - mRNA Vaccines
Claims:

- mRNA vaccines train the immune system to recognize viruses

# End goal

A working pipeline:

User Topic
↓
DuckDuckGo Search
↓
Article Scraping
↓
Clean Text Extraction
↓
Gemini Lite Claim Extraction
↓
Claims printed in console

This will provide a working misinformation / narrative detection pipeline foundation
