import fs from "fs";
import path from "path";

type Maybe<T> = T | null;

export interface User {
  id: string;
  name: string;
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

const dataDir = path.join(process.cwd(), "data");
const usersPath = path.join(dataDir, "users.json");
const docsPath = path.join(dataDir, "docs.json");

let inMemoryDocs: Doc[] = [];
let inMemoryUsers: User[] = [];
let inMemoryUsersLoaded = false;
let inMemoryDocsLoaded = false;
let isReadOnlyFs = false;

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;

    if (err && err.code === "EROFS") {
      isReadOnlyFs = true;
      return defaultValue;
    }

    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    } catch (writeError: unknown) {
      const wErr = writeError as NodeJS.ErrnoException;
      if (wErr && wErr.code === "EROFS") {
        isReadOnlyFs = true;
        return defaultValue;
      }
      throw writeError;
    }
  }
}

function writeJsonFile<T>(filePath: string, data: T) {
  if (isReadOnlyFs) {
    return;
  }

  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err && err.code === "EROFS") {
      isReadOnlyFs = true;
      return;
    }
    throw error;
  }
}

export interface User {
  id: string;
  name: string;
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

export function getUsers(): User[] {
  if (!inMemoryUsersLoaded) {
    inMemoryUsers = readJsonFile<User[]>(usersPath, []);
    inMemoryUsersLoaded = true;
  }
  return inMemoryUsers;
}

export function getDocs(): Doc[] {
  if (!inMemoryDocsLoaded) {
    inMemoryDocs = readJsonFile<Doc[]>(docsPath, []);
    inMemoryDocsLoaded = true;
  }
  return inMemoryDocs;
}

export function saveDocs(docs: Doc[]) {
  inMemoryDocs = docs;
  writeJsonFile(docsPath, docs);
}

export function findUser(id: string): Maybe<User> {
  return getUsers().find((u) => u.id === id) ?? null;
}

export function findDoc(id: string): Maybe<Doc> {
  return getDocs().find((doc) => doc.id === id) ?? null;
}

export function nextDocId(): string {
  const docs = getDocs();
  const max = docs.reduce((acc, doc) => Math.max(acc, Number(doc.id) || 0), 0);
  return `${max + 1}`;
}

export function plainTextToHtml(plain: string): string {
  const escaped = plain
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<p><br></p>";
      return `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
    })
    .join("");
  return escaped;
}
