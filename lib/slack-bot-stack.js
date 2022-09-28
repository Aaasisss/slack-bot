import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";

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

    // example resource
    // const queue = new sqs.Queue(this, 'SlackBotQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });

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

    const slackBotLambda = new lambda.Function(this, "slack-bot-lambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "slackbot.main",
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/slackbot")),
    });

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
