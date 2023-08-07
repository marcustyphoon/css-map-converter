import { globalStyle, style } from '@vanilla-extract/css';

globalStyle('#root', {
  width: '100%',
  padding: '1.5em',
  boxSizing: 'border-box',
});

globalStyle('textarea[readonly]', {
  backgroundColor: 'rgb(128, 128, 128, 0.05)',
});

export const example = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '3em',
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5em',
});

export const invalid = style({
  outline: '1px solid red',
});

export const box = style({
  minHeight: '15em',
});
