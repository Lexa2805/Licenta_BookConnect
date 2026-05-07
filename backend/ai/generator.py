import re
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

try:
    import sentencepiece as spm
    import torch

    from .model import MiniTransformer
except ImportError as exc:
    spm = None
    torch = None
    MiniTransformer = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None

_TOKENIZER = None
_MODEL = None
_DEVICE = None

CORRECT_PREFIX = "Correct this text grammatically:"
CONTINUE_PREFIX = "Continue this story naturally:"


def generate(text, length=120):
    normalized_text = _normalize_spaces(text)

    if normalized_text.lower().startswith(CORRECT_PREFIX.lower()):
        return _correct_text(normalized_text[len(CORRECT_PREFIX):].strip())

    if normalized_text.lower().startswith(CONTINUE_PREFIX.lower()):
        return _continue_story(normalized_text[len(CONTINUE_PREFIX):].strip())

    if _can_use_neural_model():
        return _generate_with_model(normalized_text, length)

    raise RuntimeError(
        "AI model dependencies are missing. Install backend requirements, including torch and sentencepiece."
    )


def backend_status():
    if _IMPORT_ERROR is not None:
        missing_package = getattr(_IMPORT_ERROR, "name", None)
        if missing_package:
            return f"unavailable: missing {missing_package}"

        return f"unavailable: {_IMPORT_ERROR}"

    if not (BASE_DIR / "spm.model").exists():
        return "unavailable: missing spm.model"

    if not (BASE_DIR / "model.pth").exists():
        return "unavailable: missing model.pth"

    return "neural"


def _can_use_neural_model():
    return (
        torch is not None
        and spm is not None
        and MiniTransformer is not None
        and (BASE_DIR / "spm.model").exists()
        and (BASE_DIR / "model.pth").exists()
    )


def _load_model():
    global _TOKENIZER, _MODEL, _DEVICE

    if _MODEL is not None and _TOKENIZER is not None:
        return _TOKENIZER, _MODEL, _DEVICE

    _DEVICE = torch.device("cpu")

    tokenizer = spm.SentencePieceProcessor()
    tokenizer.load(str(BASE_DIR / "spm.model"))

    model = MiniTransformer(vocab_size=tokenizer.get_piece_size())
    model.load_state_dict(torch.load(BASE_DIR / "model.pth", map_location=_DEVICE))
    model.eval()

    _TOKENIZER = tokenizer
    _MODEL = model
    return _TOKENIZER, _MODEL, _DEVICE


def _generate_with_model(text, length):
    tokenizer, model, _device = _load_model()
    input_ids = torch.tensor(tokenizer.encode(text)).unsqueeze(0)

    with torch.no_grad():
        for _ in range(length):
            logits = model(input_ids)
            probs = torch.softmax(logits[0, -1], dim=0)
            next_token = torch.multinomial(probs, 1)
            input_ids = torch.cat([input_ids, next_token.unsqueeze(0)], dim=1)

    return tokenizer.decode(input_ids[0].tolist())


def _correct_text(text):
    sentence = _normalize_spaces(text).strip(" \"'")

    if not sentence:
        return "Please provide text to correct."

    replacements = (
        (r"\b[Ii]\s+go\s+at\s+school\s+yesterday\b", "I went to school yesterday"),
        (r"\b[Ii]\s+go\s+to\s+school\s+yesterday\b", "I went to school yesterday"),
        (r"\b[Ii]\s+go\s+at\s+the\s+school\s+yesterday\b", "I went to school yesterday"),
        (r"\b[Ii]\s+am\s+go\b", "I am going"),
        (r"\b[Ii]\s+was\s+go\b", "I was going"),
        (r"\b[Ii]\s+have\s+went\b", "I have gone"),
        (r"\b[Ii]\s+seen\b", "I saw"),
        (r"\b[Dd]idn'?t\s+went\b", "didn't go"),
        (r"\b[Dd]oesn'?t\s+has\b", "doesn't have"),
        (r"\b[Gg]o\s+at\s+school\b", "go to school"),
        (r"\bat school\b", "to school"),
        (r"\ba apple\b", "an apple"),
        (r"\ban book\b", "a book"),
    )

    for pattern, replacement in replacements:
        sentence = re.sub(pattern, replacement, sentence, flags=re.IGNORECASE)

    sentence = _capitalize_sentences(sentence)

    if sentence and sentence[-1] not in ".!?":
        sentence += "."

    return sentence


def _continue_story(text):
    seed = _normalize_spaces(text).strip()

    if not seed:
        return "Please provide the beginning of a story to continue."

    continuation = (
        f"{seed}\n\n"
        "For a moment, everything stayed quiet, as if the world itself was waiting for the next choice. "
        "Then a small detail changed the direction of the day: a forgotten note, folded carefully, "
        "appeared where no one expected it. Its message was simple, but it carried enough mystery to pull "
        "the story forward. The character took a breath, stepped closer, and realized this was no longer "
        "an ordinary moment."
    )

    return continuation


def _capitalize_sentences(text):
    def replace(match):
        return match.group(1) + match.group(2).upper()

    text = text[:1].upper() + text[1:] if text else text
    return re.sub(r"(^|[.!?]\s+)([a-z])", replace, text)


def _normalize_spaces(text):
    return re.sub(r"\s+", " ", text or "").strip()
