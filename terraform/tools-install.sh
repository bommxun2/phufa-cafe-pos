#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update OS packages
dnf update -y

# Install and configure Docker
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user
chmod 666 /var/run/docker.sock

# Run Jenkins Container
docker volume create jenkins_home
docker run -d --name jenkins \
  --restart always \
  -u root \
  -p 8080:8080 \
  -p 50000:50000 \
  -e JENKINS_OPTS="--prefix=/jenkins-start" \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk21

# Set vm.max_map_count for SonarQube and Run Container
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
sysctl -p

docker run -d --name sonarqube \
  --restart always \
  -p 9000:9000 \
  -e SONAR_WEB_CONTEXT=/sonarqube \
  sonarqube:community

# Installing Base Packages & Docker CLI
sudo docker exec -u root jenkins apt-get update
sudo docker exec -u root jenkins apt-get install -y docker.io curl unzip

# Download and Run OpenTofu install script
sudo docker exec -u root jenkins bash -c "\
  apt-get update && \
  apt-get install -y curl unzip && \
  curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o install-opentofu.sh && \
  chmod +x install-opentofu.sh && \
  ./install-opentofu.sh --install-method standalone && \
  rm install-opentofu.sh"

# Installing AWS CLI
sudo docker exec -u root jenkins curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo docker exec -u root jenkins unzip -q awscliv2.zip
sudo docker exec -u root jenkins ./aws/install
sudo docker exec -u root jenkins rm -rf awscliv2.zip aws

# Installing Trivy
sudo docker exec -u root jenkins bash -c "curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"