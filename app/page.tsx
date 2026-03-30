/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Doc, User } from "@/lib/data";

function plainTextToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() ? `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "<p><br></p>"))
    .join("");
}

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharingTarget, setSharingTarget] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
      const saved = localStorage.getItem("docapp.user");
      if (saved) {
        const u = data.find((item: User) => item.id === saved);
        if (u) setCurrentUser(u);
      }
    } catch (error) {
      setLoadError("Failed to load users.");
    }
  };

  const loadDocs = async (userId: string | null) => {
    if (!userId) {
      setDocs([]);
      return;
    }

    try {
      const res = await fetch(`/api/docs?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      setDocs([...data.owned, ...data.shared]);
    } catch (error) {
      setLoadError("Failed to load documents.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("docapp.user", currentUser.id);
      loadDocs(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedDoc) {
      setTitle(selectedDoc.title);
      if (editorRef.current) {
        editorRef.current.innerHTML = selectedDoc.content || "";
      }
    } else {
      setTitle("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
  }, [selectedDoc]);

  const ownedDocs = useMemo(() => docs.filter((d) => d.ownerId === currentUser?.id), [docs, currentUser]);
  const sharedDocs = useMemo(() => docs.filter((d) => d.ownerId !== currentUser?.id), [docs, currentUser]);

  const showMessage = (text: string, duration = 3500) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), duration);
  };

  const createDocument = async () => {
    if (!currentUser) return;
    const title = `Untitled ${new Date().toLocaleTimeString()}`;
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: "<p><br></p>", ownerId: currentUser.id }),
    });
    if (!res.ok) return showMessage("Failed to create document");
    const doc = await res.json();
    setDocs((prev) => [...prev, doc]);
    setSelectedDoc(doc);
    showMessage("Document created");
  };

  const saveDocument = async () => {
    if (!currentUser || !selectedDoc) return;
    const content = editorRef.current?.innerHTML ?? "";
    const res = await fetch(`/api/docs/${selectedDoc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) return showMessage("Failed to save document");
    const updated = await res.json();
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDoc(updated);
    showMessage("Document saved");
  };

  const shareDocument = async () => {
    if (!selectedDoc || !sharingTarget) return;
    try {
      const res = await fetch(`/api/docs/${selectedDoc.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: sharingTarget }),
      });
      if (!res.ok) {
        setMessage("Sharing failed");
        return;
      }
      const updated = await res.json();
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setSelectedDoc(updated);
      showMessage(`Shared with ${sharingTarget}`);
    } catch (error) {
      setMessage("Share request failed");
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !currentUser) return;
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["txt", "md"].includes(ext)) {
        showMessage("Only .txt and .md files are supported");
        continue;
      }

      const text = await file.text();
      const content = plainTextToHtml(text);
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: file.name, content, ownerId: currentUser.id }),
      });
      if (!res.ok) {
        showMessage(`Upload failed: ${file.name}`);
        continue;
      }
      const doc = await res.json();
      setDocs((prev) => [...prev, doc]);
      showMessage(`Uploaded ${file.name}`);
    }
  };

  const applyCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value ?? "");
    editorRef.current?.focus();
  };

  const removeDocument = async () => {
    if (!selectedDoc || !currentUser) return;
    if (selectedDoc.ownerId !== currentUser.id) {
      showMessage("Only owner can delete document");
      return;
    }
    const res = await fetch(`/api/docs/${selectedDoc.id}`, { method: "DELETE" });
    if (!res.ok) {
      showMessage("Delete failed");
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== selectedDoc.id));
    setSelectedDoc(null);
    showMessage("Document deleted");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold">Ajaia Docs Lite (Google Docs-style)</h1>
            <p className="text-sm text-slate-500">Rich text, file upload, share and persistence.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" htmlFor="userSelect">
              User:
            </label>
            <select
              id="userSelect"
              className="rounded border px-2 py-1"
              value={currentUser?.id ?? ""}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                if (selected) setCurrentUser(selected);
              }}
            >
              <option value="">-- Choose user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loadError && <div className="rounder border border-red-300 bg-red-100 p-2 text-red-700">{loadError}</div>}

        <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-xl bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Documents</h2>
              <button onClick={createDocument} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500">
                New
              </button>
            </div>

            <div className="mb-3">
              <input
                type="file"
                accept=".txt,.md"
                onChange={(e) => uploadFiles(e.target.files)}
                className="text-xs"
              />
              <p className="text-xs text-slate-500">Upload .txt/.md into new docs</p>
            </div>

            <div className="mb-2">
              <h3 className="text-xs font-semibold uppercase text-slate-400">Owned</h3>
              {ownedDocs.length === 0 && <p className="text-xs text-slate-500">No owned docs</p>}
              {ownedDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`block w-full rounded px-2 py-1 text-left text-sm ${selectedDoc?.id === doc.id ? "bg-blue-100" : "hover:bg-slate-50"}`}
                >
                  {doc.title}
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400">Shared</h3>
              {sharedDocs.length === 0 && <p className="text-xs text-slate-500">No shared docs</p>}
              {sharedDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`block w-full rounded px-2 py-1 text-left text-sm ${selectedDoc?.id === doc.id ? "bg-blue-100" : "hover:bg-slate-50"}`}
                >
                  {doc.title}
                </button>
              ))}
            </div>
          </aside>

          <article className="rounded-xl bg-white p-4 shadow-sm">
            {!currentUser && <p className="text-sm text-slate-600">Select a user to start editing.</p>}
            {currentUser && (
              <>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="w-full">
                    <input
                      className="w-full rounded border px-2 py-1 text-lg font-semibold"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Untitled document"
                      disabled={!selectedDoc}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Owner: {selectedDoc ? selectedDoc.ownerId : "-"} | Shared: {selectedDoc ? selectedDoc.sharedWith.join(", ") || "none" : "-"}
                    </p>
                  </div>
                </div>

                <div className="mb-2 flex flex-wrap gap-1">
                  {[
                    { label: "Bold", command: "bold" },
                    { label: "Italic", command: "italic" },
                    { label: "Underline", command: "underline" },
                    { label: "H1", command: "formatBlock", value: "<h1>" },
                    { label: "H2", command: "formatBlock", value: "<h2>" },
                    { label: "UL", command: "insertUnorderedList" },
                    { label: "OL", command: "insertOrderedList" },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
                      onClick={() => applyCommand(btn.command, btn.value)}
                      type="button"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div
                  ref={editorRef}
                  contentEditable={Boolean(selectedDoc)}
                  className="min-h-[240px] rounded border border-slate-300 p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onInput={() => setMessage(null)}
                  suppressContentEditableWarning={true}
                  style={{ whiteSpace: "pre-wrap" }}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={saveDocument} className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-500" disabled={!selectedDoc}>
                    Save
                  </button>
                  <button onClick={removeDocument} className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500" disabled={!selectedDoc || selectedDoc.ownerId !== currentUser.id}>
                    Delete
                  </button>

                  <input
                    className="rounded border px-2 py-1 text-sm"
                    list="share-user-list"
                    placeholder="Share with user"
                    value={sharingTarget}
                    onChange={(e) => setSharingTarget(e.target.value)}
                  />
                  <datalist id="share-user-list">
                    {users
                      .filter((u) => u.id !== currentUser.id)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </datalist>
                  <button onClick={shareDocument} className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500" disabled={!selectedDoc || sharingTarget === ""}>
                    Share
                  </button>
                </div>

                {selectedDoc && (
                  <p className="mt-2 text-xs text-slate-500">
                    Created: {formatDate(selectedDoc.createdAt)} | Updated: {formatDate(selectedDoc.updatedAt)}
                  </p>
                )}
              </>
            )}
          </article>
        </section>

        {message && <div className="rounded bg-blue-100 p-2 text-sm text-blue-700">{message}</div>}
      </div>
    </div>
  );
}

