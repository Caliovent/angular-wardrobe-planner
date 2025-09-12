"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeTestPool = exports.clearTestDb = exports.initTestDb = void 0;
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Create a new pool for the test database using the provided connection string details
const testPool = new pg_1.Pool({
    user: 'neondb_owner',
    host: 'ep-mute-bush-agyqw247-pooler.c-2.eu-central-1.aws.neon.tech',
    database: 'neondb', // IMPORTANT: Using a dedicated test database
    password: 'npg_D3WORC0hvbtY',
    port: 5432,
    ssl: {
        rejectUnauthorized: false, // Required for Neon.tech
    },
});
const schemaSql = fs_1.default.readFileSync(path_1.default.join(__dirname, '../../schema.sql')).toString();
const initTestDb = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield testPool.connect();
    try {
        // Drop existing public schema and create a new one to ensure a clean state
        yield client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        // Re-create types and tables
        yield client.query(schemaSql);
        // Add a dummy user for testing purposes
        yield client.query(`
            INSERT INTO Users (user_id, email, password_hash)
            VALUES (1, 'test@example.com', 'password');
        `);
    }
    finally {
        client.release();
    }
});
exports.initTestDb = initTestDb;
const clearTestDb = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield testPool.connect();
    try {
        // Truncating is faster than dropping and recreating tables
        yield client.query('TRUNCATE Users, Items, Images, Links RESTART IDENTITY CASCADE;');
        // Re-add the dummy user after truncating
        yield client.query(`
            INSERT INTO Users (user_id, email, password_hash)
            VALUES (1, 'test@example.com', 'password');
        `);
    }
    finally {
        client.release();
    }
});
exports.clearTestDb = clearTestDb;
const closeTestPool = () => __awaiter(void 0, void 0, void 0, function* () {
    yield testPool.end();
});
exports.closeTestPool = closeTestPool;
exports.default = testPool;
