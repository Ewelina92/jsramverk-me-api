process.env.NODE_ENV = 'test';
const request = require("supertest");
const ObjectId = require('mongodb').ObjectId;
const database = require("../db/database");
const app = require("../app");

beforeEach(async () => {
    // populate db
    const data = [
        {
            _id: new ObjectId("612e273fd2455c204e6bcf7c"),
            title: "Title one",
            content: "Content one"
        },
        {
            _id: new ObjectId("612e273fd2455c204e6bcf7d"),
            title: "Title two",
            content: "Content two"
        }
    ];

    const db = await database.getDb();

    await db.collection.deleteMany();
    //await col.deleteMany();
    await db.collection.insertMany(data);

    return db.client.close();
});

describe("Test the root /documents", () => {
    test("It should response the GET method", () => {
        return request(app)
            .get("/documents")
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveLength(2);
            });
    });
});

describe("Test unvalid PUT request, lacking content", () => {
    test("It should response a 406 statuscode", () => {
        return request(app)
            .put("/documents")
            .send({
                title: "I am lacking content"
            })
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});

describe("Test unvalid PUT request, lacking title", () => {
    test("It should response a 406 statuscode", () => {
        return request(app)
            .put("/documents")
            .send({
                content: "I am lacking a title"
            })
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});

describe("Test unvalid PUT request, lacking body", () => {
    test("It should response a 406 statuscode", () => {
        return request(app)
            .put("/documents")
            .send({})
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});

describe("Test valid PUT request, lacking body", () => {
    test("It should response a 201 statuscode", () => {
        return request(app)
            .put("/documents")
            .send({
                title: "A whole new title",
                content: "A whole new content"
            })
            .then(response => {
                expect(response.statusCode).toBe(201);
            });
    });
});

describe("Test unvalid POST request, lacking content", () => {
    test("It should response a 406 statuscode", () => {
        return request(app)
            .post("/documents/612e273fd2455c204e6bcf7c")
            .send({
                title: "I am lacking content"
            })
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});

describe("Test unvalid POST request, lacking title", () => {
    test("It should response a 406 statuscode", () => {
        return request(app)
            .post("/documents/612e273fd2455c204e6bcf7c")
            .send({
                content: "I am lacking a title"
            })
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});

describe("Test unvalid POST request, wrong id with valid format", () => {
    test("It should response a 400 statuscode", () => {
        return request(app)
            .post("/documents/not-valid-id")
            .send({
                title: "I am a title.",
                content: "I have content."
            })
            .then(response => {
                expect(response.statusCode).toBe(400);
            });
    });
});

describe("Test unvalid POST request, wrong id with unvalid format", () => {
    test("It should response a 400 statuscode", () => {
        return request(app)
            .post("/documents/garbage")
            .send({
                title: "I am a new title.",
                content: "I have new content."
            })
            .then(response => {
                expect(response.statusCode).toBe(400);
            });
    });
});

describe("Test valid POST request, ", () => {
    test("It should response a 202 statuscode", () => {
        return request(app)
            .post("/documents/612e273fd2455c204e6bcf7c")
            .send({
                title: "I am a new title.",
                content: "I have new content."
            })
            .then(response => {
                expect(response.statusCode).toBe(202);
            });
    });
});

describe("Test the unvalid /documents/:id with valid format", () => {
    test("It should response a 406 statuscode", () => {
        return request(app)
            .get("/documents/not-valid-id")
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});

describe("Test the unvalid /documents/:id with invalid format", () => {
    test("It should response a 406 statuscode", () => {
        return request(app)
            .get("/documents/garbage")
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});

describe("Test the valid  /documents/:id", () => {
    test("It should response a 200 statuscode", () => {
        return request(app)
            .get("/documents/612e273fd2455c204e6bcf7c")
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toMatchObject({
                    title: "Title one",
                    content: "Content one",
                });
            });
    });
});

// afterEach(() => {
//     clearTestDatabase();
// });

// test('city database has Vienna', () => {
//     expect(isCity('Vienna')).toBeTruthy();
// });

// test('city database has San Juan', () => {
//     expect(isCity('San Juan')).toBeTruthy();
// });
