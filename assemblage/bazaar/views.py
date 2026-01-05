# Create your views here.
import json
from decimal import Decimal
from os.path import join, exists

try:
    import Image
except ImportError:
    from PIL import Image

from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate, logout
from django.views.generic.edit import UpdateView
from django.db.models import Q
from django.core.paginator import Paginator, InvalidPage, EmptyPage

from taggit.models import Tag
from .models import *
from assemblage.settings import MEDIA_ROOT, TMP_FOLDER
from assemblage.utils import render_to_json_response, http_file_response

def item_detail(request, slug):
    item = get_object_or_404(Item, slug=slug)
    return render(request, "item_detail.html", {'item': item, 'can_edit': item.can_edit(request.user)})

def item_detail_by_id(request, id):
    item = get_object_or_404(Item, pk=id)
    return render(request, "item_detail.html", {'item': item, 'can_edit': item.can_edit(request.user)})    


def index(request):
    return render(request, "index.html", {})

class EditItemView(UpdateView):
    '''
    , {'model': Item, 'slug_field': 'slug', 'template_name': 'edit_item.html'}
    '''
    model = Item
    slug_field = 'slug'
    template_name = 'edit_item.html'
    
    def get_queryset(self):
        base_qs = super(EditItemView, self).get_queryset()
        if not self.request.user.is_superuser:
            return base_qs.filter(user=self.request.user)
        else:
            return base_qs

@csrf_exempt
def signup(request):
    username = request.POST.get("username", None)
    password = request.POST.get("password", None)
    password2 = request.POST.get("password2", None)
    email = request.POST.get("email", None)
    if not username or not password or not password2:
        return render_to_json_response({'error': 'insufficient data'})
    if User.objects.filter(username=username).count() > 0:
        return render_to_json_response({'error': 'Username exists'})
    if password != password2:
        return render_to_json_response({'error': 'Passwords do not match'})
    u = User()
    u.username = username
    u.set_password(password)
    if email:
        u.email = email
    u.save()
    user = authenticate(username=username, password=password)
    login(request, user)
    return render_to_json_response({'success': 'User logged in', 'id': user.id})


def signout(request):
    logout(request)
    return render_to_json_response({'success': 'User logged out'})


@csrf_exempt
def signin(request):
    username = request.POST.get("username", "")
    password = request.POST.get("password", "")
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return render_to_json_response({'success': 'User logged in', 'id': user.id})
    return render_to_json_response({'error': 'Username / password do not match'})


def get_user(request):
    if request.user.is_authenticated:
        return render_to_json_response({
            'user': {
                'id': request.user.id,
                'username': request.user.username
            }
        })
    else:
        return render_to_json_response({
            'user': None
        })


def get_apps(request):
    if not request.user.is_authenticated():
        return render_to_json_response({'error': 'User not logged in'})
    user = request.user
    apps = App.objects.filter(user=user)
    return render_to_json_response([a.get_dict() for a in apps])


def items_json(request):
    qset = Item.objects.exclude(published=False)
    tag = request.GET.get('tag', '')
    typ = request.GET.get('type', None)	
    q = request.GET.get('q', None)
    q_field = request.GET.get('q_field', None)
    user_id = request.GET.get('user', None)
    city = request.GET.get('city', None)
    market_id = request.GET.get('market', None)
    sort = request.GET.get('sort', None)    
    page_size = int(request.GET.get("page_size", 50))
    page = int(request.GET.get("page", 1))
    if q and not q_field:
        qset = qset.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(utility__icontains=q) | Q(utility_url__icontains=q) | Q(significance__icontains=q) | Q(image_courtesy__icontains=q) | Q(new_imaginations__icontains=q))

    if q and q_field:
        d = {
            q_field + "__icontains": q
        }
        qset = qset.filter(**d)

    if tag != '':
        t = Tag.objects.get(name=tag)
        tagged_items = t.items.all()
        ids = [ti.object_id for ti in tagged_items]
        qset = qset.filter(id__in=ids)

    if typ and typ != 'all':
        if typ == 'fragments':
            qset = qset.filter(is_fragment=True)
        elif typ == 'assemblages':
            qset = qset.filter(is_assemblage=True)
        elif typ == 'objects':
            qset = qset.filter(is_assemblage=False).filter(is_fragment=False)

    if user_id:
        qset = qset.filter(user__id=user_id)
    
    if city:
        if city == 'other':
            qset = qset.filter(market=None)
        else:
            qset = qset.filter(market__city=city)             

    if market_id:
        qset = qset.filter(market__id=market_id)

    #FIXME add q search
    if sort: #FIXME add validation for sort fields
        qset = qset.order_by(sort)
        
#    query = request.GET.get(q, '')    
    paginator = Paginator(qset, page_size)
    try:
        results = paginator.page(page)
    except:
        results = {'object_list': []}
    d = {}
    d['total_pages'] = paginator.num_pages
    d['items'] = [item.get_dict() for item in results.object_list]
    
    return render_to_json_response(d)


def get_image(request, id, width):
    item = get_object_or_404(Item, pk=id)

    im = item.get_image(width)
    resized_path = im.storage.path(im.name)
    rotate = int(request.GET.get("rotate", 0))
    if rotate:
        rotated_path = resized_path + "." + str(rotate) + ".png"
        if not exists(rotated_path):
            img = Image.open(resized_path)
            rotated_img = img.rotate(rotate, resample=Image.BICUBIC, expand=True)
            rotated_img.save(rotated_path)
        resized_path = rotated_path             
    return http_file_response(resized_path, "image/png")


def create_app(request):
    app = App()
    if request.user.is_authenticated:
        app.user = request.user
    else:
        app.user = None
    app.save()
    return HttpResponseRedirect('/build/%d' % app.id)


def name_available(request):
    name_to_check = request.GET.get("name", "")
    if App.exists(name_to_check):
        return HttpResponse("0")
    else:
        return HttpResponse("1")

def export_name_available(request):
    name_to_check = request.GET.get("name", "")
    if Item.exists(name_to_check):
        return HttpResponse("0")
    else:
        return HttpResponse("1")

@csrf_exempt
def save_app(request):
    title = request.POST.get("title", False)
    fabric_data = request.POST.get("fabric", False)
    if not title or not fabric_data:
        return render_to_json_response({'error': 'Insufficient data to save', 'code': 0})
    if not request.user.is_authenticated():
        return render_to_json_response({'error': 'User not logged in', 'code': 1})
    app, created = App.objects.get_or_create(name=title)
    if created:
        app.user = request.user
    if app.user != request.user:
        return render_to_json_response({'error': 'User does not have permissions on this canvas', 'code': 2})
    app.data = fabric_data
    app.save()
    return render_to_json_response({'success': app.get_absolute_url()})
    

def load_app(request, id=None):
    data = {}
    if id:
        app = get_object_or_404(App, id=id)
        if request.user.id != app.user.id:
            return HttpResponse("you do not have permissions to do this")
        data['app'] = app
    data['tags'] = Tag.objects.all()
    data['cities'] = LOCATION_CHOICES
    
    return render(request, "app.html", data)

@csrf_exempt
def export_item(request):
    title = request.POST.get("title", False)
    size = request.POST.get("size", False)
    data_uri = request.POST.get("data_uri", False)
    items = [int(it) for it in json.loads(request.POST.get("items", "[]"))]
    if not title or not size or not data_uri:
        return render_to_json_response({'error': "Insufficient data to save", 'code': 0})
    item = Item()
    i = item.save_from_data_uri(title, data_uri)
    i.width = Decimal(size)
    i.user = request.user
    i.parent_items.add(*items)
    i.save()

    if i:
        return render_to_json_response(i.get_dict())
    else:
        return render_to_json_response({'error': 'Error while saving', 'code': 1})

def export_csv(request):
    qset = Item.objects.all()
    from export import export
    return export(qset)

def build(request, id):
    app = get_object_or_404(App, pk=id)
    return render(request, "testjamie.html", {
        'app': app,
        'tags': Tag.objects.all()
    })


