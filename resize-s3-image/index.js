'use strict';
const CONFIG = {
  OUTPUT_PREFIX: 'uploads/',
  VERSIONS: [
    {
      maxHeight: 100,
      maxWidth: 100,
      suffix: 'thumb'
    }, {
      maxHeight: 300,
      maxWidth: 500,
      suffix: 'small'
    }
  ]
};

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// DO NOT EDIT BELOW THIS LINE UNLESS YOU'RE WISE
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
var AWS = require('aws-sdk');
var ImageMagick = require("imagemagick");
var fs = require('fs');
var s3 = new AWS.S3();

function basename(path) {
  return path.split('/').reverse()[0].split('.')[0];
}

function extension(path) {
  let typeMatch = path.match(/\.([^.]*)$/);
  if (!typeMatch) return null;
  return typeMatch[1];
}

function ImageResizer(bucket, key, callback) {
  this.bucket = bucket;
  this.key = key;
  this.ext = extension(key);
  this.callback = callback;
  this.s3Object = null;
  this.width = null;
  this.height = null;
}

ImageResizer.prototype.resizeAll = function() {
  this.download()
    .then(this.getDimensions.bind(this))
    .then(this.resize.bind(this))
    .then(() => this.callback(null, `Resized ${this.key}`))
    .catch((error) => this.callback(error));
};

ImageResizer.prototype.resize = function(index) {
  if (!index) index = 0;
  const version = CONFIG.VERSIONS[index];

  return this.transformAndUpload(version)
    .then(() => {
      if (index < CONFIG.VERSIONS.length - 1)
        return this.resize(index + 1);
    });
};

ImageResizer.prototype.download = function() {
  return new Promise((resolve, reject) => {
    s3.getObject({ Bucket: this.bucket, Key: this.key }, (error, s3Object) => {
      if (error) return reject(error);
      this.s3Object = s3Object;
      resolve();
    });
  });
};

ImageResizer.prototype.getDimensions = function() {
  return new Promise((resolve, reject) => {
    const tmpFilePath = `/tmp/inputFile.${this.ext}`;
    fs.writeFileSync(tmpFilePath, this.s3Object.Body);

    ImageMagick.identify(['-format', '%wx%h', tmpFilePath], (err, output) => {
      fs.unlinkSync(tmpFilePath);
      if (err) return reject(err);

      let dimensions = output.trim().split('x');
      this.width = dimensions[0];
      this.height = dimensions[1];
      resolve();
    });
  });
};

ImageResizer.prototype.transformAndUpload = function(version) {
  return new Promise((resolve, reject) => {
    // Infer the scaling factor to avoid
    // stretching the image unnaturally.
    const scalingFactor = Math.min(
      version.maxWidth / this.width,
      version.maxHeight / this.height
    );

    const tmpFilePath = `/tmp/resized.${this.ext}`;
    const width  = scalingFactor * this.width;
    const height = scalingFactor * this.height;
    const data = {
      srcData: this.s3Object.Body,
      dstPath: tmpFilePath,
      height: height,
      width: width
    };

    try {
      ImageMagick.resize(data, (err, stdout, stderr) => {
        if (err) return reject(err);
        var resizedBuffer = new Buffer(fs.readFileSync(tmpFilePath));
        this.upload(resizedBuffer, version)
          .then(() => {
            try { fs.unlinkSync(tmpFilePath) } catch (e) {}
            resolve();
          })
          .catch(reject);
      });
    } catch (err) {
      reject(err);
    }
  });
};

ImageResizer.prototype.upload = function(resizedBuffer, version) {
  const filename = basename(this.key) + "_" + version.suffix + "." + this.ext;

  return new Promise((resolve, reject) => {
    s3.putObject({
      Bucket: this.bucket,
      Key: `${CONFIG.OUTPUT_PREFIX}${filename}`,
      Body: resizedBuffer,
      ContentType: this.s3Object.ContentType
    }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

exports.handler = function(event, context, callback) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  const ext = extension(key);
  let resizer = new ImageResizer(bucket, key, callback);

  if (!ext || ['jpg', 'jpeg', 'png'].indexOf(ext) < 0)
    return callback(null, "Skipping transformation. File extension is not jpg/jpeg/png: " + key);

  return resizer.resizeAll();
};