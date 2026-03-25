#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update OS packages
dnf update -y
dnf install -y git wget curl unzip

# Install java 21
dnf install -y java-21-amazon-corretto-devel

# Install and configure Docker
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user
chmod 666 /var/run/docker.sock

# Install Jenkins Native
wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
dnf install -y jenkins

# Config Jenkins
mkdir -p /etc/systemd/system/jenkins.service.d/
cat <<EOF > /etc/systemd/system/jenkins.service.d/override.conf
[Service]
Environment="JENKINS_OPTS=--prefix=/jenkins-start"
EOF
systemctl daemon-reload

# Add jenkins user
usermod -aG docker jenkins

# Start and Enable Jenkins
systemctl start jenkins
systemctl enable jenkins

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
sudo tee /etc/yum.repos.d/opentofu.repo > /dev/null <<'EOF'
[opentofu]
name=opentofu
baseurl=https://packages.opentofu.org/opentofu/tofu/rpm_any/rpm_any/\$basearch
repo_gpgcheck=0
gpgcheck=1
enabled=1
gpgkey=https://get.opentofu.org/opentofu.gpg
       https://packages.opentofu.org/opentofu/tofu/gpgkey
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300

[opentofu-source]
name=opentofu-source
baseurl=https://packages.opentofu.org/opentofu/tofu/rpm_any/rpm_any/SRPMS
repo_gpgcheck=0
gpgcheck=1
enabled=1
gpgkey=https://get.opentofu.org/opentofu.gpg
       https://packages.opentofu.org/opentofu/tofu/gpgkey
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
metadata_expire=300
EOF
sudo yum update
sudo yum install -y tofu

# Install ansible
sudo yum install ansible -y

# Install libatomic
sudo dnf install libatomic -y