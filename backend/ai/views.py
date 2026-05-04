import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def generate_text(request):
    if request.method == "GET":
        sample_text = request.GET.get("text", "Once upon a time")
        return _generate_response(sample_text)

    if request.method != "POST":
        response = JsonResponse(
            {"error": "Only POST requests are allowed."},
            status=405,
        )
        response["Allow"] = "GET, POST"
        return response

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    text = data.get("text")
    if not isinstance(text, str) or not text.strip():
        return JsonResponse(
            {"error": "Field 'text' is required and must be a non-empty string."},
            status=400,
        )

    return _generate_response(text)


def _generate_response(text):
    try:
        from ai.generator import generate
    except ModuleNotFoundError as exc:
        return JsonResponse(
            {"error": f"Missing AI dependency: {exc.name}. Install backend requirements."},
            status=503,
        )
    except ImportError as exc:
        return JsonResponse({"error": f"AI generator import failed: {exc}"}, status=503)

    try:
        return JsonResponse({"result": generate(text)})
    except Exception as exc:
        return JsonResponse({"error": f"Text generation failed: {exc}"}, status=500)
