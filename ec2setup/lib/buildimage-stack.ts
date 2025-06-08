import * as cdk from 'aws-cdk-lib';
import { GenericLinuxImage, Instance, InstanceClass, InstanceSize, InstanceType, IpAddresses, KeyPair, KeyPairType, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
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

        const keyPair = KeyPair.fromKeyPairAttributes(this, 'KeyPair', {
            keyPairName: 'ec2-key-pair',
            type: KeyPairType.RSA,
        })

        // 👇 create the EC2 Instance

        const ec2Instance = new Instance(this, 'ec2-image', {
            vpc,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC,
            },
            keyPair: keyPair,
            securityGroup: buildimage,
            instanceType: InstanceType.of(
                InstanceClass.T2,
                InstanceSize.MICRO,
            ),
            machineImage: new GenericLinuxImage({
                'eu-central-1': 'ami-087c07a880dd0f021'
            }),

            /*
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
            value: 'ssh -i ~/.aws/ec2-key-pair.pem ec2-user@' + ec2Instance.instancePublicIp
        });

        new cdk.CfnOutput(this, 'ec2InstanceID', {
            value: 'aus der Instance ' + ec2Instance.instanceId + ' ueber die Oberflache ein image erstellen (rechtsklick, dropdown image)'
        });

    }
}
