import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from ai.generator import run_ai


@csrf_exempt
def generate_text(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests are allowed."}, status=405)

    try:
        data = json.loads(request.body)
        text = data.get("text", "")
        mode = data.get("mode", "continue")

        result = run_ai(text, mode)
        return JsonResponse({"result": result})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)