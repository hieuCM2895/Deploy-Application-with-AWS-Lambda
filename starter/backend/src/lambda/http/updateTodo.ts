import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { updateTodo } from '../../businessLogic/todos';
import { TodoUpdate } from '../../model/todo';
import { createLogger } from '../../utils/logger';
import { getToken } from '../../utils/token';

const logger = createLogger('updateTodo');

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing UpdateTodo event...');
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

  // Check if request body is defined
  if (!event.body) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({ message: 'Invalid request. Missing request body.' })
    };
  }

  const updateData: TodoUpdate = JSON.parse(event.body);

  try {
    await updateTodo(jwtToken, todoId, updateData);
    logger.info(`Successfully updated the todo item: ${todoId}`);
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