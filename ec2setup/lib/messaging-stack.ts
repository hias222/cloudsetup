import * as cdk from 'aws-cdk-lib';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export default class MessagingStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const mainchannelQueue = new Queue(this, 'mainchannel', {
            visibilityTimeout: cdk.Duration.seconds(300),
            queueName: 'cdkmainchannel',
            retentionPeriod: cdk.Duration.seconds(1800),
        });

        const iotActionsRole = new Role(this, 'iot-actions-role', {
            assumedBy: new ServicePrincipal('iot.amazonaws.com')
        });

        mainchannelQueue.grantSendMessages(iotActionsRole)

        const sqsMainActionProperty: CfnTopicRule.SqsActionProperty = {
            queueUrl: mainchannelQueue.queueUrl,
            roleArn: iotActionsRole.roleArn
        };

        const mainActionProperty: CfnTopicRule.ActionProperty = {
            sqs: sqsMainActionProperty,
        }

        const sqsMainPayloadProperty: CfnTopicRule.TopicRulePayloadProperty = {
            actions: [mainActionProperty],
            sql: "SELECT * FROM 'mainchannel'",
        };

        new CfnTopicRule(this, 'IotTopicMain', {
            ruleName: "cdkmainchannel",
            topicRulePayload: sqsMainPayloadProperty
        });

        new cdk.CfnOutput(this, 'mainchannelQueue', {
            value: mainchannelQueue.queueUrl,
        });

    }
}
