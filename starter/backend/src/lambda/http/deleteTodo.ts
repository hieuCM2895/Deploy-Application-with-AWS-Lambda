import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { deleteTodo } from '../../businessLogic/todos';
import { createLogger } from '../../utils/logger';
import { getToken } from '../../utils/token';

const logger = createLogger('deleteTodo');

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing DeleteTodo event...');
  const jwtToken: string = getToken(event);
  
  // Check if todoId is present in the path parameters
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
    await deleteTodo(jwtToken, todoId);
    logger.info(`Successfully deleted todo item: ${todoId}`);
    return {
      statusCode: 204,
      headers,
      body: ''
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
