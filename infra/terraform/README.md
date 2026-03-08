# RealMonitor Terraform Direct Deploy (ECR + EC2)

This Terraform stack creates:

- 1 EC2 instance (Ubuntu)
- 2 ECR repositories (`backend`, `frontend`)
- IAM role/profile for EC2 to pull from ECR
- Security group for app + monitoring ports
- User-data bootstrap that installs Docker and runs containers using `docker run`
- No Elastic IP (uses EC2 public IP only)

## Files

- `main.tf`: AWS resources
- `variables.tf`: all configurable values
- `outputs.tf`: ECR and EC2 outputs
- `user_data.sh.tftpl`: boot script that starts containers on EC2

## Prerequisites

- Terraform `>= 1.5`
- AWS CLI authenticated with an account that can create EC2/IAM/ECR/SG resources
- Optional: existing EC2 key pair if you want SSH access

## Direct deployment with `terraform apply` only

From `infra/terraform`:

```bash
terraform init
terraform apply -var aws_region=us-east-1 -var image_tag=v1
```

After `terraform init`, `terraform apply` will:

1. create/ensure ECR repos
2. provision/update EC2 and run containers from ECR images you already pushed manually

Optional safer SSH rule:

```bash
terraform apply -var allowed_ssh_cidr=<YOUR_PUBLIC_IP>/32 -var aws_region=us-east-1 -var image_tag=v1
```

## Prerequisites

- AWS CLI authenticated locally
- Terraform runs from a PowerShell-capable shell (Windows PowerShell or PowerShell 7)

If your AWS session is temporary (SSO/STS), refresh before apply:

```bash
aws sso login
aws sts get-caller-identity
```

If AWS CLI shows `Unknown output type: Json`, fix profile output format:

```bash
aws configure set output json
```

## Roll out a new version

Deploy a new image tag (for example commit SHA):

```bash
terraform apply -var aws_region=us-east-1 -var image_tag=<new-tag>
```

Terraform updates EC2 user-data so the host pulls the new images and starts containers.
