import { Fiber, WorkLoop, ReaftElement, ReaftNode } from './types';
import { createTextElement } from './createElement';
import { createDom } from './renderer';

let workLoop: WorkLoop = {
  nextUnitOfWork: null,
  currentRoot: null,
  wipRoot: null,
  deletions: [],
  wipFiber: null,
  hookIndex: 0,
};

export function createFiber(
  element: ReaftElement,
  parent: Fiber | null,
  alternate: Fiber | null = null
): Fiber {
  return {
    type: element.type,
    props: element.props,
    dom: null,
    parent,
    child: null,
    sibling: null,
    alternate,
    hooks: [],
  };
}

export function reconcileChildren(wipFiber: Fiber, elements: ReaftNode[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child || null;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const normalizedElement = 
      element != null && typeof element !== 'object'
        ? createTextElement(String(element))
        : element as ReaftElement | null;

    const sameType = oldFiber && normalizedElement && normalizedElement.type === oldFiber.type;

    if (sameType && normalizedElement) {
      newFiber = {
        type: oldFiber!.type,
        props: normalizedElement.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
        child: null,
        sibling: null,
        hooks: [],
      };
    }
    
    if (normalizedElement && !sameType) {
      newFiber = {
        type: normalizedElement.type,
        props: normalizedElement.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
        child: null,
        sibling: null,
        hooks: [],
      };
    }
    
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION';
      workLoop.deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (prevSibling && newFiber) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

export function updateFunctionComponent(fiber: Fiber) {
  workLoop.wipFiber = fiber;
  workLoop.hookIndex = 0;
  fiber.hooks = [];
  
  const children = [(fiber.type as Function)(fiber.props)];
  reconcileChildren(fiber, Array.isArray(children) ? children : [children]);
}

export function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  
  const elements = fiber.props.children || [];
  const elementsArray = Array.isArray(elements) ? elements : [elements];
  reconcileChildren(fiber, elementsArray);
}

export function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = fiber.type instanceof Function;
  
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  
  return null;
}

export function getWorkLoop() {
  return workLoop;
}

export function setNextUnitOfWork(fiber: Fiber | null) {
  workLoop.nextUnitOfWork = fiber;
}

export function setWipRoot(fiber: Fiber | null) {
  workLoop.wipRoot = fiber;
}

export function resetDeletions() {
  workLoop.deletions = [];
}