import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as route53 from '@aws-cdk/aws-route53';
import * as alias from '@aws-cdk/aws-route53-targets';
import * as iam from '@aws-cdk/aws-iam';
import * as sqs from '@aws-cdk/aws-sqs';
import * as iot from '@aws-cdk/aws-iot';

import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as autoscaling from '@aws-cdk/aws-autoscaling'
import { loadBalancerNameFromListenerArn } from '@aws-cdk/aws-elasticloadbalancingv2';
import { TargetTrackingScalingPolicy } from '@aws-cdk/aws-autoscaling';

export class EasyWk extends cdk.Stack {
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
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.GenericLinuxImage({
        'eu-central-1': 'ami-0d527b8c289b4af7f'
      }),
      keyName: 'ec2-key-pair',
      minCapacity: 1,
      maxCapacity: 1,
    });


    /*
    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
    });
    */

    const cert_arn = elbv2.ListenerCertificate.fromArn('arn:aws:acm:eu-central-1:654384432543:certificate/103da316-55c8-4618-b9cc-03a04a040a59')

    const listener = alb.addListener('SSLListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
      certificates: [cert_arn]
    })

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

    /*
    new elbv2.ApplicationListenerRule(this, 'wsPathListenerRuleSSL', {
      listener: ssllistener,
      priority: 5,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/ws2/*'])
      ],
      action: elbv2.ListenerAction.forward([wstarget])
    })
*/

    new cdk.CfnOutput(this, 'albDNS', {
      value: alb.loadBalancerDnsName,
    });

    const myZone = route53.HostedZone.fromHostedZoneAttributes(this, 'swimdata.de',
      {
        hostedZoneId: 'Z02356492TI9XLJ8MG2C1',
        zoneName: 'swimdata.de'
      });


    const record = new route53.ARecord(this, 'easywk', {
      zone: myZone,
      recordName: 'easywk',
      target: route53.RecordTarget.fromAlias( new alias.LoadBalancerTarget(alb))
    })

    new cdk.CfnOutput(this, 'recordDNS', {
      value: 'added ' + record.domainName,
    });


    // ARM
    // 'eu-central-1': 'ami-0b168c89474ef4301'
    //         ec2.InstanceClass.T4G,
    //     ec2.InstanceSize.MICRO,

    //x64
    // Ubuntu Server 20.04 LTS (HVM), SSD Volume Type - ami-04505e74c0741db8d
    // 'eu-central-1': 'ami-0d527b8c289b4af7f'
    //      ec2.InstanceClass.T4,
    //     ec2.InstanceSize.MICRO,
    // t2.micro

  }
}
