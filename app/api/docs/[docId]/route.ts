import { NextResponse } from "next/server";
import { getDocs, saveDocs } from "@/lib/data";

export async function GET(request: Request, { params }: { params: { docId: string } }) {
  const docs = getDocs();
  const doc = docs.find((d) => d.id === params.docId);
  if (!doc) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(doc);
}

export async function PUT(request: Request, { params }: { params: { docId: string } }) {
  const payload = await request.json();
  const docs = getDocs();
  const idx = docs.findIndex((d) => d.id === params.docId);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const existing = docs[idx];
  docs[idx] = {
    ...existing,
    ...payload,
    id: existing.id,
    ownerId: existing.ownerId,
    updatedAt: new Date().toISOString(),
  };

  saveDocs(docs);
  return NextResponse.json(docs[idx]);
}

export async function DELETE(request: Request, { params }: { params: { docId: string } }) {
  const docs = getDocs();
  const idx = docs.findIndex((d) => d.id === params.docId);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  docs.splice(idx, 1);
  saveDocs(docs);
  return NextResponse.json({ success: true });
}
