resource "aws_ecr_repository" "pos" {
  name                 = "pos-system"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
