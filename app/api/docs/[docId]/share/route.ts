import { NextResponse } from "next/server";
import { getDocs, saveDocs } from "@/lib/data";

export async function POST(request: Request, { params }: { params: { docId: string } }) {
  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const docs = getDocs();
  const idx = docs.findIndex((d) => d.id === params.docId);
  if (idx === -1) {
    return NextResponse.json({ error: "doc not found" }, { status: 404 });
  }

  const doc = docs[idx];
  if (!doc.sharedWith.includes(userId)) {
    doc.sharedWith.push(userId);
    doc.updatedAt = new Date().toISOString();
    saveDocs(docs);
  }

  return NextResponse.json(doc);
}
