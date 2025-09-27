## SIT722 – Real-time Voting App (FastAPI, PostgreSQL, Nginx, K8s, Prometheus, Grafana)
## Ahmad Chaudhry - s224227027

### Overview
This project is a containerized real-time voting application with a FastAPI backend, an Nginx frontend, and a PostgreSQL database. It includes CVEs vulnerability scanning, production-grade Kubernetes manifests, metrics via Prometheus scraping, a Grafana dashboard to monitor pod instances, incoming requests and CPU load, and an Horizontal Pod Autoscaler (HPA).

Watch the demo here: https://deakin.au.panopto.com/Panopto/Pages/Viewer.aspx?id=a3bdf829-51b2-4f5f-a688-b365009ced9b 

### Architecture
- **Backend (FastAPI)**: Exposes `GET /results`, `POST /vote/{option}`, `GET /metrics`, `GET /load`. Connects to PostgreSQL. File: `app/main.py`.
- **Database (PostgreSQL)**: Stateful storage via PVC. Initialized by the backend at startup.
- **Frontend (Nginx)**: Serves app and proxies `/api` to the backend service. Files under `frontend/`.
- **Observability**: Prometheus scrapes `/metrics`; Grafana dashboards for visualization.
- **Autoscaling**: HPA scales the backend based on CPU utilization.

### Tech Stack
- FastAPI, Uvicorn, psycopg2
- Nginx static site
- PostgreSQL 15 (Alpine)
- Kubernetes (Deployments, Services, PVC, HPA, RBAC, ConfigMaps, Secrets)
- Prometheus, Grafana

### Repository Layout
- `app/`: FastAPI service and Python dependencies
- `frontend/`: UI served by Nginx (`index.html`, `script.js`, `style.css`, `nginx.conf`)
- `k8s/`: Kubernetes manifests (backend, frontend, database, monitoring, autoscaling, secrets)
- `k8s/grafana-dashboards/`: Prebuilt Grafana dashboard JSON
- `docker-compose.yml`: Minimal local container for the backend (DB not included)

## Backend API
- `GET /` → Health/info
- `POST /vote/{option}` → Increments vote for `option_a` | `option_b` | `option_c`
- `GET /results` → Returns counts for all options
- `GET /metrics` → Prometheus metrics 
- `GET /load` → CPU load generator (Tt trigger HPA)

### Configuring Grafana
- A Prometheus datasource is provisioned by `k8s/grafana-deployment.yml`.
- Import dashboard from `k8s/grafana-dashboards/vote-app-dashboard.json`.

## Security Monitoring with Docker Scout

This project implements Docker Scout for comprehensive vulnerability scanning and CVE monitoring across all containerized components.

### Implementation Details

#### Container Images Scanned
- **Backend Image**: `python:3.11-slim` base image with FastAPI dependencies
- **Frontend Image**: `nginx:alpine` base image with static content
- **Database Image**: `postgres:15-alpine` (via Kubernetes deployment)

#### CVE Monitoring Features
- **Automated Scanning**: Images are scanned for vulnerabilities during CI/CD pipeline
- **Dependency Analysis**: Monitors Python packages (`requirements.txt`) and system packages
- **Base Image Monitoring**: Tracks vulnerabilities in base images (`python:3.11-slim`, `nginx:alpine`)
- **Real-time Alerts**: Notifications for newly discovered CVEs affecting deployed images
- **Severity Classification**: CVEs categorized by severity (Critical, High, Medium, Low)

#### Security Workflow
1. **Build-time Scanning**: Docker Scout analyzes images during container build process
2. **Registry Integration**: Scans images stored in container registry
3. **Deployment Validation**: Ensures only vulnerability-scanned images are deployed

### Integration with CI/CD
Docker Scout integrates seamlessly with GitHub Actions workflows to:
- Block deployments containing critical vulnerabilities
- Generate security reports for pull requests
- Maintain security compliance across development lifecycle
- Provide automated remediation suggestions

## CI Pipeline (Continuous Integration)

The CI pipeline automates the build, security scanning, and image publishing process for the voting application.

### Pipeline Overview
**Workflow**: `CI - Build and Push Images`  
**Trigger**: Push to `main` branch or manual dispatch  

### CI Pipeline Steps

#### 1. Code Checkout
- Checks out the latest code from the repository
- Uses GitHub Actions checkout action v4

#### 2. Azure Authentication
- Authenticates with Azure using service principal credentials
- Enables access to Azure Container Registry (ACR)

#### 3. Container Registry Login
- Logs into Azure Container Registry for image publishing
- Logs into Docker Hub for Docker Scout functionality

#### 4. Backend Image Build & Security Scan
- **Build**: Creates Docker image from `app/dockerfile` using `python:3.11-slim` base
- **Security Scan**: Runs Docker Scout CVE analysis
  - Scans for Critical and High severity vulnerabilities only
  - Fails pipeline if critical/high CVEs are detected
- **Push**: Publishes scanned image to ACR

#### 5. Frontend Image Build & Push
- **Build**: Creates Docker image from `frontend/dockerfile` using `nginx:alpine` base
- **Push**: Publishes image to ACR 

### Security Integration
- **Docker Scout**: Automated vulnerability scanning with severity-based blocking
- **Image Tagging**: Uses Git commit SHA for immutable, traceable image versions

## CD Pipeline (Continuous Deployment)

The CD pipeline automates the deployment of the voting application to Azure Kubernetes Service (AKS) with proper orchestration and monitoring.

### Pipeline Overview
**Workflow**: `CD - Deploy to AKS`  
**Trigger**: Successful completion of CI pipeline on `main` branch  

### CD Pipeline Steps

#### 1. Deployment Validation
- Waits for CI pipeline to complete successfully
- Checks out the specific commit that was built and tested
- Ensures only validated images are deployed

#### 2. Azure Kubernetes Service Setup
- Authenticates with Azure using service principal
- Sets AKS cluster context for deployment operations
- Connects to the target Kubernetes cluster

#### 3. Monitoring Stack Deployment
- **Prometheus**: Deploys metrics collection and scraping infrastructure
- **Grafana**: Deploys visualization dashboard with pre-configured datasources
- Establishes observability foundation before application deployment

#### 4. Database Infrastructure Deployment
- **Secrets**: Applies database credentials and connection strings
- **PostgreSQL**: Deploys stateful database with persistent volume claims
- **Health Check**: Waits for database to stabilize before proceeding
- **Service**: Exposes database internally within the cluster

#### 5. Backend Application Deployment
- **Image Update**: Updates deployment manifest with latest image from CI
- **Deployment**: Applies backend application with database connectivity
- **Service**: Exposes backend API internally
- **HPA**: Configures horizontal pod autoscaling based on CPU metrics

#### 6. Frontend Application Deployment
- **Image Update**: Updates frontend deployment with latest image from CI
- **Deployment**: Applies Nginx-based frontend serving static content
- **Service**: Exposes frontend externally for user access

### Deployment Orchestration
- **Sequential Deployment**: Database → Backend → Frontend (dependency order)
- **Health Checks**: Waits for each component to be ready before proceeding
- **Rollback Capability**: Uses Kubernetes deployment strategies for safe rollbacks
- **Zero-Downtime**: Rolling updates ensure continuous service availability

### Infrastructure as Code
- **Kubernetes Manifests**: All infrastructure defined in YAML files
- **Configuration Management**: Secrets, configmaps, and environment variables
- **Resource Management**: CPU/memory limits, persistent volumes, network policies
- **Monitoring Integration**: Prometheus scraping, Grafana dashboards, HPA metrics
