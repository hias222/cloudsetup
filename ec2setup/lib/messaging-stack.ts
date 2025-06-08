import * as cdk from 'aws-cdk-lib';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export default class MessagingStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // VPC
        const vpc = new Vpc(this, 'messaging-vpc', {
            // ipAddresses: IpAddresses.cidr('10.10.0.0/16'),
            natGateways: 0,
            subnetConfiguration: [
                { name: 'public', cidrMask: 24, subnetType: SubnetType.PUBLIC },
            ],
        });

    }
}
