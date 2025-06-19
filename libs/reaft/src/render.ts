import { ReaftElement } from './types';
import { renderElement } from './reconciler';
import { startWorkLoop } from './scheduler';

export function render(element: ReaftElement, container: HTMLElement) {
  renderElement(element, container);
  startWorkLoop();
}