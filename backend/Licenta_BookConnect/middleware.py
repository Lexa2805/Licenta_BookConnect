"""
Custom middleware for the application.
"""


class XFrameOptionsExemptMiddleware:
    """
    Middleware to exempt media files from X-Frame-Options,
    allowing PDFs and other media to be displayed in iframes.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Mark media files as exempt from X-Frame-Options
        if request.path.startswith('/media/'):
            response.xframe_options_exempt = True
            # Also remove if it was already set
            if 'X-Frame-Options' in response:
                del response['X-Frame-Options']
        
        return response
