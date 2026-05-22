import re


PROFANITY_WORDS = [
    "asshole",
    "bastard",
    "bitch",
    "bullshit",
    "cunt",
    "dick",
    "fucker",
    "fucking",
    "fuck",
    "motherfucker",
    "pussy",
    "shit",
    "slut",
    "whore",
    "cacat",
    "căcat",
    "futu",
    "futui",
    "fututi",
    "muie",
    "pizda",
    "pizdă",
    "pula",
    "pulă",
]

PROFANITY_PATTERN = re.compile(
    r"\b("
    + "|".join(re.escape(word) for word in sorted(PROFANITY_WORDS, key=len, reverse=True))
    + r")\b",
    re.IGNORECASE,
)


def mask_profanity(value):
    if not isinstance(value, str) or not value:
        return value

    return PROFANITY_PATTERN.sub(lambda match: "*" * len(match.group(0)), value)
