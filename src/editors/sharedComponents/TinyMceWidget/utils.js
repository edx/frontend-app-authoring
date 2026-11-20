const getLocatorSafeName = ({ displayName }) => {
  const locatorSafeName = displayName.replace(/[^\w.%-]/gm, '');
  return locatorSafeName;
};

export const getStaticUrl = ({ displayName }) => (`/static/${getLocatorSafeName({ displayName })}`);

// What every asset url of a course starts with, before "/name" or "@name".
export const getAssetUrlPrefix = (courseId) => `/${courseId.replace('course', 'asset')}+type@asset+block`;

export const getRelativeUrl = ({ courseId, displayName }) => {
  if (displayName) {
    // Use "block/" (as the LMS renders /static/ urls) so relative links inside an embedded HTML asset resolve.
    return `${getAssetUrlPrefix(courseId)}/${displayName}`;
  }
  return '';
};

// Takes a url, optionally followed by its closing quote and whatever comes after it.
export const parseAssetName = (relativeUrl) => {
  let assetName = '';
  const end = relativeUrl.search(/("|&quot;)/);
  const url = end === -1 ? relativeUrl : relativeUrl.substring(0, end);
  // Filenames may start with any character getLocatorSafeName keeps, not only \w (e.g. "-embed.html").
  if (relativeUrl.match(/\/asset-v1:\S+[+]\S+[@]\S+[+]\S+\/[\w.%-]/)?.length >= 1) {
    const dividedSrc = url.split(/\/asset-v1:\S+[+]\S+[@]\S+[+]\S+[/@]/);
    [, assetName] = dividedSrc;
  } else {
    const assetBlockName = url.substring(url.indexOf('@') + 1);
    assetName = assetBlockName.substring(assetBlockName.indexOf('@') + 1);
  }
  return assetName;
};
