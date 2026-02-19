"use server";

import { getOctokit } from "@/lib/github";
import { revalidatePath } from "next/cache";

export async function starRepo(owner: string, repo: string) {
  const octokit = await getOctokit();
  if (!octokit) return { error: "Not authenticated" };
  try {
    await octokit.activity.starRepoForAuthenticatedUser({ owner, repo });
    revalidatePath(`/repos/${owner}/${repo}`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to star" };
  }
}

export async function unstarRepo(owner: string, repo: string) {
  const octokit = await getOctokit();
  if (!octokit) return { error: "Not authenticated" };
  try {
    await octokit.activity.unstarRepoForAuthenticatedUser({ owner, repo });
    revalidatePath(`/repos/${owner}/${repo}`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to unstar" };
  }
}

export async function createRepo(
  name: string,
  description: string,
  isPrivate: boolean,
  autoInit: boolean,
  gitignoreTemplate: string,
  licenseTemplate: string
): Promise<{ success: boolean; full_name?: string; error?: string }> {
  const octokit = await getOctokit();
  if (!octokit) return { success: false, error: "Not authenticated" };

  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      description: description || undefined,
      private: isPrivate,
      auto_init: autoInit || undefined,
      gitignore_template: gitignoreTemplate || undefined,
      license_template: licenseTemplate || undefined,
    } as any);

    revalidatePath("/dashboard");
    return { success: true, full_name: data.full_name };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to create repository",
    };
  }
}
