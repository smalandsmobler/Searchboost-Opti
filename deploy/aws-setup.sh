#!/bin/bash
# AWS EC2 Setup Script för Babylovesgrowth
# Detta script sätter upp en EC2 instans och deployer Babylovesgrowth API

set -e

echo "🚀 Setting up Babylovesgrowth on AWS EC2..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTANCE_NAME="babylovesgrowth-api"
REGION="eu-north-1"  # Stockholm (ändra om du vill)
INSTANCE_TYPE="t3.micro"
AMI_ID="ami-0014ce3e52359afbd"  # Ubuntu 22.04 LTS (eu-north-1)

echo -e "${BLUE}Step 1: Creating EC2 instance...${NC}"
# Du behöver köra detta manuellt via AWS Console eller CLI
# Här är AWS CLI-kommandona om du vill automatisera:

cat << 'EOF'
# AWS CLI Commands (kör dessa om du har AWS CLI installerat):

# 1. Skapa Security Group
aws ec2 create-security-group \
  --group-name babylovesgrowth-sg \
  --description "Security group for Babylovesgrowth API" \
  --region eu-north-1

# 2. Öppna portar (HTTP, HTTPS, SSH)
aws ec2 authorize-security-group-ingress \
  --group-name babylovesgrowth-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region eu-north-1

aws ec2 authorize-security-group-ingress \
  --group-name babylovesgrowth-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 \
  --region eu-north-1

aws ec2 authorize-security-group-ingress \
  --group-name babylovesgrowth-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 \
  --region eu-north-1

aws ec2 authorize-security-group-ingress \
  --group-name babylovesgrowth-sg \
  --protocol tcp --port 3000 --cidr 0.0.0.0/0 \
  --region eu-north-1

# 3. Skapa EC2 Instance (kräver key pair)
aws ec2 run-instances \
  --image-id ami-0014ce3e52359afbd \
  --instance-type t3.micro \
  --key-name YOUR_KEY_NAME \
  --security-groups babylovesgrowth-sg \
  --region eu-north-1 \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=babylovesgrowth-api}]'

# 4. Allokera Elastic IP
aws ec2 allocate-address --domain vpc --region eu-north-1

# 5. Associera Elastic IP med instansen (använd instance-id och allocation-id från ovan)
aws ec2 associate-address \
  --instance-id i-XXXXXXXXX \
  --allocation-id eipalloc-XXXXXXXXX \
  --region eu-north-1

EOF

echo -e "${GREEN}✅ AWS CLI commands printed above${NC}"
echo ""
echo "After you have the EC2 instance running, use the deployment script below..."
