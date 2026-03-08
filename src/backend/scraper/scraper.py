"""
Scraper entry point — registry-based dispatch.
Usage:
  python scraper.py --scraper magicbricks-direct --city mumbai --limit 10
  python scraper.py --list-scrapers
"""

import argparse
import json
import sys
from registry import list_scrapers, get_scraper


def main():
    parser = argparse.ArgumentParser(description='Modular real estate listing scraper.')
    parser.add_argument('--scraper', type=str, default='magicbricks-direct',
                        help='Scraper to use (run --list-scrapers to see available)')
    parser.add_argument('--city', type=str, help='City to scrape (e.g., mumbai, delhi, hyderabad)')
    parser.add_argument('--limit', type=int, default=10, help='Max number of listings to scrape')
    parser.add_argument('--token', type=str, default=None, help='Apify API token (for Apify scrapers)')
    parser.add_argument('--zenrows-key', type=str, default=None, help='ZenRows API key (for ZenRows scrapers)')
    parser.add_argument('--list-scrapers', action='store_true', help='List all available scrapers and exit')

    args = parser.parse_args()

    # List scrapers mode
    if args.list_scrapers:
        scrapers = list_scrapers()
        print(json.dumps(scrapers, indent=2))
        return

    # Validate required args
    if not args.city:
        parser.error("--city is required when scraping (not using --list-scrapers)")

    # Get scraper
    scraper_entry = get_scraper(args.scraper)
    if not scraper_entry:
        available = [s["name"] for s in list_scrapers()]
        print(json.dumps({"error": f"Unknown scraper '{args.scraper}'. Available: {available}"}), file=sys.stderr)
        sys.exit(1)

    # Build kwargs based on what the scraper needs
    kwargs = {}
    if scraper_entry["needs_token"] == "apify":
        kwargs["token"] = args.token
    elif scraper_entry["needs_token"] == "zenrows":
        kwargs["zenrows_key"] = args.zenrows_key

    try:
        listings = scraper_entry["fn"](args.city, args.limit, **kwargs)
        # Output JSON to stdout so Node.js can capture it
        print(json.dumps(listings))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
