import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { elasticBeanstalkConfig } from './eb-config';
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env variables

export class KaitoApplicationStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Step 1: Create an S3 Bucket
    const myBucket = new s3.Bucket(this, `${id}-test-bucket`, {
      bucketName: process.env.BUCKET_NAME!,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Step 2: Elastic Beanstalk Application
    const ebApp = new elasticbeanstalk.CfnApplication(this, 'MyElasticBeanstalkApp', {
      applicationName: process.env.EB_APP_NAME!
    });

    // Step 3: IAM Role for Beanstalk EC2 Instances (Instance Profile)
    const instanceRole = new iam.Role(this, 'MyBeanstalkInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      ]
    });

    const instanceProfile = new iam.CfnInstanceProfile(this, 'MyInstanceProfile', {
      roles: [instanceRole.roleName]
    });

    // Step 4: Elastic Beanstalk Environment (Using Platform ARN)
    const ebEnv = new elasticbeanstalk.CfnEnvironment(this, 'MyElasticBeanstalkEnv', {
      environmentName: process.env.EB_ENV_NAME!,
      applicationName: ebApp.applicationName!,
      platformArn: process.env.PLATFORM_ARN!,
      optionSettings: [
        ...elasticBeanstalkConfig,
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: instanceProfile.ref
        }
      ]
    });

    const schemaCreatorLambda = new nodejs.NodejsFunction(this, 'SchemaCreatorLambda', {
      functionName: 'Kaito-SchemaCreator',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: 'lib/lambda/schema_creator.ts',
      environment: {
          DB_HOST: process.env.DB_HOST!,
          DB_DATABASE: process.env.DB_DATABASE!,
          DB_USER: process.env.DB_USER!,
          DB_PASSWORD: process.env.DB_PASSWORD!,
          DB_PORT: process.env.DB_PORT || '5432',
          DB_SCHEMA: process.env.DB_SCHEMA!
      }
  });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', { value: myBucket.bucketName });
    new cdk.CfnOutput(this, 'ElasticBeanstalkEnv', { value: ebEnv.ref });
  }
}

const app = new cdk.App();
new KaitoApplicationStack(app, 'KaitoApplicationStack');
app.synth();
