import math

import torch
from torch import nn


class SelfAttention(nn.Module):
    def __init__(self, embed_dim):
        super().__init__()
        self.query = nn.Linear(embed_dim, embed_dim)
        self.key = nn.Linear(embed_dim, embed_dim)
        self.value = nn.Linear(embed_dim, embed_dim)

    def forward(self, x):
        query = self.query(x)
        key = self.key(x)
        value = self.value(x)

        scores = torch.matmul(query, key.transpose(-2, -1)) / math.sqrt(query.size(-1))
        weights = torch.softmax(scores, dim=-1)
        return torch.matmul(weights, value)


class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, hidden_dim):
        super().__init__()
        self.attn = SelfAttention(embed_dim)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.ff = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, embed_dim),
        )
        self.norm2 = nn.LayerNorm(embed_dim)

    def forward(self, x):
        x = self.norm1(x + self.attn(x))
        x = self.norm2(x + self.ff(x))
        return x


class MiniTransformer(nn.Module):
    def __init__(self, vocab_size, embed_dim=128, hidden_dim=512, num_layers=4):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.layers = nn.ModuleList(
            TransformerBlock(embed_dim, hidden_dim) for _ in range(num_layers)
        )
        self.fc = nn.Linear(embed_dim, vocab_size)

    def forward(self, input_ids):
        x = self.embedding(input_ids)

        for layer in self.layers:
            x = layer(x)

        return self.fc(x)
