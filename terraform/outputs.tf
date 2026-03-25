output "nginx_public_ip" {
  description = "Public IP of Nginx Proxy"
  value       = aws_instance.nginx_proxy.public_ip
}

output "jenkins_private_ip" {
  description = "Private IP of Jenkins instance"
  value       = aws_instance.jenkins.private_ip
}

output "backend_private_ip" {
  description = "Private IP of Backend instance"
  value       = aws_instance.backend.private_ip
}

output "api_gateway_url" {
  description = "Invoke URL for API Gateway"
  value       = aws_api_gateway_stage.stage.invoke_url
}

output "s3_website_endpoint" {
  description = "S3 static website hosting endpoint"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "s3_website_bucket_name" {
  description = "S3 static website bucket name"
  value       = aws_s3_bucket_website_configuration.frontend.id
}

output "rds_endpoint" {
  description = "RDS Aurora Cluster Endpoint"
  value       = aws_rds_cluster.aurora_cluster.endpoint
}

output "ecr_repository_url" {
  description = "ECR url"
  value = aws_ecr_repository.pos.repository_url
}