export type ReaftText = string | number;
export type ReaftEmpty = boolean | null | undefined;
export type ReaftNode = ReaftElement | ReaftText | ReaftEmpty;

export interface ReaftElement<P = any> {
  type: string | ReaftFC<P>;
  props: P;
  key: string | null;
}

export interface Props {
  children?: ReaftNode | ReaftNode[];
  key?: string | number;
  [key: string]: any;
}

export type ReaftFC<P = {}> = (props: P & { children?: ReaftNode | ReaftNode[] }) => ReaftElement | null;

export interface Fiber {
  type?: string | ReaftFC<any>;
  props: Props;
  dom: HTMLElement | Text | null;
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
  effectTag?: 'PLACEMENT' | 'UPDATE' | 'DELETION';
  hooks?: Hook[];
  ref?: any;
}

export interface Hook {
  state: any;
  queue: any[];
  deps?: any[];
}

export type EffectTag = 'PLACEMENT' | 'UPDATE' | 'DELETION';

export interface WorkLoop {
  nextUnitOfWork: Fiber | null;
  currentRoot: Fiber | null;
  wipRoot: Fiber | null;
  deletions: Fiber[];
  wipFiber: Fiber | null;
  hookIndex: number;
}

export type RequestIdleCallbackHandle = number;
export type RequestIdleCallbackOptions = {
  timeout?: number;
};
export type RequestIdleCallbackDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

// Remove conflicting global declaration since it already exists in DOM types