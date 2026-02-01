# 🚀 Deployment Guide

## Production-Ready Deployment Options

InsideMotion supports multiple deployment strategies for different use cases:

---

## 1. Local Development (Makefile)

**Best for:** Development, testing, demos

```bash
# Install dependencies and run
make run

# Or step by step:
make install    # Install dependencies
make dev        # Start dev server
```

**Access:** http://localhost:8000

**Advantages:**
- ✅ Fast iteration
- ✅ Hot reload enabled
- ✅ Easy debugging
- ✅ Standard industry practice (Make)

---

## 2. Docker Containerized (Recommended for Production)

**Best for:** Production deployment, isolated environments

### Quick Start
```bash
docker-compose up --build
```

### Production Commands
```bash
# Build image
docker-compose build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart
docker-compose restart
```

**Access:** http://localhost:8000

**Advantages:**
- ✅ Consistent environment
- ✅ Easy scaling
- ✅ Isolated dependencies
- ✅ Production-ready
- ✅ Health checks included

---

## 3. Cloud Deployment

### Option A: Railway

1. **Connect GitHub repo** to Railway
2. **Add environment variables:**
   ```
   PORT=8000
   ```
3. **Deploy** - Railway auto-detects Dockerfile
4. **Access:** `https://your-app.railway.app`

### Option B: Render

1. **Create new Web Service**
2. **Connect GitHub repo**
3. **Build command:** `docker build -t insidemotion .`
4. **Start command:** `docker run -p 8000:8000 insidemotion`
5. **Access:** `https://your-app.onrender.com`

### Option C: AWS/Azure/GCP

#### Using Docker

```bash
# Build for production
docker build -t insidemotion:prod .

# Tag for registry
docker tag insidemotion:prod <registry>/insidemotion:prod

# Push to registry
docker push <registry>/insidemotion:prod

# Deploy to cloud (example: AWS ECS, Azure Container Instances, GCP Cloud Run)
```

#### Using Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: insidemotion
spec:
  replicas: 3
  selector:
    matchLabels:
      app: insidemotion
  template:
    metadata:
      labels:
        app: insidemotion
    spec:
      containers:
      - name: insidemotion
        image: <registry>/insidemotion:prod
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## 4. Makefile Commands Reference

```bash
make help       # Show all available commands
make install    # Install Python dependencies
make dev        # Start development server
make run        # Install + start (one command)
make test       # Run test suite
make clean      # Clean build artifacts and cache
```

---

## Environment Configuration

Create `.env` file in project root:

```bash
# Server
HOST=0.0.0.0
PORT=8000

# Upload
MAX_UPLOAD_SIZE_MB=200
UPLOAD_DIR=./data/uploads

# AI Thresholds
HIP_SHIFT_THRESHOLD=0.015
KNEE_ASYMMETRY_THRESHOLD=0.02

# Logging
LOG_LEVEL=INFO
```

---

## System Requirements

### Minimum (Development)
- **CPU:** 2 cores
- **RAM:** 2GB
- **Disk:** 1GB
- **OS:** Linux, macOS, Windows (WSL2)

### Recommended (Production)
- **CPU:** 4 cores
- **RAM:** 4GB
- **Disk:** 5GB (for video uploads)
- **OS:** Linux (Ubuntu 22.04+)

---

## Performance Optimization

### 1. CPU Optimization
- Use more CPU cores for video processing
- MediaPipe benefits from multi-core systems

### 2. Memory Management
- Limit concurrent video uploads
- Process videos sequentially to avoid OOM

### 3. Storage
- Implement video cleanup (delete after 24h as stated in UI)
- Use object storage (S3, Azure Blob) for scalability

### 4. Caching
- Cache MediaPipe model in memory
- Reuse video analyzer instance

---

## Security Considerations

### 1. File Upload Validation
- ✅ File type checking (MP4, MOV, AVI)
- ✅ File size limits (200MB)
- ⚠️ TODO: Virus scanning (ClamAV)
- ⚠️ TODO: Content validation (FFmpeg probe)

### 2. Data Privacy
- ✅ Videos deleted after 24h (implement cron job)
- ✅ No patient identifiable data stored
- ⚠️ TODO: GDPR compliance (EU data residency)
- ⚠️ TODO: Encryption at rest

### 3. API Security
- ⚠️ TODO: Rate limiting (per IP/user)
- ⚠️ TODO: Authentication (JWT tokens)
- ⚠️ TODO: HTTPS/TLS certificates

---

## Monitoring & Observability

### Health Check Endpoint
```bash
curl http://localhost:8000/health
# Response: {"status": "ok"}
```

### Logs
```bash
# Local development
tail -f apps/backend/logs/app.log

# Docker
docker-compose logs -f

# Production (example: Datadog, CloudWatch)
```

### Metrics to Track
- Request latency (upload, analysis)
- Video processing time
- Error rates
- CPU/Memory usage
- Disk usage (uploads directory)

---

## Troubleshooting

### Docker build fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

### Port already in use
```bash
# Find process on port 8000
lsof -ti:8000

# Kill process
lsof -ti:8000 | xargs kill -9
```

### MediaPipe model download fails
```bash
# Manual download
curl -L "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task" \
  -o apps/backend/app/pose_landmarker_lite.task --insecure
```

### Out of memory during video processing
- Reduce video size before upload
- Process videos sequentially (queue system)
- Increase container memory limits

---

## CI/CD Pipeline Example

### GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t insidemotion:${{ github.sha }} .
      
      - name: Run tests
        run: docker run insidemotion:${{ github.sha }} pytest
      
      - name: Push to registry
        run: |
          docker tag insidemotion:${{ github.sha }} ${{ secrets.REGISTRY }}/insidemotion:latest
          docker push ${{ secrets.REGISTRY }}/insidemotion:latest
      
      - name: Deploy to production
        run: |
          # Deploy to cloud provider (Railway, Render, AWS, etc.)
```

---

## Cost Estimation

### Cloud Hosting (Monthly)

| Provider | Tier | CPU | RAM | Cost |
|----------|------|-----|-----|------|
| Railway | Hobby | 2 vCPU | 2GB | $5 |
| Render | Starter | 1 vCPU | 512MB | $7 |
| AWS EC2 | t3.small | 2 vCPU | 2GB | $15 |
| Azure | B1s | 1 vCPU | 1GB | $10 |
| GCP | e2-small | 2 vCPU | 2GB | $13 |

**Storage:** $0.023/GB/month (AWS S3)  
**Compute (video processing):** ~$0.10 per video

---

## Support & Contact

**Issues:** GitHub Issues  
**Email:** support@insidemotion.ai (coming soon)  
**Discord:** klimb_d
