import { NextResponse } from "next/server";
import { getDocs, saveDocs, nextDocId } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  const docs = getDocs();
  if (!userId) {
    return NextResponse.json(docs);
  }

  const owned = docs.filter((d) => d.ownerId === userId);
  const shared = docs.filter((d) => d.sharedWith.includes(userId));
  return NextResponse.json({ owned, shared });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, content, ownerId, sharedWith } = body;
  if (!ownerId || !title) {
    return NextResponse.json({ error: "ownerId and title are required" }, { status: 400 });
  }

  const docs = getDocs();
  const id = nextDocId();
  const now = new Date().toISOString();

  const doc = {
    id,
    title,
    content: content ?? "",
    ownerId,
    sharedWith: sharedWith ?? [],
    createdAt: now,
    updatedAt: now,
  };
  docs.push(doc);
  saveDocs(docs);
  return NextResponse.json(doc, { status: 201 });
}
