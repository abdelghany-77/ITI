import fs from "fs/promises";
import { Command } from "commander";

const program = new Command();

// Read users from file
async function readUsers() {
  try {
    const data = await fs.readFile("./users.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users file:", error.message);
    return [];
  }
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

// Save users to file
async function saveUsers(users) {
  try {
    await fs.writeFile("./users.json", JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error("Error", error.message);
    return false;
  }
}

// Add user
async function addUser(name) {
  if (!name) {
    return;
  }

  const users = await readUsers();
  const newUser = {
    id: genId(users),
    Name: name,
  };

  users.push(newUser);
  const saved = await saveUsers(users);

  if (saved) {
    console.log(`User added successfully `);
  } else {
    console.log("Error");
  }
}

// Remove user
async function removeUser(id) {
  if (!id) {
    return;
  }

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return;
  }

  const users = await readUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return;
  }

  users.splice(userIndex, 1);
  const saved = await saveUsers(users);

  if (saved) {
    console.log(`User removed successfully`);
  } else {
    console.log("Error");
  }
}

// Get all users
async function getAll() {
  const users = await readUsers();

  if (users.length === 0) {
    return;
  }
  users.forEach((user) => {
    console.log(`ID: ${user.id} , Name: ${user.Name}`);
  });
}

// Get user by id
async function getOne(id) {
  if (!id) {
    return;
  }

  const userId = parseInt(id);
  if (isNaN(userId)) {
    return;
  }

  const users = await readUsers();
  const user = users.find((user) => user.id === userId);

  if (!user) {
    return;
  }

  console.log(`ID: ${user.id} , Name: ${user.Name}`);
}

// Edit user function
async function editUser(id, newName) {
  if (!id || !newName) {
    return;
  }

  const userId = parseInt(id);
  const users = await readUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return;
  }

  users[userIndex].Name = newName;
  const saved = await saveUsers(users);

  if (saved) {
    console.log(`User updated successfully:`);
  } else {
    console.log("Error");
  }
}

//? Create user command
program
  .command("create")
  .description("Create a new user")
  .argument("<name>", "user name")
  .action(addUser);

//? Read all users command
program.command("list").description("List all users").action(getAll);

//? Read one user command
program
  .command("get")
  .description("Get a user by ID")
  .argument("<id>", "user ID")
  .action(getOne);

//? Update user command
program
  .command("update")
  .description("Update a user")
  .argument("<id>", "user ID")
  .argument("<name>", "new user name")
  .action(editUser);

//! Delete user command
program
  .command("delete")
  .description("Delete a user")
  .argument("<id>", "user ID")
  .action(removeUser);

// Parse command line arguments
program.parse();
