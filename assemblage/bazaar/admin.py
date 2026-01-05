from django.contrib import admin
from .models import *
from sorl.thumbnail.admin import AdminImageMixin

class ItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'width', 'published', 'created', 'user')
    list_editable = ('width', 'published')
    list_filter = ('published', 'is_assemblage', 'is_fragment')
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created', 'changed')


admin.site.register(Item, ItemAdmin)
admin.site.register(Market)
