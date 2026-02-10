
import argparse
import json
import sys
from parsers.magicbricks import get_magicbricks_listings

def main():
    parser = argparse.ArgumentParser(description='Scrape real estate listings.')
    parser.add_argument('--city', type=str, required=True, help='City to scrape (e.g., mumbai, delhi, hyderabad)')
    parser.add_argument('--limit', type=int, default=10, help='Max number of listings to scrape')
    
    args = parser.parse_args()
    
    try:
        listings = get_magicbricks_listings(args.city, args.limit)
        # Output JSON to stdout so Node.js can capture it
        print(json.dumps(listings))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
