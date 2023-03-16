export enum Host {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  UNK = 'unknown'
}

export const HOST_MAP: Record<string, Host> = {
  'github.com': Host.GITHUB,
  'gist.github.com': Host.GITHUB,
  'gitlab.com': Host.GITLAB
};

export const getURLHost = (url?: string): Nullable<Host> => {
  if (url) {
    const parsedURL = new URL(url);
    return HOST_MAP[parsedURL.host] || Host.UNK;
  }
  return null;
}
