import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import * as cassandra from '@aws-cdk/aws-cassandra';

import * as tableColumns from  './tableColumns';

export class KeyspacesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'KeyspacesQueue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'KeyspacesTopic');

    var keyspaceName = 'colorado';
    var tableNameHeatdata = 'heatdata';
    var tableNameHeatids = 'heatids';

    const keyspace = new cassandra.CfnKeyspace(this, keyspaceName, {
      keyspaceName: keyspaceName
    });

    new cassandra.CfnTable(this,tableNameHeatdata,{
      tableName: tableNameHeatdata,
      keyspaceName: keyspaceName,
      partitionKeyColumns: [{
        columnName: 'heatid',
        columnType: 'uuid',
      }],
      defaultTimeToLive: 0,
      regularColumns: tableColumns.heatdata
    }).addDependsOn(keyspace)

    new cassandra.CfnTable(this,tableNameHeatids,{
      tableName: tableNameHeatids,
      keyspaceName: keyspaceName,
      partitionKeyColumns: [{
        columnName: 'wkid',
        columnType: 'int',
      },
      {
        columnName: 'creation_date',
        columnType: 'timestamp',
      }
    ],
      defaultTimeToLive: 0,
      regularColumns: tableColumns.heatids
    }).addDependsOn(keyspace)


    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
