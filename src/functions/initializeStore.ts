import {
  ActionTypes,
} from '../actions/ActionTypes';
import {
  BuiltInTags,
} from '../tags/BuiltInTags';
import {
  checkPassageObject,
} from './checkPassageObject';
import {
  createCurrentPassageNameAction,
} from '../actions/creators/createCurrentPassageNameAction';
import {
  createPassageHistoryAction,
} from '../actions/creators/createPassageHistoryAction';
import {
  createPassagesAction,
} from '../actions/creators/createPassagesAction';
import {
  createStartPassageNameAction,
} from '../actions/creators/createStartPassageNameAction';
import {
  IPassage,
} from '../passages/IPassage';
import {
  Store,
} from 'redux';
import { createStoryStateAction } from '../actions/creators/createStoryStateAction';

// tslint:disable
// @ts-ignore
const slash = require('slash');
// tslint:enable

export const strings = {
  MULTIPLE_DEFAULT_PASSAGES:
  'At least two passages had the tag "start". Only one tag is allowed. ' +
  'The passages found with this error were named %1% and %2%.',
  
  MULTIPLE_PASSAGES_WITH_SAME_NAME:
  'At least two passages had the name %NAME%. The name property of every ' +
  'passage must be unique.',

  NO_START_PASSAGE:
    'There was no passage in the passages/ folder with the "start" tag. One ' +
    'and only one passage must have the start tag.',

  PASSAGES_MANIFEST_EMPTY:
    'The passages-manifest.json file contained an empty array, indicating ' +
    'that no passages have been authored in passages/.',

  PASSAGES_MANIFEST_INVALID:
    'The passages-manifest.json file was not parseable into an array.',

  PASSAGE_OBJECT_INVALID:
    'One of the passage objects, found at %FILEPATH%, was invalid. ' +
    '%REASON%.',
};

export const initializeStore = (store: Store, passagesManifest: string[]) => {
  if (!Array.isArray(passagesManifest)) {
    throw new Error(strings.PASSAGES_MANIFEST_INVALID);
  } else if (!passagesManifest.length) {
    throw new Error(strings.PASSAGES_MANIFEST_EMPTY);
  }

  let passageObjects: IPassage[];
  try {
    passageObjects = passagesManifest.map((path) => (
      /* Give webpack hints about where we're importing. If you don't do this,
       * webpack will bundle a lot of stuff you don't care about and show you a
       * confusing error about "Critical dependencies.""
       * 
       * I had a much nicer async/import() setup here but rendering after a
       * promise resolves was not working at all, and it's doubtful anyone is
       * going to try to kitbash this into an SSR setup, so the client-side
       * difference is effectively nil.
       * 
       * Note also that requires frequently fail in the browser when using
       * Windows filepaths (modules are standardized with forward slashes)
       * so the call to slash should ameliorate this issue. */
      // @ts-ignore
      require(`../../passages/${slash(path)}`)
    )).map((aa) => aa.default);
  } catch (err) {
    throw err;
  }

  const passageMap = {};
  let startPassage: IPassage | null = null;
  passageObjects.forEach((passageObj, index) => {
    const checkFailMsg = checkPassageObject(passageObj);
    if (checkFailMsg) {
      const errStr = strings.PASSAGE_OBJECT_INVALID
        .replace('%FILEPATH%', passagesManifest[index])
        .replace('%REASON%', checkFailMsg);

      throw new Error(errStr);
    }

    if (passageObj.name in passageMap) {
      const errStr = strings.PASSAGE_OBJECT_INVALID
        .replace('%NAME%', passageObj.name);

      throw new Error(errStr);
    }

    if (passageObj.tags && passageObj.tags.indexOf('start') !== -1) {
      if (startPassage) {
        const errStr = strings.MULTIPLE_DEFAULT_PASSAGES
          .replace('%1%', startPassage.name)
          .replace('%2%', passageObj.name);

        throw new Error(errStr);
      }

      startPassage = passageObj;
    }

    passageMap[passageObj.name] = passageObj;
  });

  if (!startPassage) {
    throw new Error(strings.NO_START_PASSAGE);
  }

  const name = startPassage!.name;
  store.dispatch(createPassagesAction(passageMap));
  store.dispatch(createStartPassageNameAction(name));
  store.dispatch(createCurrentPassageNameAction(name));
  store.dispatch(createStoryStateAction(ActionTypes.StoryStateNew));
  store.dispatch(createPassageHistoryAction(
    ActionTypes.PassageHistoryNew,
    {
      name,
      linkTags: [
        BuiltInTags.Start,
      ],
    },
  ));
};

export default initializeStore;
