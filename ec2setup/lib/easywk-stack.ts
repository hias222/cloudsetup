import * as cdk from 'aws-cdk-lib';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { CloudFormationInit, GenericLinuxImage, InitConfig, InitFile, InstanceClass, InstanceSize, InstanceType, KeyPair, KeyPairType, Peer, Port, SecurityGroup, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const sshPubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCutxuVIQiLAktM+lZSgiZoDlQvFREd1ap8NOjCWrMl0/rJpJvpGDifeRG4eP2nNgAFY2VbgsOZGAdPTMZHSypxfFlYGHFSWnvySt5hWN7AldRHKlWNKZ5IKilc4V1qGVrzP6GD6IdXjWOb2bxDe230tefHW4ZxxKlyHTEmq7orB93IFQSXcAEActVE4bf0fjPwIholzrQRGsCDbOewf2e8lI7N41H8An12i5OBxNj76o8dRGr2imPo/9v2ObfCqki9WbgG3HXvHDJsqKZ5IneCsao5UXREyiz3/GToOLJQAAU+ZfoAyLQcDLTS+HLiYL6Jcl9qKHhHXAA35of1zEHlxQfegvLhXFqODo9kIFy95uaLaSmC7tEinVJdJ2/p5/RcD1Ol6oSubKoXLc/h/7XeHpwwsTZ4B8F8Rt+rkOFZ18mWP5aw7+C99ylm6eF0l3yEXYyx7H5zLNZqBARoyWPwnYb9IA6s4WVmi/7YulO170x9wImyJPzO+s/0d5yauA0= MFU@QM-MOS-MFU.fritz.box'

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

    const userData = UserData.forLinux();

    // Add user data that is used to configure the EC2 instance
    userData.addCommands(
      'yum update -y',
      'mkdir -p /home/ec2-user/sample'
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

    httpListener.addTargets('MyFleet', {
      port: 8080,
      targets: [baseasg],
    });

  }
}
