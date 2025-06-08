import * as cdk from 'aws-cdk-lib';
import { IpAddresses, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export default class LiveTimingStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC
        const vpc = new Vpc(this, 'colorado-vpc', {
            ipAddresses: IpAddresses.cidr('10.20.0.0/16'),
            natGateways: 0,
            subnetConfiguration: [
                { name: 'public', cidrMask: 24, subnetType: SubnetType.PUBLIC },
            ],
        });

        const alb = new ApplicationLoadBalancer(this, 'alb', {
            vpc,
            internetFacing: true,
            idleTimeout: cdk.Duration.seconds(2000),
        });

        // 👇 create Security Group for the Instance
        const webserverSG = new SecurityGroup(this, 'webserverSG', {
            vpc,
            allowAllOutbound: true,
        });

        webserverSG.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(22),
            'allow SSH access from anywhere',
        );
    }
}
