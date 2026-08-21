# NexaCart Cloud & Deployment Guide

This guide covers local container execution, Kubernetes deployment, and AWS production cloud readiness.

---

## 1. Local Development (Docker Compose)

The entire microservice system can be launched in one command:

```bash
# Build and start all 4 containers in background
docker compose up --build -d

# Check running container status
docker compose ps

# View aggregate container logs
docker compose logs -f

# Teardown and stop containers
docker compose down
```

### Services Started:
1. `nexacart-mongodb` on port `27017`
2. `nexacart-recommendation-service` on port `8000`
3. `nexacart-backend` on port `5000`
4. `nexacart-frontend` on port `5173`

---

## 2. Kubernetes Cluster Deployment (EKS / Minikube / Kind)

Apply the production manifests in order:

```bash
# 1. Create Namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Apply ConfigMap and Secrets
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.example.yaml

# 3. Deploy MongoDB
kubectl apply -f kubernetes/mongodb.yaml

# 4. Deploy Microservices
kubectl apply -f kubernetes/recommendation-deployment.yaml
kubectl apply -f kubernetes/recommendation-service.yaml

kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/backend-service.yaml

kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml

# Verify Deployments & Pods
kubectl get pods -n nexacart -o wide
kubectl get services -n nexacart
```

---

## 3. AWS Production Architecture (AWS Ready)

```
                            ┌────────────────────────────────────────┐
                            │           AWS Route 53 (DNS)           │
                            └───────────────────┬────────────────────┘
                                                │
                                                ▼
                            ┌────────────────────────────────────────┐
                            │     AWS CloudFront (CDN + Edge)        │
                            └───────┬────────────────────────┬───────┘
                                    │ Static Assets          │ API Requests
                                    ▼                        ▼
                       ┌─────────────────────────┐  ┌─────────────────────────┐
                       │      Amazon S3          │  │ Application Load        │
                       │  (Product Images & UI)  │  │ Balancer (ALB)          │
                       └─────────────────────────┘  └────────────┬────────────┘
                                                                 │
                                                                 ▼
                                                    ┌─────────────────────────┐
                                                    │     Amazon EKS Cluster  │
                                                    │  ├── Backend Pods (Node)│
                                                    │  └── ML RecSys (FastAPI)│
                                                    └────────────┬────────────┘
                                                                 │
                                                                 ▼
                                                    ┌─────────────────────────┐
                                                    │      MongoDB Atlas      │
                                                    │  (Multi-AZ Replica Set) │
                                                    └─────────────────────────┘
```

### Key AWS Building Blocks:
- **Amazon EKS (Elastic Kubernetes Service):** Hosts containerized Node.js backend and Python FastAPI pods with Horizontal Pod Autoscalers (HPA) targeting 70% CPU utilization.
- **MongoDB Atlas on AWS:** Managed, multi-AZ replica set with automated backups, encryption at rest, and VPC peering to EKS.
- **Amazon S3 + CloudFront:** Secure storage and global CDN caching for high-resolution product photography.
- **Amazon CloudWatch & Prometheus/Grafana:** Centralized metrics, log aggregation, and error alert triggers.
