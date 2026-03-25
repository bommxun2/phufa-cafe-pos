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

# Add Trivy Repository and Install
cat << EOF > /etc/yum.repos.d/trivy.repo
[trivy]
name=Trivy repository
baseurl=https://pkg.trivy.dev/rpm/releases/\$basearch/
gpgcheck=1
enabled=1
gpgkey=https://pkg.trivy.dev/rpm/public.key
EOF

dnf install -y trivy

# Download and Run OpenTofu install script
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh -o /tmp/install-opentofu.sh
chmod +x /tmp/install-opentofu.sh
/tmp/install-opentofu.sh --install-method standalone
rm -f /tmp/install-opentofu.sh