# Deployment Guide for Assemblage Django Application

This comprehensive guide will walk you through deploying the Assemblage Django application on a VPS (Virtual Private Server) using Ubuntu 22.04 or later.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial VPS Setup](#initial-vps-setup)
3. [Application Deployment](#application-deployment)
4. [SSL Certificate Setup](#ssl-certificate-setup)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Security Recommendations](#security-recommendations)

## Prerequisites

### VPS Requirements
- Ubuntu 22.04 LTS or later
- Minimum 1GB RAM (2GB recommended)
- 20GB disk space minimum
- Root or sudo access
- A domain name pointing to your VPS IP (for SSL)

### Local Requirements
- SSH client
- Git (if using repository)

## Initial VPS Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your-server-ip
```

### Step 2: Run the VPS Setup Script

Upload the setup script to your server and run it:

```bash
# Upload the setup script (from your local machine)
scp deploy/setup_vps.sh root@your-server-ip:/root/

# On the VPS, make it executable and run
chmod +x /root/setup_vps.sh
./setup_vps.sh
```

This script will:
- Update system packages
- Install Python, Nginx, and required dependencies
- Create the `assemblage` user
- Setup firewall rules
- Create necessary directories
- Configure log rotation

### Step 3: Upload Your Code

If using Git:
```bash
# Switch to assemblage user
sudo -u assemblage -i

# Clone your repository
cd /home/assemblage
git clone https://github.com/your-username/assemblage.git
```

If uploading manually:
```bash
# From your local machine
scp -r * assemblage@your-server-ip:/home/assemblage/assemblage/
```

## Application Deployment

### Step 1: Configure Environment Variables

```bash
# Switch to assemblage user
sudo -u assemblage -i

# Copy the environment template
cp /home/assemblage/assemblage/deploy/config/.env.example /home/assemblage/assemblage/.env

# Edit the environment file
nano /home/assemblage/assemblage/.env
```

Required configurations:
- `SECRET_KEY`: Generate a strong secret key
- `ALLOWED_HOSTS`: Add your domain and server IP
- `DEBUG`: Set to `False` for production

To generate a secret key:
```python
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Step 2: Run the Deployment Script

```bash
# As assemblage user
sudo -u assemblage /home/assemblage/assemblage/deploy/deploy.sh
```

This script will:
- Setup Python virtual environment
- Install dependencies
- Run database migrations
- Collect static files
- Configure and start Gunicorn
- Configure Nginx

### Step 3: Update Nginx Configuration

Edit the Nginx configuration with your domain:

```bash
sudo nano /etc/nginx/sites-available/assemblage
```

Replace `your-domain.com` with your actual domain name.

Test and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate Setup

### Using Let's Encrypt (Recommended)

```bash
# Install certbot if not already installed
sudo apt install certbot python3-certbot-nginx -y

# Obtain and install certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

The certificate will auto-renew. Test renewal:
```bash
sudo certbot renew --dry-run
```

## Post-Deployment Configuration

### Create Django Superuser

```bash
sudo -u assemblage -i
cd /home/assemblage/assemblage
source venv/bin/activate
python manage.py createsuperuser
```

### Configure Email (Optional)

Edit `.env` file to add email settings for error notifications:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Setup Automatic Backups

The backup script is already configured to run daily at 2 AM. To run manually:

```bash
sudo -u assemblage /home/assemblage/assemblage/deploy/backup.sh
```

## Maintenance

### Updating the Application

For code updates:
```bash
sudo -u assemblage /home/assemblage/assemblage/deploy/update.sh
```

### Manual Service Management

```bash
# Check service status
sudo systemctl status gunicorn
sudo systemctl status nginx

# Restart services
sudo systemctl restart gunicorn
sudo systemctl restart nginx

# View logs
sudo journalctl -u gunicorn -n 50
tail -f /home/assemblage/logs/nginx-error.log
tail -f /home/assemblage/logs/gunicorn-error.log
```

### Database Backup and Restore

Backup:
```bash
sudo -u assemblage /home/assemblage/assemblage/deploy/backup.sh
```

Restore (from backup directory):
```bash
# Stop application
sudo systemctl stop gunicorn

# Restore database
gunzip /home/assemblage/backups/db_assemblage_YYYYMMDD_HHMMSS.db.gz
cp /home/assemblage/backups/db_assemblage_YYYYMMDD_HHMMSS.db /home/assemblage/assemblage/assemblage/assemblage.db

# Set permissions
sudo chown assemblage:assemblage /home/assemblage/assemblage/assemblage/assemblage.db

# Start application
sudo systemctl start gunicorn
```

## Troubleshooting

### Common Issues and Solutions

#### 502 Bad Gateway Error

1. Check if Gunicorn is running:
```bash
sudo systemctl status gunicorn
```

2. Check socket file exists:
```bash
ls -la /run/gunicorn/
```

3. Check logs:
```bash
sudo journalctl -u gunicorn -n 50
```

#### Static Files Not Loading

1. Verify static files collected:
```bash
ls -la /home/assemblage/static/
```

2. Re-collect static files:
```bash
sudo -u assemblage -i
cd /home/assemblage/assemblage
source venv/bin/activate
python manage.py collectstatic --noinput
```

#### Permission Denied Errors

Fix file permissions:
```bash
sudo chown -R assemblage:assemblage /home/assemblage/assemblage
sudo chown -R assemblage:www-data /home/assemblage/media
sudo chown -R assemblage:www-data /home/assemblage/static
```

#### Database Locked Error (SQLite)

This can occur under high load. Consider:
1. Switching to PostgreSQL for production
2. Implementing database connection pooling
3. Adding retry logic in Django settings

### Checking Application Health

```bash
# Test Gunicorn directly
curl --unix-socket /run/gunicorn/assemblage.sock http://localhost

# Test Nginx
curl -I http://your-domain.com

# Check disk space
df -h

# Check memory usage
free -m

# Check running processes
ps aux | grep gunicorn
```

## Security Recommendations

### Essential Security Measures

1. **Change SSH Port** (optional but recommended):
```bash
sudo nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222 (or another port)
sudo systemctl restart sshd
```

2. **Setup SSH Key Authentication**:
```bash
# On your local machine
ssh-copy-id assemblage@your-server-ip

# On the server, disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

3. **Configure Fail2ban**:
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

4. **Regular Updates**:
```bash
# Setup automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

5. **Monitor Logs**:
```bash
# Check authentication attempts
sudo tail -f /var/log/auth.log

# Check Nginx access
tail -f /home/assemblage/logs/nginx-access.log
```

### Django Security Checklist

Run Django's security check:
```bash
sudo -u assemblage -i
cd /home/assemblage/assemblage
source venv/bin/activate
python manage.py check --deploy
```

Address any warnings or errors reported.

## Performance Optimization

### Gunicorn Workers

Adjust workers in `/etc/systemd/system/gunicorn.service`:
- Formula: `(2 × CPU cores) + 1`
- For 2 CPU cores: 5 workers

### Nginx Caching

Add caching headers for static files (already configured in nginx.conf).

### Database Optimization

For SQLite:
```python
# In production_settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'assemblage.db',
        'OPTIONS': {
            'timeout': 20,
            'check_same_thread': False,
            'journal_mode': 'wal',  # Write-Ahead Logging
        }
    }
}
```

## Monitoring

### Setup Basic Monitoring

1. **Disk Space Alert**:
```bash
# Add to crontab
0 */6 * * * df -h | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{ print $5 " " $1 }' | while read output; do echo $output | awk '{ print $1}' | sed 's/%//' | awk '{ if($1 > 80) print "Disk Space Alert: " $2 " is " $1 "%"; }'
```

2. **Service Health Check**:
```bash
# Create health check script
cat > /home/assemblage/health_check.sh << 'EOF'
#!/bin/bash
if ! systemctl is-active --quiet gunicorn; then
    echo "Gunicorn is down, attempting restart..."
    sudo systemctl restart gunicorn
fi
EOF

chmod +x /home/assemblage/health_check.sh
# Add to crontab: */5 * * * * /home/assemblage/health_check.sh
```

## Support and Resources

- Django Documentation: https://docs.djangoproject.com/
- Gunicorn Documentation: https://docs.gunicorn.org/
- Nginx Documentation: https://nginx.org/en/docs/
- Ubuntu Server Guide: https://ubuntu.com/server/docs

## Quick Command Reference

```bash
# Service Management
sudo systemctl {start|stop|restart|status} gunicorn
sudo systemctl {start|stop|restart|status} nginx

# Logs
sudo journalctl -u gunicorn -f  # Follow Gunicorn logs
tail -f /home/assemblage/logs/nginx-error.log  # Follow Nginx errors

# Django Management
sudo -u assemblage -i
cd /home/assemblage/assemblage && source venv/bin/activate
python manage.py migrate
python manage.py collectstatic
python manage.py createsuperuser

# Updates
sudo -u assemblage /home/assemblage/assemblage/deploy/update.sh

# Backup
sudo -u assemblage /home/assemblage/assemblage/deploy/backup.sh
```

---

**Note**: This guide assumes a single-server deployment. For high-traffic applications, consider:
- Load balancing with multiple application servers
- Separate database server (PostgreSQL/MySQL)
- CDN for static files
- Redis for caching and sessions
- Container orchestration (Docker/Kubernetes)