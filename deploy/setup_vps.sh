#!/bin/bash

# VPS Setup Script for Django Assemblage Project
# This script sets up a fresh Ubuntu VPS for Django deployment
# Run as root or with sudo

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

echo -e "${GREEN}Starting VPS Setup for Django Assemblage Project${NC}"

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
apt update
apt upgrade -y

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libpq-dev \
    postgresql \
    postgresql-contrib \
    nginx \
    curl \
    git \
    supervisor \
    ufw \
    certbot \
    python3-certbot-nginx \
    sqlite3 \
    libsqlite3-dev

# Create application user
echo -e "${YELLOW}Creating application user: ${APP_USER}${NC}"
if id "${APP_USER}" &>/dev/null; then
    echo -e "${GREEN}User ${APP_USER} already exists${NC}"
else
    adduser --system --group --disabled-password --home ${APP_HOME} ${APP_USER}
    echo -e "${GREEN}User ${APP_USER} created${NC}"
fi

# Setup directory structure
echo -e "${YELLOW}Setting up directory structure...${NC}"
mkdir -p ${PROJECT_DIR}
mkdir -p ${APP_HOME}/logs
mkdir -p ${APP_HOME}/backups
mkdir -p ${APP_HOME}/media
mkdir -p ${APP_HOME}/static

# Set proper permissions
chown -R ${APP_USER}:${APP_USER} ${APP_HOME}
chmod 751 ${APP_HOME}

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Install Python packages globally
echo -e "${YELLOW}Installing Python packages...${NC}"
pip3 install --upgrade pip
pip3 install virtualenv gunicorn

# Create virtual environment
echo -e "${YELLOW}Creating Python virtual environment...${NC}"
sudo -u ${APP_USER} python3 -m venv ${VENV_DIR}

# Create gunicorn directory for socket
mkdir -p /run/gunicorn
chown ${APP_USER}:www-data /run/gunicorn

# Setup log rotation
echo -e "${YELLOW}Setting up log rotation...${NC}"
cat > /etc/logrotate.d/assemblage << EOF
${APP_HOME}/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 ${APP_USER} ${APP_USER}
    sharedscripts
    postrotate
        systemctl reload gunicorn.socket >/dev/null 2>&1 || true
    endscript
}
EOF

# Create deployment info file
echo -e "${YELLOW}Creating deployment info...${NC}"
cat > ${APP_HOME}/deployment_info.txt << EOF
Deployment Information
======================
Project: ${PROJECT_NAME}
User: ${APP_USER}
Home: ${APP_HOME}
Project Directory: ${PROJECT_DIR}
Virtual Environment: ${VENV_DIR}
Logs: ${APP_HOME}/logs
Backups: ${APP_HOME}/backups
Media: ${APP_HOME}/media
Static: ${APP_HOME}/static

Created: $(date)
EOF

chown ${APP_USER}:${APP_USER} ${APP_HOME}/deployment_info.txt

# Create a simple backup script
echo -e "${YELLOW}Creating backup script...${NC}"
cat > ${APP_HOME}/backup_db.sh << 'EOF'
#!/bin/bash
# Simple database backup script
BACKUP_DIR="/home/assemblage/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/home/assemblage/assemblage/assemblage/assemblage.db"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "${BACKUP_DIR}/assemblage_${DATE}.db"
    # Keep only last 7 backups
    find ${BACKUP_DIR} -name "assemblage_*.db" -mtime +7 -delete
    echo "Backup created: assemblage_${DATE}.db"
else
    echo "Database file not found!"
fi
EOF

chmod +x ${APP_HOME}/backup_db.sh
chown ${APP_USER}:${APP_USER} ${APP_HOME}/backup_db.sh

# Setup cron for daily backups
echo -e "${YELLOW}Setting up cron for daily backups...${NC}"
(crontab -u ${APP_USER} -l 2>/dev/null; echo "0 2 * * * ${APP_HOME}/backup_db.sh >> ${APP_HOME}/logs/backup.log 2>&1") | crontab -u ${APP_USER} -

# System optimization for Django
echo -e "${YELLOW}Optimizing system for Django...${NC}"
cat >> /etc/sysctl.conf << EOF

# Django/Gunicorn optimization
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_max_orphans = 256
EOF

sysctl -p

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VPS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clone your repository to ${PROJECT_DIR}"
echo "2. Copy and configure the systemd service files"
echo "3. Configure Nginx"
echo "4. Run the deploy.sh script"
echo "5. Setup SSL with: certbot --nginx -d yourdomain.com"
echo ""
echo -e "${YELLOW}Important paths:${NC}"
echo "Project: ${PROJECT_DIR}"
echo "Virtual Environment: ${VENV_DIR}"
echo "Logs: ${APP_HOME}/logs"
echo "Static files: ${APP_HOME}/static"
echo "Media files: ${APP_HOME}/media"
echo ""
echo -e "${GREEN}Security reminder:${NC}"
echo "- Change the default SSH port"
echo "- Setup SSH key authentication"
echo "- Disable root login"
echo "- Configure fail2ban"