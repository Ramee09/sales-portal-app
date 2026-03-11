#!/usr/bin/env python3
"""
Jenkins Configuration Script for Sales Portal CI/CD Pipeline
"""

import requests
import sys
import time

JENKINS_URL = "http://172.210.109.6"
JENKINS_USER = "admin"
JENKINS_PASS = "admin"
GITHUB_REPO = "https://github.com/Ramee09/sales-portal-app.git"
GITHUB_BRANCH = "main"

def jenkins_api(method, endpoint, data=None, headers=None):
    """Make Jenkins API calls"""
    url = f"{JENKINS_URL}{endpoint}"
    auth = (JENKINS_USER, JENKINS_PASS)
    
    if headers is None:
        headers = {}
    
    try:
        if method == "GET":
            response = requests.get(url, auth=auth, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, auth=auth, data=data, headers=headers, timeout=10)
        else:
            return None
        
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

def wait_for_jenkins():
    """Wait for Jenkins to be ready"""
    print("Waiting for Jenkins to be ready...")
    for i in range(30):
        response = jenkins_api("GET", "/api/json")
        if response and response.status_code == 200:
            print("✓ Jenkins is ready")
            return True
        print(f"  Attempt {i+1}/30...")
        time.sleep(2)
    return False

def create_pipeline_job():
    """Create pipeline job"""
    print("\nCreating pipeline job...")
    
    job_name = "sales-portal-pipeline"
    job_xml = f'''<?xml version="1.1" encoding="UTF-8"?>
<org.jenkinsci.plugins.workflow.job.WorkflowJob plugin="workflow-job">
  <actions/>
  <description>Sales Portal - E-commerce CI/CD Pipeline</description>
  <properties>
    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin="github">
      <projectUrl>https://github.com/Ramee09/sales-portal-app/</projectUrl>
    </com.coravy.hudson.plugins.github.GithubProjectProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps">
    <scm class="hudson.plugins.git.GitSCM" plugin="git">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>{GITHUB_REPO}</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/{GITHUB_BRANCH}</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
    </scm>
    <scriptPath>Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <disabled>false</disabled>
</org.jenkinsci.plugins.workflow.job.WorkflowJob>'''
    
    headers = {"Content-Type": "application/xml"}
    response = jenkins_api("POST", f"/createItem?name={job_name}", data=job_xml, headers=headers)
    
    if response and response.status_code in [200, 201]:
        print(f"✓ Pipeline job '{job_name}' created successfully")
        return True
    else:
        print(f"✗ Failed to create job: {response.status_code if response else 'No response'}")
        if response:
            print(f"  Response: {response.text}")
        return False

def main():
    print("="*50)
    print("Jenkins CI/CD Configuration")
    print("="*50)
    
    if not wait_for_jenkins():
        print("✗ Jenkins not responding")
        sys.exit(1)
    
    if create_pipeline_job():
        print("\n" + "="*50)
        print("✓ Jenkins Configuration Complete!")
        print("="*50)
        print(f"\nJenkins URL: {JENKINS_URL}")
        print(f"Job Name:   sales-portal-pipeline")
        print(f"Repository: {GITHUB_REPO}")
        print(f"Branch:     {GITHUB_BRANCH}")
        print("\nNext Steps:")
        print("1. Manually build the Docker image (or wait for Jenkins to build it)")
        print("2. Set up GitHub webhook (optional, for automatic builds)")
        print("3. Trigger build: Build Now in Jenkins")
        return 0
    else:
        print("\n✗ Configuration failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
