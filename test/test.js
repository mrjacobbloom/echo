const { expect } = require('chai');
require('../dist/echo');

beforeEach(() => {
  Echo.options.bracketNotationOptional = true;
  Echo.options.parensOptional = true;
  Echo.options.constructorParensOptional = true;
  Echo.options.stringDelimiter = '\'';
  Echo.options.colorMode = 'off';
  Echo.options.theme = 'chrome';
  Echo.options.output = 'promise';
});

describe('renderTokens tests', () => {
  describe('Get tests', () => {
    describe('parensOptional=true', () => {
      it('Special identifiers and numbers are square-bracketed and tokenized correctly', async () => {
        const { tokens } = await Echo[null][undefined][true][false][Infinity][-Infinity][NaN][25];
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
          { value: ']', type: 'operator' }
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
  });

  describe('Parens ambiguities and nonambiguities tests', () => {
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
  });
});