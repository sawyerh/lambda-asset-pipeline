## Usage

1. [Create an Elastic Transcoder Pipeline](http://docs.aws.amazon.com/elastictranscoder/latest/developerguide/creating-pipelines.html)
2. Set your Pipeline ID, presets, and output directory in the `CONFIG` object at the top of `index.js`.
3. [Create a new Lambda function](http://docs.aws.amazon.com/lambda/latest/dg/getting-started.html). Skip the blueprints screen, copy + paste the contents of `index.js` into the inline code editor. Make sure the "Handler" is set to index.handler. Make sure the IAM role you select has the `elastictranscoder:CreateJob` permission. (see policy.json)
4. Set up your S3 bucket to [send events to your Lambda function](http://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html) when a new video object is created.

## Lambda settings

- **Runtime**: Node.js 4.3
- **Memory**: 128 MB
- **Timeout**: 3 sec.