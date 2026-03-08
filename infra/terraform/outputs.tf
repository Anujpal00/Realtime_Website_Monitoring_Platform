output "backend_ecr_repository_url" {
  description = "Backend ECR repo URI."
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "Frontend ECR repo URI."
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_ecr_repository_name" {
  description = "Backend ECR repo name."
  value       = aws_ecr_repository.backend.name
}

output "frontend_ecr_repository_name" {
  description = "Frontend ECR repo name."
  value       = aws_ecr_repository.frontend.name
}

output "ec2_instance_id" {
  description = "EC2 instance ID."
  value       = aws_instance.app.id
}

output "ec2_public_ip" {
  description = "Public IP of application server."
  value       = aws_instance.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS of application server."
  value       = aws_instance.app.public_dns
}

output "frontend_url" {
  description = "Frontend URL."
  value       = "http://${aws_instance.app.public_ip}"
}

output "backend_health_url" {
  description = "Backend health endpoint."
  value       = "http://${aws_instance.app.public_ip}:4000/api/health"
}
