from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from os.path import join

from assemblage.bazaar.views import EditItemView
from assemblage.bazaar import views

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Item editing
    re_path(r'^item/(?P<slug>.*)/edit$', EditItemView.as_view(), name='edit_item_view'),
    
    # Main views
    path('', views.index, name='index'),
    re_path(r'^item/(?P<id>\d+)$', views.item_detail_by_id, name='item_detail_by_id'),
    re_path(r'^item/(?P<slug>.*)$', views.item_detail, name='item_detail'),
    re_path(r'^build/(?P<id>\d+)$', views.build, name='build'),
    re_path(r'^(?P<id>\d+)/(?P<width>\d+).png$', views.get_image, name='get_image'),
    
    # API endpoints
    path('items_json/', views.items_json, name='items_json'),
    path('create_app/', views.create_app, name='create_app'),
    path('check_app_name/', views.name_available, name='name_available'),
    path('check_export_name/', views.export_name_available, name='export_name_available'),
    path('save_app/', views.save_app, name='save_app'),
    path('export_item/', views.export_item, name='export_item'),
    re_path(r'^app/(?P<id>\d+)$', views.load_app, name='load_app'),
    path('app', views.load_app, name='load_app_no_id'),
    path('get_user', views.get_user, name='get_user'),
    path('signup', views.signup, name='signup'),
    path('signin', views.signin, name='signin'),
    path('signout', views.signout, name='signout'),
    path('get_apps', views.get_apps, name='get_apps'),
    path('export_csv', views.export_csv, name='export_csv'),
    
    # Auth URLs
    path('account/', include('django.contrib.auth.urls')),
    
    # Static template views
    path('test', TemplateView.as_view(template_name='test.html'), name='test'),
    path('stage', TemplateView.as_view(template_name='stage.html'), name='stage'),
    path('itemdetail', TemplateView.as_view(template_name='item_detail.html'), name='itemdetail'),
    path('browse', TemplateView.as_view(template_name='browse.html'), name='browse'),
    path('testjamie', TemplateView.as_view(template_name='testjamie.html'), name='testjamie'),
    path('home', TemplateView.as_view(template_name='index.html'), name='home'),
    path('help', TemplateView.as_view(template_name='help.html'), name='help'),
    path('app2', TemplateView.as_view(template_name='app2.html'), name='app2'),
    path('app3', TemplateView.as_view(template_name='app3.html'), name='app3'),
]

# Serve media files in development
if settings.LOCAL_DEVELOPMENT:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

