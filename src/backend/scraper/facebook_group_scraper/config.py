"""
config.py — Central configuration for the Facebook Real Estate Pipeline.

All API keys, URLs, model settings, file paths, and prompts live here.
"""
import os
from dotenv import load_dotenv

# Override existing env vars (e.g. from Node process) with local .env
load_dotenv(override=True)

# ----------------------------------------------
#  API Keys (loaded from .env)
# ----------------------------------------------
APIFY_TOKEN = os.getenv("APIFY_TOKEN_FB")

GROQ_API_KEYS = [
    os.getenv("GROQ_API_KEY_1"),
    os.getenv("GROQ_API_KEY_2"),
]
# Which key to use (0 = first, 1 = second)
ACTIVE_GROQ_KEY = GROQ_API_KEYS[1]

# ----------------------------------------------
#  Groq / LLM Settings
# ----------------------------------------------
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"
LLM_TEMPERATURE = 0
API_DELAY_SECONDS = 1  # delay between API calls to avoid rate limits

# ----------------------------------------------
#  Scraper Settings
# ----------------------------------------------
APIFY_ACTOR_ID = "2chN8UQcH1CfxLRNE"
RESULTS_LIMIT = 20
VIEW_OPTION = "TOP_POSTS"

# ----------------------------------------------
#  File Paths
# ----------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

GROUPS_FILE = os.path.join(BASE_DIR, "groups.txt")
RAW_CSV = os.path.join(DATA_DIR, "raw_listings.csv")
EXTRACTED_CSV = os.path.join(DATA_DIR, "extracted_listings.csv")

# ----------------------------------------------
#  Output Schema
# ----------------------------------------------
EXPECTED_COLUMNS = [
    "TITLE", "LOCALITY", "TYPE", "BHK", "AREA",
    "PRICE", "AMENITIES", "SELLER", "STATUS", "CREATED_AT",
    "CONTACT", "GROUP_URL",
]

# ----------------------------------------------
#  LLM Extraction Prompt
# ----------------------------------------------
EXTRACTION_PROMPT = """You are a real estate data extractor. Given a Facebook group listing, extract the following fields. Return ONLY a JSON object with these keys. Use "-" if a field cannot be determined.

Fields:
- TITLE: Use the provided title. Clean it if necessary.
- LOCALITY: Extract the locality from location or description text.
- TYPE: Property type if mentioned (Apartment, Flat, Villa, Plot, Independent house, Builder floor, etc.). "-" if not mentioned.
- BHK: Number before "BHK" (e.g. "3 BHK" -> 3). "-" if not mentioned.
- AREA: Area in square feet (numeric value only). "-" if not mentioned.
- PRICE: Numeric property price. Remove commas and currency symbols. "-" if not available.
- AMENITIES: List of amenities mentioned (parking, gym, swimming pool, security, lift, garden, clubhouse, etc.). "-" if none.
- SELLER: Seller info (builder name, broker, owner). "-" if not present.
- STATUS: Classify as ready_to_move, under_construction, or resale if mentioned. "-" if not mentioned.
- CREATED_AT: Listing creation date if mentioned. "-" if not present.
- CONTACT: Extract phone numbers, WhatsApp numbers, or email addresses. "-" if not present.

Return ONLY valid JSON. No markdown, no explanation."""
