## Usage

1. Set your image versions and output directory in the `CONFIG` object at the top of `index.js`. **Important: You'll likely want to set the output directory (`OUTPUT_PREFIX`) to a different directory than the one your original images are uploaded to, otherwise S3 may send an event notification to Lambda after each resized image is placed in your bucket, and you don't want that.**
1. [Create a new Lambda function](http://docs.aws.amazon.com/lambda/latest/dg/getting-started.html). Skip the blueprints screen, copy + paste the contents of `index.js` into the inline code editor. Make sure the "Handler" is set to index.handler. Make sure the IAM role you select has the `s3:GetObject` and `s3:PutObject` permissions. (see policy.json)
1. Set up your S3 bucket to [send events to your Lambda function](http://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html) when a new image object is created.

## Lambda settings

- **Runtime**: Node.js 4.3
- **Memory**: 512 MB
- **Timeout**: 30 sec.