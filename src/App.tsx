import { useState, useReducer } from 'react';
import { example, section, invalid, box } from './App.css';

type cssMapKey = string;
type cssMapValue = string;

type cssMap = Record<cssMapValue, cssMapKey[]>;
type reverseCssMap = Record<cssMapKey, cssMapValue>;

interface cssMapDataEntry {
  text: string;
  valid: boolean;
  map: cssMap;
  keys: cssMapKey[];
  values: cssMapValue[];
  reverseMap: reverseCssMap;
}
type cssMapDataState = cssMapDataEntry[];

interface cssMapDataAction {
  index: number;
  text: string;
}

interface parseEntryText {
  type: 'text';
  text: string;
}

interface parseEntryKey {
  type: 'key';
  key: string;
  value: string;
  hasDot: boolean;
}

type parseEntry = parseEntryText | parseEntryKey;

interface parseResult {
  entries: parseEntry[];
  translatedOutput: string;
  jsOutput: string;
}

const initialCssMapCount = 3;

function cssMapReducer(state: cssMapDataState, { index, text }: cssMapDataAction) {
  let valid = false;
  let map: cssMap = {};
  let keys: cssMapKey[] = [];
  let values: cssMapValue[] = [];

  const reverseMap: reverseCssMap = {};
  try {
    if (text) {
      const parsed = JSON.parse(text);

      if (!Object.values(parsed).every((value) => Array.isArray(value))) {
        throw new Error('JSON value is not an array');
      }

      map = parsed;

      keys = Object.values(map).flat().filter(Boolean);
      values = Object.keys(map).filter(Boolean);

      // eslint-disable-next-line @typescript-eslint/no-shadow
      for (const [key, values] of Object.entries(map)) {
        for (const value of values) {
          reverseMap[value] = key;
        }
      }
    }

    valid = true;
  } catch (e) {
    //
  }

  const newState = [...state];
  newState[index] = { text, valid, map, keys, values, reverseMap };
  return newState;
}

const blankCssMapDataEntry: cssMapDataEntry = {
  text: '',
  valid: true,
  map: {},
  keys: [],
  values: [],
  reverseMap: {},
};

const EXAMPLE_MAP = { 'timeline': ['Ac1HR'], post: ['FwDxs', '8anIv'] };
const EXAMPLE_MAP_TWO = { 'timeline': ['BXfYg'], post: ['C3MCM', 'zyZjj'] };

let initialData: cssMapDataState = Array(initialCssMapCount).fill(blankCssMapDataEntry);
initialData = cssMapReducer(initialData, {
  index: 0,
  text: JSON.stringify(EXAMPLE_MAP),
});
initialData = cssMapReducer(initialData, {
  index: 1,
  text: JSON.stringify(EXAMPLE_MAP_TWO),
});

const EXAMPLE_INPUT = `
.Ac1HR .8anIv {
  display: block;
}

<div class="Ac1HR">
  <div class="FwDxs">hello</div>
</div>
`.trim();

function App() {
  const [input, setInput] = useState<string>(EXAMPLE_INPUT);

  const [cssMapTexts, dispatchCssMapTexts] = useReducer(cssMapReducer, initialData);

  const parseResults: parseResult[] = cssMapTexts
    .filter(({ keys }) => keys.length)
    .map(({ keys, reverseMap }) => {
      let entries: parseEntry[] = [];

      try {
        if (keys.length) {
          const dotKeys = keys.map((key) => `.${key}`);

          const regex = new RegExp(`(\\.?(?:${keys.join('|')}))`);

          const fragments = input.split(regex);

          entries = fragments.map((fragment) => {
            if (dotKeys.includes(fragment)) {
              const fragmentWithoutDot = fragment.replace(/^\./, '');
              return {
                type: 'key',
                key: fragmentWithoutDot,
                value: reverseMap[fragmentWithoutDot],
                hasDot: true,
              } as parseEntryKey;
            }
            if (keys.includes(fragment)) {
              return {
                type: 'key',
                key: fragment,
                value: reverseMap[fragment],
                hasDot: false,
              } as parseEntryKey;
            }
            return {
              type: 'text',
              text: fragment,
            } as parseEntryText;
          });
        }
      } catch (e) {
        // do nothing
      }

      let translatedOutput = '';
      let jsOutput = '';
      try {
        translatedOutput = entries
          .map((entry) => {
            if (entry.type === 'key') {
              const value = entry.value ?? 'UNKNOWN';
              return entry.hasDot ? `.ⓣ${value}` : `ⓣ${value}`;
            }
            return entry.text;
          })
          .join('');

        jsOutput = entries
          .map((entry) => {
            if (entry.type === 'key') {
              const value = entry.value ?? 'UNKNOWN';
              return entry.hasDot
                ? `\${keyToCss('${value}')}`
                : `\${keyToClasses('${value}').join(' ')}`;
            }
            return entry.text;
          })
          .join('');
      } catch (e) {
        // do nothing
      }

      return { entries, translatedOutput, jsOutput };
    });

  const bestCount = Math.max(...parseResults.map(({ entries }) => entries.length));
  const bestParsedResult = parseResults.find(({ entries }) => entries.length === bestCount);

  const { entries, translatedOutput, jsOutput } = bestParsedResult ?? {
    entries: [],
    translatedOutput: '',
    jsOutput: '',
  };

  const updateResults = cssMapTexts
    .filter(({ keys }) => keys.length)
    .map(({ map }) => {
      let count = 0;

      const mappedEntries = entries.map((entry) => {
        if (entry.type === 'key') {
          if (map[entry.value]) {
            count++;
            return { ...entry, keys: map[entry.value] };
          }
          return { ...entry, keys: ['UNKNOWN'] };
        }
        return entry;
      });

      let updatedOutput = '';
      try {
        updatedOutput = mappedEntries
          .map((entry) => {
            if (entry.type === 'key') {
              if (entry.hasDot) {
                return entry.keys.length > 1
                  ? `is:(${entry.keys.map((key) => `.${key}`).join(',')})`
                  : entry.keys.map((key) => `.${key}`).join(',');
              }
              return entry.keys.length > 1
                ? `MULTIPLE-${entry.value.toUpperCase()}-KEYS: [ ${entry.keys.join(' ')} ]`
                : entry.keys.join(' ');
            }
            return entry.text;
          })
          .join('');
      } catch (e) {
        // do nothing
      }
      return { count, updatedOutput };
    });

  const newestUpdateResult = updateResults.at(-1);
  const { updatedOutput } = newestUpdateResult ?? { updatedOutput: '' };

  return (
    <div className={example}>
      <div className={section}>
        <h3>css maps</h3>
        <p>
          In each text box, paste the results of having run <b>await tumblr.getCssMap()</b> in the
          javascript console on a Tumblr page, in chronological order. This tool will assume that
          your input was created when one of these css maps was the current one and will translate
          your input to work with the last map entered.
        </p>
        {cssMapTexts.map(({ text, valid }, index) => {
          return (
            <textarea
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              value={text}
              className={valid ? '' : invalid}
              onChange={(e) => {
                dispatchCssMapTexts({ index, text: e.target.value });
              }}
            />
          );
        })}
        <button
          type="button"
          onClick={(e) => {
            dispatchCssMapTexts({ index: cssMapTexts.length, text: '' });
          }}
        >
          add another
        </button>
      </div>

      <div className={section}>
        <h3>input</h3>
        <p>
          Text to translate. This can contain Tumblr CSS selectors (<b>.aBcDe</b>) and/or HTML
          classes (<b>aBcDe</b>), though HTML will become a mess if Tumblr reuses a selector name.
        </p>
        <textarea
          className={box}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
        />
      </div>

      <div className={section}>
        <h3>translated</h3>
        With translated strings:
        <textarea className={box} value={translatedOutput} readOnly />
        XKit Rewritten-style JavaScript template string:
        <textarea className={box} value={jsOutput} readOnly />
      </div>

      <div className={section}>
        <h3>updated</h3>
        With strings updated to the last valid CSS map entered:
        <textarea className={box} value={updatedOutput} readOnly />
      </div>
    </div>
  );
}

export default App;
