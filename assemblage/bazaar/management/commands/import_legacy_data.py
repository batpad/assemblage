import sqlite3
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from assemblage.bazaar.models import Item, Market
from assemblage.settings import PROJECT_ROOT


class Command(BaseCommand):
    help = 'Import legacy data from converted MySQL database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source-db',
            default='assemblage_production.db',
            help='Source database file (default: assemblage_production.db)'
        )
        parser.add_argument(
            '--import-users',
            action='store_true',
            help='Import user accounts'
        )
        parser.add_argument(
            '--import-markets',
            action='store_true',
            help='Import markets'
        )
        parser.add_argument(
            '--import-items',
            action='store_true',
            help='Import items'
        )

    def handle(self, *args, **options):
        source_db = os.path.join(PROJECT_ROOT, options['source_db'])
        
        if not os.path.exists(source_db):
            self.stdout.write(self.style.ERROR(f'Source database not found: {source_db}'))
            return

        conn = sqlite3.connect(source_db)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            if options['import_users']:
                self.import_users(cursor)
            
            if options['import_markets']:
                self.import_markets(cursor)
                
            if options['import_items']:
                self.import_items(cursor)
                
        finally:
            conn.close()

    @transaction.atomic
    def import_users(self, cursor):
        self.stdout.write('Importing users...')
        
        cursor.execute("""
            SELECT username, email, password, first_name, last_name, 
                   is_staff, is_active, is_superuser, last_login, date_joined
            FROM auth_user
            WHERE username != 'admin'  -- Skip admin to avoid conflicts
        """)
        
        imported = 0
        skipped = 0
        
        for row in cursor.fetchall():
            username = row['username']
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(f'  Skipping existing user: {username}')
                skipped += 1
                continue
            
            # Create new user
            user = User.objects.create(
                username=username,
                email=row['email'] or '',
                password=row['password'],  # Already hashed
                first_name=row['first_name'] or '',
                last_name=row['last_name'] or '',
                is_staff=row['is_staff'],
                is_active=row['is_active'],
                is_superuser=row['is_superuser'],
                last_login=row['last_login'],
                date_joined=row['date_joined']
            )
            
            self.stdout.write(f'  Imported user: {username} (ID: {user.id})')
            imported += 1
        
        self.stdout.write(self.style.SUCCESS(f'Users: {imported} imported, {skipped} skipped'))

    @transaction.atomic
    def import_markets(self, cursor):
        self.stdout.write('Importing markets...')
        
        cursor.execute("SELECT * FROM bazaar_market")
        imported = 0
        
        for row in cursor.fetchall():
            market, created = Market.objects.get_or_create(
                name=row['name'],
                defaults={
                    'city': row['city']
                }
            )
            
            if created:
                self.stdout.write(f'  Imported market: {market.name}')
                imported += 1
            else:
                self.stdout.write(f'  Skipping existing market: {market.name}')
        
        self.stdout.write(self.style.SUCCESS(f'Markets: {imported} imported'))

    @transaction.atomic  
    def import_items(self, cursor):
        self.stdout.write('Importing items...')
        
        cursor.execute("""
            SELECT * FROM bazaar_item
            ORDER BY id
        """)
        
        imported = 0
        skipped = 0
        
        for row in cursor.fetchall():
            title = row['title']
            
            # Check if item already exists
            if Item.objects.filter(title=title).exists():
                self.stdout.write(f'  Skipping existing item: {title}')
                skipped += 1
                continue
            
            # Get user by username (since IDs might be different)
            user = None
            if row['user_id']:
                user_cursor = cursor.execute(
                    "SELECT username FROM auth_user WHERE id = ?", 
                    (row['user_id'],)
                )
                user_row = user_cursor.fetchone()
                if user_row:
                    try:
                        user = User.objects.get(username=user_row['username'])
                    except User.DoesNotExist:
                        self.stdout.write(f'  Warning: User not found for item {title}')
            
            # Get market by name
            market = None
            if row['market_id']:
                market_cursor = cursor.execute(
                    "SELECT name FROM bazaar_market WHERE id = ?",
                    (row['market_id'],)
                )
                market_row = market_cursor.fetchone()
                if market_row:
                    try:
                        market = Market.objects.get(name=market_row['name'])
                    except Market.DoesNotExist:
                        self.stdout.write(f'  Warning: Market not found for item {title}')
            
            # Create item
            item = Item.objects.create(
                title=title,
                slug=row['slug'] or '',
                description=row['description'] or '',
                utility=row['utility'] or '',
                utility_url=row['utility_url'] or '',
                significance=row['significance'] or '',
                image_courtesy=row['image_courtesy'] or '',
                width=row['width'],
                published=bool(row['published']),
                is_assemblage=bool(row['is_assemblage']),
                is_fragment=bool(row['is_fragment']),
                new_imaginations=row['new_imaginations'] or '',
                image=row['image'] or '',
                user=user,
                market=market,
                created=row['created'],
                changed=row['changed']
            )
            
            self.stdout.write(f'  Imported item: {title} (ID: {item.id})')
            imported += 1
        
        self.stdout.write(self.style.SUCCESS(f'Items: {imported} imported, {skipped} skipped'))