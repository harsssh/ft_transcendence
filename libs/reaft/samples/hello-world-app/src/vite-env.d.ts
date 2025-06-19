/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module '*.svg' {
  const content: string;
  export default content;
}