process.env.NODE_ENV = 'test';
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const database = require("./db/database");
const { rootValue } = require('./resolvers');

beforeEach(async () => {
    // populate db
    const data = [
        {
            _id: new ObjectId("612e273fd2455c204e6bcf7c"),
            title: "Title one",
            content: "Content one",
            kind: "Document",
            owner: "6145dad42c8d8aefbceba6cb",
        },
        {
            _id: new ObjectId("612e273fd2455c204e6bcf7d"),
            title: "Title two",
            kind: "Code",
            content: "// content two",
            owner: "6145dad42c8d8aefbceba6cb",
            collaborators: ["6145dad42c8d8aefbceba6ca"],
        },
        {
            _id: new ObjectId("612e273fd2455c204e6bcf6f"),
            title: "Title three",
            content: "Content three",
            owner: "6145dad42c8d8aefbceba6cb",
            collaborators: ["6145dad42c8d8aefbceba6ca"],
        }
    ];

    const hash = await bcrypt.hash("password", 10);

    const users = [
        {
            _id: new ObjectId("6145dad42c8d8aefbceba6cb"),
            email: "testuser@example.com",
            password: hash,
        },
        {
            _id: new ObjectId("6145dad42c8d8aefbceba6ca"),
            email: "otheruser@example.com",
            password: hash,
        }
    ];

    const db = await database.getDb();

    await db.users.deleteMany();
    await db.users.insertMany(users);
    await db.documents.deleteMany();
    await db.documents.insertMany(data);
    await db.invitations.deleteMany();

    return db.client.close();
});

// getAllDocuments

describe("Test resolving all document", () => {
    test("It should give two documents", async () => {
        const result = await rootValue.documents(undefined, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.length).toBe(3);
    });
});

describe("Test resolving all document", () => {
    test("They should have owners", async () => {
        const result = await rootValue.documents(undefined, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const owner = await result[0].owner();

        expect(owner.email).toBe('testuser@example.com');
    });
});

describe("Test resolving all document", () => {
    test("They should have collaborators", async () => {
        const result = await rootValue.documents(undefined, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        await result[0].collaborators();
        const collaborators = await result[1].collaborators();

        expect(collaborators.length).toBe(1);
    });
});

// getDocument

describe("Test resolving a specific document", () => {
    test("It should give a single text document", async () => {
        const result = await rootValue.document({_id: "612e273fd2455c204e6bcf6f"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.title).toBe('Title three');
    });
});

describe("Test resolving a specific document", () => {
    test("It should provide the owner", async () => {
        const result = await rootValue.document({_id: "612e273fd2455c204e6bcf7c"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const owner = await result.owner();

        expect(owner.email).toBe('testuser@example.com');
    });
});

describe("Test resolving a specific document", () => {
    test("It should give a single code document", async () => {
        const result = await rootValue.document({_id: "612e273fd2455c204e6bcf7d"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.kind).toBe('Code');
    });
});

describe("Test resolving a specific document", () => {
    test("Wrong id should return 406", async () => {
        await rootValue.document({_id: "asd"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(406);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test resolving a specific document", () => {
    test("Unfound id should return 406", async () => {
        await rootValue.document({_id: "6145dad42c8d8aefbceba6cb"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(406);
                    return {send: () => {}};
                }
            },
        });
    });
});

// addCollaborator

describe("Test Adding a non-existent collaborator", () => {
    test("It should add a collaborator", async () => {
        await rootValue.addCollaborator({
            documentId: "612e273fd2455c204e6bcf7c",
            email: "test@example.com",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const result = await rootValue.document({_id: "612e273fd2455c204e6bcf7c"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const collaborators = await result.collaborators();

        expect(collaborators).toBe(undefined);
    });
});

describe("Test Adding a existing collaborator", () => {
    test("It should add a collaborator", async () => {
        await rootValue.addCollaborator({
            documentId: "612e273fd2455c204e6bcf7c",
            email: "otheruser@example.com",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const result = await rootValue.document({_id: "612e273fd2455c204e6bcf7c"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const collaborators = await result.collaborators();
        const firstCollaborator = await collaborators[0];

        expect(firstCollaborator.email).toBe('otheruser@example.com');
    });
});

describe("Test Adding a existing collaborator", () => {
    test("No document ID should return 406", async () => {
        await rootValue.addCollaborator({
            email: "otheruser@example.com",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(406);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test Adding a existing collaborator", () => {
    test("No email should return 406", async () => {
        await rootValue.addCollaborator({
            documentId: "612e273fd2455c204e6bcf7c",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(406);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test Adding a existing collaborator", () => {
    test("Bad formed id should return 400", async () => {
        await rootValue.addCollaborator({
            documentId: "12345",
            email: "otheruser@example.com",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {json: () => {}};
                }
            },
        });
    });
});

// removeCollaborator

describe("Test removing a collaborator", () => {
    test("It should remove a collaborator", async () => {
        await rootValue.removeCollaborator({
            documentId: "612e273fd2455c204e6bcf7d",
            email: "otheruser@example.com",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const result = await rootValue.document({_id: "612e273fd2455c204e6bcf7d"}, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        const collaborators = await result.collaborators();

        expect(collaborators.length).toBe(0);
    });
});

describe("Test removing a existing collaborator", () => {
    test("No email should return 406", async () => {
        await rootValue.removeCollaborator({
            documentId: "612e273fd2455c204e6bcf7d",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(406);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test removing a existing collaborator", () => {
    test("Non-existant email should return 400", async () => {
        await rootValue.removeCollaborator({
            documentId: "612e273fd2455c204e6bcf7d",
            email: "nothere@example.com",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test removing a existing collaborator", () => {
    test("malformed ID should return 400", async () => {
        await rootValue.removeCollaborator({
            documentId: "12345",
            email: "otheruser@example.com",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {json: () => {}};
                }
            },
        });
    });
});

// createDocument

describe("Test adding a document", () => {
    test("It should add a text document", async () => {
        const result = await rootValue.createDocument({
            title: "My new document",
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
            kind: "Document",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.kind).toBe("Document");
        expect(result.title).toBe("My new document");
        expect(result.content).toBe(JSON.stringify("Testing!"));
    });
});

describe("Test adding a document", () => {
    test("It should add a code document", async () => {
        const result = await rootValue.createDocument({
            title: "My code document",
            comments: JSON.stringify([]),
            content: "// My code!",
            kind: "Code",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.kind).toBe("Code");
        expect(result.content).toBe("// My code!");
    });
});

describe("Test adding a document", () => {
    test("It should add a text document by default", async () => {
        const result = await rootValue.createDocument({
            title: "My new document",
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
            kind: undefined,
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.kind).toBe("Document");
    });
});

describe("Test adding a document", () => {
    test("malformed content should return 400", async () => {
        await rootValue.createDocument({
            title: "My new document",
            comments: JSON.stringify([]),
            content: {bla: "test"},
            kind: undefined,
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test adding a document", () => {
    test("malformed comments should return 400", async () => {
        await rootValue.createDocument({
            title: "My new document",
            comments: {comments: "garbled"},
            content: JSON.stringify("Testing!"),
            kind: undefined,
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test adding a document", () => {
    test("No title should return 400", async () => {
        await rootValue.createDocument({
            title: undefined,
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
            kind: "Document",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(406);
                    return {send: () => {}};
                }
            },
        });
    });
});

// updateDocument

describe("Test updating a document", () => {
    test("It should update a text document", async () => {
        const result = await rootValue.updateDocument({
            _id: "612e273fd2455c204e6bcf7c",
            title: "My updated document",
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
            kind: "Document",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.kind).toBe("Document");
        expect(result.title).toBe("My updated document");
        expect(result.content).toBe(JSON.stringify("Testing!"));
    });
});

describe("Test updating a document", () => {
    test("It should update a code document", async () => {
        const result = await rootValue.updateDocument({
            _id: "612e273fd2455c204e6bcf7c",
            title: "My updated document",
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
            kind: "Code",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.kind).toBe("Code");
        expect(result.title).toBe("My updated document");
        expect(result.content).toBe(JSON.stringify("Testing!"));
    });
});

describe("Test updating a document", () => {
    test("It should be a text document", async () => {
        const result = await rootValue.updateDocument({
            _id: "612e273fd2455c204e6bcf7c",
            title: "My updated document",
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            }
        });

        expect(result.kind).toBe("Document");
        expect(result.title).toBe("My updated document");
        expect(result.content).toBe(JSON.stringify("Testing!"));
    });
});

describe("Test updating a document", () => {
    test("No title should return 400", async () => {
        await rootValue.updateDocument({
            _id: "612e273fd2455c204e6bcf7c",
            title: undefined,
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
            kind: "Document",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(406);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test updating a document", () => {
    test("Garbled ID should return 400", async () => {
        await rootValue.updateDocument({
            _id: "123wrong",
            title: "My updated document",
            comments: JSON.stringify([]),
            content: JSON.stringify("Testing!"),
            kind: "Document",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test updating a document", () => {
    test("Garbled content should return 400", async () => {
        await rootValue.updateDocument({
            _id: "612e273fd2455c204e6bcf7c",
            title: "My updated document",
            comments: JSON.stringify([]),
            content: {bad: "content"},
            kind: "Document",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {send: () => {}};
                }
            },
        });
    });
});

describe("Test updating a document", () => {
    test("Garbled comments should return 400", async () => {
        await rootValue.updateDocument({
            _id: "612e273fd2455c204e6bcf7c",
            title: "My updated document",
            comments: {bad: "content"},
            content: JSON.stringify("Hi!"),
            kind: "Document",
        }, {
            user: {
                _id: "6145dad42c8d8aefbceba6cb"
            },
            res: {
                status: (code) => {
                    expect(code).toBe(400);
                    return {send: () => {}};
                }
            },
        });
    });
});
