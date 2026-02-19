import { NextRequest, NextResponse } from "next/server";
import { getOctokit } from "@/lib/github";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  if (!q) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  const octokit = await getOctokit();
  if (!octokit) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const org = searchParams.get("org") || "";
  const perPage = Math.min(
    Math.max(Number(searchParams.get("per_page")) || 30, 1),
    100
  );

  // If org is provided, search org members first, then backfill with global results
  if (org) {
    try {
      const [orgRes, globalRes] = await Promise.all([
        octokit.search.users({
          q: `${q} org:${org}`,
          per_page: perPage,
        }),
        octokit.search.users({
          q,
          per_page: perPage,
        }),
      ]);

      const seen = new Set<string>();
      const merged: any[] = [];

      for (const u of orgRes.data.items) {
        if (!seen.has(u.login)) {
          seen.add(u.login);
          merged.push(u);
        }
      }
      for (const u of globalRes.data.items) {
        if (!seen.has(u.login) && merged.length < perPage) {
          seen.add(u.login);
          merged.push(u);
        }
      }

      return NextResponse.json({
        total_count: merged.length,
        items: merged,
      });
    } catch {
      // Fall through to plain search if org search fails
    }
  }

  const { data } = await octokit.search.users({
    q,
    per_page: perPage,
  });

  return NextResponse.json(data);
}
