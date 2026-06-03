import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from ai.generator import run_ai


@csrf_exempt
def generate_text(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests are allowed."}, status=405)

    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Request body must be valid JSON."}, status=400)
        text = str(data.get("text", "")).strip()
        mode = data.get("mode", "continue")

        if not text:
            return JsonResponse({"error": "Text is required."}, status=400)

        if mode not in {"correct", "continue"}:
            return JsonResponse({"error": "Mode must be 'correct' or 'continue'."}, status=400)

        result = run_ai(text, mode)
        return JsonResponse({"result": result})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
