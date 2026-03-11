#!/bin/bash

# Jenkins Configuration Script
# This script automatically configures Jenkins for the Sales Portal CI/CD pipeline

set -e

JENKINS_URL="http://172.210.109.6"
JENKINS_USER="admin"
JENKINS_PASS="admin"
GITHUB_REPO="https://github.com/Ramee09/sales-portal-app.git"
GITHUB_BRANCH="main"

echo "==============================================="
echo "Jenkins CI/CD Pipeline Configuration"
echo "==============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to call Jenkins API
jenkins_api_call() {
  local endpoint=$1
  local data=$2
  
  if [ -z "$data" ]; then
    curl -s -u "$JENKINS_USER:$JENKINS_PASS" "$JENKINS_URL/api/json$endpoint"
  else
    curl -s -u "$JENKINS_USER:$JENKINS_PASS" -X POST "$JENKINS_URL$endpoint" \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      -d "$data"
  fi
}

# Step 1: Wait for Jenkins to be ready
echo -e "${BLUE}Step 1: Waiting for Jenkins...${NC}"
for i in {1..30}; do
  if curl -s -u "$JENKINS_USER:$JENKINS_PASS" "$JENKINS_URL/api/json" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Jenkins is ready${NC}"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

# Step 2: Install plugins
echo ""
echo -e "${BLUE}Step 2: Installing required plugins...${NC}"

PLUGINS=(
  "kubernetes:latest"
  "docker-plugin:latest"
  "github-branch-source:latest"
  "github:latest"
  "pipeline-github:latest"
  "azure-cli:latest"
)

for plugin in "${PLUGINS[@]}"; do
  plugin_name=$(echo $plugin | cut -d: -f1)
  echo "Installing plugin: $plugin_name..."
  jenkins_api_call "/pluginManager/installPlugins" "plugins=$plugin&dynamicLoad=true" > /dev/null
  echo -e "${GREEN}✓ $plugin_name installed${NC}"
done

# Step 3: Add Azure Registry Credentials
echo ""
echo -e "${BLUE}Step 3: Adding Azure Registry credentials...${NC}"

# Get ACR credentials
ACR_USERNAME=$(az acr credential show -n salesportalacr --query username -o tsv)
ACR_PASSWORD=$(az acr credential show -n salesportalacr --query 'passwords[0].value' -o tsv)

# Create credentials XML
CREDS_XML="<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>azure-registry-credentials</id>
  <description>Azure Container Registry</description>
  <username>$ACR_USERNAME</username>
  <password>$ACR_PASSWORD</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>"

echo -e "${GREEN}✓ Azure Registry credentials prepared${NC}"

# Step 4: Create Git credentials
echo ""
echo -e "${BLUE}Step 4: Setting up GitHub credentials...${NC}"

GIT_CREDS_XML="<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>github-credentials</id>
  <description>GitHub</description>
  <username>Ramee09</username>
  <password></password>
  <usernameVariable>GIT_USERNAME</usernameVariable>
  <passwordVariable>GIT_PASSWORD</passwordVariable>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>"

echo -e "${GREEN}✓ GitHub credentials prepared${NC}"

# Step 5: Create Pipeline Job Configuration
echo ""
echo -e "${BLUE}Step 5: Creating pipeline job...${NC}"

JOB_CONFIG="<?xml version='1.1' encoding='UTF-8'?>
<org.jenkinsci.plugins.workflow.job.WorkflowJob plugin=\"workflow-job@latest\">
  <actions/>
  <description>Sales Portal - CI/CD Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin=\"github@latest\">
      <projectUrl>https://github.com/Ramee09/sales-portal-app/</projectUrl>
      <displayName></displayName>
    </com.coravy.hudson.plugins.github.GithubProjectProperty>
    <org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
      <triggers>
        <com.github.pushakaes.GitHubPushTrigger plugin=\"github-branch-source@latest\">
          <spec></spec>
        </com.github.pushakaes.GitHubPushTrigger>
      </triggers>
    </org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
  </properties>
  <definition class=\"org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition\" plugin=\"workflow-cps@latest\">
    <scm class=\"hudson.plugins.git.GitSCM\" plugin=\"git@latest\">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>$GITHUB_REPO</url>
          <credentialsId>github-credentials</credentialsId>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/$GITHUB_BRANCH</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
    </scm>
    <scriptPath>Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</org.jenkinsci.plugins.workflow.job.WorkflowJob>"

echo "$JOB_CONFIG" > /tmp/job-config.xml
echo -e "${GREEN}✓ Pipeline job configuration prepared${NC}"

# Step 6: Create job via Jenkins API
echo ""
echo -e "${BLUE}Step 6: Creating job in Jenkins...${NC}"

curl -s -u "$JENKINS_USER:$JENKINS_PASS" -X POST "$JENKINS_URL/createItem?name=sales-portal-pipeline" \
  -H "Content-Type: application/xml" \
  --data @/tmp/job-config.xml

echo -e "${GREEN}✓ Pipeline job created${NC}"

# Summary
echo ""
echo "==============================================="
echo -e "${GREEN}✓ Jenkins Configuration Complete!${NC}"
echo "==============================================="
echo ""
echo "Jenkins URL: $JENKINS_URL"
echo "Job Name: sales-portal-pipeline"
echo "Repository: $GITHUB_REPO"
echo "Branch: $GITHUB_BRANCH"
echo ""
echo "Next steps:"
echo "1. Access Jenkins at: $JENKINS_URL"
echo "2. Configure GitHub webhook:"
echo "   - URL: $JENKINS_URL/github-webhook/"
echo "   - Events: Push"
echo "3. Trigger first build: Build Now"
echo ""
