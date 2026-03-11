# Sales Portal - Complete CI/CD Setup Guide

## 📋 Overview

This document outlines the complete setup for Sales Portal CI/CD pipeline with Jenkins running on Azure Kubernetes Service (AKS).

### Repository Structure

Two separate repositories work together:

| Repository | Purpose | Link |
|-----------|---------|------|
| **sales-portal-app** | Application code | https://github.com/ramee09/sales-portal-app |
| **jenkins-aks** | CI/CD infrastructure | https://github.com/ramee09/jenkins-aks |

---

## 🏗️ Infrastructure Setup (Already Completed)

### ✅ Deployed Resources

| Component | Details | Status |
|-----------|---------|--------|
| Resource Group | `sales-portal-rg` (eastus) | ✅ Created  |
| AKS Cluster | `sales-portal-aks` (3 nodes) | ✅ Running |
| Container Registry | `salesportalacr.azurecr.io` | ✅ Created |
| Jenkins | Running in AKS | ✅ Deployed |
| MongoDB | Running in AKS | ✅ Deployed |
| Sales Portal App | Deployment ready | ✅ Ready |

---

## 📦 GitHub Repository Setup

### ✅ Task: Create & Push Repositories

**Before proceeding, complete these steps:**

#### 1️⃣ Create `sales-portal-app` Repository

```
GitHub → + → New repository
- Name: sales-portal-app
- Description: E-commerce Sales Portal with Kubernetes and Jenkins CI/CD
- Visibility: Public
- Create
```

#### 2️⃣ Create `jenkins-aks` Repository

```
GitHub → + → New repository
- Name: jenkins-aks
- Description: Jenkins CI/CD infrastructure for AKS
- Visibility: Public
- Create
```

#### 3️⃣ Push sales-portal-app Code

```bash
cd /Users/nagarameshswarna/Downloads/sales-portal
git push -u origin main
```

**Prompted for credentials?**
- Username: `ramee09`
- Password: Your GitHub **Personal Access Token** (Settings → Developer settings → Tokens)

#### 4️⃣ Push jenkins-aks Code

```bash
cd /Users/nagarameshswarna/Downloads/jenkins-infrastructure
git push -u origin main
```

---

## 🔐 Azure Container Registry

### Access Jenkins-built Images

```bash
# Login to ACR
az acr login --name salesportalacr

# List images
az acr repository list --name salesportalacr

# View tags
az acr repository show-tags --name salesportalacr --repository sales-portal
```

---

## 🤖 Jenkins Configuration

### Access Jenkins

**URL**: `http://172.210.109.6` (LoadBalancer External IP)

**Get Admin Password**:
```bash
kubectl exec -n jenkins -it deployment/jenkins -- \
  cat /var/jenkins_home/secrets/initialAdminPassword
```

### 1️⃣ Initial Setup (First Login)

1. Copy the admin password from above
2. Visit `http://172.210.109.6`
3. Paste password to unlock Jenkins
4. Choose **Install suggested plugins**
5. Create first admin user
6. Complete setup

### 2️⃣ Install Additional Plugins

**Manage Jenkins** → **Manage Plugins** → **Available**

Search and install:
- ☐ Kubernetes plugin
- ☐ Docker Pipeline
- ☐ GitHub Integration  
- ☐ Pipeline: GitHub
- ☐ Azure CLI Steps plugin

Click **Install without restart**

### 3️⃣ Add Credentials

**Manage Jenkins** → **Credentials** → **System** → **Global credentials (unrestricted)**

#### Credential 1: Azure Registry

- Click **+ Add Credentials**
- Kind: **Username with password**
- Username: Get from:
  ```bash
  az acr credential show -n salesportalacr --query username
  ```
- Password: Get from:
  ```bash
  az acr credential show -n salesportalacr --query 'passwords[0].value'
  ```
- ID: `azure-registry-credentials`
- Click **Create**

#### Credential 2: Kubeconfig

- Click **+ Add Credentials**
- Kind: **Secret file**
- File: Upload `~/.kube/config`
- ID: `kubeconfig-file`
- Click **Create**

#### Credential 3: Azure Subscription

- Click **+ Add Credentials**
- Kind: **Secret text**
- Secret:
  ```bash
  az account show --query id --output tsv
  ```
- ID: `azure-subscription-id`
- Click **Create**

#### Credential 4: GitHub (Optional)

- Click **+ Add Credentials**
- Kind: **Username with password**
- Username: `ramee09`
- Password: Your GitHub Personal Access Token
- ID: `github-credentials`
- Click **Create**

---

## 🔧 Create Jenkins Pipeline Job

### New Pipeline Job

1. **Jenkins Dashboard** → **+ New Item**
2. Name: `sales-portal-pipeline`
3. Type: **Pipeline**
4. Click **OK**

### Configure Pipeline

**Build Triggers**
- ☑ GitHub hook trigger for GITScm polling

**Pipeline**
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/ramee09/sales-portal-app.git`
- Credentials: Select `github-credentials` (or create if needed)
- Branches to build: `*/main`
- Script Path: `Jenkinsfile`

**Advanced**
- Polling ignores commits: ☑ (optional)

Click **Save**

---

## 🔔 GitHub Webhook Setup

### Enable Automatic Builds from GitHub

In **github.com/ramee09/sales-portal-app**:

1. **Settings** → **Webhooks**
2. Click **Add webhook**
3. **Payload URL**: `http://172.210.109.6/github-webhook/`
4. **Content type**: `application/json`
5. **Events**: Select **Push events**
6. ☑ **Active**
7. Click **Add webhook**

**Verify**: Webhook should show green checkmark with recent deliveries

---

## 📊 Pipeline Stages

The Jenkinsfile automatically runs these stages:

```
1. Checkout       → Pull code from GitHub
   ↓
2. Build & Tests  → npm install, lint, test
   ↓
3. Build Image    → docker build
   ↓
4. Push to ACR    → Push to salesportalacr.azurecr.io
   ↓
5. Deploy to AKS  → Rolling update to sales-portal namespace
   ↓
6. Smoke Tests    → Verify pods are running
```

---

## 🚀 Trigger First Build

### Option 1: Manual Trigger in Jenkins

```
Jenkins Dashboard → sales-portal-pipeline → Build Now
```

### Option 2: Push to GitHub (Webhook)

```bash
cd /Users/nagarameshswarna/Downloads/sales-portal
echo "# CI/CD Pipeline Test" >> README-DEPLOY.md
git add .
git commit -m "test: trigger pipeline"
git push origin main
```

This automatically triggers Jenkins via GitHub webhook

### Option 3: Jenkins CLI (if needed)

```bash
java -jar jenkins-cli.jar -s http://172.210.109.6 \
  -auth admin:<password> \
  build sales-portal-pipeline
```

---

## 📈 Monitor Build Progress

### View Build Logs in Jenkins

1. Click on build number (e.g., **#1**)
2. Click **Console Output**
3. Watch real-time logs

### View App Deployment

```bash
# Watch pods being deployed
kubectl get pods -n sales-portal -w

# View individual pod logs
kubectl logs -n sales-portal deployment/sales-portal-app -f

# Check deployment status
kubectl describe deployment sales-portal-app -n sales-portal
```

### View Service Status

```bash
# Get app service IP
kubectl get svc -n sales-portal

# Test app health
curl http://<SERVICE-IP>/health
```

---

## ✅ Verification Checklist

- [ ] Both GitHub repositories created
- [ ] Code pushed to both repos
- [ ] Jenkins pod running: `kubectl get pods -n jenkins`
- [ ] Jenkins UI accessible at http://172.210.109.6
- [ ] All credentials added
- [ ] Pipeline job created: `sales-portal-pipeline`
- [ ] GitHub webhook configured and active
- [ ] MongoDB running: `kubectl get pods -n sales-portal`
- [ ] First build triggered and successful
- [ ] App pods running with latest image
- [ ] App health check passing: `curl /health`

---

## 🐛 Troubleshooting

### Jenkins Pod Not Ready

```bash
# Check Jenkins logs
kubectl logs -n jenkins deployment/jenkins

# Check resources
kubectl top pods -n jenkins

# Describe pod for errors
kubectl describe pod -n jenkins deployment/jenkins
```

### Build Failing

1. Check **Console Output** in Jenkins
2. Common issues:
   - GitHub webhook not configured
   - Credentials missing or incorrect
   - ACR login failure

```bash
# Test ACR access
az acr login --name salesportalacr
az acr repository list --name salesportalacr
```

### App Not Deploying

```bash
# Check deployment status
kubectl describe deployment sales-portal-app -n sales-portal

# Check pod errors
kubectl describe pod -n sales-portal <pod-name>

# Check image pull
kubectl get events -n sales-portal
```

### Webhook Not Triggering

1. Verify webhook in GitHub Settings → Webhooks
2. Check webhook delivery logs
3. Verify webhook URL is correct: `http://172.210.109.6/github-webhook/`

---

## 📝 Environment Variables

Configured in `k8s/02-configmap-secret.yaml`:

```yaml
NODE_ENV: "production"
PORT: "3000"
MONGODB_URI: "mongodb://mongodb:27017/sales-portal"
JWT_SECRET: (from secret)
STRIPE_API_KEY: (from secret)
```

Update as needed for your environment.

---

## 🔄 Update Cycle

### Making Changes

1. Edit code in `sales-portal-app` repo
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "feature: description"
   git push origin main
   ```
3. GitHub webhook triggers Jenkins
4. Jenkins automatically:
   - Builds Docker image
   - Pushes to ACR
   - Deploys to AKS
5. View new version at app endpoint

### Updating Infrastructure

For Jenkins infrastructure changes:
1. Edit files in `jenkins-aks` repo
2. Push to GitHub
3. Manually apply changes:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/ramee09/jenkins-aks/main/jenkins/*.yaml
   ```

---

## 🔗 Related Resources

- **sales-portal-app**: https://github.com/ramee09/sales-portal-app
- **jenkins-aks**: https://github.com/ramee09/jenkins-aks
- **Jenkins Docs**: https://www.jenkins.io/doc/
- **Azure AKS**: https://docs.microsoft.com/en-us/azure/aks/
- **Kubernetes**: https://kubernetes.io/docs/

---

## 📞 Support

For issues, check:
1. Jenkins logs: `kubectl logs -n jenkins deployment/jenkins`
2. Pod status: `kubectl get pods --all-namespaces`
3. GitHub webhook deliveries
4. AKS cluster health: `az aks show -g sales-portal-rg -n sales-portal-aks`
