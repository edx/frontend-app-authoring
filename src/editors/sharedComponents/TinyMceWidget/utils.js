const getLocatorSafeName = ({ displayName }) => {
  const locatorSafeName = displayName.replace(/[^\w.%-]/gm, '');
  return locatorSafeName;
};

export const getStaticUrl = ({ displayName }) => (`/static/${getLocatorSafeName({ displayName })}`);

export const getRelativeUrl = ({ courseId, displayName }) => {
  if (displayName) {
    const assetCourseId = courseId.replace('course', 'asset');
    // Use "block/" (as the LMS renders /static/ urls) so relative links inside an embedded HTML asset resolve.
    const assetPathShell = `/${assetCourseId}+type@asset+block/`;
    return `${assetPathShell}${displayName}`;
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
