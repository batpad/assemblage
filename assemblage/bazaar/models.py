from django.db import models
from taggit.managers import TaggableManager
from sorl.thumbnail import ImageField, get_thumbnail
from django.template.defaultfilters import slugify
from django.core.files import File
import os
import re
from os.path import basename, join
from django.contrib.auth.models import User
try:
    import Image
except:
    from PIL import Image
from decimal import Decimal
import datetime
from assemblage.settings import TMP_FOLDER


LOCATION_CHOICES = (
    ('mumbai', 'Mumbai'),
    ('london', 'London'),
)

class Market(models.Model):
    name = models.CharField(max_length=512)
    city = models.CharField(max_length=256, choices=LOCATION_CHOICES)
    
    def __str__(self):
        return self.city + ": " + self.name

class Item(models.Model):
    tags = TaggableManager()
    changed = models.DateTimeField(null=True, editable=False)
    created = models.DateTimeField(null=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, editable=False)
    is_assemblage = models.BooleanField(default=False, editable=False)
    is_fragment = models.BooleanField(default=False)
    image = ImageField(upload_to='uploads/items/', help_text="Upload image of object")
    width = models.DecimalField(max_digits=8, decimal_places=3, help_text="Width of object, in cm", blank=True, null=True)
#    image_oshash = models.CharField(max_length=64, blank=True)
    market = models.ForeignKey(Market, on_delete=models.SET_NULL, blank=True, null=True)
#    markets = models.ManyToManyField(Market, editable=False, related_name='child_items') #This field is used to cache markets item is part of, derived from parent items

#    location = models.CharField(choices=LOCATION_CHOICES, default="mumbai", max_length=64)
    title = models.CharField(max_length=255, help_text="A title for this object", unique=True)
    slug = models.SlugField(editable=False)
    # tags field is now handled by TaggableManager above
    description = models.TextField(blank=True, help_text="Some description for the object (optional)")
    utility = models.TextField(blank=True, help_text="Definition / Relevance")
    utility_url = models.URLField(blank=True, max_length=1024, help_text="URL with definition (wiki link, etc)")
    significance = models.TextField(blank=True, help_text="Personal history / Travelogue:journey of an object")
    image_courtesy = models.CharField(max_length=512, help_text="name of contributor", blank=True)
    new_imaginations = models.TextField(blank=True, editable=False) #only for assemblaged objects
    published = models.BooleanField(default=True)
    #image_height = models.IntegerField()
    #image_width = models.IntegerField()

    parent_items = models.ManyToManyField("Item", editable=False, related_name="child_items")    

#    height_field = models.IntegerField()
#    width_field = models.IntegerField()    
    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return '/item/%d' % self.id

    def can_edit(self, user):
        if user.is_superuser or self.user == user:
            return True
        else:
            return False

    @classmethod
    def exists(kls, name):
        if kls.objects.filter(title=name).count() > 0:
            return True
        else:
            return False

    def save_from_data_uri(self, title, data_uri):
        if Item.objects.filter(title=title).count() > 0:
            return False
        self.title = title
        self.is_assemblage = True
        imgstr = re.search(r'base64,(.*)', data_uri).group(1)
        filename = slugify(title) + ".png"
        tmp_path = join(TMP_FOLDER, filename)
        fil = open(tmp_path, "wb")
        import base64
        fil.write(base64.b64decode(imgstr))
        fil.close()    
        f = File(open(tmp_path))
        
        self.image.save(filename, f)
        self.save()
        #fil.close()
        return self


    def get_dict(self):
        if self.market:
            market_name = self.market.name
        else:
            market_name = 'Unknown'
        img = Image.open(self.image.path)
        width_px = img.size[0]
        height_px = img.size[1]
        return {
            'id': self.id,
            'hires': self.image.url,
            'image_url': self.get_image('800').url,
            'width': str(self.width) if self.width else "5.000",
            'title': self.title,
            'market': market_name,
            'details_url': self.get_absolute_url(),
            'width_px': width_px,
            'height_px': height_px,
            'published': self.published,
            'thumb300': self.get_image('300').url,
            'thumb100': get_thumbnail(self.image, "100x100").url
        }

    def get_image(self, width):
        im = get_thumbnail(self.image, width, quality=99)
        return im               

    def get_size_cms(self):
        width = self.width
        if not width:
            return {'width': 10, 'height': 10}
        image_size = Image.open(self.image.file).size
        aspect_ratio = Decimal(image_size[0]) / Decimal(image_size[1])
        height = width / aspect_ratio
        return {'width': width, 'height': height}        

#        image_width = self.        

    def save(self, *args, **kwargs):
        #super(Item, self).save(self, *args, **kwargs)
        slug = slugify(self.title)
        while Item.objects.exclude(id=self.id).filter(slug=slug).count() > 0:
            slug += "_x"
        self.slug = slug
        if not self.id:
            self.created = datetime.datetime.today()
        self.changed = datetime.datetime.today()
        if self.created == None:
            self.created = self.changed
        #import pdb
        #pdb.set_trace()
        super(Item, self).save(*args, **kwargs)        

    def admin_thumbnail(self):
        image_url = self.get_image('100').url
        return '<img src="%s" width="100" />' % image_url

    class Meta:
        ordering = ['is_assemblage', '-id']

    admin_thumbnail.short_description = "Thumbnail"
    admin_thumbnail.allow_tags = True


    
    @classmethod
    def add_from_path(cls, path):
        f = File(open(path))
        item = cls()
        title = basename(path)
        item.image.save(title, f)
        item.title = title
        item.save()

    @classmethod
    def addFiles(cls, folder_path):
        path = folder_path
#        path = join(UPLOAD_ROOT, folder_name)
  #  spider(path, addFile, category=category)
        for dirpath, dirnames, filenames in os.walk(path):
            if filenames:
  #            prefix = dirpath[len(path)+1:]
                for filename in filenames:
                    if filename.lower().endswith(".png"):
                        cls.add_from_path(join(dirpath, filename))


class App(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255, blank=True, unique=True, db_index=True)
    description = models.TextField(blank=True)
    data = models.TextField(blank=True)
    items = models.ManyToManyField(Item)
    created = models.DateTimeField()
    changed = models.DateTimeField()

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.id:
            self.created = datetime.datetime.today()
        self.changed = datetime.datetime.today()
        if self.created == None:
            self.created = self.changed
        super(App, self).save(*args, **kwargs)

    def get_absolute_url(self):
        return "/app/%d" % self.id
    
    def get_dict(self):
        return {
            'name': self.name,
            'url': self.get_absolute_url()
        }

    @classmethod
    def exists(kls, name):
        if kls.objects.filter(name=name).count() > 0:
            return True
        else:
            return False

