import { getRepoPageData } from "@/lib/github";
import { TrackView } from "@/components/shared/track-view";
import { RepoOverview } from "@/components/repo/repo-overview";

export default async function RepoPage({
	params,
}: {
	params: Promise<{ owner: string; repo: string }>;
}) {
	const { owner, repo } = await params;

	const pageData = await getRepoPageData(owner, repo);
	if (!pageData) return null;

	const { repoData, navCounts } = pageData;
	const { permissions } = repoData;
	const isMaintainer = permissions.push || permissions.admin || permissions.maintain;

	return (
		<div className={isMaintainer ? "flex flex-col flex-1 min-h-0" : undefined}>
			<TrackView
				type="repo"
				url={`/${owner}/${repo}`}
				title={`${owner}/${repo}`}
				subtitle={repoData.description || "No description"}
				image={repoData.owner.avatar_url}
			/>
			<RepoOverview
				owner={owner}
				repo={repo}
				repoData={repoData}
				isMaintainer={isMaintainer}
				openPRCount={navCounts.openPrs}
				openIssueCount={navCounts.openIssues}
				defaultBranch={repoData.default_branch}
			/>
		</div>
	);
}
