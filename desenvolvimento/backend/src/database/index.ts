import { createConnection, getConnection, getManager } from "typeorm";
require('dotenv').config();

export async function connect() {
     const conn = createConnection({
        name: 'default',
        type: 'postgres',
        host: process.env.DATABASE_IP,
        port: parseInt(process.env.DATABASE_PORT),
        username: 'postgres',
        password: process.env.DATABASE_PASS,
        database: 'media',
        logging: true,
        entities: ['src/database/models/*.ts']
     });

    return conn;
}

