const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const URL_EXPIRES_SECONDS = 24 * 60 * 60;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadToS3(buffer, key, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return key;
}

async function getPresignedUrl(key) {
  if (!key) return null;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: URL_EXPIRES_SECONDS });
}

async function deleteFromS3(key) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { uploadToS3, getPresignedUrl, deleteFromS3 };