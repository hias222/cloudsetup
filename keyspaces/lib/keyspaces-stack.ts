import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import * as cassandra from '@aws-cdk/aws-cassandra';

export class KeyspacesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'KeyspacesQueue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'KeyspacesTopic');

    new cassandra.CfnKeyspace(this, 'colorado', {
      keyspaceName: 'colorado'
    });


    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}



/*
 ks = cassandra.CfnKeyspace(
            self, "MycassandraKeySpace", keyspace_name="MycassandraKeySpace"
        )
        cassandra.CfnTable(
            self,
            "CustomerTable",
            table_name="Customer",
            keyspace_name="MycassandraKeySpace",
            regular_columns=[
                cassandra.CfnTable.ColumnProperty(
                    column_name="name",
                    column_type="varchar",
                ),
                cassandra.CfnTable.ColumnProperty(
                    column_name="country",
                    column_type="varchar",
                ),
                cassandra.CfnTable.ColumnProperty(
                    column_name="email", column_type="varchar"
                ),
            ],
            partition_key_columns=[
                cassandra.CfnTable.ColumnProperty(
                    column_name="id", column_type="varchar"
                )
            ],
        ).add_depends_on(ks)
        */