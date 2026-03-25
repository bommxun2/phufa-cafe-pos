resource "aws_db_subnet_group" "aurora_subnet_group" {
  name       = "aurora-subnet-group"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]

  tags = {
    Name = "Aurora DB Subnet Group"
  }
}

resource "aws_rds_cluster" "aurora_cluster" {
  cluster_identifier      = "phufa-aurora-cluster"
  engine                  = "aurora-mysql"
  database_name           = "phufadb"
  master_username         = "admin"
  master_password         = "YourStrongPassword123!"
  db_subnet_group_name    = aws_db_subnet_group.aurora_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  skip_final_snapshot     = true

  tags = {
    Name = "Aurora MariaDB Compatible Cluster"
  }
}

resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = 1
  identifier         = "phufa-aurora-instance-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora_cluster.id
  instance_class     = "db.t3.medium"
  engine             = aws_rds_cluster.aurora_cluster.engine
  engine_version     = aws_rds_cluster.aurora_cluster.engine_version
  db_subnet_group_name = aws_db_subnet_group.aurora_subnet_group.name
}