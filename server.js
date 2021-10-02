const app = require("./app");
const server = require("http").createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: ["http://www.student.bth.se", "http://localhost:3000"],
        methods: ["GET", "POST"]
    },
});

io.on('connection', (socket) => {
    socket.on('open', function (document) {
        socket.join(document);
    });

    socket.on("doc_content", function (delta) {
        const room = Array.from(socket.rooms)[1];

        socket.to(room).emit("doc_content", delta);
    });

    socket.on("new_comment", function (delta) {
        const room = Array.from(socket.rooms)[1];

        socket.to(room).emit("new_comment", delta);
    });
});

const port = process.env.PORT || 1337;

server.listen(port, () => console.log(`Example API listening on port ${port}!`));
