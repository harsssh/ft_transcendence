import { Hook } from './types';
import { getWorkLoop } from './fiber';
import { renderElement } from './reconciler';

export function useState<T>(initial: T): [T, (action: T | ((prev: T) => T)) => void] {
  const workLoop = getWorkLoop();
  const oldHook = workLoop.wipFiber?.alternate?.hooks?.[workLoop.hookIndex];
  const hook: Hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action: any) => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  });

  const setState = (action: T | ((prev: T) => T)) => {
    hook.queue.push(action);
    
    if (workLoop.currentRoot) {
      const children = workLoop.currentRoot.props.children;
      const firstChild = Array.isArray(children) ? children[0] : children;
      if (firstChild) {
        renderElement(
          firstChild as any,
          workLoop.currentRoot.dom as HTMLElement
        );
      }

      // Start the concurrent work loop
      requestIdleCallback((deadline) => {
        let shouldYield = false;
        while (workLoop.nextUnitOfWork && !shouldYield) {
          workLoop.nextUnitOfWork = workLoop.nextUnitOfWork;
          shouldYield = deadline.timeRemaining() < 1;
        }
      });
    }
  };

  if (workLoop.wipFiber) {
    workLoop.wipFiber.hooks = workLoop.wipFiber.hooks || [];
    workLoop.wipFiber.hooks.push(hook);
  }
  workLoop.hookIndex++;

  return [hook.state, setState];
}

type EffectDeps = any[] | undefined;
type EffectCallback = () => void | (() => void);

interface EffectHook {
  callback: EffectCallback;
  cleanup?: () => void;
  deps?: EffectDeps;
}


export function useEffect(callback: EffectCallback, deps?: EffectDeps): void {
  const workLoop = getWorkLoop();
  const oldHook = workLoop.wipFiber?.alternate?.hooks?.[workLoop.hookIndex] as EffectHook | undefined;
  
  let hasChanged = true;
  if (oldHook && deps !== undefined && oldHook.deps !== undefined) {
    hasChanged = deps.some((dep, i) => dep !== oldHook.deps![i]);
  }

  const hook: EffectHook = {
    callback,
    deps,
  };

  if (hasChanged) {
    if (oldHook?.cleanup) {
      oldHook.cleanup();
    }
    
    const cleanup = callback();
    if (typeof cleanup === 'function') {
      hook.cleanup = cleanup;
    }
  } else {
    hook.cleanup = oldHook?.cleanup;
  }

  if (workLoop.wipFiber) {
    workLoop.wipFiber.hooks = workLoop.wipFiber.hooks || [];
    workLoop.wipFiber.hooks.push(hook as any);
  }
  workLoop.hookIndex++;
}

export function useMemo<T>(factory: () => T, deps: any[]): T {
  const workLoop = getWorkLoop();
  const oldHook = workLoop.wipFiber?.alternate?.hooks?.[workLoop.hookIndex];
  
  let hasChanged = true;
  if (oldHook && oldHook.deps) {
    hasChanged = deps.some((dep, i) => dep !== oldHook.deps![i]);
  }

  const hook: Hook = {
    state: hasChanged ? factory() : oldHook?.state,
    queue: [],
    deps: deps,
  };

  if (workLoop.wipFiber) {
    workLoop.wipFiber.hooks = workLoop.wipFiber.hooks || [];
    workLoop.wipFiber.hooks.push(hook);
  }
  workLoop.hookIndex++;

  return hook.state;
}

export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  return useMemo(() => callback, deps);
}