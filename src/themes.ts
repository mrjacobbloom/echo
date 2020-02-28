const ANSI = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

export default {
  // https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/ui/inspectorSyntaxHighlight.css
  chrome: {
    browser: {
      'keyword': 'color: hsl(310, 86%, 36%)',
      'number': 'color: hsl(248, 100%, 41%)',
      'string': 'color: hsl(1, 80%, 43%)',
      'boolean': 'color: hsl(310, 86%, 36%)',
      'object': 'color: black',
      'null': 'color: hsl(310, 86%, 36%)',
      'undefined': 'color: hsl(310, 86%, 36%)',
      'operator': 'color: black',
      'variable': 'color: black',
      'property': 'color: black',
      'default': 'color: black',
    },
    ansi: {
      'keyword': ANSI.magenta,
      'number': ANSI.blue,
      'string': ANSI.red,
      'boolean': ANSI.magenta,
      'object': ANSI.reset,
      'null': ANSI.magenta,
      'undefined': ANSI.magenta,
      'operator': ANSI.reset,
      'variable': ANSI.reset,
      'property': ANSI.reset,
      'default': ANSI.reset,
    },
  },

  // https://searchfox.org/mozilla-central/source/devtools/client/shared/sourceeditor/codemirror/lib/codemirror.css
  // https://searchfox.org/mozilla-central/source/devtools/client/themes/light-theme.css
  // https://searchfox.org/mozilla-central/source/devtools/client/themes/variables.css
  firefox: {
    browser: {
      'keyword': 'color: #dd00a9',
      'number': 'color: #30a',
      'string': 'color: #30a',
      'boolean': 'color: #dd00a9',
      'object': 'color: black',
      'null': 'color: #dd00a9',
      'undefined': 'color: #dd00a9',
      'operator': 'color: black',
      'variable': 'color: #8000d7',
      'property': 'color: #085;',
      'default': 'color: black',
    },
    ansi: {
     'keyword': ANSI.magenta,
     'number': ANSI.blue,
     'string': ANSI.blue,
     'boolean': ANSI.magenta,
     'object': ANSI.reset,
     'null': ANSI.magenta,
     'undefined': ANSI.magenta,
     'operator': ANSI.reset,
     'variable': ANSI.blue,
     'property': ANSI.green,
     'default': ANSI.reset,
    },
  },
} as ThemeMap;