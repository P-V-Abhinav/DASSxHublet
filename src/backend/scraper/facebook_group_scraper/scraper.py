"""
scraper.py — Facebook Group Scraper using Apify.

Scrapes posts from one or more Facebook groups and returns a DataFrame.
Groups are loaded from groups.txt (one URL per line).
"""
import pandas as pd
from apify_client import ApifyClient

import config


def load_group_urls(path: str = config.GROUPS_FILE) -> list[str]:
    """
    Read group URLs from a text file.
    Ignores blank lines and lines starting with #.
    """
    urls = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                urls.append(line)
    if not urls:
        raise ValueError(f"No group URLs found in {path}")
    print(f"[SCRAPER] Loaded {len(urls)} group URL(s) from {path}")
    return urls


def scrape_group(
    group_url: str,
    limit: int = config.RESULTS_LIMIT,
    view_option: str = config.VIEW_OPTION,
) -> pd.DataFrame:
    """
    Scrape a single Facebook group using the Apify actor.

    Returns:
        DataFrame with the raw scraped data.
    """
    print(f"\n[SCRAPER] Scraping: {group_url}")
    print(f"   Limit: {limit} | View: {view_option}")

    client = ApifyClient(config.APIFY_TOKEN)

    run_input = {
        "startUrls": [{"url": group_url}],
        "resultsLimit": limit,
        "viewOption": view_option,
    }

    run = client.actor(config.APIFY_ACTOR_ID).call(run_input=run_input)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    df = pd.DataFrame(items)
    print(f"[OK] Scraped {len(df)} posts from this group")
    return df


def scrape_all_groups(
    urls: list[str] = None,
    limit: int = config.RESULTS_LIMIT,
    view_option: str = config.VIEW_OPTION,
) -> pd.DataFrame:
    """
    Scrape all groups listed in groups.txt.
    Combines results into a single DataFrame.
    """
    if urls is None:
        urls = load_group_urls()

    all_dfs = []
    for url in urls:
        df = scrape_group(url, limit, view_option)
        all_dfs.append(df)

    combined = pd.concat(all_dfs, ignore_index=True)
    print(f"\n[DONE] Total scraped: {len(combined)} posts from {len(urls)} group(s)")
    return combined


def save_raw(df: pd.DataFrame, path: str = config.RAW_CSV) -> None:
    """Save the raw scraped DataFrame to CSV."""
    df.to_csv(path, index=False)
    print(f"[SAVE] Saved raw data -> {path}")


if __name__ == "__main__":
    import os
    os.makedirs(config.DATA_DIR, exist_ok=True)

    df = scrape_all_groups()
    save_raw(df)
