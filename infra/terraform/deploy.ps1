param(
  [string]$AwsRegion = "us-east-1",
  [string]$ImageTag = "",
  [string]$TfDir = "infra/terraform",
  [string]$RepoRoot = "."
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ImageTag)) {
  try {
    $ImageTag = (git rev-parse --short HEAD).Trim()
  } catch {
    $ImageTag = "latest"
  }
}

$tfPath = Resolve-Path $TfDir
$rootPath = Resolve-Path $RepoRoot

Write-Host "Terraform init..."
terraform -chdir="$tfPath" init

Write-Host "Creating/ensuring ECR repositories..."
terraform -chdir="$tfPath" apply -auto-approve `
  -var "aws_region=$AwsRegion" `
  -target=aws_ecr_repository.backend `
  -target=aws_ecr_repository.frontend

$accountId = (aws sts get-caller-identity --query Account --output text).Trim()
$registry = "$accountId.dkr.ecr.$AwsRegion.amazonaws.com"

Write-Host "Logging in to ECR..."
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $registry

Write-Host "Building backend image..."
docker build -t "$registry/realmonitor-backend:$ImageTag" "$rootPath/backend"
docker tag "$registry/realmonitor-backend:$ImageTag" "$registry/realmonitor-backend:latest"

Write-Host "Building frontend image..."
docker build -t "$registry/realmonitor-frontend:$ImageTag" "$rootPath/frontend"
docker tag "$registry/realmonitor-frontend:$ImageTag" "$registry/realmonitor-frontend:latest"

Write-Host "Pushing backend image..."
docker push "$registry/realmonitor-backend:$ImageTag"
docker push "$registry/realmonitor-backend:latest"

Write-Host "Pushing frontend image..."
docker push "$registry/realmonitor-frontend:$ImageTag"
docker push "$registry/realmonitor-frontend:latest"

Write-Host "Deploying EC2 stack with image tag $ImageTag ..."
terraform -chdir="$tfPath" apply -auto-approve `
  -var "aws_region=$AwsRegion" `
  -var "image_tag=$ImageTag"

Write-Host "Done. Deployed image tag: $ImageTag"
