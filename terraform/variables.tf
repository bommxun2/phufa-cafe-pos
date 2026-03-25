variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "Public Subnet CIDR"
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "Private Subnet CIDR"
  default     = "10.0.2.0/24"
}

variable "private_subnet_2_cidr" {
  description = "Private Subnet 2 CIDR (Required for RDS)"
  default     = "10.0.3.0/24"
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t3.micro"
}