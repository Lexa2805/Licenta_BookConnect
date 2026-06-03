import json
import re
from difflib import SequenceMatcher
from pathlib import Path

import sentencepiece as spm
import torch
import torch.nn.functional as F

from .model import MiniGPT


BASE_DIR = Path(__file__).resolve().parent

MODEL_CORRECT_PATH = BASE_DIR / "model_correct.pth"
MODEL_CONTINUE_PATH = BASE_DIR / "model_continue.pth"


CONFIG_CORRECT_PATH = BASE_DIR / "model_config_v3.json"
CONFIG_CONTINUE_PATH = BASE_DIR / "model_config_v3.json"

TOKENIZER_PATH = BASE_DIR / "spm_v3.model"

device = torch.device("cpu")


def load_config(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


config_correct = load_config(CONFIG_CORRECT_PATH)
config_continue = load_config(CONFIG_CONTINUE_PATH)

sp = spm.SentencePieceProcessor()
sp.load(str(TOKENIZER_PATH))


def encode(text: str):
    return sp.encode(text, out_type=int)


def decode(ids):
    return sp.decode(ids)


def _normalize_spaces(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    return text


def _capitalize_sentence(text: str) -> str:
    if not text:
        return text

    text = re.sub(r"\bi\b", "I", text)
    chars = list(text)
    capitalize_next = True

    for index, char in enumerate(chars):
        if char.isalpha() and capitalize_next:
            chars[index] = char.upper()
            capitalize_next = False
        elif char in ".!?":
            capitalize_next = True
        elif not char.isspace():
            capitalize_next = False

    return "".join(chars)


def _finish_sentence(text: str) -> str:
    if text and text[-1].isalnum():
        return f"{text}."
    return text


def _to_ing(verb: str) -> str:
    irregular = {
        "be": "being",
        "die": "dying",
        "lie": "lying",
        "run": "running",
        "sit": "sitting",
        "swim": "swimming",
    }
    lower = verb.lower()
    if lower in irregular:
        return irregular[lower]
    if lower.endswith("ie"):
        return f"{lower[:-2]}ying"
    if lower.endswith("e") and lower not in {"see", "be"}:
        return f"{lower[:-1]}ing"
    return f"{lower}ing"


def _third_person(verb: str) -> str:
    lower = verb.lower()
    irregular = {
        "be": "is",
        "do": "does",
        "go": "goes",
        "have": "has",
    }
    if lower in irregular:
        return irregular[lower]
    if lower.endswith("y") and len(lower) > 1 and lower[-2] not in "aeiou":
        return f"{lower[:-1]}ies"
    if lower.endswith(("s", "sh", "ch", "x", "z", "o")):
        return f"{lower}es"
    return f"{lower}s"


PAST_TENSE_VERBS = {
    "am": "was",
    "is": "was",
    "are": "were",
    "be": "was",
    "begin": "began",
    "bring": "brought",
    "buy": "bought",
    "come": "came",
    "do": "did",
    "drink": "drank",
    "eat": "ate",
    "feel": "felt",
    "find": "found",
    "get": "got",
    "give": "gave",
    "go": "went",
    "goes": "went",
    "has": "had",
    "have": "had",
    "hear": "heard",
    "keep": "kept",
    "know": "knew",
    "leave": "left",
    "make": "made",
    "meet": "met",
    "read": "read",
    "run": "ran",
    "say": "said",
    "see": "saw",
    "sees": "saw",
    "sleep": "slept",
    "speak": "spoke",
    "take": "took",
    "tell": "told",
    "think": "thought",
    "write": "wrote",
}

PAST_MARKER_RE = re.compile(
    r"\b(yesterday|last\s+(?:night|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|"
    r"\d+\s+(?:minute|hour|day|week|month|year)s?\s+ago)\b",
    re.IGNORECASE,
)


def _apply_past_marker_rules(text: str) -> str:
    if not PAST_MARKER_RE.search(text):
        return text

    verb_pattern = re.compile(r"\b(" + "|".join(sorted(PAST_TENSE_VERBS, key=len, reverse=True)) + r")\b", re.IGNORECASE)

    def replace(match: re.Match[str]) -> str:
        prefix = text[max(0, match.start() - 4) : match.start()].lower()
        if prefix.endswith("to "):
            return match.group(0)
        return PAST_TENSE_VERBS[match.group(0).lower()]

    return verb_pattern.sub(replace, text, count=1)


def correct_text_locally(text: str) -> str:
    """Conservative grammar cleanup for correction mode.

    The trained correction model is tiny and can drift into unrelated completions.
    These deterministic rules cover common student-writing mistakes and provide a
    safe fallback when generated text is not a plausible correction.
    """

    corrected = _normalize_spaces(text)

    replacements = [
        (r"\bgoing\s+to\s+home\b", "going home"),
        (r"\bgo\s+to\s+home\b", "go home"),
        (r"\bwent\s+to\s+home\b", "went home"),
        (r"\b(I|you|we|they)\s+has\b", r"\1 have"),
        (r"\b(he|she|it)\s+have\b", r"\1 has"),
        (r"\b(I)\s+(?:is|are)\b", r"\1 am"),
        (r"\b(you|we|they)\s+is\b", r"\1 are"),
        (r"\b(he|she|it)\s+are\b", r"\1 is"),
        (r"\b(this|that)\s+are\b", r"\1 is"),
        (r"\b(these|those)\s+is\b", r"\1 are"),
    ]

    for pattern, replacement in replacements:
        corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)

    corrected = re.sub(
        r"\b(is|am|are|was|were)\s+(go|come|make|write|read|eat|see|do|work|play|study|live|look|try|run|walk|talk)\b",
        lambda match: f"{match.group(1)} {_to_ing(match.group(2))}",
        corrected,
        flags=re.IGNORECASE,
    )

    corrected = re.sub(
        r"\b(he|she|it)\s+(go|do|have|make|like|love|want|need|work|play|study|live|look|try|read|write|eat|see)\b",
        lambda match: f"{match.group(1)} {_third_person(match.group(2))}",
        corrected,
        flags=re.IGNORECASE,
    )

    corrected = _apply_past_marker_rules(corrected)

    corrected = re.sub(r"\ba\s+([aeiouAEIOU]\w*)", r"an \1", corrected)
    corrected = re.sub(r"\ban\s+([^aeiouAEIOU\W]\w*)", r"a \1", corrected)

    return _finish_sentence(_capitalize_sentence(_normalize_spaces(corrected)))


def _strip_model_artifacts(text: str) -> str:
    cleaned = text.strip().strip("\"'")
    cleaned = cleaned.split("<END>")[0].strip()

    for marker in ("Correct:", "Continue:", "=>"):
        if marker in cleaned:
            cleaned = cleaned.split(marker)[0].strip()

    return _finish_sentence(_capitalize_sentence(_normalize_spaces(cleaned)))


def _word_set(text: str) -> set[str]:
    return set(re.findall(r"[A-Za-z']+", text.lower()))


def _word_sequence(text: str) -> list[str]:
    return re.findall(r"[A-Za-z']+", text.lower())


def is_plausible_correction(source: str, candidate: str) -> bool:
    if not candidate:
        return False
    if any(marker in candidate for marker in ("Correct:", "Continue:", "=>", "<END>")):
        return False

    source_words = _word_set(source)
    candidate_words = _word_set(candidate)
    if not source_words or not candidate_words:
        return False

    source_count = len(re.findall(r"[A-Za-z']+", source))
    candidate_count = len(re.findall(r"[A-Za-z']+", candidate))
    if candidate_count > max(source_count * 2 + 6, 14):
        return False

    overlap = len(source_words & candidate_words) / max(len(source_words), 1)
    similarity = SequenceMatcher(None, source.lower(), candidate.lower()).ratio()
    return overlap >= 0.45 or similarity >= 0.55


def load_model(model_path: Path, config: dict) -> MiniGPT:
    model = MiniGPT(
        vocab_size=config["vocab_size"],
        block_size=config["block_size"],
        n_embd=config["n_embd"],
        n_head=config["n_head"],
        n_layer=config["n_layer"],
        dropout=config["dropout"],
    ).to(device)

    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.eval()
    return model


model_correct = load_model(MODEL_CORRECT_PATH, config_correct)
model_continue = load_model(MODEL_CONTINUE_PATH, config_continue)


@torch.no_grad()
def generate_with_model(
    model: MiniGPT,
    prompt: str,
    block_size: int,
    max_new_tokens: int,
    temperature: float,
    top_k: int,
    repetition_penalty: float,
    stop_markers: list[str],
    sample: bool = True,
) -> str:
    prompt_ids = encode(prompt)
    ids = torch.tensor(prompt_ids, dtype=torch.long, device=device)[None, :]
    prompt_len = len(prompt_ids)

    for _ in range(max_new_tokens):
        idx_cond = ids[:, -block_size:]
        logits = model(idx_cond)
        logits = logits[:, -1, :]

        recent_tokens = ids[0].tolist()[-40:]
        for token in set(recent_tokens):
            logits[0, token] /= repetition_penalty

        logits = logits / temperature

        if top_k is not None:
            values, _ = torch.topk(logits, min(top_k, logits.size(-1)))
            logits[logits < values[:, [-1]]] = -float("inf")

        if sample:
            probs = F.softmax(logits, dim=-1)
            next_id = torch.multinomial(probs, num_samples=1)
        else:
            next_id = torch.argmax(logits, dim=-1, keepdim=True)

        ids = torch.cat((ids, next_id), dim=1)

        completion = decode(ids[0, prompt_len:].tolist())

        if "<END>" in completion:
            return completion.split("<END>")[0].strip()

        for marker in stop_markers:
            if marker in completion:
                return completion.split(marker)[0].strip()

    return decode(ids[0, prompt_len:].tolist()).strip()


def run_ai(text: str, mode: str) -> str:
    cleaned = text.strip()

    if mode == "correct":
        local_correction = correct_text_locally(cleaned)
        if _word_sequence(local_correction) != _word_sequence(cleaned):
            return local_correction

        prompt = f"Correct: {cleaned} =>"
        generated = generate_with_model(
            model=model_correct,
            prompt=prompt,
            block_size=config_correct["block_size"],
            max_new_tokens=40,
            temperature=1.0,
            top_k=None,
            repetition_penalty=1.03,
            stop_markers=["Correct:", "Continue:"],
            sample=False,
        )
        model_correction = _strip_model_artifacts(generated)

        if is_plausible_correction(cleaned, model_correction):
            return model_correction

        return local_correction

    prompt = f"Continue: {cleaned} =>"
    return generate_with_model(
        model=model_continue,
        prompt=prompt,
        block_size=config_continue["block_size"],
        max_new_tokens=220,
        temperature=0.72,
        top_k=30,
        repetition_penalty=1.10,
        stop_markers=["Continue:", "Correct:"],
    )
