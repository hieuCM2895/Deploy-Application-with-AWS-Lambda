import * as AWS from 'aws-sdk';
import { TodoAccess } from '../dataLayer/todoAccess';
import { getUserId } from '../utils/token';

const todoAccess = new TodoAccess();
const bucketName = process.env.ATTACHMENTS_S3_BUCKET;
const signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION;

export function getAttachmentUrl(attachmentId: string): string {
  return `https://${bucketName}.s3.amazonaws.com/${attachmentId}`
}

export async function generateUploadUrl(jwtToken: string, todoId: string): Promise<string> {
  const userId = getUserId(jwtToken);

  if (!bucketName || !signedUrlExpiration) {
    throw new Error('Missing environment variable(s)');
  }
  const urlExpiration = parseInt(signedUrlExpiration, 10);
  const s3 = new AWS.S3({ signatureVersion: 'v4' });
  const signedUrl = s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  });
  await todoAccess.saveImgUrl(userId, todoId, bucketName);
  return signedUrl;
}