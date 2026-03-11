# Jenkins Pipeline Setup Status

## ✅ Completed

### Infrastructure
- **AKS Cluster**: `sales-portal-aks` in `eastus` region (3 nodes → v1.33.7)
- **Container Registry**: `salesportalacr` (Basic SKU) in Azure
- **Jenkins Deployment**: Running in `jenkins` namespace on AKS
  - Image: `jenkins:latest` (v2.541.2)  
  - Service: LoadBalancer at `172.210.109.6:8080`
  - Storage: 20Gi PVC with persistent volume
  - RBAC: ClusterRole bindings configured

### Application Infrastructure
- **Namespace**: `sales-portal` with MongoDB v6.0 and app deployment
- **Kubernetes Manifests**: Applied successfully
  - ConfigMaps and Secrets configured
  - Service, Ingress, and HPA deployed
  - MongoDB initdb container image deployed

### GitHub Repositories
- **sales-portal-app**: Code pushed with Jenkinsfile (6-stage pipeline)
- **jenkins-aks**: Infrastructure IaC with Kubernetes manifests

### Jenkins Job
- **Name**: `sales-portal-pipeline`
- **Status**: Created and accessible
- **Repository**: https://github.com/Ramee09/sales-portal-app.git (main branch)
- **Trigger**: Manual `Build Now` or API endpoint

## ⚠️ Current Limitations

### Issue: Freestyle vs. Pipeline Job
The created job (`sales-portal-pipeline`) is currently a **Freestyle Project** because:
- **Root Cause**: Jenkins Workflow plugin (required for Pipeline jobs) not recognized by Jenkins API
- **Error**: "No item type 'org.jenkinsci.plugins.workflow.job.WorkflowJob' is known"
- **Impact**: The job cannot directly execute the `Jenkinsfile` with its 6 pipeline stages

### Next Steps Required

#### Option 1: Convert to Declarative Pipeline (Recommended)
1. Manually add Pipeline Stage View / Declarative pipeline support
2. Update job configuration XML to use Pipeline-compatible format  
3. Ensure Workflow plugin is fully initialized in Jenkins

#### Option 2: Configure Freestyle Job with Build Steps
1. Add shell build step that clones repo and manually runs Jenkinsfile steps
2. Configure Git plugin for automatic checkout
3. Add Docker build and ACR push scripts as build steps

#### Option 3: Upgrade Jenkins Configuration
1. Install Pipeline plugin explicitly via Jenkins Plugin Manager
2. Restart Jenkins to load plugins
3. Recreate job as proper Pipeline job

## 🔧 Current Job Configuration

```yaml
Job Name: sales-portal-pipeline
Type: Freestyle Project
SCM: Git (GitHub https://github.com/Ramee09/sales-portal-app.git)
Branch: */main
Git Branch Specifier: main
Checkout: Enabled
Build Steps: (Currently None - add shell scripts or pipeline steps)
```

## 📝 Recommended Actions for Next Session

### Short Term (Get pipeline running)
1. SSH into Jenkins pod or use kubectl exec
2. Verify plugin directory: `/var/jenkins_home/plugins/`
3. Check if `workflow-job.hpi` or similar Pipeline plugin exists
4. If missing, install via CLI or Jenkins UI

### Medium Term (Optimize setup)
1. Add custom build steps to existing Freestyle job
2. Or convert to Pipeline job once plugins are confirmed
3. Test full 6-stage pipeline execution

### Long Term (Production Ready)
1. Set up GitHub webhook for automatic triggers
2. Configure Docker credentials in Jenkins for ACR push 
3. Add Kubernetes service account for AKS deployments
4. Set up health checks and monitoring
5. Implement blue-green or canary deploy strategies

## 📊 Pipeline Stages (From Jenkinsfile)

When fully configured, the pipeline will execute:
1. **Checkout** - Clone repo from GitHub
2. **Build & Tests** - npm install and npm test  
3. **Build Image** - Create Docker image
4. **Push to ACR** - Push to Azure Container Registry
5. **Deploy to AKS** - Deploy updated image to cluster
6. **Smoke Tests** - Verify app health after deployment

## 🔐 Security Notes

- Jenkins admin: `admin/admin` (change ASAP in production)
- Jenkins API available at: `http://172.210.109.6:8080/api/`
- Git credentials: Currently using public repo (no auth needed)
- ACR credentials: Configured in AKS as secret (need to verify binding)

## 📋 Access Information

| Component | URL/Endpoint | Credentials |
|-----------|-------------|-------------|
| Jenkins | http://172.210.109.6:8080 | admin/admin |
| Jenkins API | http://172.210.109.6:8080/api/json | admin/admin |
| Pipeline Job | http://172.210.109.6:8080/job/sales-portal-pipeline/ | Public |
| ACR Registry | salesportalacr.azurecr.io | Azure credentials |

## 🚀 Next: Fixing Pipeline Execution

To complete the CI/CD setup, we need to ensure the Jenkinsfile can be properly executed. This involves either:
- Converting the Freestyle job to a Declarative Pipeline job, or
- Adding explicit build steps that replicate the Jenkinsfile logic

Would you like me to proceed with either option?
