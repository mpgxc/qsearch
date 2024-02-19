import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { UpdateBuilder, UpdateExpression } from "./update-builder";

export type UpdateParams<Content> = {
  PK: string;
  SK: string;
  content: Content;
  path?: string;
};

export type RepositoryConfig = {
  client: DynamoDBClient;
  tableName: string;
};

export class Repository {
  private command!: UpdateItemCommand;

  constructor(private readonly config: RepositoryConfig) {}

  public update<Content extends Record<string, any>>({
    PK,
    SK,
    content,
    path,
  }: UpdateParams<Content>): Repository {
    const updater = new UpdateBuilder({
      path,
      content,
      updateAttrName: "updatedAt",
    });

    const {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    } = updater.expressions();

    this.command = new UpdateItemCommand({
      TableName: this.config.tableName,
      Key: marshall({ PK, SK }),
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: "UPDATED_NEW",
    });

    return this;
  }

  public expressions(): UpdateExpression {
    if (!this.command) {
      throw new Error("No update command to execute");
    }

    const {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    } = this.command.input as UpdateExpression;

    return {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    };
  }

  public async execute(): Promise<void> {
    if (!this.command || !this.command.input) {
      throw new Error("No update command to execute");
    }

    const { $metadata } = await this.config.client.send(this.command);

    if ($metadata.httpStatusCode !== 200) {
      throw new Error("Failed to execute update command");
    }
  }
}
