import { parseAssetName } from './utils';

const prefix = '/asset-v1:org+test+run+type@asset+block';

describe('parseAssetName', () => {
  it.each([
    ['block/ form', `${prefix}/a.png`],
    ['block@ form', `${prefix}@a.png`],
    ['courseware hash form', `/assets/courseware/v1/abc123${prefix}/a.png`],
  ])('reads the name from a url with nothing after it, %s', (_name, url) => {
    expect(parseAssetName(url)).toEqual('a.png');
  });

  it('stops at the closing quote', () => {
    expect(parseAssetName(`${prefix}/a.png" alt="x@y"`)).toEqual('a.png');
    expect(parseAssetName(`${prefix}@a.png&quot; alt=&quot;x&quot;`)).toEqual('a.png');
  });
});
