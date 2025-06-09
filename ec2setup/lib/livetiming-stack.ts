import * as cdk from 'aws-cdk-lib';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { GenericLinuxImage, InstanceClass, InstanceSize, InstanceType, IpAddresses, KeyPair, KeyPairType, Peer, Port, SecurityGroup, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ListenerCertificate, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
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

        // ami-0fbf281c629915e76

        // der kann nur in der gleichen region sein
        const cert_arn = ListenerCertificate.fromArn('arn:aws:acm:eu-central-1:654384432543:certificate/a81cf6df-d492-4919-a10a-aa64d8aa6bd2')

        const httpsListener = alb.addListener('SSLListener', {
            port: 443,
            protocol: ApplicationProtocol.HTTPS,
            sslPolicy: SslPolicy.RECOMMENDED,
            certificates: [cert_arn]
        })

        const userData = UserData.forLinux();

        // Add user data that is used to configure the EC2 instance
        userData.addCommands(
            'apt update -y',
        );

        const keyPair = KeyPair.fromKeyPairAttributes(this, 'KeyPair', {
            keyPairName: 'ec2-key-pair',
            type: KeyPairType.RSA,
        })

        const baseasg = new AutoScalingGroup(this, 'baseasg', {
            vpc,
            userData: userData,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC,
            },
            securityGroup: webserverSG,
            instanceType: InstanceType.of(
                InstanceClass.T2,
                InstanceSize.MICRO,
            ),
            //machineImage: new ec2.AmazonLinuxImage({
            //  generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            //}),
            machineImage: new GenericLinuxImage({
                'eu-central-1': 'ami-0fbf281c629915e76'
            }),
            keyPair: keyPair,
            minCapacity: 1,
            maxCapacity: 1,
        });

        httpsListener.addTargets('https-target', {
            port: 8080,
            protocol: ApplicationProtocol.HTTP,
            targets: [baseasg],
        });

        const myZone = HostedZone.fromHostedZoneAttributes(this, 'swimdata.de',
            {
                hostedZoneId: 'Z02356492TI9XLJ8MG2C1',
                zoneName: 'swimdata.de'
            });

        const record = new ARecord(this, 'socket', {
            zone: myZone,
            recordName: 'socket',
            target: RecordTarget.fromAlias(new LoadBalancerTarget(alb))
        })

        new cdk.CfnOutput(this, 'recordDNS', {
            value: 'added ' + record.domainName,
        });

        new cdk.CfnOutput(this, 'albDNS', {
            value: alb.loadBalancerDnsName,
        });




    }
}
