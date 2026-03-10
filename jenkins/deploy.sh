#!/bin/bash
# Script to deploy Sales Portal to AKS
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
NAMESPACE="sales-portal"
DEPLOYMENT_NAME="sales-portal-app"

echo "========================================="
echo "Deploying Sales Portal to AKS"
echo "Environment: ${ENVIRONMENT}"
echo "Namespace: ${NAMESPACE}"
echo "========================================="

# Create namespace
echo "Creating namespace..."
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/

# Wait for deployment
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=300s

# Get deployment info
echo "========================================="
echo "Deployment Status:"
kubectl get all -n ${NAMESPACE}
echo "========================================="

echo "Deployment completed successfully!"
