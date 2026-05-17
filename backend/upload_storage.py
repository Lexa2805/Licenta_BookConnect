import posixpath
import os
import time
import uuid
import hashlib
import mimetypes
import urllib.parse
import urllib.request

from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename


def _cloudinary_config():
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if not cloud_name or not api_key or not api_secret:
        return None
    return cloud_name, api_key, api_secret


def _sign_cloudinary_upload(params, api_secret):
    signature_base = "&".join(f"{key}={params[key]}" for key in sorted(params))
    return hashlib.sha1(f"{signature_base}{api_secret}".encode("utf-8")).hexdigest()


def _multipart_body(fields, files):
    boundary = f"----BookConnect{uuid.uuid4().hex}"
    chunks = []

    for name, value in fields.items():
        chunks.extend(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"),
                str(value).encode("utf-8"),
                b"\r\n",
            ]
        )

    for name, file_info in files.items():
        filename, content_type, content = file_info
        chunks.extend(
            [
                f"--{boundary}\r\n".encode("utf-8"),
                (
                    f'Content-Disposition: form-data; name="{name}"; '
                    f'filename="{filename}"\r\n'
                ).encode("utf-8"),
                f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"),
                content,
                b"\r\n",
            ]
        )

    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return boundary, b"".join(chunks)


def _encode_public_id(public_id):
    return "/".join(urllib.parse.quote(part) for part in public_id.split("/"))


def cloudinary_file_url(public_id, resource_type="image"):
    config = _cloudinary_config()
    if not config or not public_id:
        return None

    cloud_name, _, _ = config
    delivery_options = "f_auto,q_auto/" if resource_type == "image" else ""
    return f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{delivery_options}{_encode_public_id(public_id)}"


def cloudinary_image_url(public_id):
    return cloudinary_file_url(public_id, "image")


def _upload_to_cloudinary(uploaded_file, folder, resource_type="image"):
    config = _cloudinary_config()
    if not config:
        return None

    cloud_name, api_key, api_secret = config
    timestamp = str(int(time.time()))
    filename = get_valid_filename(uploaded_file.name or "upload")
    public_name = filename.rsplit(".", 1)[0] if resource_type == "image" else filename
    public_id = f"{uuid.uuid4().hex}-{public_name}"
    params = {
        "folder": folder,
        "public_id": public_id,
        "timestamp": timestamp,
    }
    signature = _sign_cloudinary_upload(params, api_secret)

    if hasattr(uploaded_file, "seek"):
        uploaded_file.seek(0)
    content = uploaded_file.read()
    content_type = (
        getattr(uploaded_file, "content_type", "")
        or mimetypes.guess_type(filename)[0]
        or "application/octet-stream"
    )

    boundary, body = _multipart_body(
        {
            "api_key": api_key,
            "timestamp": timestamp,
            "folder": folder,
            "public_id": public_id,
            "signature": signature,
        },
        {
            "file": (filename, content_type, content),
        },
    )
    request = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload",
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        import json

        data = json.loads(response.read().decode("utf-8"))

    return {
        "url": data.get("secure_url"),
        "path": None,
        "public_id": data.get("public_id"),
        "resource_type": data.get("resource_type") or resource_type,
        "original_filename": uploaded_file.name,
        "content_type": content_type,
        "size": getattr(uploaded_file, "size", 0) or len(content),
        "storage": "cloudinary",
    }


def save_uploaded_file(uploaded_file, folder, request=None):
    if not uploaded_file:
        return None

    content_type = getattr(uploaded_file, "content_type", "") or ""
    if content_type.startswith("image/"):
        cloudinary_info = _upload_to_cloudinary(uploaded_file, folder, "image")
        if cloudinary_info:
            return cloudinary_info
        raise RuntimeError("Cloudinary is not configured for image uploads.")

    if content_type == "application/pdf" or str(uploaded_file.name).lower().endswith(".pdf"):
        cloudinary_info = _upload_to_cloudinary(uploaded_file, folder, "raw")
        if cloudinary_info:
            return cloudinary_info
        raise RuntimeError("Cloudinary is not configured for PDF uploads.")

    filename = get_valid_filename(uploaded_file.name)
    storage_path = default_storage.save(posixpath.join(folder, filename), uploaded_file)
    url = default_storage.url(storage_path)
    if request is not None:
        url = request.build_absolute_uri(url)

    return {
        "url": url,
        "path": storage_path,
        "original_filename": uploaded_file.name,
        "content_type": getattr(uploaded_file, "content_type", "") or "",
        "size": getattr(uploaded_file, "size", 0) or 0,
    }
