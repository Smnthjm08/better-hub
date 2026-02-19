"use server";

import { getOctokit, invalidateRepoPullRequestsCache } from "@/lib/github";
import { revalidatePath } from "next/cache";

export async function refreshPullRequests(owner: string, repo: string) {
  await invalidateRepoPullRequestsCache(owner, repo);
  revalidatePath(`/repos/${owner}/${repo}/pulls`);
}

export async function fetchPRsByAuthor(
  owner: string,
  repo: string,
  author: string
) {
  const octokit = await getOctokit();
  if (!octokit) return { open: [], closed: [] };

  const [openRes, closedRes] = await Promise.all([
    octokit.search.issuesAndPullRequests({
      q: `is:pr is:open repo:${owner}/${repo} author:${author}`,
      per_page: 100,
      sort: "updated",
      order: "desc",
    }),
    octokit.search.issuesAndPullRequests({
      q: `is:pr is:closed repo:${owner}/${repo} author:${author}`,
      per_page: 100,
      sort: "updated",
      order: "desc",
    }),
  ]);

  return {
    open: openRes.data.items,
    closed: closedRes.data.items,
  };
}
