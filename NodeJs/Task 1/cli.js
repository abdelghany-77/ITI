import fs from "fs/promises";

const data = await fs.readFile("./users.json", "utf-8");
let parsedData = JSON.parse(data);
const [, , action, ...args] = process.argv;

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

// save users to file
async function saveUsers(users) {
  await fs.writeFile("./users.json", JSON.stringify(users, null, 2));
}

// Add user
async function addUser(name) {
  const newUser = {
    id: genId(parsedData),
    Name: name,
  };

  parsedData.push(newUser);
  await saveUsers(parsedData);
  console.log(`added successfully `);
}

//! Remove user
async function removeUser(id) {
  const userId = parseInt(id);
  const userIndex = parsedData.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return 0;
  }
  parsedData.splice(userIndex, 1);
  await saveUsers(parsedData);
  console.log(`User removed successfully`);
}

// Get all users function
function getAll() {
  if (parsedData.length === 0) {
    console.log("No users found");
    return;
  }
  parsedData.forEach((user) => {
    console.log(`ID: ${user.id}, Name: ${user.Name}`);
  });
}

// user by id
function getOne(id) {
  const userId = parseInt(id);
  const user = parsedData.find((user) => user.id === userId);

  if (!user) {
    console.log(`User not found`);
    return;
  }

  console.log(`Name: ${user.Name}`);
}

//? Edit user function
async function editUser(id, newName) {
  if (!id || !newName) {
    return 0;
  }

  const userId = parseInt(id);
  const userIndex = parsedData.findIndex((user) => user.id === userId);

  parsedData[userIndex].Name = newName;
  await saveUsers(parsedData);
  console.log(`User updated successfully`);
}

switch (action) {
  case "add":
    await addUser(args[0]);
    break;
  case "remove":
    await removeUser(args[0]);
    break;
  case "getall":
    getAll();
    break;
  case "getone":
    getOne(args[0]);
    break;
  case "edit":
    await editUser(args[0], args[1]);
    break;
}
