# Sales Portal - README

## E-commerce Sales Portal

A production-ready Node.js e-commerce platform with Docker, Kubernetes, and Jenkins CI/CD.

### Tech Stack
- Node.js + Express.js
- MongoDB
- Docker
- Kubernetes (Azure AKS)
- Jenkins CI/CD
- Azure Cloud

### Quick Start

```bash
# Install dependencies
npm install

# Run locally with Docker
docker-compose up -d

# Test API
curl http://localhost:3000/health
curl http://localhost:3000/api/products
```

### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get all -n sales-portal
```

### API Endpoints

- `GET /health` - Health check
- `GET /api` - API info
- `GET /api/products` - List products
- `GET /api/products/:id` - Product details
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Order details

### Documentation
- See README files for full setup guides

### License
MIT
