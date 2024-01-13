import * as vscode from "vscode";
import fetchPackageInfoFromNPM from "./fetchPackageInfoFromNPM";

function determineRepositoryNameFromGitURL(gitURL: string): string {
  if (gitURL.toLowerCase().includes("gitlab")) {
    return "GitLab";
  }
  if (gitURL.toLowerCase().includes("bitbucket")) {
    return "Bitbucket";
  }
  if (gitURL.toLowerCase().includes("sourceforge")) {
    return "SourceForge";
  }
  // default to GitHub
  return "GitHub";
}

export default async function composeHoverMarkdownContent(
  packageName: string,
  range?: vscode.Range,
) {
  try {
    // fetch info about package from npm
    const packageDetails = await fetchPackageInfoFromNPM(packageName);
    if (!packageDetails) {
      return null;
    }
    const gitRepositoryURL = packageDetails.repository?.url
      .replace("git+", "")
      .replace(".git", "");
    const repositoryName = determineRepositoryNameFromGitURL(
      gitRepositoryURL ?? "",
    );
    const docsHomePageURL =
      packageDetails.homepage && !packageDetails.homepage.startsWith("git+")
        ? (packageDetails.homepage as string).replace("git+", "")
        : undefined;
    const reportBugURL = packageDetails.bugs?.url;
    const packageDescription = packageDetails.description;
    const hoverContent = new vscode.MarkdownString(
      `**NPM Package Links for ${packageName}**

${packageDescription ? packageDescription : ""}

**Version**: ${packageDetails.version}

**License**: ${packageDetails.license}

[NPM](https://npmjs.com/package/${packageName}) | [${repositoryName}](${gitRepositoryURL}) | ${docsHomePageURL ? `[Homepage](${docsHomePageURL}` : ""})

${reportBugURL ? `[View issues/Report bug](${reportBugURL})` : ""}
`,
      true,
    );
    hoverContent.isTrusted = true;
    return new vscode.Hover(hoverContent, range);
  } catch (e) {
    console.error(e);
    return null;
  }
}
