import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { createLogger } from '../utils/logger';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { TodoItem, TodoUpdate } from '../model/todo';

const XAWS = AWSXRay.captureAWS(AWS);
const logger = createLogger('todoAccess');

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todoTable = process.env.TODOS_TABLE || 'default-todos-table-name'
  ) {}

  async getTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todo items');
    const result = await this.docClient
      .query({
        TableName: this.todoTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise();
    return result.Items as TodoItem[];
  }


  async saveImgUrl(userId: string, todoId: string, bucketName: string): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${todoId}`
        }
      })
      .promise();
  }

  async getTodo(userId: string, todoId: string): Promise<TodoItem | null> {
  logger.info(`Getting todo item: ${todoId}`);
  const result = await this.docClient
    .query({
      TableName: this.todoTable,
      KeyConditionExpression: 'userId = :userId and todoId = :todoId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':todoId': todoId
      }
    })
    .promise();

    if (result.Items && result.Items.length > 0) {
        const todoItem = result.Items[0];
        return todoItem as TodoItem;
    }
    
    return null;
  }

  async updateTodo(userId: string, todoId: string, updateData: TodoUpdate): Promise<void> {
    logger.info(`Updating a todo item: ${todoId}`);
    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set #n = :n, dueDate = :due, done = :dn',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: {
          ':n': updateData.name,
          ':due': updateData.dueDate,
          ':dn': updateData.done
        }
      })
      .promise();
  }


  async createTodo(newTodo: TodoItem): Promise<TodoItem> {
    logger.info(`Creating new todo item: ${newTodo.todoId}`);
    await this.docClient
      .put({
        TableName: this.todoTable,
        Item: newTodo
      })
      .promise();
    return newTodo;
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todoTable,
        Key: { userId, todoId }
      })
      .promise();
  }
}