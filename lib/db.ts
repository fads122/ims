import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure users file exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  createdAt: string;
}

export function getUsers(): User[] {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function findUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function createUser(email: string, hashedPassword: string): User {
  const users = getUsers();
  const newUser: User = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

