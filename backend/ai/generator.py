import torch
import sentencepiece as spm
from pathlib import Path

from .model import MiniTransformer


BASE_DIR = Path(__file__).resolve().parent

# tokenizer
sp = spm.SentencePieceProcessor()
sp.load(str(BASE_DIR / "spm.model"))

def encode(s):
    return sp.encode(s)

def decode(l):
    return sp.decode(l)

# model
device = torch.device("cpu")

model = MiniTransformer(vocab_size=sp.get_piece_size())
model.load_state_dict(torch.load(BASE_DIR / "model.pth", map_location=device))
model.eval()

def generate(text, length=120):
    input_ids = torch.tensor(encode(text)).unsqueeze(0)

    for _ in range(length):
        logits = model(input_ids)
        probs = torch.softmax(logits[0, -1], dim=0)
        next_token = torch.multinomial(probs, 1)
        input_ids = torch.cat([input_ids, next_token.unsqueeze(0)], dim=1)

    return decode(input_ids[0].tolist())
