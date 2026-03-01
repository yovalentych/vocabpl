import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const db = await getDb();

    // Search by username or name (case-insensitive)
    const users = await db
      .collection("users")
      .find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } }
        ]
      })
      .project({ _id: 1, username: 1, name: 1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      users: users.map(u => ({
        id: u._id.toString(),
        username: u.username,
        name: u.name || ""
      }))
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
