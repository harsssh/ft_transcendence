import { Fiber, Props } from './types';

export function createDom(fiber: Fiber): HTMLElement | Text {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props);
  return dom;
}

const isEvent = (key: string) => key.startsWith('on');
const isProperty = (key: string) => key !== 'children' && !isEvent(key);
const isNew = (prev: Props, next: Props) => (key: string) => prev[key] !== next[key];
const isGone = (_prev: Props, next: Props) => (key: string) => !(key in next);

export function updateDom(dom: HTMLElement | Text, prevProps: Props, nextProps: Props) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      if (name === 'style') {
        (dom as HTMLElement).style.cssText = '';
      } else if (name in dom) {
        (dom as any)[name] = '';
      } else {
        (dom as HTMLElement).removeAttribute(name);
      }
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      if (name === 'style') {
        const styles = nextProps[name];
        if (typeof styles === 'object') {
          Object.assign((dom as HTMLElement).style, styles);
        } else {
          (dom as HTMLElement).style.cssText = styles;
        }
      } else if (name === 'className') {
        (dom as HTMLElement).className = nextProps[name];
      } else if (name in dom) {
        (dom as any)[name] = nextProps[name];
      } else {
        (dom as HTMLElement).setAttribute(name, nextProps[name]);
      }
    });

  // Add new event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

export function commitRoot(workLoop: any) {
  workLoop.deletions.forEach(commitWork);
  commitWork(workLoop.wipRoot.child);
  workLoop.currentRoot = workLoop.wipRoot;
  workLoop.wipRoot = null;
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent || null;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, domParent: HTMLElement | Text) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else if (fiber.child) {
    commitDeletion(fiber.child, domParent);
  }
}


