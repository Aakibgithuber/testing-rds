#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { KaitoApplicationStack } from '../lib/deploy-stack';
import * as projectConfig from '../config/projectConfig.json';

const app = new cdk.App();

new KaitoApplicationStack(app, 'KaitoApplicationStack', {
  stackName: `${projectConfig.projectPrefix}-pipeline-stack`,
  env: {
    region: projectConfig.environments.DEV.region,
  },
});