import {
  shallow,
} from 'enzyme';

import * as React from 'react';

import passage from './%NAME%';

import * as bundle from '../../src/passages/bundle';

const {
  name,
  tags,
  title,
  contents: Component,
} = passage;

describe('Tests for the %NAME% passage.', () => {
  it('Has a non-empty name string.', () => {
    expect(name && typeof name === 'string').toBe(true);
  });

  it('If it has a title, it is a non-empty string.', () => {
    expect(!title || typeof title === 'string').toBe(true);
  });

  it('If it has tags, they are either non-empty strings or key-value objects.', () => {
    expect(!tags || tags.filter((aa) => {
      if (aa) {
        if (typeof aa === 'string') {
          return true;
        } else if (typeof aa === 'object') {
          if (aa.key &&
              typeof aa.key === 'string' &&
              aa.value &&
              typeof aa.value === 'string')
          {
            return true;
          }
        }
      }

      return false;
    }).length === tags.length).toBe(true);
  });

  it('Renders shallowly without crashing.', () => {
    /* Don't test if it's a noRender passage. */
    if (Array.isArray(tags) && !bundle.tags.getTag(tags, 'noRender')) {
      shallow(<Component />);
    }
  });
});
