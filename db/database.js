const mongo = require("mongodb").MongoClient;
const { optionalRequire } = require("optional-require");
/* istanbul ignore next */
const config = optionalRequire("./config.json", { require }) || {};

const database = {
    getDb: async function getDb() {
        let dsn = `mongodb+srv://${config.username}:${config.password}@cluster0.pqjhk.mongodb.net` +
        `/dev?retryWrites=true&w=majority`;
        // let dsn = `mongodb://localhost:27017/mumin`;

        /* istanbul ignore next */
        if (process.env.NODE_ENV === 'test') {
            dsn = "mongodb://localhost:27017/test";
        }

        const client  = await mongo.connect(dsn, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const db = await client.db();
        const documentCollection = await db.collection("documents");
        const userCollection = await db.collection("users");
        const invitationCollection = await db.collection("invitations");

        return {
            documents: documentCollection,
            users: userCollection,
            invitations: invitationCollection,
            client: client,
        };
    }
};

module.exports = database;
