const app = require("./app");
const server = require("http").createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://192.168.86.247:3000",
        methods: ["GET", "POST"]
    },
});

io.on('connection', (socket) => {
    socket.on('open', function (document) {
        console.log(socket.rooms);
        socket.join(document);
        console.log("User connected", document);
    });

    socket.on("doc_content", function (delta) {
        // console.log(delta);
        // console.log(socket.rooms);
        // console.log(Array.from(socket.rooms)[1]);
        const room = Array.from(socket.rooms)[1];

        console.log("sending to", room);

        socket.to(room).emit("doc_content", delta);
    });
});

const port = process.env.PORT || 1337;

server.listen(port, () => console.log(`Example API listening on port ${port}!`));
