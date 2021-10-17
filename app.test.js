process.env.NODE_ENV = 'test';
const request = require("supertest");
const app = require("./app");

describe("Test non-existant route", () => {
    test("It should response the GET method", () => {
        return request(app)
            .get("/doesnotexist")
            .then(response => {
                expect(response.statusCode).toBe(404);
            });
    });
});
