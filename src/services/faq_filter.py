import re

# List of conversational filler and common greetings to ignore
STOP_WORDS = {
    "hi", "hello", "hey", "sup", "yo", "good morning", "good afternoon",
    "good evening", "thanks", "thank you", "bye", "goodbye", "test",
    "ok", "okay", "help", "please", "cool", "nice", "yes", "no"
}

def normalize_query(query: str) -> str:
    """Normalizes query string (lowercased, trimmed, punctuation stripped)."""
    if not query:
        return ""
    # Strip punctuation using regex and trim whitespace
    cleaned = re.sub(r'[^\w\s]', '', query)
    return cleaned.lower().strip()

def is_faq_candidate(raw_query: str) -> bool:
    """Validates whether a prompt qualifies to be tracked as a potential FAQ candidate."""
    if not raw_query or not isinstance(raw_query, str):
        return False

    clean = normalize_query(raw_query)

    # Rule 1: Must be at least 15 characters long
    if len(clean) < 15:
        return False

    # Rule 2: Must contain at least 4 words
    words = clean.split()
    if len(words) < 4:
        return False

    # Rule 3: Reject exact stop-word matches
    if clean in STOP_WORDS:
        return False

    # Rule 4: Reject if query starts with a common greeting and is too short
    first_word = words[0]
    if first_word in {"hi", "hello", "hey"} and len(words) < 4:
        return False

    return True
