import posixpath

from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename


def save_uploaded_file(uploaded_file, folder, request=None):
    if not uploaded_file:
        return None

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
