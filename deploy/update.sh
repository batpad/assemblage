#!/bin/bash

# Quick update script for Assemblage Django application
# Use this for code updates after initial deployment

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
VENV_DIR="${PROJECT_DIR}/venv"

# Function to print status
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as correct user
if [ "$(whoami)" != "$APP_USER" ]; then
    print_error "This script must be run as the $APP_USER user"
    echo "Usage: sudo -u $APP_USER $0"
    exit 1
fi

print_status "Starting update for Assemblage Django application"

# Change to project directory
cd $PROJECT_DIR

# Pull latest code from git (if git repository)
if [ -d ".git" ]; then
    print_status "Pulling latest code from repository..."
    git pull origin main || git pull origin master
else
    print_warning "Not a git repository, skipping code pull"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source $VENV_DIR/bin/activate

# Install/update dependencies
if [ -f "requirements.txt" ]; then
    print_status "Installing/updating Python dependencies..."
    pip install -r requirements.txt
fi

# Run database migrations
print_status "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput --clear

# Compile messages (if using internationalization)
if [ -d "locale" ]; then
    print_status "Compiling translation messages..."
    python manage.py compilemessages || print_warning "Failed to compile messages"
fi

# Clear cache (if applicable)
print_status "Clearing cache..."
python manage.py shell -c "from django.core.cache import cache; cache.clear()" 2>/dev/null || print_warning "No cache to clear"

# Reload Gunicorn gracefully
print_status "Reloading Gunicorn..."
sudo systemctl reload gunicorn

# Optional: Restart Gunicorn (use if reload doesn't work)
# sudo systemctl restart gunicorn

# Test if site is responding
print_status "Testing site response..."
sleep 2
if curl -f -s -o /dev/null http://localhost; then
    print_status "Site is responding correctly"
else
    print_warning "Site may not be responding correctly, check logs"
fi

# Show service status
print_status "Checking service status..."
sudo systemctl status gunicorn.socket --no-pager --lines=0

print_status "Update completed successfully!"

echo ""
echo -e "${GREEN}Update Summary:${NC}"
echo "- Code updated from repository"
echo "- Dependencies installed/updated"
echo "- Database migrations applied"
echo "- Static files collected"
echo "- Gunicorn reloaded"
echo ""
echo -e "${YELLOW}If you encounter issues:${NC}"
echo "- Check Gunicorn logs: sudo journalctl -u gunicorn -n 50"
echo "- Check Nginx logs: tail -f ${APP_HOME}/logs/nginx-error.log"
echo "- Check Django logs: tail -f ${APP_HOME}/logs/django-error.log"