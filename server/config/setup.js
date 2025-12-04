import mongoose from "mongoose";
import { connectDB } from "./db.js";


await connectDB();
const client = mongoose.connection.getClient();

try {
  const db = mongoose.connection.db;
  await db.command({
    collMod: "users",
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [
          '_id',
          'name',
          'email',
          'password',
          'rootDirId'
        ],
        properties: {
          _id: {
            bsonType: 'objectId'
          },
          name: {
            bsonType: 'string',
            minLength: 3
          },
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@gmail.com$'
          },
          password: {
            bsonType: 'string'
          },
          rootDirId: {
            bsonType: 'objectId'
          }
        },
        additionalProperties: false
      }
    },
    validationAction: "error",
    validationLevel: "strict",
  });

  await db.command({
    collMod: "directories",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "name", "userId", "parentDirId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
          },
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: ["objectId", "null"],
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: "error",
    validationLevel: "strict",
  });

  await db.command({
    collMod: "files",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "extension", "name", "userId", "parentDirId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
          },
          extension: {
            bsonType: "string",
          },
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: "objectId",
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: "error",
    validationLevel: "strict",
  });
} catch (error) {
  console.log("Error setting up the database Validation ", error);
} finally {
  await client.close();
}
