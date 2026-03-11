# Sales Portal CI/CD Pipeline - Testing Guide

## 🎯 Current Status

✅ GitHub repositories created and code pushed  
✅ AKS cluster with Jenkins deployed  
✅ MongoDB deployed  
✅ ACR configured  
⏳ Jenkins job needs manual creation  

---

## 📝 Manual Jenkins Setup (5 minutes)

### Access Jenkins

1. **Open Browser**: `http://172.210.109.6`
2. **Login**:
   - Username: `admin`
   - Password: `admin`

### Step 1: Create Pipeline Job

1. Click **+ New Item** (top left)
2. Enter name: `sales-portal-pipeline`
3. Select **Pipeline**
4. Click **OK**

### Step 2: Configure Pipeline

In the job configuration page:

**Build Triggers**
- ☑ GitHub hook trigger for GITScm polling

**Pipeline**
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository URL: `https://github.com/Ramee09/sales-portal-app.git`
- Branches to build: `*/main`
- Script Path: `Jenkinsfile`

Click **Save**

### Step 3: Set Up GitHub Webhook (Optional)

In your GitHub repo: `https://github.com/Ramee09/sales-portal-app`

1. Go to **Settings** → **Webhooks**  
2. Click **Add webhook**
3. **Payload URL**: `http://172.210.109.6/github-webhook/`
4. **Content type**: `application/json`
5. **Events**: Select **Push events**
6. Click **Add webhook**

---

## 🚀 Trigger Your First Build

### Option 1: Manual Build (Quickest)

1. In Jenkins, go to **sales-portal-pipeline**
2. Click **Build Now**
3. Watch the build progress in **Console Output**

### Option 2: GitHub Webhook Trigger (Automatic)

```bash
cd /Users/nagarameshswarna/Downloads/sales-portal
echo "# Testing CI/CD Pipeline" >> TEST-RUN.md
git add TEST-RUN.md
git commit -m "test: trigger first pipeline build"
git push origin main
```

This automatically triggers Jenkins via GitHub webhook.

---

## 📊 Pipeline Execution Flow

The build will:

1. ✓ **Checkout** - Pull code from GitHub
2. ✓ **Build & Test** - Run `npm install`, `npm lint`, `npm test`
3. ✓ **Build Docker Image** - Create container
4. ✓ **Push to ACR** - Push to `salesportalacr.azurecr.io`
5. ✓ **Deploy to AKS** - Update sales-portal app
6. ✓ **Smoke Tests** - Verify pods are running

---

## 📈 Monitor Your Build

### In Jenkins

1. Click on build number (e.g., `#1`)
2. Click **Console Output**
3. Watch real-time logs

### In Kubernetes

```bash
# Watch pods being updated
kubectl get pods -n sales-portal -w

# View app logs
kubectl logs -n sales-portal deployment/sales-portal-app -f

# Check deployment status
kubectl describe deployment sales-portal-app -n sales-portal

# Get app service IP
kubectl get svc -n sales-portal

# Test app
curl http://<SERVICE-IP>/health
```

---

## ✅ Verification Checklist

- [ ] Jenkins job created: `sales-portal-pipeline`
- [ ] Job configuration has correct GitHub repo URL
- [ ] Git branch set to `*/main`
- [ ] Script Path is `Jenkinsfile`
- [ ] Build Triggers has GitHub hook enabled
- [ ] GitHub webhook configured (optional)
- [ ] First build triggered
- [ ] Build completes successfully
- [ ] Docker image appears in ACR
- [ ] Pods updated with new image
- [ ] App health check passing

---

## 🔍 Troubleshooting

### Build Fails - Check Git Access
```bash
# Verify repository is accessible
curl -I https://github.com/Ramee09/sales-portal-app.git
```

### Build Fails - Check Docker Build
```bash
# Check Docker output in Jenkins console
# Look for "docker build" and "docker push" stages
```

### Build Fails - Check ACR Access
```bash
# Verify ACR credentials
az acr credential show -n salesportalacr
az acr repository list --name salesportalacr
```

### Pods Not Updating
```bash
# Check deployment image
kubectl describe deployment sales-portal-app -n sales-portal | grep Image

# Check pod events
kubectl describe pod -n sales-portal <pod-name>
```

### App Not Accessible
```bash
# Check service
kubectl get svc -n sales-portal

# Check ingress
kubectl get ingress -n sales-portal

# Test local access
kubectl port-forward svc/sales-portal-service 3000:80 -n sales-portal
# Visit http://localhost:3000
```

---

## 🎉 Success Indicators

- ✓ Jenkins job runs and completes
- ✓ Build stages progress: Checkout → Build → Docker → ACR → AKS
- ✓ No errors in console output
- ✓ New image appears in ACR registry
- ✓ Pods restart with new image
- ✓ App responds to HTTP requests

---

## 📞 Quick Reference

| Item | Link/Value |
|------|-----------|
| Jenkins | http://172.210.109.6 |
| Jenkins Job | sales-portal-pipeline |
| GitHub Repo | https://github.com/Ramee09/sales-portal-app |
| ACR | salesportalacr.azurecr.io |
| AKS Cluster | sales-portal-aks (eastus) |
| App Namespace | sales-portal |
| Jenkins Namespace | jenkins |

---

## 📚 Useful Commands

```bash
# Get Jenkins logs
kubectl logs -n jenkins deployment/jenkins -f

# Get app deployment status
kubectl get deployment -n sales-portal

# Describe app pods
kubectl describe pods -n sales-portal

# Check ACR images
az acr repository list --name salesportalacr
az acr repository show-tags --name salesportalacr --repository sales-portal

# Port forward to app
kubectl port-forward svc/sales-portal-service 3000:80 -n sales-portal

# Port forward to Jenkins
kubectl port-forward svc/jenkins 8080:80 -n jenkins
```

---

**Next: Follow the manual Jenkins setup above to complete your CI/CD pipeline testing! 🚀**
