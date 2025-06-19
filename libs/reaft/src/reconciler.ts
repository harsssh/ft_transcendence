import { Fiber, ReaftElement } from './types';
import { getWorkLoop, setWipRoot, setNextUnitOfWork, resetDeletions } from './fiber';

export function commitRoot() {
  const workLoop = getWorkLoop();
  workLoop.deletions.forEach(commitWork);
  commitWork(workLoop.wipRoot?.child || null);
  workLoop.currentRoot = workLoop.wipRoot;
  setWipRoot(null);
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

function updateDom(dom: HTMLElement | Text, prevProps: any, nextProps: any) {
  const isEvent = (key: string) => key.startsWith('on');
  const isProperty = (key: string) => key !== 'children' && !isEvent(key);
  const isNew = (prev: any, next: any) => (key: string) => prev[key] !== next[key];
  const isGone = (_prev: any, next: any) => (key: string) => !(key in next);

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

export function renderElement(element: ReaftElement, container: HTMLElement) {
  const workLoop = getWorkLoop();
  
  setWipRoot({
    dom: container,
    props: {
      children: [element],
    },
    alternate: workLoop.currentRoot,
    parent: null,
    child: null,
    sibling: null,
  } as Fiber);
  
  resetDeletions();
  setNextUnitOfWork(workLoop.wipRoot);
}