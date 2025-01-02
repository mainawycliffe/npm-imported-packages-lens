import { render } from "ejs";
import * as vscode from "vscode";
import fetchPackageInfoFromNPM, {
  fetchLatestPackageVersionFromNPM,
} from "./fetchPackageInfoFromNPM";

/**
 * EJS template for the hover content, which is rendered with the package details
 * For more info on EJS, see https://ejs.co/
 */
const contentMarkdownTemplate = `
#### NPM Package Links for <%= packageName %>

<% if(packageDescription) { %>
<%= packageDescription%>
<% } %>

---

#### Links

[NPM](https://npmjs.com/package/<%= packageName %>) <% if (repositoryName) { %> | [<%= repositoryName %>](<%= gitRepositoryURL %>) <% } %>  <% if (docsHomePageURL) { %> | [Homepage](<%= docsHomePageURL %>) <% } %>

<% if (reportBugURL) { %>
[View issues/Report bug](<%= reportBugURL %>)
<% } %>

---
**Version**: <%= packageDetails.version %>

<% if(latestPackageVersion) { %>
_**⭐️ Latest version**: <%= latestPackageVersion %>_
<% } %>

**License**: <%= packageDetails.license %>
`;

function determineRepositoryNameFromGitURL(gitURL: string): string | undefined {
  if (!gitURL) {
    return undefined;
  }

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
    // fetch info about the latest version of the package from npm
    const latestPackageVersion =
      await fetchLatestPackageVersionFromNPM(packageName);
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
    const str = render(contentMarkdownTemplate, {
      packageDetails,
      packageName,
      packageDescription,
      latestPackageVersion,
      repositoryName,
      gitRepositoryURL,
      docsHomePageURL,
      reportBugURL,
    });
    const hoverContent = new vscode.MarkdownString(str, true);
    hoverContent.isTrusted = true;
    return new vscode.Hover(hoverContent, range);
  } catch (e) {
    console.error(e);
    return null;
  }
}
