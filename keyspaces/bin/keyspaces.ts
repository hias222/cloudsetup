#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Ec2serverStack } from '../lib/ec2server-stack';
import { KeyspacesStack } from '../lib/keyspaces-stack';
import { WebSocketOnly } from '../lib/websocketonly-stack';

const app = new cdk.App();
new KeyspacesStack(app, 'KeyspacesStack');
new Ec2serverStack(app, "Ec2Stack");
new WebSocketOnly(app, "WebSocketOnly");
