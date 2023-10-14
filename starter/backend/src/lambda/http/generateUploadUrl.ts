import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
import { generateUploadUrl } from '../../fileStorage/attachmentUtils';
import { createLogger } from '../../utils/logger';
import { getToken } from '../../utils/token';

const logger = createLogger('GenerateUploadUrl');

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing GenerateUploadUrl event...');
  const jwtToken: string = getToken(event);

  // Check if pathParameters is defined and has todoId
  const todoId = event.pathParameters?.todoId;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  };

  if (!todoId) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({ message: 'Invalid request. Missing todoId in path parameters.' })
    };
  }

  try {
    const signedUrl: string = await generateUploadUrl(jwtToken, todoId);
    logger.info('Successfully created signed url.');
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ uploadUrl: signedUrl })
    };
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error })
    };
  }
};