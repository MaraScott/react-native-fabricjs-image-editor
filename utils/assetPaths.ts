const DEFAULT_ASSETS_PATH = './assets/public';

const removeTrailingSlash = (value: string) => (value.endsWith('/') ? value.slice(0, -1) : value);

const replaceUnstablePath = (base: string, newTarget: string) => {
  const [prefix, query = ''] = base.split('?');
  if (!query) {
    return `${removeTrailingSlash(prefix)}/img/${newTarget}`;
  }

  const unstableMatch = query.match(/unstable_path=([^&]+)/);
  if (!unstableMatch) {
    return `${removeTrailingSlash(prefix)}/img/${newTarget}?${query}`;
  }

  const decoded = decodeURIComponent(unstableMatch[1]).replace(/\/$/, '');
  const updatedTarget = `${decoded}/img/${newTarget}`;
  const replacedQuery = query.replace(unstableMatch[0], `unstable_path=${encodeURIComponent(updatedTarget)}`);
  return `${prefix}?${replacedQuery}`;
};

export const getAssetsPath = (configuredPath?: string) => configuredPath && configuredPath.trim() !== '' ? configuredPath : DEFAULT_ASSETS_PATH;

export const buildIconUrl = (assetsPath: string | undefined, iconName: string) => {
  const base = getAssetsPath(assetsPath);
  return replaceUnstablePath(base, iconName);
};
