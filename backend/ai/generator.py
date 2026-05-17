import json
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

        probs = F.softmax(logits, dim=-1)
        next_id = torch.multinomial(probs, num_samples=1)
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
        prompt = f"Correct: {cleaned} =>"
        return generate_with_model(
            model=model_correct,
            prompt=prompt,
            block_size=config_correct["block_size"],
            max_new_tokens=40,
            temperature=0.35,
            top_k=10,
            repetition_penalty=1.03,
            stop_markers=["Correct:", "Continue:"],
        )

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