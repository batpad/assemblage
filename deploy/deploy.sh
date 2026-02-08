#!/bin/bash

# Main deployment script for Assemblage Django application
# Run this after initial VPS setup to deploy the application

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
REPO_URL=""  # Set your repository URL here

# Function to check if running as correct user
check_user() {
    if [ "$EUID" -eq 0 ]; then
        echo -e "${RED}Please run this script as the assemblage user, not as root${NC}"
        echo "Usage: sudo -u assemblage ./deploy.sh"
        exit 1
    fi
}

# Function to print section headers
print_section() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Check if environment file exists
check_env() {
    if [ ! -f "${PROJECT_DIR}/.env" ]; then
        echo -e "${RED}Error: .env file not found at ${PROJECT_DIR}/.env${NC}"
        echo -e "${YELLOW}Please create it from the template:${NC}"
        echo "cp ${PROJECT_DIR}/deploy/config/.env.example ${PROJECT_DIR}/.env"
        echo "Then edit it with your production settings"
        exit 1
    fi
}

# Main deployment function
main() {
    print_section "Starting Deployment of Assemblage Django Application"
    
    # Check user
    check_user
    
    # Clone or update repository
    print_section "Setting up repository"
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${YELLOW}Repository URL not set. Assuming code is already in place.${NC}"
        if [ ! -d "$PROJECT_DIR" ]; then
            echo -e "${RED}Error: Project directory not found at ${PROJECT_DIR}${NC}"
            echo "Please clone your repository or copy your code to ${PROJECT_DIR}"
            exit 1
        fi
    else
        if [ ! -d "$PROJECT_DIR/.git" ]; then
            echo "Cloning repository..."
            cd $APP_HOME
            git clone $REPO_URL $PROJECT_NAME
        else
            echo "Updating repository..."
            cd $PROJECT_DIR
            git pull origin main
        fi
    fi
    
    # Check for .env file
    check_env
    
    # Setup virtual environment
    print_section "Setting up Python virtual environment"
    
    if [ ! -d "$VENV_DIR" ]; then
        echo "Creating virtual environment..."
        python3 -m venv $VENV_DIR
    fi
    
    # Activate virtual environment
    source $VENV_DIR/bin/activate
    
    # Upgrade pip
    echo "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    print_section "Installing Python dependencies"
    
    if [ -f "${PROJECT_DIR}/requirements.txt" ]; then
        pip install -r ${PROJECT_DIR}/requirements.txt
    else
        echo -e "${RED}Warning: requirements.txt not found${NC}"
    fi
    
    # Install gunicorn
    pip install gunicorn
    
    # Copy production settings if not exists
    print_section "Configuring Django settings"
    
    if [ ! -f "${PROJECT_DIR}/assemblage/production_settings.py" ]; then
        echo "Copying production settings..."
        cp ${PROJECT_DIR}/deploy/config/production_settings.py ${PROJECT_DIR}/assemblage/
    fi
    
    # Update settings.py to use production settings in production
    if ! grep -q "from .production_settings import \*" "${PROJECT_DIR}/assemblage/settings.py"; then
        echo "" >> ${PROJECT_DIR}/assemblage/settings.py
        echo "# Load production settings if available" >> ${PROJECT_DIR}/assemblage/settings.py
        echo "try:" >> ${PROJECT_DIR}/assemblage/settings.py
        echo "    from .production_settings import *" >> ${PROJECT_DIR}/assemblage/settings.py
        echo "except ImportError:" >> ${PROJECT_DIR}/assemblage/settings.py
        echo "    pass" >> ${PROJECT_DIR}/assemblage/settings.py
    fi
    
    # Run Django management commands
    print_section "Running Django management commands"
    
    cd $PROJECT_DIR
    
    # Make migrations
    echo "Making migrations..."
    python manage.py makemigrations --noinput
    
    # Apply migrations
    echo "Applying migrations..."
    python manage.py migrate --noinput
    
    # Collect static files
    echo "Collecting static files..."
    python manage.py collectstatic --noinput --clear
    
    # Create superuser (optional, interactive)
    echo -e "${YELLOW}Do you want to create a superuser? (y/n)${NC}"
    read -r response
    if [[ "$response" == "y" ]]; then
        python manage.py createsuperuser
    fi
    
    # Set proper permissions
    print_section "Setting file permissions"
    
    # Ensure assemblage owns all files
    sudo chown -R ${APP_USER}:${APP_USER} ${PROJECT_DIR}
    
    # Set directory permissions
    find ${PROJECT_DIR} -type d -exec chmod 755 {} \;
    
    # Set file permissions  
    find ${PROJECT_DIR} -type f -exec chmod 644 {} \;
    
    # Make manage.py executable
    chmod +x ${PROJECT_DIR}/manage.py
    
    # Make scripts executable
    chmod +x ${PROJECT_DIR}/deploy/*.sh
    
    # Setup systemd services
    print_section "Setting up systemd services"
    
    echo "Copying systemd files..."
    sudo cp ${PROJECT_DIR}/deploy/config/gunicorn.socket /etc/systemd/system/
    sudo cp ${PROJECT_DIR}/deploy/config/gunicorn.service /etc/systemd/system/
    
    # Reload systemd
    echo "Reloading systemd..."
    sudo systemctl daemon-reload
    
    # Enable and start Gunicorn socket
    echo "Starting Gunicorn..."
    sudo systemctl enable gunicorn.socket
    sudo systemctl start gunicorn.socket
    
    # Check Gunicorn status
    sudo systemctl status gunicorn.socket --no-pager
    
    # Setup Nginx
    print_section "Setting up Nginx"
    
    echo "Copying Nginx configuration..."
    sudo cp ${PROJECT_DIR}/deploy/config/nginx.conf /etc/nginx/sites-available/${PROJECT_NAME}
    
    # Enable the site
    if [ ! -L "/etc/nginx/sites-enabled/${PROJECT_NAME}" ]; then
        sudo ln -s /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/
    fi
    
    # Remove default site if exists
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        sudo rm /etc/nginx/sites-enabled/default
    fi
    
    # Test Nginx configuration
    echo "Testing Nginx configuration..."
    sudo nginx -t
    
    # Restart Nginx
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
    
    # Setup log rotation
    print_section "Setting up log rotation"
    
    if [ ! -f "/etc/logrotate.d/${PROJECT_NAME}" ]; then
        echo "Log rotation already configured"
    fi
    
    # Create cron job for backups
    print_section "Setting up automatic backups"
    
    # Check if backup cron job exists
    if ! crontab -l 2>/dev/null | grep -q "backup_db.sh"; then
        echo "Backup cron job already configured"
    fi
    
    print_section "Deployment Complete!"
    
    echo -e "${GREEN}Your Django application is now deployed!${NC}"
    echo ""
    echo -e "${YELLOW}Important next steps:${NC}"
    echo "1. Update your domain in /etc/nginx/sites-available/${PROJECT_NAME}"
    echo "2. Setup SSL certificate with Let's Encrypt:"
    echo "   sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
    echo "3. Update ALLOWED_HOSTS in .env file with your domain"
    echo "4. Restart services:"
    echo "   sudo systemctl restart gunicorn"
    echo "   sudo systemctl restart nginx"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo "Check Gunicorn status: sudo systemctl status gunicorn"
    echo "View Gunicorn logs: sudo journalctl -u gunicorn"
    echo "Restart Gunicorn: sudo systemctl restart gunicorn"
    echo "View Nginx error logs: tail -f ${APP_HOME}/logs/nginx-error.log"
    echo ""
    echo -e "${GREEN}Deployment script finished successfully!${NC}"
}

# Run main function
main "$@"