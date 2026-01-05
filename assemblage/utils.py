"""
Utility functions to replace ox package dependencies
"""
import os
import mimetypes
from datetime import datetime, timedelta
from django.http import JsonResponse, FileResponse, Http404


def render_to_json_response(dictionary, status=200):
    """
    Replacement for ox.django.shortcuts.render_to_json_response
    """
    return JsonResponse(dictionary, status=status)


def http_file_response(path, content_type=None, filename=None):
    """
    Replacement for ox.django.http.HttpFileResponse
    """
    if not os.path.exists(path):
        raise Http404("File not found")
    
    if not content_type:
        content_type = mimetypes.guess_type(path)[0]
    if not content_type:
        content_type = 'application/octet-stream'
    
    response = FileResponse(
        open(path, 'rb'),
        content_type=content_type
    )
    
    if filename:
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    # Set expiration date
    expires = datetime.utcnow() + timedelta(days=1)
    response['Expires'] = expires.strftime("%a, %d-%b-%Y %H:%M:%S GMT")
    
    return response