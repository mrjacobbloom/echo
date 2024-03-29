const { promisify } = require('util');
const { expect } = require('chai');
const { stub } = require('sinon');
require('../dist/echo');

const setTimeoutAsync = promisify(setTimeout);

beforeEach(() => {
  Echo.options.bracketNotationOptional = true;
  Echo.options.parensOptional = true;
  Echo.options.constructorParensOptional = true;
  Echo.options.stringDelimiter = '\'';
  Echo.options.colorMode = 'off';
  Echo.options.theme = 'chrome';
  Echo.options.autoLog = false;
  Echo.options.autoLogMinLength = 1;
});

describe('Echo public interface tests', () => {
  it('Echo.render returns correct shape', async () => {
    const resValue = Echo.foo.bar(123).render();
    expect(resValue).to.deep.equal({
      tokens: [
        { value: 'Echo', type: 'variable' },
        { value: '.', type: 'operator' },
        { value: 'foo', type: 'property' },
        { value: '.', type: 'operator' },
        { value: 'bar', type: 'property' },
        { value: '(', type: 'operator' },
        { value: '123', type: 'number' },
        { value: ')', type: 'operator' }
      ],
      plaintext: 'Echo.foo.bar(123)',
      formatted: [ 'Echo.foo.bar(123)' ],
      theme: null,
    });
  });

  it('Echo.print works as expected, and normal logging is prevented', async () => {
    stub(console, 'log');
    Echo.foo.print();
    await setTimeoutAsync(10);
    expect(console.log.callCount).to.equal(1);
    console.log.restore();
  });

  it('Echo.then resolves to correct shape', async () => {
    const resValue = await Echo.foo.bar(123);
    expect(resValue).to.deep.equal({
      tokens: [
        { value: 'Echo', type: 'variable' },
        { value: '.', type: 'operator' },
        { value: 'foo', type: 'property' },
        { value: '.', type: 'operator' },
        { value: 'bar', type: 'property' },
        { value: '(', type: 'operator' },
        { value: '123', type: 'number' },
        { value: ')', type: 'operator' }
      ],
      plaintext: 'Echo.foo.bar(123)',
      formatted: [ 'Echo.foo.bar(123)' ],
      theme: null,
    });
  });

  it('Echo.options has correct shape', () => {
    expect(Echo.options).to.deep.equal({
      colorMode: 'off',
      bracketNotationOptional: true,
      constructorParensOptional: true,
      parensOptional: true,
      stringDelimiter: '\'',
      theme: 'chrome',
      autoLog: false,
      autoLogMinLength: 1,
    });
  });

  it('Echo.toString works', () => {
    expect(Echo.foo(1).bar.toString()).to.equal(Echo.foo(1).bar.toString());
  });

  it('Echo.__registerPublicGetter works as expected', async () => {
    const key = Symbol('foo');
    const getter = stub();
    Echo.__registerPublicGetter(key, getter);
    stub(console, 'log');
    Echo[key];
    await setTimeoutAsync(10);
    expect(console.log.callCount).to.equal(0);
    console.log.restore();
    expect(getter.callCount).to.equal(1);
    expect(getter.args[0][0]).to.be.a('function');
  });
});

describe('Proxy trap completeness tests', () => {
  it('Reflect.ownKeys(Echo) works as expected, does NOT include ECHO_INTERNALS', () => {
    const keys = Reflect.ownKeys(Echo);

    // Builtin / overridden JS-y stuff
    expect(keys).to.include('prototype');
    expect(keys).to.include('name');
    expect(keys).to.include('toString');
    expect(keys).to.include(Symbol.toPrimitive);
    expect(keys).to.include(Symbol.for('nodejs.util.inspect.custom'));

    // Public API
    expect(keys).to.include('render');
    expect(keys).to.include('print');
    expect(keys).to.include('then');
    expect(keys).to.include('options');
    expect(keys).to.include('__registerPublicGetter');

    // Does NOT include ECHO_INTERNALS
    expect(keys.find(k => typeof k === 'symbol' && k.description === 'ECHO_INTERNALS')).to.equal(undefined);
  });

  it('Object.getOwnPropertyDescriptors(Echo) completes without crashing', () => {
    Object.getOwnPropertyDescriptors(Echo);
  });

  it('Object.getOwnPropertyDescriptor(Echo, \'name\') has a value of "Echo" (for RunKit pretty-print)', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Echo, 'name');
    expect(descriptor.value).to.equal('Echo');
    expect(descriptor.configurable).to.equal(true);
  });

  it('`\'key\' in Echo` returns true for ownKeys', () => {
    for (const key of Reflect.ownKeys(Echo)) {
      expect(key in Echo).to.equal(true);
    }
  });

  it('`\'key\' in Echo` returns false for unknown key', () => {
    expect('unknown' in Echo).to.equal(false);
  });
});

describe('tokenize tests', () => {
  describe('Get tests', () => {
    describe('parensOptional=true', () => {
      it('Special identifiers and numbers are square-bracketed and tokenized correctly', async () => {
        const { tokens } = await Echo[null][undefined][true][false][Infinity][-Infinity][NaN][25][Symbol('foo')][{}][Intl][''];
        expect(tokens).to.deep.equal([
          { value: 'Echo', type: 'variable' },
          { value: '[', type: 'operator' },
          { value: 'null', type: 'null' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'undefined', type: 'undefined' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'true', type: 'boolean' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'false', type: 'boolean' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'Infinity', type: 'keyword' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: '-Infinity', type: 'keyword' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'NaN', type: 'keyword' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: '25', type: 'number' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator',   },
          { value: 'Symbol', type: 'variable',   },
          { value: '(', type: 'operator',   },
          { value: '\'foo\'', type: 'string',   },
          { value: ')', type: 'operator',   },
          { value: ']', type: 'operator',   },
          { value: '[', type: 'operator',   },
          { value: '{}', type: 'object',   },
          { value: ']', type: 'operator',   },
          { value: '[', type: 'operator',   },
          { value: 'Intl {}', type: 'object',   },
          { value: ']', type: 'operator',   },
          { value: '[', type: 'operator',   },
          { value: '\'\'', type: 'string',   },
          { value: ']', type: 'operator',   }
        ]);
      });
  
      it('Strings that are not valid identifiers are square-bracketed and escaped', async () => {
        const { tokens } = await Echo['foo\'bar']['1baz']['qu x'];
        expect(tokens).to.deep.equal([
          { value: 'Echo', type: 'variable' },
          { value: '[', type: 'operator' },
          { value: "'foo\\'bar'", type: 'string' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'1baz'", type: 'string' },
          { value: ']', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'qu x'", type: 'string' },
          { value: ']', type: 'operator' }
        ]);
      });
  
      it('If bracketNotationOptional=true, valid identifiers use dot notation', async () => {
        const { tokens } = await Echo.foo;
        expect(tokens).to.deep.equal([
          { value: 'Echo', type: 'variable' },
          { value: '.', type: 'operator' },
          { value: 'foo', type: 'property' }
        ]);
      });
  
      it('If bracketNotationOptional=false, valid identifiers are square-bracketed', async () => {
        Echo.options.bracketNotationOptional = false;
        const { tokens } = await Echo.foo;
        expect(tokens).to.deep.equal([
          { value: 'Echo', type: 'variable' },
          { value: '[', type: 'operator' },
          { value: "'foo'", type: 'string' },
          { value: ']', type: 'operator' }
        ]);
      });

      it('If previous operation was not a get, and prev is not already wrapped in parens, wrap in parens', async () => {
        Echo.options.bracketNotationOptional = false;
        const { tokens } = await (new Echo).foo;
        expect(tokens).to.deep.equal([
          { value: '(', type: 'operator' },
          { value: 'new', type: 'keyword' },
          { value: ' ', type: 'default' },
          { value: 'Echo', type: 'variable' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'foo'", type: 'string' },
          { value: ']', type: 'operator' }
        ]);
      });

      it('If previous operation was not a get, and prev is already wrapped in parens, do not wrap in parens', async () => {
        Echo.options.bracketNotationOptional = false;
        const { tokens } = await (new Echo).foo;
        expect(tokens).to.deep.equal([
          { value: '(', type: 'operator' },
          { value: 'new', type: 'keyword' },
          { value: ' ', type: 'default' },
          { value: 'Echo', type: 'variable' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'foo'", type: 'string' },
          { value: ']', type: 'operator' }
        ]);
      });
    });

    describe('parensOptional=false', () => {
      it('Special identifiers and numbers are square-bracketed and tokenized correctly', async () => {
        Echo.options.parensOptional = false;
        const { tokens } = await Echo[null][undefined][true][false][Infinity][-Infinity][NaN][25];
        expect(tokens).to.deep.equal([
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: 'Echo', type: 'variable' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'null', type: 'null' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'undefined', type: 'undefined' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'true', type: 'boolean' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'false', type: 'boolean' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'Infinity', type: 'keyword' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: '-Infinity', type: 'keyword' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: 'NaN', type: 'keyword' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: '25', type: 'number' },
          { value: ']', type: 'operator' }
        ]);
      });
  
      it('Strings that are not valid identifiers are square-bracketed and escaped', async () => {
        Echo.options.parensOptional = false;
        const { tokens } = await Echo['foo\'bar']['1baz']['qu x'];
        expect(tokens).to.deep.equal([
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: '(', type: 'operator' },
          { value: 'Echo', type: 'variable' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'foo\\'bar'", type: 'string' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'1baz'", type: 'string' },
          { value: ']', type: 'operator' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'qu x'", type: 'string' },
          { value: ']', type: 'operator' }
        ]);
      });
  
      it('If bracketNotationOptional=true, valid identifiers use dot notation', async () => {
        Echo.options.parensOptional = false;
        const { tokens } = await Echo.foo;
        expect(tokens).to.deep.equal([
          { value: '(', type: 'operator' },
          { value: 'Echo', type: 'variable' },
          { value: ')', type: 'operator' },
          { value: '.', type: 'operator' },
          { value: 'foo', type: 'property' }
        ]);
      });
  
      it('If bracketNotationOptional=false, valid identifiers are square-bracketed', async () => {
        Echo.options.parensOptional = false;
        Echo.options.bracketNotationOptional = false;
        const { tokens } = await Echo.foo;
        expect(tokens).to.deep.equal([
          { value: '(', type: 'operator' },
          { value: 'Echo', type: 'variable' },
          { value: ')', type: 'operator' },
          { value: '[', type: 'operator' },
          { value: "'foo'", type: 'string' },
          { value: ']', type: 'operator' }
        ]);
      });
    })
  });

  describe('Construct tests', () => {
    it('If constructorParensOptional=true, empty arguments list is dropped', async () => {
      const { tokens } = await new Echo;
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: 'Echo', type: 'variable' }
      ]);
    });

    it('If constructorParensOptional=false, empty arguments list is rendered', async () => {
      Echo.options.constructorParensOptional = false;
      const { tokens } = await new Echo;
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: 'Echo', type: 'variable' },
        { value: '(', type: 'operator' },
        { value: ')', type: 'operator' }
      ]);
    });

    it('Non-empty arguments list is always rendered', async () => {
      const { tokens } = await new Echo(0);
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: 'Echo', type: 'variable' },
        { value: '(', type: 'operator' },
        { value: '0', type: 'number' },
        { value: ')', type: 'operator' }
      ]);
    });

    it('If all prior operations were gets, do not wrap in parens', async () => {
      const { tokens } = await new Echo.foo.bar;
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: 'Echo', type: 'variable' },
        { value: '.', type: 'operator' },
        { value: 'foo', type: 'property' },
        { value: '.', type: 'operator' },
        { value: 'bar', type: 'property' }
      ]);
    });

    it('parensOptional=false and all prior operations were gets, do wrap in parens', async () => {
      Echo.options.parensOptional = false;
      const { tokens } = await new Echo.foo.bar;
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: '(', type: 'operator' },
        { value: '(', type: 'operator' },
        { value: '(', type: 'operator' },
        { value: 'Echo', type: 'variable' },
        { value: ')', type: 'operator' },
        { value: '.', type: 'operator' },
        { value: 'foo', type: 'property' },
        { value: ')', type: 'operator' },
        { value: '.', type: 'operator' },
        { value: 'bar', type: 'property' },
        { value: ')', type: 'operator' }
      ]);
    });
  });

  describe('Apply tests', () => {
    it('Apply renders correctly with no arguments', async () => {
      const { tokens } = await Echo();
      expect(tokens).to.deep.equal([
        { value: 'Echo', type: 'variable' },
        { value: '(', type: 'operator' },
        { value: ')', type: 'operator' }
      ]);
    });

    it('Apply renders correctly with arguments', async () => {
      const { tokens } = await Echo(1, 'foo');
      expect(tokens).to.deep.equal([
        { value: 'Echo', type: 'variable' },
        { value: '(', type: 'operator' },
        { value: '1', type: 'number' },
        { value: ',', type: 'operator' },
        { value: ' ', type: 'default' },
        { value: "'foo'", type: 'string' },
        { value: ')', type: 'operator' }
      ]);
    });

    it('Template tag detection works', async () => {
      const { tokens } = await Echo.foo`bar${1}ba\nz`.qux;
      expect(tokens).to.deep.equal([
        { value: 'Echo', type: 'variable' },
        { value: '.', type: 'operator' },
        { value: 'foo', type: 'property' },
        { value: '`bar${', type: 'string' },
        { value: '1', type: 'number' },
        { value: '}ba\\nz`', type: 'string' },
        { value: '.', type: 'operator' },
        { value: 'qux', type: 'property' }
      ]);
    });
  });

  describe('Arguments tests', () => {
    const ARGS = [
      10, -10, 0.6, 10n, Infinity, -Infinity, NaN,
      'foo', 'b\'ar',
      true, null, undefined,
      Array, [1, 2], () => {}, function namedFunc() {}
    ];
    const ARG_TOKENS = [
      { value: '10', type: 'number' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: '-10', type: 'number' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: '0.6', type: 'number' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: '10n', type: 'number' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: 'Infinity', type: 'keyword' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: '-Infinity', type: 'keyword' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: 'NaN', type: 'keyword' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: "'foo'", type: 'string' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: "'b\\'ar'", type: 'string' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: 'true', type: 'boolean' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: 'null', type: 'null' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: 'undefined', type: 'undefined' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: 'Array', type: 'variable' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: '[', type: 'operator' },
      { value: '1', type: 'number' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: '2', type: 'number' },
      { value: ']', type: 'operator' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: '() => {}', type: 'default' },
      { value: ',', type: 'operator' },
      { value: ' ', type: 'default' },
      { value: 'namedFunc', type: 'variable' }
    ];
    it('When Echo is called directly as function, arguments have correct types', async () => {
      const { tokens } = await Echo(...ARGS);
      expect(tokens).to.deep.equal([
        { value: 'Echo', type: 'variable' },
        { value: '(', type: 'operator' },
        ...ARG_TOKENS,
        { value: ')', type: 'operator' }
      ]);
    });
  
    it('When Echo is called indirectly as function, arguments have correct types', async () => {
      const { tokens } = await Echo.foo(...ARGS);
      expect(tokens).to.deep.equal([
        { value: 'Echo', type: 'variable' },
        { value: '.', type: 'operator' },
        { value: 'foo', type: 'property' },
        { value: '(', type: 'operator' },
        ...ARG_TOKENS,
        { value: ')', type: 'operator' }
      ]);
    });
  
    it('When Echo is called directly as constructor, arguments have correct types', async () => {
      const { tokens } = await new Echo(...ARGS);
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: 'Echo', type: 'variable' },
        { value: '(', type: 'operator' },
        ...ARG_TOKENS,
        { value: ')', type: 'operator' }
      ]);
    });
  
    it('When Echo is called indirectly as constructor, arguments have correct types', async () => {
      const { tokens } = await new Echo.foo(...ARGS);
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: 'Echo', type: 'variable' },
        { value: '.', type: 'operator' },
        { value: 'foo', type: 'property' },
        { value: '(', type: 'operator' },
        ...ARG_TOKENS,
        { value: ')', type: 'operator' }
      ]);
    });

    it('Argument with a newline is rendered as template string', async () => {
      const { tokens } = await new Echo('foo\nbar');
      expect(tokens).to.deep.equal([
        { value: 'new', type: 'keyword' },
        { value: ' ', type: 'default' },
        { value: 'Echo', type: 'variable' },
        { value: '(', type: 'operator' },
        { value: '`foo\nbar`', type: 'string' },
        { value: ')', type: 'operator' }
      ]);
    });
  });

  describe('Parens ambiguities and non-ambiguities tests', () => {
    it('new Echo', async () => expect((await new Echo).plaintext).to.equal('new Echo'));
    it('new Echo(1)', async () => expect((await new Echo(1)).plaintext).to.equal('new Echo(1)'));
    it('new (Echo())', async () => expect((await new (Echo())).plaintext).to.equal('new (Echo())'));
    it('(new Echo)()', async () => expect((await (new Echo)()).plaintext).to.equal('(new Echo)()'));
    it('(new Echo(1))()', async () => expect((await (new Echo(1))()).plaintext).to.equal('(new Echo(1))()'));
    it('Echo().foo()', async () => expect((await Echo().foo()).plaintext).to.equal('Echo().foo()'));
    it('new Echo.foo', async () => expect((await new Echo.foo).plaintext).to.equal('new Echo.foo'));
    it('new Echo.foo(1)', async () => expect((await new Echo.foo(1)).plaintext).to.equal('new Echo.foo(1)'));
    it('(new Echo).foo', async () => expect((await (new Echo).foo).plaintext).to.equal('(new Echo).foo'));
    it('(new Echo(1)).foo', async () => expect((await (new Echo(1)).foo).plaintext).to.equal('(new Echo(1)).foo'));
    it('(new (Echo())).foo', async () => expect((await (new (Echo())).foo).plaintext).to.equal('(new (Echo())).foo'));
    it('(new (Echo())).foo(1)', async () => expect((await (new (Echo())).foo(1)).plaintext).to.equal('(new (Echo())).foo(1)'));
    it('(new (Echo())(1)).foo(1)', async () => expect((await (new (Echo())(1)).foo(1)).plaintext).to.equal('(new (Echo())(1)).foo(1)'));
    it('new (Echo().foo())', async () => expect((await new (Echo().foo())).plaintext).to.equal('new (Echo().foo())'));
    it('new new Echo', async () => expect((await new new Echo).plaintext).to.equal('new new Echo'));
    it('new new Echo(1)', async () => expect((await new new Echo(1)).plaintext).to.equal('new new Echo(1)'));
    it('Echo()()()', async () => expect((await Echo()()()).plaintext).to.equal('Echo()()()'));
    it('new (Echo`foo`)', async () => expect((await new (Echo`foo`)).plaintext).to.equal('new (Echo`foo`)'));
    it('(new Echo)`foo`', async () => expect((await (new Echo)`foo`).plaintext).to.equal('(new Echo)`foo`'));
  });
});

describe('prettyPrint tests', () => {
  describe('colorMode=\'browser\'', () => {
    beforeEach(() => Echo.options.colorMode = 'browser');
    it('Browser mode escapes %\'s', async () => {
      const { formatted: [ formatString ] } = await Echo('%s', '%c', '%d');
      expect(formatString).to.include('%%s').and.include('%%c').and.include('%%d');
    });
    it('Neighboring tokens with same style are coalesced', async () => {
      const { formatted: [ formatString ] } = await Echo(1)()()();
      expect(formatString).to.equal('%cEcho(%c1%c)()()()');
    });
    it('Correct theme object is returned from Echo.render()', async () => {
      const { theme } = await Echo;
      expect(theme).to.be.an('object');
      expect(theme.keyword).to.be.a('string');
      expect(theme.keyword).to.include('color:');
    });
  });
  describe('colorMode=\'ansi\'', () => {
    beforeEach(() => Echo.options.colorMode = 'ansi');
    it('ANSI output ends with reset character', async () => {
      const { formatted: [ formatString ] } = await Echo.foo();
      expect(formatString.endsWith('\x1b[0m')).to.be.true;
    });
    it('Neighboring tokens with same color code are coalesced', async () => {
      const { formatted: [ formatString ] } = await Echo(1)()()();
      expect(formatString).to.equal('\x1b[0mEcho(\x1b[34m1\x1b[0m)()()()\x1b[0m');
    });
    it('Correct theme object is returned from Echo.render()', async () => {
      const { theme } = await Echo;
      expect(theme).to.be.an('object');
      expect(theme.keyword).to.be.a('string');
      expect(theme.keyword).to.include('\x1b');
    });
  });
  it('Custom themes work as expected, and use a reasonable default style for unspecified token types', async () => {
    Echo.options.colorMode = 'browser';
    Echo.options.theme = { variable: 'color: variable', operator: 'color: operator' };
    const { formatted } = await Echo.foo;
    expect(formatted).to.deep.equal(['%cEcho%c.%cfoo', 'color: variable', 'color: operator', 'color: black']);
  });
});

describe('autoLog tests', () => {
  afterEach(() => {
    if (console.log.restore) console.log.restore();
  })
  it('does not autoLog if autoLog=false', async () => {
    Echo.options.autoLog = false;
    await setTimeoutAsync(10);
    stub(console, 'log');
    Echo.foo;
    await setTimeoutAsync(10);
    expect(console.log.called).to.be.false;
  });
  it('does not autoLog if number of tokens is < autoLogMinLength', async () => {
    Echo.options.autoLog = true;
    Echo.options.autoLogMinLength = 10;
    await setTimeoutAsync(10);
    stub(console, 'log');
    Echo.foo;
    await setTimeoutAsync(10);
    expect(console.log.called).to.be.false;
  });
  it('Using Echo without render function triggers an autoLog', async () => {
    Echo.options.autoLog = true;
    await setTimeoutAsync(10);
    stub(console, 'log');
    Echo.foo;
    await setTimeoutAsync(10);
    expect(console.log.callCount).to.equal(1);
  });
  it('Using Echo with render function does not trigger an autoLog', async () => {
    Echo.options.autoLog = true;
    await setTimeoutAsync(10);
    stub(console, 'log');
    Echo.foo.render();
    await setTimeoutAsync(10);
    expect(console.log.callCount).to.equal(0);
  });
  it('Additional Echoes as arguments do not cause extra logging', async () => {
    Echo.options.autoLog = true;
    await setTimeoutAsync(10);
    stub(console, 'log');
    Echo.foo(Echo.bar);
    await setTimeoutAsync(10);
    expect(console.log.callCount).to.equal(1);
  });
  it('Additional Echoes in get brackets still log but and not cause extra logging', async () => {
    Echo.options.autoLog = true;
    await setTimeoutAsync(10);
    stub(console, 'log');
    Echo.foo[Echo.bar];
    await setTimeoutAsync(10);
    expect(console.log.callCount).to.equal(1);
  });
});