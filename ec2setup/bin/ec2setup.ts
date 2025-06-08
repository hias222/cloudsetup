#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import Ec2SetupStack from '../lib/easywk-stack';
import LiveTimingStack from '../lib/livetiming-stack';
import BuildImageStack from '../lib/buildimage-stack';

const app = new cdk.App();
new LiveTimingStack(app, "LiveTiming");
new BuildImageStack(app, "BuildImage");
new Ec2SetupStack(app, 'EasyWk', {});