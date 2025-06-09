# Cloud Setup

## prepare

``` bash
# # aws cli needs to be installed
# install cdk
npm install -g aws-cdk
npm install -g typescript
# configure accounts
aws configure
```

### Roles in AWS

* IAMCreateRole - selbst erzeugt Richtlinie

### Certificates

Cloud front certificates manual config  

* cloudfront need to be ssl
* forward ssl to sockets
  
for easywk and Websocket a certificate need to bee prepared, add arn in cdk script

### Install CDK scripts

```bash
# build
tsc

# run
cdk list
cdk bootstrap --profile setup

# deploys all
cdk deploy --profile setup

# destroy all
cdk destroy --profile setup --all
```

## EasyWk

### setup

The script spins up one ec2 server with php and DNS entry easywk.swimdata.de

```bash
cdk deploy EasyWk --profile setup
```

### sync: prepare and test

```bash
# check ssh connect - ip of server
scp -i ~/.aws/ec2-key-pair.pem * ubuntu@3.72.35.118:/var/www/html
## rsync test
# rsync -chavzP --stats user@remote.host:/path/to/copy /path/to/local/storage
rsync -avP -e "ssh -i /home/rock/.aws/ec2-key-pair.pem" ubuntu@3.72.35.118:/var/www/html /opt/shared/lenex/sad/live
```

### sync: cron and srcript

```bash
# cron
*/5 * * * * /home/rock/start_easywk_sync.sh
```

start_easywk_sync.sh

```bash
#!/bin/bash

echo ""  >>  /home/rock/rsync.log

echo "#####" >>  /home/rock/rsync.log

date >> /home/rock/rsync.log

/usr/bin/rsync -avP -e "ssh -i /home/rock/.aws/ec2-key-pair.pem" /opt/shared/lenex/sad/live/* ubuntu@3.72.35.118:/var/www/html >> /home/rock/rsync.log
```

## LiveTiming

### Messaging

Setup base SQS and IoT

```bash
cdk deploy Messaging --profile setup
```

[IoT Configs](aws/Readme.md)

### BuildImage

To use with live timing stack

```bash
cdk deploy BuildImage --profile setup
```

Use ansibelswim projekt

* add host with ip to inventory

```bash
ansible-playbook -i inventories/production/hosts awsWSService.yml -e global_clean_all=true --limit=wsaws
```

* check acces on port 8080 - see output of cdk build

### LiveTiming setup

The script spins up one ec2 server with all services to push messages from local mqtt

```bash
cdk deploy LiveTiming --profile setup
```

check queues

```bash
aws configure list
aws sts get-caller-identity
# SQS
aws sqs list-queues
# keyspace
```

## old need to be updated

### Websocket only

```bash
cdk deploy WebSocketOnly --profile setup
# add IP Addreses and keys to ansible (wsaws)
ansible-playbook -i inventories/production/hosts awsWSService.yml --limit=wsaws -e global_clean_all=true
```

## deploy

```bash
cd keyspaces
cdk deploy
```

## check cassandra access

download cert curl https://certs.secureserver.net/repository/sf-class2-root.crt -O

```bash
# cassandra.eu-central-1.amazonaws.com
# ssl_context = SSLContext(PROTOCOL_TLSv1_2)
export SSL_CERTFILE=sf-class2-root.crt
cqlsh cassandra.eu-central-1.amazonaws.com 9142 -u "<generated-keyspace-useranme>" -p "<generated-keyspace-password>" --ssl --ssl_context PROTOCOL_TLSv1_2
```

## docs

<https://dev.to/chathra222/create-managed-cassendra-database-keyspaces-using-aws-cdk-4el4>
