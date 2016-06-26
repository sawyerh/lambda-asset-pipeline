'use strict';
const CONFIG = {
  // Your AWS Elastic Transcoder Pipeline:
  PIPELINE_ID: "",
  // Set which presets should be used to transcode
  // your video. Add a new object to this array
  // for each preset. The suffix will be appended
  // to the transcoded file's name and should at least
  // contain the expected file extension:
  PRESETS: [{
    id: "1351620000001-100070", // "System preset: Web"
    suffix: ".mp4"
  }],
  // Set the directory where you'd like transcoded
  // videos to be placed. This can also be used to
  // add a prefix to the transcoded file's name:
  OUTPUT_KEY_PREFIX: "uploads/"
};

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// DO NOT EDIT BELOW THIS LINE UNLESS YOU'RE WISE
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
var aws = require('aws-sdk');
var elastictranscoder = new aws.ElasticTranscoder();

function basename(path) {
  return path.split('/').reverse()[0].split('.')[0];
}

function outputs(name) {
  return CONFIG.PRESETS.map(function(output) {
    return {
      Key: name + output.suffix,
      PresetId: output.id,
      ThumbnailPattern: name + "-{count}"
    };
  });
}

exports.handler = function(event, context, callback) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  let params = {
    Input: {
      Key: key
    },
    PipelineId: CONFIG.PIPELINE_ID,
    OutputKeyPrefix: CONFIG.OUTPUT_KEY_PREFIX,
    Outputs: outputs(basename(key))
  };

  elastictranscoder.createJob(params, function(err, data) {
    if (err)
      return callback(err);

    console.log('Created transcoder job: ', data.Job.Id);
    return callback(null, data);
  });
};