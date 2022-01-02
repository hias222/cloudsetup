import * as iam from '@aws-cdk/aws-iam';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import * as iot from '@aws-cdk/aws-iot';
import * as cassandra from '@aws-cdk/aws-cassandra';
import * as tableColumns from './tableColumns';

export class KeyspacesStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    var keyspaceName = 'colorado';
    var tableNameHeatdata = 'heatdata';
    var tableNameHeatids = 'heatids';

    const keyspace = new cassandra.CfnKeyspace(this, keyspaceName, {
      keyspaceName: keyspaceName
    });

    new cassandra.CfnTable(this, tableNameHeatdata, {
      tableName: tableNameHeatdata,
      keyspaceName: keyspaceName,
      partitionKeyColumns: [{
        columnName: 'heatid',
        columnType: 'uuid',
      }],
      defaultTimeToLive: 0,
      regularColumns: tableColumns.heatdata
    }).addDependsOn(keyspace)

    // ordering missing
    new cassandra.CfnTable(this, tableNameHeatids, {
      tableName: tableNameHeatids,
      keyspaceName: keyspaceName,
      partitionKeyColumns: [{
        columnName: 'wkid',
        columnType: 'int',
      }
      ],
      clusteringKeyColumns: [{
        column: {
          columnName: 'creation_date',
          columnType: 'timestamp',
        },
        orderBy: 'DESC'
      }],
      defaultTimeToLive: 0,
      regularColumns: tableColumns.heatids
    }).addDependsOn(keyspace)

    const storechannelQueue = new sqs.Queue(this, 'storechannel', {
      visibilityTimeout: cdk.Duration.seconds(300),
      queueName: 'cdkstorechannel',
      retentionPeriod: cdk.Duration.seconds(1800),
    });

    const mainchannelQueue = new sqs.Queue(this, 'mainchannel', {
      visibilityTimeout: cdk.Duration.seconds(300),
      queueName: 'cdkmainchannel',
      retentionPeriod: cdk.Duration.seconds(1800),
    });

    const iotActionsRole = new iam.Role(this, 'iot-actions-role', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com')
    });

    mainchannelQueue.grantSendMessages(iotActionsRole)
    storechannelQueue.grantSendMessages(iotActionsRole)

    const sqsMainActionProperty: iot.CfnTopicRule.SqsActionProperty = {
      queueUrl: mainchannelQueue.queueUrl,
      roleArn: iotActionsRole.roleArn
    };

    const mainActionProperty: iot.CfnTopicRule.ActionProperty = {
      sqs: sqsMainActionProperty,
    }

    const sqsMainPayloadProperty: iot.CfnTopicRule.TopicRulePayloadProperty = {
      actions: [mainActionProperty],
      sql: "SELECT * FROM 'mainchannel'",
    };

    new iot.CfnTopicRule(this, 'IotTopicMain', {
      ruleName: "cdkmainchannel",
      topicRulePayload: sqsMainPayloadProperty
    });


    const sqsStoreActionProperty: iot.CfnTopicRule.SqsActionProperty = {
      queueUrl: storechannelQueue.queueUrl,
      roleArn: iotActionsRole.roleArn
    };

    const storeActionProperty: iot.CfnTopicRule.ActionProperty = {
      sqs: sqsStoreActionProperty,
    }

    const sqsStorePayloadProperty: iot.CfnTopicRule.TopicRulePayloadProperty = {
      actions: [storeActionProperty],
      sql: "SELECT * FROM 'storechannel'",
    };

    new iot.CfnTopicRule(this, 'IotTopicStore', {
      ruleName: "cdkstorechannel",
      topicRulePayload: sqsStorePayloadProperty
    });

    new cdk.CfnOutput(this, 'mainchannelQueue', {
      value: mainchannelQueue.queueUrl,
    });

    new cdk.CfnOutput(this, 'storechannelQueue', {
      value: storechannelQueue.queueUrl,
    });

  }
}
