const apigateway = require("aws-cdk-lib/aws-apigateway");
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const S3 = require("aws-cdk-lib/aws-s3");
const path = require("node:path");

class SlackBotStack extends cdk.Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here

    //create a bucket, providing scope and id
    const bucket = new S3.Bucket(this, "Slack-bot");

    //create api endpoint, initially with only POST
    const api = new apigateway.RestApi(this, "api", {
      description:
        "This api gateway receives events from slack and triggers a lambda function",
      deployOptions: {
        stageName: "dev",
      },
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: ["POST"], //add methos if needed
        allowCredentials: true,
        // allowOrigins: ["https://api.slack.com/robots"],
        allowOrigins: ["*"],
      },
    });

    //create a lambda function and configure appropriately
    const slackBotLambda = new lambda.Function(this, "slack-bot-lambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.main",
      code: lambda.Code.fromAsset(path.join(__dirname, "/../src/")),
      environment: {
        BUCKET: bucket.bucketName,
      },
    });
    //grand access to lambda function to read and write to the bucket
    bucket.grantReadWrite(slackBotLambda);

    const slackBotResource = api.root.addResource("slackBot");

    slackBotResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(slackBotLambda, { proxy: true })
    );

    //create an Output for the API URL
    new cdk.CfnOutput(this, "apiUrl", { value: api.url });
  }
}

module.exports = { SlackBotStack };
