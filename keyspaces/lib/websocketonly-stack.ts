import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

import * as iam from '@aws-cdk/aws-iam';
import * as sqs from '@aws-cdk/aws-sqs';
import * as iot from '@aws-cdk/aws-iot';

import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as autoscaling from '@aws-cdk/aws-autoscaling'

export class WebSocketOnly extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 create VPC in which we'll launch the Instance

    const vpc = new ec2.Vpc(this, 'colorado-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC },
      ],
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: true,
      idleTimeout: cdk.Duration.seconds(2000),
    });

    // 👇 create Security Group for the Instance
    const webserverSG = new ec2.SecurityGroup(this, 'colorado-sg', {
      vpc,
      allowAllOutbound: true,
    });

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere',
    );

    const wsasg = new autoscaling.AutoScalingGroup(this, 'wsasg', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: webserverSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO,
      ),
      //machineImage: new ec2.AmazonLinuxImage({
      //  generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      //}),
      machineImage: new ec2.GenericLinuxImage({
        'eu-central-1': 'ami-0b168c89474ef4301'
      }),
      keyName: 'ec2-key-pair',
      minCapacity: 1,
      maxCapacity: 1,
    });

    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });

    const wstarget = listener.addTargets('wstarget', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [wsasg],
      healthCheck: {
        path: '/',
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
      },
    });

    new elbv2.ApplicationListenerRule(this, 'wsPathListenerRule', {
      listener: listener,
      priority: 10,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/ws2/*'])
      ],
      action: elbv2.ListenerAction.forward([wstarget])
    })

    new cdk.CfnOutput(this, 'albDNS', {
      value: alb.loadBalancerDnsName,
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

    new cdk.CfnOutput(this, 'mainchannelQueue', {
      value: mainchannelQueue.queueUrl,
    });

  }
}
