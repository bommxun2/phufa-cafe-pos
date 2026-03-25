data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["137112412989"] # Amazon

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-x86_64"]
  }
}

resource "tls_private_key" "main_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "prod" {
  key_name   = "pos-system-key"
  public_key = tls_private_key.main_key.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.main_key.private_key_pem
  filename        = "${path.module}/pos-system-key.pem"
  file_permission = "0400"
}

resource "aws_instance" "nginx_proxy" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public.id
  key_name      = aws_key_pair.prod.key_name

  vpc_security_group_ids = [aws_security_group.nginx_sg.id]

  tags = {
    Name = "nginx-proxy"
  }
}

resource "aws_instance" "jenkins" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.large"
  subnet_id     = aws_subnet.private.id
  key_name      = aws_key_pair.prod.key_name
  user_data     = file("${path.module}/tools-install.sh")
  
  vpc_security_group_ids = [aws_security_group.private_instances_sg.id]
  
  tags = {
    Name = "jenkins-server"
  }
}

resource "aws_instance" "backend" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.private.id
  key_name      = aws_key_pair.prod.key_name

  vpc_security_group_ids = [aws_security_group.private_instances_sg.id]

  tags = {
    Name = "backend-server"
  }
}