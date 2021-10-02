const ObjectId = require('mongodb').ObjectId;
const database = require("../db/database.js");
const { getUser } = require("./users");

const getAllDocuments = async (res, userId) => {
    let db;

    try {
        db = await database.getDb();

        const resultSet = await db.documents.find({
            $or: [
                {
                    owner: userId
                },
                {
                    collaborators: {
                        $in: [
                            userId,
                        ],
                    }
                },
            ],
        }).toArray();

        return resultSet.map(doc => {
            return {
                ...doc,
                content: JSON.stringify(doc.content),
                comments: JSON.stringify(resultSet.comments),
                owner: async () => getUser(res, doc.owner),
                collaborators: async () => {
                    if (!doc.collaborators) {
                        return;
                    }
                    return doc.collaborators.map((collaborator) =>
                        getUser(res, collaborator));
                },
            };
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
};

const getDocument = async (res, userId, id) => {
    let objectID;

    try {
        objectID = new ObjectId(id);
    } catch (error) {
        res.status(406).send();
        return;
    }

    let db;
    let resultSet;

    try {
        db = await database.getDb();
        resultSet = await db.documents.findOne({
            $and: [
                {
                    _id: objectID
                },
                {
                    $or: [
                        {
                            owner: userId
                        },
                        {
                            collaborators: {
                                $in: [
                                    userId,
                                ],
                            }
                        },
                    ],
                }
            ]
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
        content: JSON.stringify(resultSet.content),
        comments: JSON.stringify(resultSet.comments),
        owner: async () => getUser(res, resultSet.owner),
        collaborators: async () => {
            if (!resultSet.collaborators) {
                return;
            }
            return resultSet.collaborators.map((collaborator) =>
                getUser(res, collaborator));
        },
    };
};

const updateDocument = async (res, userId, id, title, content, comments) => {
    if (!title || !content || !id) {
        return res.status(406).send();
    }

    let objectID;

    try {
        objectID = new ObjectId(id);
    } catch (error) {
        res.status(400).send();
        return;
    }

    let contentObj;

    try {
        contentObj = JSON.parse(content);
    } catch (error) {
        console.log("BB");
        res.status(400).send();
        return;
    }

    let commentArr;

    try {
        commentArr = JSON.parse(comments);
    } catch (error) {
        console.log("AA");
        res.status(400).send();
        return;
    }

    let db;
    let resultSet;

    try {
        db = await database.getDb();
        resultSet = await db.documents.updateOne(
            {
                $and: [
                    {
                        _id: objectID
                    },
                    {
                        $or: [
                            {
                                owner: userId
                            },
                            {
                                collaborators: {
                                    $in: [
                                        userId,
                                    ],
                                }
                            },
                        ],
                    }
                ]
            },
            {
                $set: {
                    title: title,
                    content: contentObj,
                    comments: commentArr,
                }
            }
        );
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

    if (resultSet.matchedCount !== 1) {
        console.log("CC");
        return res.status(400).send();
    }

    return getDocument(res, userId, id);
};

const createDocument = async (res, userId, title, content, comments) => {
    if (!title || !content) {
        return res.status(406).send();
    }

    let contentObj;

    try {
        contentObj = JSON.parse(content);
    } catch (error) {
        res.status(400).send();
        return;
    }

    let commentArr;

    try {
        commentArr = JSON.parse(comments);
    } catch (error) {
        res.status(400).send();
        return;
    }

    let db;
    let resultSet;

    try {
        db = await database.getDb();
        resultSet = await db.documents.insertOne(
            {
                title: title,
                content: contentObj,
                owner: userId,
                comments: commentArr,
            }
        );
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

    if (!resultSet.insertedId) {
        return res.status(500).send();
    }

    return getDocument(res, userId, resultSet.insertedId);
};

const addCollaborator = async (res, userId, documentId, email) => {
    if (!documentId || !email) {
        return res.status(406).send();
    }

    let db;
    let user;

    try {
        db = await database.getDb();
        user = await db.users.findOne({ email: email });
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

    if (!user) {
        return res.status(400).send();
    }

    let objectID;

    try {
        objectID = new ObjectId(documentId);
    } catch {
        return res.status(400).json({});
    }

    let resultSet;

    try {
        db = await database.getDb();

        resultSet = await db.documents.updateOne(
            {
                $and: [
                    {
                        _id: objectID
                    },
                    {
                        $or: [
                            {
                                owner: userId
                            },
                            {
                                collaborators: {
                                    $in: [
                                        userId,
                                    ],
                                }
                            },
                        ],
                    }
                ]
            },
            {
                $addToSet: {
                    collaborators: `${user._id}`,
                }
            }
        );
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

    if (resultSet.matchedCount !== 1) {
        return res.status(400).send();
    }

    return getDocument(res, userId, documentId);
};

const removeCollaborator = async (res, userId, documentId, email) => {
    if (!documentId || !email) {
        return res.status(406).send();
    }

    let db;
    let user;

    try {
        db = await database.getDb();
        user = await db.users.findOne({ email: email });
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

    if (!user) {
        return res.status(400).send();
    }

    let objectID;

    try {
        objectID = new ObjectId(documentId);
    } catch {
        return res.status(400).json({});
    }

    let resultSet;

    try {
        db = await database.getDb();

        resultSet = await db.documents.updateOne(
            {
                $and: [
                    {
                        _id: objectID
                    },
                    {
                        $or: [
                            {
                                owner: userId
                            },
                            {
                                collaborators: {
                                    $in: [
                                        userId,
                                    ],
                                }
                            },
                        ],
                    }
                ]
            },
            {
                $pull: {
                    collaborators: `${user._id}`,
                }
            }
        );
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

    if (resultSet.matchedCount !== 1) {
        return res.status(400).send();
    }

    return getDocument(res, userId, documentId);
};


module.exports = {
    getAllDocuments,
    getDocument,
    updateDocument,
    createDocument,
    addCollaborator,
    removeCollaborator,
};
