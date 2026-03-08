variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project prefix used for resource names."
  type        = string
  default     = "realmonitor"
}

variable "instance_type" {
  description = "EC2 instance type for the application host."
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Optional EC2 key pair name for SSH access."
  type        = string
  default     = null
}

variable "image_tag" {
  description = "Container image tag to deploy for backend and frontend."
  type        = string
  nullable    = false

  validation {
    condition     = length(trimspace(var.image_tag)) > 0
    error_message = "image_tag must be provided (for example: -var image_tag=v1)."
  }
}

variable "backend_repo_name" {
  description = "ECR repository name for backend image."
  type        = string
  default     = "realmonitor-backend"
}

variable "frontend_repo_name" {
  description = "ECR repository name for frontend image."
  type        = string
  default     = "realmonitor-frontend"
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into EC2."
  type        = string
  default     = "0.0.0.0/0"
}

variable "allowed_app_cidr" {
  description = "CIDR allowed to access app ports."
  type        = string
  default     = "0.0.0.0/0"
}
