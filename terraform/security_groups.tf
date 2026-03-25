resource "aws_security_group" "nginx_sg" {
  name        = "nginx_proxy_sg"
  description = "Allow HTTP, HTTPS, and SSH inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "nginx-sg"
  }
}

resource "aws_security_group" "private_instances_sg" {
  name        = "private_instances_sg"
  description = "Allow traffic from Nginx and internal VPC"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_sg.id]
  }

  ingress {
    from_port       = 8080 # Jenkins
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_sg.id]
  }

  ingress {
    from_port       = 9000 # Sonarqube
    to_port         = 9000
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_sg.id]
  }

  ingress {
    from_port       = 3000 # Grafana
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_sg.id]
  }

  ingress {
    from_port       = 5000 # Backend
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_sg.id]
  }

  ingress {
    from_port       = 9090 # Prometheus
    to_port         = 9090
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_sg.id]
  }

  ingress {
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.nginx_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "private-instances-sg"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "rds_sg"
  description = "Allow MariaDB traffic from private instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.private_instances_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-sg"
  }
}