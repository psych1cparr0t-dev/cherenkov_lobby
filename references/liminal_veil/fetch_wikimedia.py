import requests
import urllib.parse
import os
import subprocess

queries = [
    ("sunrise time lapse nature", "nature1"),
    ("modern architecture design", "design1"),
    ("human expressive dance", "human1"),
    ("innovation technology", "innovation1"),
    ("painting art expression", "creative1"),
]

def search_wikimedia_commons(query):
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "list": "search",
        "srsearch": f"{query} filetype:video",
        "srnamespace": "6", # File namespace
        "srlimit": 5
    }
    headers = {"User-Agent": "CherenkovMosaicBot/1.0 (test@test.com)"}
    r = requests.get(url, params=params, headers=headers)
    try:
        data = r.json()
    except Exception as e:
        print(f"Error parsing JSON: {e}, Response: {r.text[:200]}")
        return []
    
    results = []
    if "query" in data and "search" in data["query"]:
        for item in data["query"]["search"]:
            title = item["title"]
            results.append(title)
    return results

def get_file_url(title):
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "titles": title,
        "prop": "videoinfo",
        "viprop": "url"
    }
    headers = {"User-Agent": "CherenkovMosaicBot/1.0 (test@test.com)"}
    r = requests.get(url, params=params, headers=headers)
    try:
        data = r.json()
    except Exception as e:
        print(f"Error parsing JSON for URL: {e}, Response: {r.text[:200]}")
        return None
    
    pages = data.get("query", {}).get("pages", {})
    for page_id, page_info in pages.items():
        if "videoinfo" in page_info:
            return page_info["videoinfo"][0]["url"]
    return None

def main():
    os.makedirs("wikimedia_downloads", exist_ok=True)
    out_dir = "first_draft"
    os.makedirs(out_dir, exist_ok=True)

    for q, category in queries:
        print(f"Searching for: {q}")
        titles = search_wikimedia_commons(q)
        for t in titles:
            print(f"Found: {t}")
            url = get_file_url(t)
            if url:
                print(f"URL: {url}")
                # Download and cut
                output_name = f"{out_dir}/{category}_10s.webm"
                cmd = f"ffmpeg -y -i '{url}' -t 9.5 -c:v libvpx-vp9 -b:v 1M -crf 30 -an '{output_name}' < /dev/null"
                print(f"Running: {cmd}")
                subprocess.run(cmd, shell=True)
                break

if __name__ == "__main__":
    main()
