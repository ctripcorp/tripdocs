import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

const base00 = '#2e3440',
  base01 = '#3b4252',
  base02 = '#434c5e',
  base03 = '#4c566a';

const base04 = '#d8dee9',
  base05 = '#e5e9f0',
  base06 = '#eceff4';

const base07 = '#ffa500',
  base08 = '#88c0d0',
  base09 = '#81a1ff',
  base0A = '#0000cc';

const base0b = '#bf616a',
  base0C = '#d08770',
  base0D = '#ebcb8b',
  base0E = '#a3be8c',
  base0F = '#b48ead';

const invalid = '#d30102',
  darkBackground = base06,
  highlightBackground = darkBackground,
  background = '#ffffff',
  tooltipBackground = base01,
  selection = darkBackground,
  cursor = base01;

export const myTheme = createTheme({
  theme: 'light',
  settings: {
    background: background,
    foreground: base00,
    caret: cursor,
    selection: selection,
    selectionMatch: '#036dd626',
    lineHighlight: highlightBackground,
    gutterBackground: '#fff',
    gutterForeground: '#8a919966',
  },
  styles: [
    { tag: t.keyword, color: base09 },
    {
      tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName],
      color: base0C,
    },
    { tag: [t.variableName], color: base0C },
    { tag: [t.function(t.variableName)], color: base0D },
    { tag: [t.labelName], color: base09 },
    {
      tag: [t.color, t.constant(t.name), t.standard(t.name)],
      color: base0C,
    },
    { tag: [t.definition(t.name), t.separator], color: base0E },
    { tag: [t.brace], color: base07 },
    {
      tag: [t.annotation],
      color: invalid,
    },
    {
      tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace],
      color: base08,
    },
    {
      tag: [t.typeName, t.className],
      color: base0D,
    },
    {
      tag: [t.operator, t.operatorKeyword],
      color: base0E,
    },
    {
      tag: [t.tagName],
      color: base0F,
    },
    {
      tag: [t.squareBracket],
      color: base0b,
    },
    {
      tag: [t.angleBracket],
      color: base0C,
    },
    {
      tag: [t.attributeName],
      color: base0D,
    },
    {
      tag: [t.regexp],
      color: base0A,
    },
    {
      tag: [t.quote],
      color: base0E,
    },
    { tag: [t.string], color: base0C },
    {
      tag: t.link,
      color: base07,
      textDecoration: 'underline',
      textUnderlinePosition: 'under',
    },
    {
      tag: [t.url, t.escape, t.special(t.string)],
      color: base0C,
    },
    { tag: [t.meta], color: base08 },
    { tag: [t.comment], color: base02, fontStyle: 'italic' },
    { tag: t.strong, fontWeight: 'bold', color: base00 },
    { tag: t.emphasis, fontStyle: 'italic', color: base00 },
    { tag: t.strikethrough, textDecoration: 'line-through' },
    { tag: t.heading, fontWeight: 'bold', color: base0A },
    { tag: t.special(t.heading1), fontWeight: 'bold', color: base0A },
    { tag: t.heading1, fontWeight: 'bold', color: base0A },
    {
      tag: [t.heading2, t.heading3, t.heading4],
      fontWeight: 'bold',
      color: base0A,
    },
    {
      tag: [t.heading5, t.heading6],
      color: base0A,
    },
    { tag: [t.atom, t.bool, t.special(t.variableName)], color: base0C },
    {
      tag: [t.processingInstruction, t.inserted],
      color: base0E,
    },
    {
      tag: [t.contentSeparator],
      color: base0D,
    },
    { tag: t.invalid, color: base02, borderBottom: `1px dotted ${invalid}` },
  ],
});
