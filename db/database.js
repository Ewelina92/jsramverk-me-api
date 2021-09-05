const mongo = require("mongodb").MongoClient;
const { optionalRequire } = require("optional-require");
const config = optionalRequire("./config.json", { require }) || {};
const collectionName = "documents";

const database = {
    getDb: async function getDb() {
        let dsn = `mongodb+srv://${config.username}:${config.password}@cluster0.pqjhk.mongodb.net` +
        `/dev?retryWrites=true&w=majority`;
        // let dsn = `mongodb://localhost:27017/mumin`;

        if (process.env.NODE_ENV === 'test') {
            dsn = "mongodb://localhost:27017/test";
        }

        const client  = await mongo.connect(dsn, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const db = await client.db();
        const collection = await db.collection(collectionName);

        return {
            collection: collection,
            client: client,
        };
    }
};

module.exports = database;
