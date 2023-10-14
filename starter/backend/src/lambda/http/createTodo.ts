import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
import { createTodo } from '../../businessLogic/todos';
import { createLogger } from '../../utils/logger';
import { getToken } from '../../utils/token';
import { TodoCreate, TodoItem } from '../../model/todo';

const logger = createLogger('createTodo');

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('CreateTodo event...');
  const jwtToken: string = getToken(event);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  };

 if (event.body === null) {
    return {
      statusCode: 400,
      headers: headers,
      body: JSON.stringify({ message: 'Invalid request body' })
    };
  }

  try {
    const newTodoData: TodoCreate = JSON.parse(event.body);

    const newTodo: TodoItem = await createTodo(jwtToken, newTodoData);
    logger.info('Successfully created a new item.');
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ newTodo })
    };
  } catch (error) {
    logger.error(`Error message: ${error.message}`);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error })
    };
  }
};