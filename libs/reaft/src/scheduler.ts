import { RequestIdleCallbackDeadline } from './types';
import { getWorkLoop, performUnitOfWork } from './fiber';
import { commitRoot } from './reconciler';

let shouldYield = false;

function workLoopConcurrent(deadline: RequestIdleCallbackDeadline) {
  shouldYield = false;
  const workLoop = getWorkLoop();
  
  while (workLoop.nextUnitOfWork && !shouldYield) {
    workLoop.nextUnitOfWork = performUnitOfWork(workLoop.nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!workLoop.nextUnitOfWork && workLoop.wipRoot) {
    commitRoot();
  }

  if (workLoop.nextUnitOfWork || workLoop.wipRoot) {
    requestIdleCallback(workLoopConcurrent);
  }
}

export function startWorkLoop() {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(workLoopConcurrent);
  } else {
    // Fallback for environments without requestIdleCallback
    setTimeout(() => {
      const deadline: RequestIdleCallbackDeadline = {
        didTimeout: false,
        timeRemaining: () => 1,
      };
      workLoopConcurrent(deadline);
    }, 0);
  }
}

export function workLoopSync() {
  const workLoop = getWorkLoop();
  
  while (workLoop.nextUnitOfWork) {
    workLoop.nextUnitOfWork = performUnitOfWork(workLoop.nextUnitOfWork);
  }

  if (workLoop.wipRoot) {
    commitRoot();
  }
}