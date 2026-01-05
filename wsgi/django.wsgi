# django.wsgi for assemblage
import os
import sys
 
project_module = 'assemblage'

root_dir = os.path.normpath(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, project_module))

os.environ['DJANGO_SETTINGS_MODULE'] = project_module + '.settings'
 
from django.core.wsgi import get_wsgi_application
 
application = get_wsgi_application()
