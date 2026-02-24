const DATA_ROOT_URL = process.env.DATA_ROOT_URL;
const DATA_REPO_OWNER = process.env.DATA_REPO_OWNER ?? "immxrko";
const DATA_REPO_NAME = process.env.DATA_REPO_NAME ?? "UCL-Replacement-Spot-Race";
const DATA_BRANCH = process.env.DATA_BRANCH ?? "data";

const getDefaultRootUrl = () =>
  `https://raw.githubusercontent.com/${DATA_REPO_OWNER}/${DATA_REPO_NAME}/refs/heads/${DATA_BRANCH}`;

export const getDataRootUrl = () => DATA_ROOT_URL ?? getDefaultRootUrl();

export const buildDataUrl = (filePath: string) =>
  `${getDataRootUrl().replace(/\/$/, "")}/${filePath.replace(/^\//, "")}`;
