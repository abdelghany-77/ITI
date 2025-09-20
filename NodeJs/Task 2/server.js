import http from "http";
import fs from "fs/promises";
import url from "url";

const PORT = 3000;

// Read users from file
async function getUsers() {
  try {
    const data = await fs.readFile("./users.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save users to file
async function saveUsers(users) {
  await fs.writeFile("./users.json", JSON.stringify(users, null, 2));
}

// Generate new ID
function genId(users) {
  if (users.length === 0) {
    return 1;
  }

  let highestId = 0;
  for (let i = 0; i < users.length; i++) {
    if (users[i].id > highestId) {
      highestId = users[i].id;
    }
  }
  return highestId + 1;
}

// Get request
async function getBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  return body ? JSON.parse(body) : {};
}

// Send JSON response
function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// Create server
const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);
  const method = req.method;

  console.log(`${method} ${pathname}`);

  try {
    const users = await getUsers();

    // Get all users
    if (pathname === "/users" && method === "GET") {
      sendJSON(res, 200, users);
    }

    // Get user by ID
    else if (pathname.match(/^\/users\/\d+$/) && method === "GET") {
      const id = parseInt(pathname.split("/")[2]);
      const user = users.find((u) => u.id === id);

      if (user) {
        sendJSON(res, 200, user);
      } else {
        sendJSON(res, 404, { error: "User not found" });
      }
    }

    // Create new user
    else if (pathname === "/users" && method === "POST") {
      const body = await getBody(req);

      if (!body.name) {
        sendJSON(res, 400, { error: "Name is required" });
        return;
      }

      const newUser = {
        id: genId(users),
        name: body.name,
      };

      users.push(newUser);
      await saveUsers(users);
      sendJSON(res, 201, newUser);
    }

    // Update user
    else if (pathname.match(/^\/users\/\d+$/) && method === "PUT") {
      const id = parseInt(pathname.split("/")[2]);
      const body = await getBody(req);
      const user = users.find((u) => u.id === id);

      if (!user) {
        sendJSON(res, 404, { error: "User not found" });
        return;
      }

      if (!body.name) {
        sendJSON(res, 400, { error: "Name is required" });
        return;
      }

      user.name = body.name;
      await saveUsers(users);
      sendJSON(res, 200, user);
    }

    // Delete user
    else if (pathname.match(/^\/users\/\d+$/) && method === "DELETE") {
      const id = parseInt(pathname.split("/")[2]);
      const index = users.findIndex((u) => u.id === id);

      if (index === -1) {
        sendJSON(res, 404, { error: "User not found" });
        return;
      }

      const deletedUser = users.splice(index, 1)[0];
      await saveUsers(users);
      sendJSON(res, 200, deletedUser);
    } else {
      sendJSON(res, 404, { error: "not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    sendJSON(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
