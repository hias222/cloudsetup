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
