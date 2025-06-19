interface SyntheticEvent {
  nativeEvent: Event;
  currentTarget: EventTarget | null;
  target: EventTarget | null;
  type: string;
  preventDefault: () => void;
  stopPropagation: () => void;
  persist: () => void;
  defaultPrevented: boolean;
  propagationStopped: boolean;
}

class ReaftSyntheticEvent implements SyntheticEvent {
  nativeEvent: Event;
  currentTarget: EventTarget | null;
  target: EventTarget | null;
  type: string;
  private _defaultPrevented = false;
  private _propagationStopped = false;

  constructor(nativeEvent: Event) {
    this.nativeEvent = nativeEvent;
    this.currentTarget = nativeEvent.currentTarget;
    this.target = nativeEvent.target;
    this.type = nativeEvent.type;
  }

  preventDefault() {
    this._defaultPrevented = true;
    this.nativeEvent.preventDefault();
  }

  stopPropagation() {
    this._propagationStopped = true;
    this.nativeEvent.stopPropagation();
  }

  persist() {
    // In a real implementation, this would prevent the event from being reused
    // For now, it's a no-op
  }

  get defaultPrevented() {
    return this._defaultPrevented;
  }

  get propagationStopped() {
    return this._propagationStopped;
  }
}

const eventTypes = new Set([
  'click',
  'change',
  'input',
  'submit',
  'focus',
  'blur',
  'keydown',
  'keyup',
  'keypress',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'mouseenter',
  'mouseleave',
  'touchstart',
  'touchend',
  'touchmove',
  'load',
  'error',
  'scroll',
  'resize',
]);

const eventListeners = new Map<string, (event: Event) => void>();

export function initializeEventSystem() {
  if (typeof document === 'undefined') return;

  eventTypes.forEach(eventType => {
    if (!eventListeners.has(eventType)) {
      const listener = (event: Event) => {
        const syntheticEvent = new ReaftSyntheticEvent(event);
        dispatchEvent(syntheticEvent);
      };

      eventListeners.set(eventType, listener);
      document.addEventListener(eventType, listener, true);
    }
  });
}

function dispatchEvent(syntheticEvent: SyntheticEvent) {
  const target = syntheticEvent.target as Element;
  if (!target) return;

  const handlerName = `on${syntheticEvent.type.charAt(0).toUpperCase()}${syntheticEvent.type.slice(1)}`;
  
  let currentTarget: Element | null = target;
  const path: Element[] = [];

  // Capture phase - build path to root
  while (currentTarget) {
    path.unshift(currentTarget);
    currentTarget = currentTarget.parentElement;
  }

  // Execute handlers along the path
  for (const element of path) {
    if (syntheticEvent.propagationStopped) break;

    const handler = (element as any)[`__reaft_${handlerName}`];
    if (handler && typeof handler === 'function') {
      syntheticEvent.currentTarget = element;
      try {
        handler(syntheticEvent);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  }
}

export function attachEventListeners(element: HTMLElement, props: any) {
  Object.keys(props).forEach(name => {
    if (name.startsWith('on')) {
      const eventType = name.toLowerCase().substring(2);
      if (eventTypes.has(eventType)) {
        (element as any)[`__reaft_${name}`] = props[name];
      }
    }
  });
}

export function detachEventListeners(element: HTMLElement, props: any) {
  Object.keys(props).forEach(name => {
    if (name.startsWith('on')) {
      const eventType = name.toLowerCase().substring(2);
      if (eventTypes.has(eventType)) {
        delete (element as any)[`__reaft_${name}`];
      }
    }
  });
}

// Initialize event system when module loads
if (typeof document !== 'undefined') {
  initializeEventSystem();
}