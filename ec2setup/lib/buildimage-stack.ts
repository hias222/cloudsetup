import * as cdk from 'aws-cdk-lib';
import { GenericLinuxImage, Instance, InstanceClass, InstanceSize, InstanceType, IpAddresses, KeyPair, KeyPairType, Peer, Port, SecurityGroup, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export default class BuildImageStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC
        const vpc = new Vpc(this, 'buildimage-vpc', {
            // ipAddresses: IpAddresses.cidr('10.10.0.0/16'),
            natGateways: 0,
            subnetConfiguration: [
                { name: 'public', cidrMask: 24, subnetType: SubnetType.PUBLIC },
            ],
        });

        // 👇 create Security Group for the Instance
        const buildimage = new SecurityGroup(this, 'buildimage', {
            vpc,
            allowAllOutbound: true,
        });

        buildimage.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(22),
            'allow SSH access from anywhere',
        );

        buildimage.addIngressRule(
            Peer.anyIpv4(),
            Port.tcp(8080),
            'allow http 8080 for test'
        );


        const keyPair = KeyPair.fromKeyPairAttributes(this, 'KeyPair', {
            keyPairName: 'ec2-key-pair',
            type: KeyPairType.RSA,
        })

        const userData = UserData.forLinux();

        // Add user data that is used to configure the EC2 instance
        userData.addCommands(
            'apt update -y',
        )

        // 👇 create the EC2 Instance

        const ec2Instance = new Instance(this, 'ec2-image', {
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC,
            },
            keyPair: keyPair,
            userData: userData,
            securityGroup: buildimage,
            instanceType: InstanceType.of(
                InstanceClass.T2,
                InstanceSize.MICRO,
            ),
            machineImage: new GenericLinuxImage({
                'eu-central-1': 'ami-0fbf281c629915e76'
            }),

            /*

             // ami-0fbf281c629915e76 fertiges image
             // ami-014dd8ec7f09293e6 frisches image

            instanceType: InstanceType.of(
            InstanceClass.T4G,
            InstanceSize.MICRO,
            ),
            machineImage: new GenericLinuxImage({
                'eu-central-1': 'ami-083b72f9e766cbb7c'
            }),
            */

        });

        new cdk.CfnOutput(this, 'ec2Instance', {
            value: 'ssh -i ~/.aws/ec2-key-pair.pem ubuntu@' + ec2Instance.instancePublicIp
        });

        new cdk.CfnOutput(this, 'ec2Instance_http', {
            value: 'nginx: http://' + ec2Instance.instancePublicIp + ':8080/health'
        });

        new cdk.CfnOutput(this, 'ec2InstanceID', {
            value: 'aus der Instance ' + ec2Instance.instanceId + ' ueber die Oberflache ein image erstellen (rechtsklick, dropdown image)'
        });

    }
}
