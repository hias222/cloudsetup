import * as cdk from 'aws-cdk-lib';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { CloudFormationInit, GenericLinuxImage, InitConfig, InitFile, InstanceClass, InstanceSize, InstanceType, KeyPair, KeyPairType, Peer, Port, SecurityGroup, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ListenerCertificate, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export default class EasyWk extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'easywk-vpc', {
      natGateways: 0,
      subnetConfiguration: [
        { name: 'public', cidrMask: 24, subnetType: SubnetType.PUBLIC },
      ],
      maxAzs: 2, // Default is all AZs in the region
    });

    // Create a security group for SSH
    const secgroup = new SecurityGroup(this, 'SSHSecurityGroup', {
      vpc: vpc,
      description: 'Security Group for SSH',
      allowAllOutbound: true,
    });

    secgroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22));

    const alb = new ApplicationLoadBalancer(this, 'alb', {
      vpc,
      internetFacing: true,
      idleTimeout: cdk.Duration.seconds(2000),
    });

    const httpListener = alb.addListener("httpListener", {
      port: 80,
      open: true,
    });

    // der kann nur in der gleichen region sein
    const cert_arn = ListenerCertificate.fromArn('arn:aws:acm:eu-central-1:654384432543:certificate/8bbad726-6fea-4986-bb13-0debacdd9e3c')

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
      'apt install apache2 net-tools -y',
      'apt install php libapache2-mod-php -y',
      'mkdir -p /home/ubuntu/sample',
      'systemctl restart apache2.service'
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
      securityGroup: secgroup,
      instanceType: InstanceType.of(
        InstanceClass.T2,
        InstanceSize.MICRO,
      ),
      //machineImage: new ec2.AmazonLinuxImage({
      //  generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      //}),
      machineImage: new GenericLinuxImage({
        'eu-central-1': 'ami-03250b0e01c28d196'
      }),
      keyPair: keyPair,
      minCapacity: 1,
      maxCapacity: 1,
    });

    httpListener.addTargets('test-80', {
      port: 80,
      targets: [baseasg],
    });

    httpsListener.addTargets('https-target', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targets: [baseasg],
    });

    const myZone = HostedZone.fromHostedZoneAttributes(this, 'swimdata.de',
      {
        hostedZoneId: 'Z02356492TI9XLJ8MG2C1',
        zoneName: 'swimdata.de'
      });

    const record = new ARecord(this, 'easywk', {
      zone: myZone,
      recordName: 'easywk',
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
