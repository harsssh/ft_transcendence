import { ReaftElement, ReaftNode, Props, ReaftFC } from './types';

export function createElement<P extends Props = Props>(
  type: string | ReaftFC<P>,
  props: P | null,
  ...children: ReaftNode[]
): ReaftElement<P> {
  const normalizedProps = props || ({} as P);
  
  const flattenedChildren = children.length > 0
    ? children.flat(Infinity).filter(child => 
        child !== null && 
        child !== undefined && 
        child !== false && 
        child !== true
      )
    : [];

  return {
    type,
    props: {
      ...normalizedProps,
      children: flattenedChildren.length > 0 ? flattenedChildren : undefined,
    } as P,
    key: normalizedProps.key ? String(normalizedProps.key) : null,
  };
}

export function createTextElement(text: string | number): ReaftElement {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
    key: null,
  };
}

export const Fragment = Symbol('Reaft.Fragment');