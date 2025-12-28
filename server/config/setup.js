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
          'maxStorage',
          'role',
          'isLoggedIn',
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
          maxStorage: {
            bsonType: 'long',
          },
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@gmail.com$'
          },
          password: {
            bsonType: 'string',
            minLength: 6
          },
          role: {
            bsonType: "string",
            enum: ["user", "admin", "manager"],
          },
          picture: {
            bsonType: 'string'
          },
          isLoggedIn: {
            bsonType: 'bool'
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
        required: ["_id", "name", "size", "userId", "parentDirId", "createdAt", "updatedAt"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
          },
          size: {
            bsonType: "int",
          },
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: ["objectId", "null"],
          },
          createdAt: {
            bsonType: "date",
          },
          updatedAt: {
            bsonType: "date",
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
        required: ["_id", "extension", "size", "name", "userId", "parentDirId", "createdAt", "updatedAt"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
          },
          size: {
            bsonType: "int",
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
          createdAt: {
            bsonType: "date",
          },
          updatedAt: {
            bsonType: "date",
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
