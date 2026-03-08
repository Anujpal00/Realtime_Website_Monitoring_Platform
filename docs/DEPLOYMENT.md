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

## CI/CD Flow (GitHub Actions)

1. Build + test on every push/PR
2. Build Docker images
3. Deploy via SSH (placeholder in `.github/workflows/ci-cd.yml`)
