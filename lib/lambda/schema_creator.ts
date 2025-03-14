import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env variables

export const handler = async () => {
    try {
        const dbHost = process.env.DB_HOST!;
        const dbName = process.env.DB_DATABASE!;
        const username = process.env.DB_USER!;
        const password = process.env.DB_PASSWORD!;
        const schemaName = process.env.DB_SCHEMA!;  // ✅ Dynamic schema name from .env

        // PostgreSQL connection setup
        const client = new Client({
            host: dbHost,
            database: dbName,
            user: username,
            password: password,
            port: parseInt(process.env.DB_PORT || '5432')
        });
        await client.connect();

        // ✅ Dynamic schema creation
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);

        await client.end();

        console.log(`✅ Schema "${schemaName}" created successfully!`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Schema "${schemaName}" created successfully!` }),
        };
    } catch (error) {
        console.error('❌ Error creating schema:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error creating schema', details: error }),
        };
    }
};