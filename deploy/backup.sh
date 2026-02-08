#!/bin/bash

# Backup script for Assemblage Django application
# Creates backups of database and media files

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="assemblage"
APP_USER="assemblage"
APP_HOME="/home/${APP_USER}"
PROJECT_DIR="${APP_HOME}/${PROJECT_NAME}"
BACKUP_DIR="${APP_HOME}/backups"
MEDIA_DIR="${APP_HOME}/media"
DB_FILE="${PROJECT_DIR}/assemblage/assemblage.db"

# Backup retention (days)
RETENTION_DAYS=30

# Date format for backup files
DATE=$(date +%Y%m%d_%H%M%S)
READABLE_DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Function to print messages
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to calculate file size in human readable format
human_size() {
    local size=$1
    if [ $size -gt 1073741824 ]; then
        echo "$(echo "scale=2; $size/1073741824" | bc) GB"
    elif [ $size -gt 1048576 ]; then
        echo "$(echo "scale=2; $size/1048576" | bc) MB"
    elif [ $size -gt 1024 ]; then
        echo "$(echo "scale=2; $size/1024" | bc) KB"
    else
        echo "$size bytes"
    fi
}

# Check if running as correct user
if [ "$(whoami)" != "$APP_USER" ]; then
    print_error "This script must be run as the $APP_USER user"
    echo "Usage: sudo -u $APP_USER $0"
    exit 1
fi

print_status "Starting backup for Assemblage Django application"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    print_status "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
fi

# Backup SQLite database
if [ -f "$DB_FILE" ]; then
    print_status "Backing up SQLite database..."
    
    # Create backup with integrity check
    sqlite3 "$DB_FILE" ".backup '${BACKUP_DIR}/db_${PROJECT_NAME}_${DATE}.db'"
    
    # Compress the backup
    print_status "Compressing database backup..."
    gzip "${BACKUP_DIR}/db_${PROJECT_NAME}_${DATE}.db"
    
    DB_BACKUP_SIZE=$(stat -c%s "${BACKUP_DIR}/db_${PROJECT_NAME}_${DATE}.db.gz" 2>/dev/null || stat -f%z "${BACKUP_DIR}/db_${PROJECT_NAME}_${DATE}.db.gz" 2>/dev/null)
    print_status "Database backup created: db_${PROJECT_NAME}_${DATE}.db.gz ($(human_size $DB_BACKUP_SIZE))"
else
    print_warning "Database file not found at $DB_FILE"
fi

# Backup media files
if [ -d "$MEDIA_DIR" ] && [ "$(ls -A $MEDIA_DIR)" ]; then
    print_status "Backing up media files..."
    
    # Create tar archive of media files
    tar -czf "${BACKUP_DIR}/media_${PROJECT_NAME}_${DATE}.tar.gz" -C "$APP_HOME" media/
    
    MEDIA_BACKUP_SIZE=$(stat -c%s "${BACKUP_DIR}/media_${PROJECT_NAME}_${DATE}.tar.gz" 2>/dev/null || stat -f%z "${BACKUP_DIR}/media_${PROJECT_NAME}_${DATE}.tar.gz" 2>/dev/null)
    print_status "Media backup created: media_${PROJECT_NAME}_${DATE}.tar.gz ($(human_size $MEDIA_BACKUP_SIZE))"
else
    print_warning "No media files to backup or media directory not found"
fi

# Backup environment file
if [ -f "${PROJECT_DIR}/.env" ]; then
    print_status "Backing up environment configuration..."
    cp "${PROJECT_DIR}/.env" "${BACKUP_DIR}/env_${PROJECT_NAME}_${DATE}.env"
    print_status "Environment backup created: env_${PROJECT_NAME}_${DATE}.env"
fi

# Create backup manifest
print_status "Creating backup manifest..."
cat > "${BACKUP_DIR}/manifest_${DATE}.txt" << EOF
Backup Manifest
===============
Date: $READABLE_DATE
Project: $PROJECT_NAME
Host: $(hostname)

Files Created:
EOF

if [ -f "${BACKUP_DIR}/db_${PROJECT_NAME}_${DATE}.db.gz" ]; then
    echo "- db_${PROJECT_NAME}_${DATE}.db.gz ($(human_size $DB_BACKUP_SIZE))" >> "${BACKUP_DIR}/manifest_${DATE}.txt"
fi

if [ -f "${BACKUP_DIR}/media_${PROJECT_NAME}_${DATE}.tar.gz" ]; then
    echo "- media_${PROJECT_NAME}_${DATE}.tar.gz ($(human_size $MEDIA_BACKUP_SIZE))" >> "${BACKUP_DIR}/manifest_${DATE}.txt"
fi

if [ -f "${BACKUP_DIR}/env_${PROJECT_NAME}_${DATE}.env" ]; then
    echo "- env_${PROJECT_NAME}_${DATE}.env" >> "${BACKUP_DIR}/manifest_${DATE}.txt"
fi

# Clean up old backups
print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."

# Count files before cleanup
BEFORE_COUNT=$(find "$BACKUP_DIR" -type f \( -name "*.db.gz" -o -name "*.tar.gz" -o -name "*.env" \) | wc -l)

# Remove old database backups
find "$BACKUP_DIR" -name "db_${PROJECT_NAME}_*.db.gz" -mtime +$RETENTION_DAYS -delete

# Remove old media backups
find "$BACKUP_DIR" -name "media_${PROJECT_NAME}_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Remove old env backups
find "$BACKUP_DIR" -name "env_${PROJECT_NAME}_*.env" -mtime +$RETENTION_DAYS -delete

# Remove old manifests
find "$BACKUP_DIR" -name "manifest_*.txt" -mtime +$RETENTION_DAYS -delete

# Count files after cleanup
AFTER_COUNT=$(find "$BACKUP_DIR" -type f \( -name "*.db.gz" -o -name "*.tar.gz" -o -name "*.env" \) | wc -l)
DELETED_COUNT=$((BEFORE_COUNT - AFTER_COUNT))

if [ $DELETED_COUNT -gt 0 ]; then
    print_status "Removed $DELETED_COUNT old backup file(s)"
fi

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
print_status "Total backup directory size: $TOTAL_SIZE"

# Optional: Sync to remote storage (uncomment and configure as needed)
# if command -v rclone &> /dev/null; then
#     print_status "Syncing to remote storage..."
#     rclone sync "$BACKUP_DIR" remote:backups/${PROJECT_NAME}/ --progress
#     print_status "Remote sync completed"
# fi

print_status "Backup completed successfully!"

# Create restore instructions
if [ ! -f "${BACKUP_DIR}/RESTORE_INSTRUCTIONS.md" ]; then
    cat > "${BACKUP_DIR}/RESTORE_INSTRUCTIONS.md" << 'EOF'
# Restore Instructions

## Database Restore

To restore a database backup:

```bash
# Stop the application
sudo systemctl stop gunicorn

# Decompress the backup
gunzip db_assemblage_YYYYMMDD_HHMMSS.db.gz

# Backup current database (just in case)
cp /home/assemblage/assemblage/assemblage/assemblage.db /home/assemblage/assemblage/assemblage/assemblage.db.before_restore

# Restore the database
cp db_assemblage_YYYYMMDD_HHMMSS.db /home/assemblage/assemblage/assemblage/assemblage.db

# Set correct permissions
chown assemblage:assemblage /home/assemblage/assemblage/assemblage/assemblage.db
chmod 644 /home/assemblage/assemblage/assemblage/assemblage.db

# Start the application
sudo systemctl start gunicorn
```

## Media Files Restore

To restore media files:

```bash
# Extract media files
tar -xzf media_assemblage_YYYYMMDD_HHMMSS.tar.gz -C /home/assemblage/

# Set correct permissions
chown -R assemblage:assemblage /home/assemblage/media/
```

## Environment File Restore

To restore environment configuration:

```bash
# Backup current .env
cp /home/assemblage/assemblage/.env /home/assemblage/assemblage/.env.before_restore

# Restore .env file
cp env_assemblage_YYYYMMDD_HHMMSS.env /home/assemblage/assemblage/.env

# Set correct permissions
chown assemblage:assemblage /home/assemblage/assemblage/.env
chmod 600 /home/assemblage/assemblage/.env

# Restart application
sudo systemctl restart gunicorn
```
EOF
    print_status "Restore instructions created at ${BACKUP_DIR}/RESTORE_INSTRUCTIONS.md"
fi

echo ""
echo -e "${GREEN}Backup Summary:${NC}"
echo "Location: $BACKUP_DIR"
echo "Database: $([ -f "${BACKUP_DIR}/db_${PROJECT_NAME}_${DATE}.db.gz" ] && echo "✓" || echo "✗")"
echo "Media: $([ -f "${BACKUP_DIR}/media_${PROJECT_NAME}_${DATE}.tar.gz" ] && echo "✓" || echo "✗")"
echo "Environment: $([ -f "${BACKUP_DIR}/env_${PROJECT_NAME}_${DATE}.env" ] && echo "✓" || echo "✗")"
echo "Retention: $RETENTION_DAYS days"
echo ""
echo "For restore instructions, see: ${BACKUP_DIR}/RESTORE_INSTRUCTIONS.md"