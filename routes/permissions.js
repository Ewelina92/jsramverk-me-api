/* istanbul ignore file */
var express = require('express');
const ObjectId = require('mongodb').ObjectId;
var router = express.Router();
const database = require("../db/database");

// put /:id (add collaborator)
router.put("/:id", async (req, res) => {
    if (!req?.body?.email || !req?.params?.id) {
        res.status(406).send();
        return;
    }

    const db = await database.getDb();

    const user = await db.users.findOne({email: req.body.email});

    if (!user) {
        res.status(400).json({});
        return;
    }

    let objectID;

    try {
        objectID = new ObjectId(req.params.id);
    } catch {
        res.status(400).json({});
        return;
    }

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
            $addToSet: {
                collaborators: `${user._id}`,
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

// delete /:id (remove collaborator)
router.delete("/:id", async (req, res) => {
    if (!req?.body?.email || !req?.params?.id) {
        res.status(406).send();
        return;
    }

    const db = await database.getDb();

    const user = await db.users.findOne({email: req.body.email});

    let objectID;

    try {
        objectID = new ObjectId(req.params.id);
    } catch {
        res.status(400).send();
        return;
    }

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
            $pull: {
                collaborators: `${user._id}`,
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


module.exports = router;
