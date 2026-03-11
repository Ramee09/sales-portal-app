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

### CI/CD & Infrastructure

This repository contains the application code. The Jenkins CI/CD infrastructure and deployment configuration is maintained in a **separate repository**:

📦 **[jenkins-aks](https://github.com/ramee09/jenkins-aks)** - Jenkins infrastructure for AKS cluster

This separation ensures:
- ✅ Infrastructure code is version controlled independently
- ✅ Different access controls for app vs infrastructure
- ✅ Clear separation of concerns
- ✅ Easier CI/CD collaboration

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

### Related Repositories
- **[jenkins-aks](https://github.com/ramee09/jenkins-aks)** - CI/CD platform infrastructure

### Documentation
- See README files for full setup guides

### License
MIT
