# Cloud Setup

## prepare

``` bash
# # aws cli needs to be installed
# install cdk
npm i -g aws-cdk
# configure accounts
aws configure
```

## check access rights

```bash
aws configure list
aws sts get-caller-identity
# SQS
aws sqs list-queues
# keyspace
```

## Install

### EC2

```bash
cdk deploy Ec2Stack --profile setup
```

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
