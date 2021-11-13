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

## docs

<https://dev.to/chathra222/create-managed-cassendra-database-keyspaces-using-aws-cdk-4el4>
