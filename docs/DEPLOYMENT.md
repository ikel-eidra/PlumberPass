# Deployment Guide

This guide covers various deployment options for PlumberPass.

## Table of Contents

- [Static Hosting (PWA Only)](#static-hosting-pwa-only)
- [Full Stack Deployment](#full-stack-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)

---

## Static Hosting (PWA Only)

The simplest deployment option - host only the PWA frontend.

### Option 1: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend/public
vercel --prod
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd frontend/public
netlify deploy --prod --dir=.
```

Or use drag-and-drop:
1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag the `frontend/public` folder

### Option 3: GitHub Pages

```bash
# Install gh-pages
npm i -g gh-pages

# Deploy
cd frontend/public
gh-pages -d . --branch gh-pages
```

### Option 4: Firebase Hosting

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

---

## Full Stack Deployment

### VPS (Ubuntu + Nginx)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip python3-venv nginx git

# Clone repository
git clone https://github.com/yourusername/plumberpass.git
cd plumberpass
```

#### 2. Backend Setup

```bash
# Setup Python environment
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Test run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 3. Frontend Build

```bash
# Build frontend
cd ../frontend
npm install
npm run build

# Copy to nginx directory
sudo cp -r dist/* /var/www/plumberpass/
sudo cp -r public/* /var/www/plumberpass/
```

#### 4. Nginx Configuration

Create `/etc/nginx/sites-available/plumberpass`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/plumberpass;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/plumberpass /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Systemd Service

Create `/etc/systemd/system/plumberpass.service`:

```ini
[Unit]
Description=PlumberPass Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/plumberpass/backend
Environment="PATH=/path/to/plumberpass/backend/.venv/bin"
ExecStart=/path/to/plumberpass/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable plumberpass
sudo systemctl start plumberpass
```

#### 6. SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Docker Deployment

### Using Docker Compose

```bash
# Build and run
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - ENVIRONMENT=production
    volumes:
      - ./backend/data:/app/data
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Cloud Platforms

### Railway

1. Fork the repository on GitHub
2. Connect Railway to your GitHub account
3. Create new project from repository
4. Railway will auto-detect the services
5. Deploy

### Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Use these settings:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init -p python-3.11 plumberpass

# Deploy
eb create plumberpass-env
eb open
```

### Google Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT-ID/plumberpass

# Deploy
gcloud run deploy plumberpass \
  --image gcr.io/PROJECT-ID/plumberpass \
  --platform managed \
  --allow-unauthenticated
```

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `LOG_LEVEL` | info | Logging level |
| `CORS_ORIGINS` | * | Allowed CORS origins |
| `DATA_DIR` | ./data | Data files directory |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | /api | API base URL |
| `VITE_APP_VERSION` | 1.0.0 | App version |

---

## Monitoring

### Health Checks

- Backend: `GET /health`
- Frontend: Check if page loads

### Logging

Backend logs to stdout/stderr. In production, use:
- `journalctl -u plumberpass` (systemd)
- `docker-compose logs` (Docker)

### Uptime Monitoring

Recommended services:
- UptimeRobot (free tier)
- Pingdom
- StatusCake

---

## Backup Strategy

### Data Backup

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/plumberpass"
mkdir -p $BACKUP_DIR

# Backup data directory
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /path/to/plumberpass/backend/data

# Keep only last 30 backups
ls -t $BACKUP_DIR/data_*.tar.gz | tail -n +31 | xargs rm -f
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
sudo journalctl -u plumberpass -n 100

# Test manually
cd /path/to/plumberpass/backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Nginx 502 error

```bash
# Check if backend is running
sudo systemctl status plumberpass

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### CORS errors

Update `CORS_ORIGINS` environment variable to include your domain.

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Firewall configured (only 80/443 open)
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Logs monitored
- [ ] No sensitive data in code
- [ ] Environment variables for secrets
