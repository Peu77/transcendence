// TypeScript JSX type declarations for refreshjs
import { h } from 'refreshjs';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
