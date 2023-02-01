const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const session = require("express-session");

// App setup
app.use(cors());

app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", async (req, res) => {
  try {
    res.send("Server is up!");
    console.log("Server is up!");
  } catch (error) {
    res.send(error);
  }
});

let activeUsers = [];

io.on("connection", (socket) => {
  console.log("new socket connection: " + socket.id);

  socket.on("new user", (sessionId, callback) => {
    const searchActiveUser = activeUsers.find((item) => {
      if (item.sessionId == sessionId) {
        return true;
      }
    });

    if (!searchActiveUser) {
      if (activeUsers.length == 0) {
        activeUsers.push({ sessionId, role: "mentor", socketId: socket.id });
        console.log("new Mentor added!");
      } else {
        //check if mentor is exist...
        const checkForMentor = activeUsers.find((item) => {
          if (item.role == "mentor") {
            return true;
          }
        });

        if (!checkForMentor) {
          activeUsers.push({ sessionId, role: "mentor", socketId: socket.id });
          console.log("new Mentor added!");
        } else {
          activeUsers.push({ sessionId, role: "student", socketId: socket.id });
          console.log("new Student added!");
        }
      }
    } else {
      const objIndex = activeUsers.findIndex(
        (obj) => obj.sessionId == sessionId
      );

      activeUsers[objIndex].socketId = socket.id;
    }

    callback({
      activeUsers: activeUsers,
    });
  });

  socket.on("code-update", (code) => {
    socket.broadcast.emit("code-update", code.code);
  });

  socket.on("disconnect", () => {
    let idToRemove = socket.id;

    const filteredActiveUser = activeUsers.filter(
      (item) => item.socketId !== idToRemove
    );

    activeUsers = filteredActiveUser;
  });
});

const port = process.env.port || 5000;
server.listen(port, () => {
  console.log("Server is running...");
});
