const ObjectId = require('mongodb').ObjectId;
const database = require("../db/database.js");
const { getAllDocuments } = require("./documents");

const getUser = async (res, id) => {
    let objectID;

    try {
        objectID = new ObjectId(id);
    } catch (error) {
        return res.status(406).send();
    }

    let db;
    let resultSet;

    try {
        db = await database.getDb();
        resultSet = await db.users.findOne({
            _id: objectID
        });
    } catch (e) {
        return res.status(500).json({
            errors: {
                status: 500,
                name: "Database Error",
                description: e.message,
                path: "/",
            }
        });
    } finally {
        await db.client.close();
    }

    if (!resultSet) {
        return res.status(406).send();
    }

    return {
        ...resultSet,
        documents: async ( id ) => getAllDocuments(res, id),
    };
};


module.exports = {
    getUser,
};
