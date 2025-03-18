import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { elasticBeanstalkConfig } from './eb-config';
import * as dotenv from 'dotenv';

dotenv.config(); 

// 🔹 Function to create S3 Buckets
const createBucket = (scope: Construct, id: string, bucketName: string) => {
    return new s3.Bucket(scope, id, {
        bucketName,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
};

// 🔹 Function to create Elastic Beanstalk Applications
const createBeanstalkApp = (scope: Construct, id: string, appName: string) => {
    return new elasticbeanstalk.CfnApplication(scope, id, {
        applicationName: appName
    });
};

// 🔹 Function to create IAM Roles
const createInstanceRole = (scope: Construct, id: string) => {
    const instanceRole = new iam.Role(scope, `${id}-Role`, {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
        ]
    });

    return new iam.CfnInstanceProfile(scope, `${id}-InstanceProfile`, {
        roles: [instanceRole.roleName]
    });
};

// 🔹 Function to create Elastic Beanstalk Environments
const createBeanstalkEnv = (scope: Construct, id: string, appName: string, instanceProfileRef: string) => {
    return new elasticbeanstalk.CfnEnvironment(scope, id, {
        environmentName: `${appName}-env`,
        applicationName: appName,
        platformArn: "arn:aws:elasticbeanstalk:ap-south-1::platform/Docker running on 64bit Amazon Linux 2023/4.4.4",
        optionSettings: [
            ...elasticBeanstalkConfig,
            {
                namespace: 'aws:autoscaling:launchconfiguration',
                optionName: 'IamInstanceProfile',
                value: instanceProfileRef
            }
        ]
    });
};

// 🔹 Function to create Lambda Functions
const createSchemaCreatorLambda = (scope: Construct, id: string) => {
    return new nodejs.NodejsFunction(scope, id, {
        functionName: `${id}`,
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
};

// 🔹 Function to create CloudFront Distribution
const createCloudFront = (scope: Construct, id: string, endpointUrl: string) => {
    return new cloudfront.Distribution(scope, id, {
        defaultBehavior: {
            origin: new origins.HttpOrigin(endpointUrl),
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        }
    });
};

// 🔹 Main Stack Definition
export class KaitoApplicationStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // S3 Buckets
        const bucket1 = createBucket(this, `${id}-bucket1`, "kaito-test-bucket-123");
        const bucket2 = createBucket(this, `${id}-bucket2`, "kaito-test-bucket-456");

        // Elastic Beanstalk Applications
        const ebApp1 = createBeanstalkApp(this, 'MyElasticBeanstalkApp1', "kaito-eb-app-1");
        const ebApp2 = createBeanstalkApp(this, 'MyElasticBeanstalkApp2', "kaito-eb-app-2");

        // Instance Profiles
        const instanceProfile1 = createInstanceRole(this, 'MyBeanstalkInstanceRole1');
        const instanceProfile2 = createInstanceRole(this, 'MyBeanstalkInstanceRole2');

        // Elastic Beanstalk Environments
        const ebEnv1 = createBeanstalkEnv(this, 'MyElasticBeanstalkEnv1', ebApp1.applicationName!, instanceProfile1.ref);
        const ebEnv2 = createBeanstalkEnv(this, 'MyElasticBeanstalkEnv2', ebApp2.applicationName!, instanceProfile2.ref);

        // Lambda Functions
        const schemaCreatorLambda1 = createSchemaCreatorLambda(this, 'Kaito-SchemaCreator');
        const schemaCreatorLambda2 = createSchemaCreatorLambda(this, 'SchemaCreatorLambda2');

        // CloudFront Distributions
        const cfDistribution1 = createCloudFront(this, 'MyCloudFront1', `${ebEnv1.attrEndpointUrl}`);
        const cfDistribution2 = createCloudFront(this, 'MyCloudFront2', `${ebEnv2.attrEndpointUrl}`);

        // Outputs
        new cdk.CfnOutput(this, 'BucketName1', { value: bucket1.bucketName });
        new cdk.CfnOutput(this, 'BucketName2', { value: bucket2.bucketName });
        new cdk.CfnOutput(this, 'ElasticBeanstalkEnv1', { value: ebEnv1.ref });
        new cdk.CfnOutput(this, 'ElasticBeanstalkEnv2', { value: ebEnv2.ref });
        new cdk.CfnOutput(this, 'CloudFrontURL1', { value: cfDistribution1.distributionDomainName });
        new cdk.CfnOutput(this, 'CloudFrontURL2', { value: cfDistribution2.distributionDomainName });
        new cdk.CfnOutput(this, 'Lambda1', { value: schemaCreatorLambda1.functionName });
        new cdk.CfnOutput(this, 'Lambda2', { value: schemaCreatorLambda2.functionName });
    }
}

// App Initialization
const app = new cdk.App();
new KaitoApplicationStack(app, 'KaitoApplicationStack');
app.synth();
