import requests
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def search_duckduckgo(topic: str, max_results: int = 5) -> list[str]:
    url = f"https://duckduckgo.com/html/?q={requests.utils.quote(topic)}"
    response = requests.get(url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")

    urls = []
    for result in soup.select("a.result__url"):
        href = result.get("href", "")
        if href.startswith("http"):
            urls.append(href)
        if len(urls) >= max_results:
            break

    # Fallback: try result__a links with uddg param
    if not urls:
        for result in soup.select("a.result__a"):
            href = result.get("href", "")
            if "uddg=" in href:
                from urllib.parse import urlparse, parse_qs, unquote
                parsed = urlparse(href)
                uddg = parse_qs(parsed.query).get("uddg", [])
                if uddg:
                    urls.append(unquote(uddg[0]))
            elif href.startswith("http"):
                urls.append(href)
            if len(urls) >= max_results:
                break

    return urls


def scrape_page(url: str) -> dict:
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Step 1 — Standard HTML title
        title = soup.title.string.strip() if soup.title and soup.title.string else ""

        # Step 2 — OpenGraph title fallback
        if not title:
            og_title = soup.find("meta", property="og:title")
            if og_title:
                title = og_title.get("content", "")

        # Step 3 — First H1 fallback
        if not title:
            h1 = soup.find("h1")
            if h1:
                title = h1.get_text().strip()

        if not title:
            title = url

        # Remove noise elements
        for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form", "noscript", "svg"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)
        text = " ".join(text.split())[:2000]

        return {"url": url, "title": title, "text": text}
    except Exception as e:
        print(f"  Failed to scrape {url}: {e}")
        return {"url": url, "title": "", "text": ""}


def scraper_agent(context: dict) -> None:
    topic = context["topic"]
    if not topic:
        print("Scraper agent: no topic set, skipping.")
        return

    print(f"\nSearching DuckDuckGo for: {topic}")

    urls = search_duckduckgo(topic)
    print(f"Found {len(urls)} results\n")

    for url in urls[:5]:
        print(f"Scraping: {url}")
        page = scrape_page(url)
        context["documents"].append(page)

    print(f"Total documents: {len(context['documents'])}\n")
