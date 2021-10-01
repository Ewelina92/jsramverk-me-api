var express = require('express');
const ObjectId = require('mongodb').ObjectId;
var router = express.Router();
const database = require("../db/database");

// list all documents: /documents
router.get("/", async (req, res) => {
    const db = await database.getDb();
    const resultSet = await db.documents.find({
        $or: [
            {
                owner: req.user._id
            },
            {
                collaborators: {
                    $in: [
                        req.user._id,
                    ],
                }
            },
        ],
    }).toArray();

    await db.client.close();

    res.json(resultSet);
});

// get one document /:id
router.get("/:id", async (req, res) => {
    let objectID;

    try {
        objectID = new ObjectId(req.params.id);
    } catch (error) {
        res.status(406).send();
        return;
    }
    const db = await database.getDb();
    const resultSet = await db.documents.findOne({
        $and: [
            {
                _id: objectID
            },
            {
                $or: [
                    {
                        owner: req.user._id
                    },
                    {
                        collaborators: {
                            $in: [
                                req.user._id,
                            ],
                        }
                    },
                ],
            }
        ]
    });

    await db.client.close();

    if (!resultSet) {
        res.status(406).send();
        return;
    }

    res.json(resultSet);
});

// put / (create new)
router.put("/", async (req, res) => {
    // eslint-disable-next-line
    if (!req?.body?.title || !req?.body?.content) {
        res.status(406).send();
        return;
    }

    const db = await database.getDb();
    const resultSet = await db.documents.insertOne( // returns _id
        {
            title: req.body.title,
            content: req.body.content,
            owner: req.user._id,
        }
    );

    await db.client.close();

    res.status(201).json({
        documentID: resultSet.insertedId,
    });
});

// post /:id (update existing)
router.post("/:id", async (req, res) => {
    if (!req?.body?.title || !req?.body?.content || !req?.params?.id) {
        return res.status(406).send();
    }

    let objectID;

    try {
        objectID = new ObjectId(req.params.id);
    } catch {
        res.status(400).send();
        return;
    }

    const db = await database.getDb();
    const resultSet = await db.documents.updateOne(
        {
            $and: [
                {
                    _id: objectID
                },
                {
                    $or: [
                        {
                            owner: req.user._id
                        },
                        {
                            collaborators: {
                                $in: [
                                    req.user._id,
                                ],
                            }
                        },
                    ],
                }
            ]
        },
        {
            $set: {
                title: req.body.title,
                content: req.body.content
            }
        }
    );

    await db.client.close();

    if (resultSet.matchedCount !== 1) {
        res.status(400).send();
        return;
    }

    res.status(202).json(resultSet);
});

// router.delete("/", (req, res) => {
//     // DELETE requests should return 204 No Content
//     res.status(204).send();
// });

module.exports = router;
