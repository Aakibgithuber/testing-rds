import * as dotenv from 'dotenv';
dotenv.config();

export const elasticBeanstalkConfig = [
  {
    namespace: 'aws:autoscaling:launchconfiguration',
    optionName: 'IamInstanceProfile',
    value: 'MyInstanceProfile'
  },

  // Environment Variables
  ...[
    { optionName: 'APP_NAME', value: process.env.APP_NAME  },
    { optionName: 'AWS_REGION', value: process.env.AWS_REGION  },
    { optionName: 'DB_DATABASE', value: process.env.DB_DATABASE  },
    { optionName: 'DB_HOST', value: process.env.DB_HOST  },
    { optionName: 'DB_PASSWORD', value: process.env.DB_PASSWORD  },
    { optionName: 'DB_PORT', value: process.env.DB_PORT || '5432' },
    { optionName: 'DB_USER', value: process.env.DB_USER  },
    { optionName: 'ENVIRONMENT', value: process.env.ENVIRONMENT  },
    { optionName: 'KC_ADMIN_CLIENT_ID', value: process.env.KC_ADMIN_CLIENT_ID  },
    { optionName: 'KC_ADMIN_CLIENT_SECRET', value: process.env.KC_ADMIN_CLIENT_SECRET  },
    { optionName: 'KC_BASE_URL', value: process.env.KC_BASE_URL  },
    { optionName: 'KC_CLIENT_ID', value: process.env.KC_CLIENT_ID  },
    { optionName: 'KC_CLIENT_SECRET', value: process.env.KC_CLIENT_SECRET  },
    { optionName: 'KC_CLIENT_UUID', value: process.env.KC_CLIENT_UUID  },
    { optionName: 'KC_REALM', value: process.env.KC_REALM  },
    { optionName: 'NODE_ENV', value: process.env.NODE_ENV  },
    { optionName: 'PORT', value: process.env.PORT  },  
    { optionName: 'SENDGRID_API_KEY', value: process.env.SENDGRID_API_KEY  },
    { optionName: 'SENDGRID_SENDER_EMAIL_ID', value: process.env.SENDGRID_SENDER_EMAIL_ID  }
  ].map(({ optionName, value }) => ({
    namespace: 'aws:elasticbeanstalk:application:environment',
    optionName,
    value
  })),

  // EC2 Instance Configuration
  ...[
    { optionName: 'InstanceType', value: process.env.INSTANCE_TYPE || 't3.medium' },
    { optionName: 'RootVolumeType', value: process.env.ROOT_VOLUME_TYPE || 'gp3' },
    { optionName: 'RootVolumeSize', value: process.env.ROOT_VOLUME_SIZE || '30' },
    { optionName: 'RootVolumeIOPS', value: process.env.ROOT_VOLUME_IOPS || '3000' }
  ].map(({ optionName, value }) => ({
    namespace: 'aws:autoscaling:launchconfiguration',
    optionName,
    value
  }))
];
