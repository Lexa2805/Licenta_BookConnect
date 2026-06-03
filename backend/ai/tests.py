import re

from ai.generator import decode, encode, run_ai


def words(text):
    return re.findall(r"[A-Za-z']+", text.lower())


def test_corectare_greseala_de_timp_verbal():
    result = run_ai("She go to school yesterday", "correct")

    assert "went" in result.lower()
    assert "go to school" not in result.lower()


def test_continuare_text_are_lungime_minima_si_nu_repeta_inputul():
    prompt = "The old library opened its doors as rain touched the windows"

    result = run_ai(prompt, "continue")

    assert len(encode(result)) >= 15
    assert result.strip() != prompt


def test_tokenizare_round_trip_pastreaza_majoritatea_cuvintelor():
    text = "The quick brown fox jumps over the lazy dog"

    reconstructed = decode(encode(text))
    original_words = words(text)
    reconstructed_words = set(words(reconstructed))
    preserved_words = [word for word in original_words if word in reconstructed_words]

    assert len(preserved_words) / len(original_words) >= 0.8
