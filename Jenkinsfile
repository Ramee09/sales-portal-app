pipeline {
    agent any
    
    environment {
        // Azure & Registry
        AZURE_SUBSCRIPTION_ID = credentials('azure-subscription-id')
        AZURE_RESOURCE_GROUP = 'sales-portal-rg'
        AZURE_AKS_NAME = 'sales-portal-aks'
        AZURE_AKS_REGION = 'eastus'
        
        // Container Registry
        REGISTRY_NAME = 'salesportalacr'
        REGISTRY_URL = "${REGISTRY_NAME}.azurecr.io"
        REGISTRY_CREDS = credentials('azure-registry-credentials')
        
        // Application
        APP_NAME = 'sales-portal'
        IMAGE_NAME = "${REGISTRY_URL}/${APP_NAME}"
        IMAGE_TAG = "${BUILD_NUMBER}"
        FULL_IMAGE = "${IMAGE_NAME}:${IMAGE_TAG}"
        
        // Kubernetes
        K8S_NAMESPACE = 'sales-portal'
        K8S_DEPLOYMENT = 'sales-portal-app'
        KUBECONFIG = credentials('kubeconfig-file')
        
        // Git
        GIT_REPO = 'https://github.com/YOUR_USERNAME/sales-portal.git'
        GIT_BRANCH = 'main'
    }
    
    options {
        timeout(time: 1, unit: 'HOURS')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "========== Checking out code =========="
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "*/${GIT_BRANCH}"]],
                        userRemoteConfigs: [[url: GIT_REPO]]
                    ])
                }
            }
        }
        
        stage('Build & Unit Tests') {
            steps {
                script {
                    echo "========== Running Build & Unit Tests =========="
                    sh '''
                        npm install
                        npm run lint
                        npm test
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "========== Building Docker Image =========="
                    sh '''
                        docker build \
                            --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                            --build-arg GIT_COMMIT=${GIT_COMMIT} \
                            --build-arg GIT_BRANCH=${GIT_BRANCH} \
                            -t ${FULL_IMAGE} \
                            -t ${IMAGE_NAME}:latest \
                            .
                    '''
                }
            }
        }
        
        stage('Push to ACR') {
            steps {
                script {
                    echo "========== Pushing image to Azure Container Registry =========="
                    sh '''
                        echo ${REGISTRY_CREDS_PSW} | docker login -u ${REGISTRY_CREDS_USR} --password-stdin ${REGISTRY_URL}
                        docker push ${FULL_IMAGE}
                        docker push ${IMAGE_NAME}:latest
                        docker logout ${REGISTRY_URL}
                    '''
                }
            }
        }
        
        stage('Deploy to AKS') {
            steps {
                script {
                    echo "========== Deploying to AKS Cluster =========="
                    sh '''
                        export KUBECONFIG=${KUBECONFIG}
                        kubectl cluster-info
                        kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                        kubectl set image deployment/${K8S_DEPLOYMENT} \
                            ${APP_NAME}=${FULL_IMAGE} \
                            -n ${K8S_NAMESPACE} \
                            --record
                        kubectl rollout status deployment/${K8S_DEPLOYMENT} \
                            -n ${K8S_NAMESPACE} \
                            --timeout=5m
                    '''
                }
            }
        }
        
        stage('Smoke Tests') {
            steps {
                script {
                    echo "========== Running Smoke Tests =========="
                    sh '''
                        kubectl get pods -n ${K8S_NAMESPACE}
                    '''
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker logout ${REGISTRY_URL} || true'
        }
        success {
            echo "========== Build Successful =========="
        }
        failure {
            echo "========== Build Failed =========="
        }
    }
}
