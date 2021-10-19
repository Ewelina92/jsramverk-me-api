const ObjectId = require('mongodb').ObjectId;
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
            let contentToSend;

            if (doc?.kind == "Code") {
                contentToSend = doc.content;
            } else {
                contentToSend = JSON.stringify(doc.content);
            }
            return {
                ...doc,
                kind: doc.kind || "Document",
                content: contentToSend,
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
        /* istanbul ignore next */
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
        /* istanbul ignore next */
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

    let contentToSend;

    if (resultSet?.kind == "Code") {
        contentToSend = resultSet.content;
    } else {
        contentToSend = JSON.stringify(resultSet.content);
    }

    return {
        ...resultSet,
        kind: resultSet.kind || "Document",
        content: contentToSend,
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

const updateDocument = async (res, userId, id, title, content, comments, kind) => {
    if (!title || !content || !id) {
        return res.status(406).send();
    }

    if (!kind) {
        kind = "Document";
    }

    let objectID;

    try {
        objectID = new ObjectId(id);
    } catch (error) {
        res.status(400).send();
        return;
    }

    let contentObj;

    if (kind == "Code") {
        contentObj = content;
    } else {
        try {
            contentObj = JSON.parse(content);
        } catch (error) {
            res.status(400).send();
            return;
        }
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
                    kind: kind,
                }
            }
        );
    } catch (e) {
        /* istanbul ignore next */
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

    /* istanbul ignore if */
    if (resultSet.matchedCount !== 1) {
        return res.status(400).send();
    }

    return getDocument(res, userId, id);
};

const createDocument = async (res, userId, title, content, comments, kind) => {
    if (!title || !content) {
        return res.status(406).send();
    }

    if (!kind) {
        kind = "Document";
    }

    let contentObj;

    if (kind == "Code") {
        contentObj = content;
    } else {
        try {
            contentObj = JSON.parse(content);
        } catch (error) {
            res.status(400).send();
            return;
        }
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
                kind: kind,
                owner: userId,
                comments: commentArr,
            }
        );
    } catch (e) {
        /* istanbul ignore next */
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

    /* istanbul ignore if */
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

    // try to get the user with email
    try {
        db = await database.getDb();
        user = await db.users.findOne({ email: email });
    } catch (e) {
        /* istanbul ignore next */
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

    // if this user does not exist
    if (!user) {
        const msg = {
            to: email,
            from: 'ewelina.van.rantwijk@outlook.com',
            subject: 'Collaborate on Ewelina Editor!',
            html: '<p>You are invited to collaborate on a document. '
                +'</p><p><br></p><p>Click the link below to accept the invitation '
                +'and sign up!</p><p><br></p><p><a href="https://www.student.'
                +'bth.se/~eaja20/editor" target="_blank">'
                +'https://www.student.bth.se/~eaja20/editor</a></p>',
        };

        try {
            db = await database.getDb();
            /* istanbul ignore if */
            if (process.env.NODE_ENV != 'test') {
                // send invitation email
                await sgMail.send(msg);
            }
            // insert invitation to document for this email
            await db.invitations.insertOne(
                {
                    documentId: documentId,
                    email: email,
                }
            );
            return getDocument(res, userId, documentId);
        } catch (error) {
            /* istanbul ignore next */
            console.error(error);
            /* istanbul ignore next */
            return res.status(400).send();
        } finally {
            await db.client.close();
        }
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
        /* istanbul ignore next */
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

    /* istanbul ignore if */
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
        /* istanbul ignore next */
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
        /* istanbul ignore next */
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

    /* istanbul ignore if */
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
