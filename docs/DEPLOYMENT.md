# Deployment Guide (AWS EC2 Example)

## 1) Provision EC2

- Ubuntu 22.04 LTS
- Open ports: 22 (SSH), 3000 (frontend), 4000 (backend), 9090 (Prometheus)

## 2) Install Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

## 3) Deploy

```bash
git clone <your-repo>
cd realmonitor
docker compose up --build -d
```

## 4) Verify

- Frontend: http://<EC2_PUBLIC_IP>:3000
- Backend: http://<EC2_PUBLIC_IP>:4000/api/health
- Prometheus: http://<EC2_PUBLIC_IP>:9090

## Notes

- For **real host metrics**, run Node Exporter directly on the EC2 host or use host networking.
- For production security, put the frontend + backend behind an Nginx reverse proxy and configure HTTPS.

## Terraform + ECR + EC2 (Direct, No GitHub CI/CD)

Terraform files are in `infra/terraform`.

### What gets created

- ECR repos: `realmonitor-backend`, `realmonitor-frontend`
- EC2 instance (Ubuntu) with Docker + Docker Compose
- IAM role/profile for EC2 to pull from ECR
- Security group with ports `22,3000,4000,9090,9100,9115`

### Terraform apply only (no CI/CD, no wrapper script)

From `infra/terraform`:

```bash
terraform init
terraform apply -var aws_region=us-east-1 -var image_tag=v1
```

This `terraform apply` does local Docker build -> ECR push -> EC2 deployment.
