process.env.NODE_ENV = 'test';
const request = require("supertest");
const app = require("../app");

describe("Test downloading pdf", () => {
    test("It should respond with 200 OK", () => {
        return request(app)
            .post("/pdf")
            .send({
                html: "<b>Hello!</b>"
            })
            .then(response => {
                expect(response.statusCode).toBe(200);
            });
    });
});

describe("Test requesting bad pdf", () => {
    test("It should respond with 406", () => {
        return request(app)
            .post("/pdf")
            .send({
                notHtml: "<b>Hello!</b>"
            })
            .then(response => {
                expect(response.statusCode).toBe(406);
            });
    });
});
