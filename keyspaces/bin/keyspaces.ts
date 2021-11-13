#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { KeyspacesStack } from '../lib/keyspaces-stack';

const app = new cdk.App();
new KeyspacesStack(app, 'KeyspacesStack');
