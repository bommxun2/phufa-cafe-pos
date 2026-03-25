terraform {
  required_providers {
    aws = {
      source = "opentofu/aws"
      version = "6.37.0"
    }
  }
  backend "s3" {
    bucket       = "prod-pos-tf-bucket"
    region       = "us-east-1"
    key          = "pos/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}