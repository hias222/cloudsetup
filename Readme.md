# Cloud Setup

## prepare

``` bash
# # aws cli needs to be installed
# install cdk
npm i -g aws-cdk
# configure accounts
aws configure
```

### Certificates

Cloud front certificates manual config  

* cloudfront need to be ssl
* forward ssl to sockets
  
for Websocket a certificate need to bee prepared, add arn script

## check access rights

```bash
aws configure list
aws sts get-caller-identity
# SQS
aws sqs list-queues
# keyspace
```

## ec2setup

```bash
# global
npm install -g typescript

# build
tsc

# run
cdk list
cdk bootstrap --profile setup
cdk deploy --profile setup
```

## keyspaces

### ec2

```bash
cdk deploy Ec2Stack --profile setup
```

```bash
# copy data
scp -i ~/.aws/ec2-key-pair.pem * ubuntu@3.72.35.118:/var/www/html
##
rsync -chavzP --stats user@remote.host:/path/to/copy /path/to/local/storage
rsync -avP -e "ssh -i /home/rock/.aws/ec2-key-pair.pem" ubuntu@3.72.35.118:/var/www/html /opt/shared/lenex/sad/live
```

```bash
# cron
*/5 * * * * /home/rock/start_easywk_sync.sh

# start_easywk_sync.sh

#!/bin/bash

echo ""  >>  /home/rock/rsync.log

echo "#####" >>  /home/rock/rsync.log

date >> /home/rock/rsync.log

/usr/bin/rsync -avP -e "ssh -i /home/rock/.aws/ec2-key-pair.pem" /opt/shared/lenex/sad/live/* ubuntu@3.72.35.118:/var/www/html >> /home/rock/rsync.log

### Keyspaces

```bash
cdk deploy KeyspacesStack
```

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

# check cassandra access

download cert curl https://certs.secureserver.net/repository/sf-class2-root.crt -O

```bash
# cassandra.eu-central-1.amazonaws.com
# ssl_context = SSLContext(PROTOCOL_TLSv1_2)
export SSL_CERTFILE=sf-class2-root.crt
cqlsh cassandra.eu-central-1.amazonaws.com 9142 -u "<generated-keyspace-useranme>" -p "<generated-keyspace-password>" --ssl --ssl_context PROTOCOL_TLSv1_2
```

## docs

<https://dev.to/chathra222/create-managed-cassendra-database-keyspaces-using-aws-cdk-4el4>
