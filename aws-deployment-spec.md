# AWS Hosting & Infrastructure Technical Specification
**Application:** UICMS Creative Workflow & Management System  
**Stack:** React 19 SPA (Frontend) + PHP 8.2 / FastCGI (Backend API) + MySQL 8.0 / Amazon Aurora (Database) + Amazon S3 (Asset Storage)  
**Date:** September 2026  

---

## 1. Architectural Overview & Cloud Topology

```
                       [ Users & Enterprise Clients ]
                                     |
                                     v
                       [ AWS CloudFront (CDN + SSL) ]
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
    [ Amazon S3 (Static Web Hosting) ]           [ AWS Application Load Balancer ]
       - React 19 Frontend SPA                      - SSL / TLS Termination (ACM)
       - Dist HTML / JS / Tailwind CSS              - Route /api/* to PHP Backend
                                                           |
                                                           v
                                            +------------------------------+
                                            |   VPC Private Subnet         |
                                            |   AWS ECS Fargate / EC2      |
                                            |   (PHP 8.2-FPM + NGINX)      |
                                            +------------------------------+
                                                           |
                           +-------------------------------+-------------------------------+
                           |                                                               |
                           v                                                               v
         [ Amazon RDS MySQL 8.0 / Aurora ]                               [ Amazon S3 Bucket ]
            - Multi-AZ High Availability                                    - Proofs, Briefs & CI Assets
            - Automated Backups & KMS Encryption                           - Pre-signed secure upload URLs
```

---

## 2. Infrastructure Sizing & Compute Specifications

### Tier 1: Production (Recommended Enterprise Setup)

| Component | AWS Service | Specification / Instance Type | Purpose & Capacity |
| :--- | :--- | :--- | :--- |
| **Frontend CDN** | Amazon CloudFront | Global Edge Network + ACM SSL | Sub-50ms worldwide asset delivery, DDoS shielding |
| **Frontend Storage** | Amazon S3 | S3 Standard Bucket (Static Hosting) | Hosts compiled Vite/React bundle (`/dist`) |
| **API Backend** | AWS ECS Fargate | 2x Tasks (1 vCPU, 2 GB RAM each) | Auto-scaling PHP 8.2-FPM containers behind ALB |
| **Load Balancer** | Application Load Balancer (ALB) | Dual-AZ with HTTPS / WAF | Health checks, path-based routing (`/api/*`) |
| **Database** | Amazon RDS MySQL 8.0 | `db.t4g.medium` (2 vCPU, 4 GB RAM, 100GB gp3) | Multi-AZ Failover, Automated Snapshots |
| **Asset Storage** | Amazon S3 + S3 Transfer Accel | S3 Standard (SSE-S3 AES-256) | Client deliverable PDFs, proofs, high-res vectors |
| **Secrets & Config** | AWS Secrets Manager | Managed Key-Value Store | DB credentials, API keys, JWT secret keys |

### Tier 2: Cost-Optimized / Staging (Low Footprint)

| Component | AWS Service | Sizing | Monthly Estimate |
| :--- | :--- | :--- | :--- |
| **Full-Stack Host** | Amazon EC2 (t4g.small) | 2 vCPU, 2 GB RAM (ARM Graviton3) | ~$12 / mo |
| **Database** | Amazon RDS MySQL (Single-AZ) | `db.t4g.micro` (1 vCPU, 1 GB RAM, 20GB gp3) | ~$14 / mo |
| **Static & Assets** | Amazon S3 + CloudFront | Free Tier (5GB + 1TB transfer) | ~$2 / mo |
| **Total Staging** | | | **~$28 - $35 / mo** |

---

## 3. Step-by-Step AWS Deployment Guide

### Step 1: Database Setup (Amazon RDS MySQL)
1. Navigate to **AWS RDS Console** -> **Create Database**.
2. Engine: **MySQL Community** (Version `8.0.35` or higher) or **Amazon Aurora MySQL**.
3. Template: **Production** (Multi-AZ) or **Dev/Test**.
4. Settings:
   - DB Instance Identifier: `uicms-prod-db`
   - Master Username: `uicms_admin`
   - Master Password: Store securely in **AWS Secrets Manager**.
5. Connectivity:
   - VPC: `uicms-vpc`
   - Public Access: **No** (Database stays in private isolated database subnets).
   - Security Group: Allow port `3306` ingress **only from ECS/EC2 Security Group**.
6. Seed Database:
   - Connect via bastion host or Cloud9 and execute `/database_seed.sql`.

### Step 2: Backend Deployment (AWS ECS Fargate / Docker)
1. Build and push container to **Amazon Elastic Container Registry (ECR)**:
   ```bash
   aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com
   docker build -t uicms-php-backend ./php-backend
   docker tag uicms-php-backend:latest <ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/uicms-backend:latest
   docker push <ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/uicms-backend:latest
   ```
2. Configure **ECS Task Definition**:
   - Environment Variables:
     - `DB_HOST`: `uicms-prod-db.cxxxxxx.eu-west-1.rds.amazonaws.com`
     - `DB_NAME`: `uicms_workflow`
     - `DB_USER`: `uicms_admin`
     - `DB_PASS`: Reference ARN from AWS Secrets Manager.
     - `APP_ENV`: `production`

### Step 3: Frontend Deployment (S3 + CloudFront)
1. Build optimized production bundle:
   ```bash
   npm run build
   ```
2. Sync to S3 bucket:
   ```bash
   aws s3 sync dist/ s3://uicms-app-frontend-bucket/ --delete
   ```
3. CloudFront Distribution:
   - Origin 1: S3 Bucket (Default root `/*`)
   - Origin 2: ALB (`/api/*` forwarding directly to PHP backend)
   - Invalidate cache on each deployment:
     ```bash
     aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
     ```

---

## 4. Security & Compliance Checklist

- [x] **Network Isolation:** Database & backend instances deployed in Private Subnets with NAT Gateway.
- [x] **Data Protection at Rest:** AWS KMS encryption enabled on RDS MySQL (`aws/rds`) and S3 buckets (`AES-256`).
- [x] **Data Protection in Transit:** TLS 1.3 enforced on CloudFront and ALB via AWS Certificate Manager (ACM).
- [x] **SQL Injection Defense:** All PHP database queries utilize PDO prepared statements with parameterized inputs.
- [x] **Audit Trail Retention:** Project updates, sign-offs, and QA submissions are recorded with cryptographic SHA256 signature hashes in `activity_logs`.
