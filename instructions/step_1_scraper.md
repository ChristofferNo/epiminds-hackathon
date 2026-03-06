# Step 1 — Web Scraper Agent

Follow the architecture described in **CLAUDE.md**.

In this step we will implement the **first agent: the Scraper Agent**.

The purpose of this step is to verify that:

- the backend can access the topic
- we can fetch web results
- we can scrape article text
- we can store scraped documents in the shared context

This step should also **print output to the terminal** so we can confirm it works.

Do NOT implement any other agents yet.

---

# Goal

Input:

A topic stored in the shared context.

Output:

The scraper agent fetches **~5 webpages related to the topic** and stores them in:

```python
shared_context["documents"]
```

Each document should contain:

```python
{
  "url": "...",
  "title": "...",
  "text": "..."
}
```

After running, the agent should print:

- topic
- number of pages found
- URLs scraped

This is only for debugging during the hackathon.

---

# File to Create

Create:

```
agents/scraper_agent.py
```

---

# Scraper Agent Responsibilities

The scraper agent should:

1. Read the topic from shared context
2. Search the web for the topic
3. Retrieve ~5 URLs
4. Scrape basic text from those pages
5. Store them in shared context

---

# Searching the Web

Use **DuckDuckGo HTML search** because it works without API keys.

Search URL format:

```
https://duckduckgo.com/html/?q={topic}
```

Use `requests` and `BeautifulSoup` to parse results.

Extract links from search results.

Limit to **5 URLs**.

---

# Scraping Page Content

For each URL:

1. Request the page
2. Extract visible text
3. Limit text length to avoid huge payloads (for example first 2000 characters)

Store:

```python
{
  "url": url,
  "title": page_title,
  "text": text_snippet
}
```

Append to:

```
shared_context["documents"]
```

---

# Example Implementation Outline

Example structure:

```python
def scraper_agent(context):

    topic = context["topic"]

    print(f"Running scraper agent for topic: {topic}")

    urls = search_duckduckgo(topic)

    for url in urls[:5]:

        page = scrape_page(url)

        context["documents"].append(page)

        print("Scraped:", url)

    print("Total documents:", len(context["documents"]))
```

---

# Add a Temporary Test Route

To verify the agent works, add a temporary endpoint in:

```
backend/main.py
```

Route:

```
POST /run-scraper
```

Behavior:

1. Call the scraper agent
2. Return the updated shared context

Example:

```python
@app.post("/run-scraper")
def run_scraper():
    scraper_agent(shared_context)
    return shared_context
```

---

# Expected Terminal Output

When the agent runs we should see something like:

```
Running scraper agent for topic: mRNA vaccines

Found 5 URLs

Scraped: https://example1.com
Scraped: https://example2.com
Scraped: https://example3.com

Total documents: 5
```

This confirms the scraper is working.

---

# Expected Context After Running

Example:

```python
shared_context = {
  "topic": "mRNA vaccines",
  "documents": [
      {
        "url": "...",
        "title": "...",
        "text": "..."
      }
  ],
  "claims": [],
  "narratives": []
}
```

---

# Important Constraints

Do NOT:

- implement claim extraction yet
- implement narrative clustering
- modify the frontend

Only implement the **scraper agent** and the **test endpoint**.

---

# How to Test

1. Start backend

```
uvicorn backend.main:app --reload
```

2. Set topic using frontend or API.

3. Call:

```
POST /run-scraper
```

4. Confirm:

- terminal prints scraping logs
- response contains scraped documents

Once this works we will move to **Step 2 — Claim Extraction Agent**.
