import React from 'react';
import {
  render, screen, initializeMocks, fireEvent,
} from '@src/testUtils';
import { waitFor } from '@testing-library/react';
import { EditorState } from '@codemirror/state';
import { formatMessage, MockUseState } from '../../testUtils';
import alphanumericMap from './constants';
import { CodeEditorInternal as CodeEditor } from './index';
import * as hooks from './hooks';

describe('CodeEditor', () => {
  describe('Hooks', () => {
    const state = new MockUseState(hooks);
    beforeEach(() => {
      jest.clearAllMocks();
    });
    state.testGetter(state.keys.showBtnEscapeHTML);
    describe('stateHooks', () => {
      beforeEach(() => {
        state.mock();
      });
      it('prepareShowBtnEscapeHTML', () => {
        const hook = hooks.prepareShowBtnEscapeHTML();
        expect(state.stateVals.showBtnEscapeHTML).toEqual(hook.showBtnEscapeHTML);
        hook.hideBtn();
        expect(state.setState.showBtnEscapeHTML).toHaveBeenCalledWith(false);
      });
      afterEach(() => { state.restore(); });
    });

    describe('escapeHTMLSpecialChars', () => {
      const cleanText = `${Object.values(alphanumericMap).join(' , ')}`;

      const mockDispatch = jest.fn((args) => ({ mockDispatch: args }));

      const ref = {
        current: {
          dispatch: mockDispatch,
          state: {
            doc: {
              toString: () => cleanText,
            },
          },
        },
      };
      const mockHideBtn = jest.fn();
      it('unescapes literals and sets them to be alphanumerics', () => {
        hooks.escapeHTMLSpecialChars({ ref, hideBtn: mockHideBtn });
        expect(mockDispatch).toHaveBeenCalled();
        expect(mockHideBtn).toHaveBeenCalled();
      });

      // Presses the button on `text` and lets real CodeMirror apply the changes it dispatches.
      const press = (text) => {
        let editorState = EditorState.create({ doc: text });
        const editorRef = {
          current: {
            get state() { return editorState; },
            dispatch: (tr) => { editorState = editorState.update(tr).state; },
          },
        };
        hooks.escapeHTMLSpecialChars({ ref: editorRef, hideBtn: jest.fn() });
        return editorState.doc.toString();
      };

      it.each([
        ['attribute quotes', '<img src="a.png" alt="x">'],
        ['a quote in text', '<p>He said "hi"</p>'],
        ['an existing &quot;', '<p title="He said &quot;hi&quot;">x</p>'],
        ['an advanced problem', '<customresponse cfn="check"><textline size="20"/></customresponse>'],
      ])('leaves %s alone (LP-1583)', (_name, text) => {
        expect(press(text)).toEqual(text);
      });

      it('still converts the other special characters', () => {
        expect(press('<p title="x">© 2026 — done</p>')).toEqual('<p title="x">&copy; 2026 &mdash; done</p>');
      });

      it.each([
        ['a later-listed character that comes first in the text', 'a — b © c', 'a &mdash; b &copy; c'],
        ['the same character on both sides of another', '— © —', '&mdash; &copy; &mdash;'],
        ['three different characters in reverse map order', '“x” ± ¢', '&ldquo;x&rdquo; &plusmn; &cent;'],
      ])('converts %s (LP-1583)', (_name, text, expected) => {
        expect(press(text)).toEqual(expected);
      });

      it('dispatches no changes and hides the button when there is nothing to convert', () => {
        const dispatch = jest.fn();
        const hideBtn = jest.fn();
        const plainRef = { current: { state: { doc: { toString: () => '<p class="x">plain</p>' } }, dispatch } };
        hooks.escapeHTMLSpecialChars({ ref: plainRef, hideBtn });
        expect(dispatch).toHaveBeenCalledWith({ changes: [] });
        expect(hideBtn).toHaveBeenCalled();
      });
    });
  });

  describe('xmlSyntaxChecker', () => {
    describe('lang equals html', () => {
      it('returns empty array', () => {
        const textArr = ['<problem>', '<p>', 'this is some text', '</p>', '</problem>'];
        const diagnostics = hooks.syntaxChecker({ textArr, lang: 'html' });
        expect(diagnostics).toEqual([]);
      });
    });
    describe('textArr is undefined', () => {
      it('returns empty array', () => {
        let textArr;
        const diagnostics = hooks.syntaxChecker({ textArr, lang: 'html' });
        expect(diagnostics).toEqual([]);
      });
    });
    describe('lang equals xml', () => {
      it('returns empty array', () => {
        const textArr = ['<problem>', '<p>', 'this is some text', '</p>', '</problem>'];
        const diagnostics = hooks.syntaxChecker({ textArr, lang: 'xml' });
        expect(diagnostics).toEqual([]);
      });
      it('returns an array with error object', () => {
        const textArr = ['<problem>', '<p>', '<p>', 'this is some text', '</p>', '</problem>'];
        const expectedDiagnostics = hooks.syntaxChecker({ textArr, lang: 'xml' });
        const diagnostics = [{
          from: 9,
          to: 12,
          severity: 'error',
          message: 'SyntaxError: Expected that start and end tag must be identical but "<" found.',
        }];
        expect(expectedDiagnostics).toEqual(diagnostics);
      });
    });
  });

  describe('Component', () => {
    describe('renders', () => {
      beforeEach(() => {
        initializeMocks();
      });
      let useRefSpy;
      test('Renders and calls Hooks ', () => {
        const props = {
          intl: { formatMessage },
          innerRef: {
            current: 'sOmEvALUE',
          },
          lang: 'html',
          value: 'mOcKhTmL',
        };
        const mockBtnRef = { current: null };
        const mockDOMRef = { current: null };
        const mockUseRef = jest.fn()
          .mockImplementationOnce(() => mockDOMRef) // for DOMref
          .mockImplementationOnce(() => mockBtnRef); // for btnRef

        useRefSpy = jest.spyOn(React, 'useRef').mockImplementation(mockUseRef);

        const mockHideBtn = jest.fn();
        jest.spyOn(hooks, 'prepareShowBtnEscapeHTML').mockImplementation(() => ({
          showBtnEscapeHTML: true,
          hideBtn: mockHideBtn,
        }));
        jest.spyOn(hooks, 'createCodeMirrorDomNode').mockImplementation(() => ({}));
        const mockEscapeHTMLSpecialChars = jest.fn();
        jest.spyOn(hooks, 'escapeHTMLSpecialChars').mockImplementation(mockEscapeHTMLSpecialChars);
        // Note: ref won't show up as it is not acutaly a DOM attribute.
        render(<CodeEditor {...props} />);
        expect(screen.getByRole('button', { name: 'Unescape HTML Literals' })).toBeInTheDocument();
        expect(hooks.prepareShowBtnEscapeHTML).toHaveBeenCalled();
        expect(hooks.createCodeMirrorDomNode).toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Unescape HTML Literals' }));
        expect(mockEscapeHTMLSpecialChars).toHaveBeenCalled();
        // Prevent React.useRef mock leakage into subsequent tests
        useRefSpy.mockRestore();
      });
    });

    describe('opening the editor', () => {
      beforeEach(() => {
        initializeMocks();
        // Earlier tests leave these two mocked; this one needs the real editor and no leftover state mock.
        jest.spyOn(hooks, 'createCodeMirrorDomNode').mockRestore();
        jest.spyOn(hooks, 'prepareShowBtnEscapeHTML').mockReturnValue({ showBtnEscapeHTML: false, hideBtn: jest.fn() });
      });

      test('starts with the stored text as it is, so Undo has nothing to bring back (LP-1583)', () => {
        const value = '<p title="He said &quot;hi&quot;">Dash &mdash; copy &copy;</p>';
        const create = jest.spyOn(EditorState, 'create');
        const innerRef: { current: any } = { current: null };
        render(<CodeEditor innerRef={innerRef} value={value} lang="html" />);
        expect(create).toHaveBeenCalledWith(expect.objectContaining({ doc: value }));
        expect(innerRef.current.state.doc.toString()).toEqual(value);
      });
    });

    describe('escape button', () => {
      beforeEach(() => {
        initializeMocks();
        jest.spyOn(hooks, 'createCodeMirrorDomNode').mockImplementation(() => ({}));
        jest.spyOn(hooks, 'prepareShowBtnEscapeHTML').mockReturnValue({ showBtnEscapeHTML: true, hideBtn: jest.fn() });
      });

      // The button writes named codes such as &mdash;. HTML knows them; XML does not, and a problem
      // holding one cannot be saved (LP-1583).
      test.each([
        ['html', true],
        ['xml', false],
        ['markdown', false],
      ])('for lang %s, shown: %s', (lang, shown) => {
        render(<CodeEditor innerRef={{ current: null }} value="some text" lang={lang} />);
        const button = screen.queryByRole('button', { name: 'Unescape HTML Literals' });
        expect(button !== null).toBe(shown);
      });
    });

    describe('value change effect', () => {
      beforeEach(() => {
        initializeMocks();
      });

      test('dispatches changes when value prop updates', async () => {
        const mockDispatch = jest.fn();
        const oldContent = 'old content';
        const newContent = 'new content';
        const mockView = {
          state: { doc: { toString: () => oldContent } },
          dispatch: mockDispatch,
        };
        const innerRef = { current: mockView };

        jest.spyOn(hooks, 'createCodeMirrorDomNode').mockImplementation(() => ({}));
        jest.spyOn(hooks, 'prepareShowBtnEscapeHTML').mockReturnValue({ showBtnEscapeHTML: false, hideBtn: jest.fn() });

        const { rerender } = render(<CodeEditor innerRef={innerRef} value={oldContent} lang="xml" />);
        // Initial render: value matches doc, no dispatch
        expect(mockDispatch).not.toHaveBeenCalled();

        // Rerender with new value triggers effect
        rerender(<CodeEditor innerRef={innerRef} value={newContent} lang="xml" />);
        await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
        const callArg = mockDispatch.mock.calls[0][0];
        expect(callArg.changes.insert).toBe(newContent);
        expect(callArg.changes.from).toBe(0);
        expect(callArg.changes.to).toBe(oldContent.length);

        // Simulate that the editor document now reflects the new content so a rerender
        // with the same value does not trigger another dispatch.
        mockView.state.doc.toString = () => newContent;

        // Rerender again with same value should not trigger additional dispatch
        mockDispatch.mockClear();
        rerender(<CodeEditor innerRef={innerRef} value={newContent} lang="xml" />);
        // Give a tick to ensure no extra dispatch happens
        await waitFor(() => expect(mockDispatch).not.toHaveBeenCalled());
      });
    });
  });
});
