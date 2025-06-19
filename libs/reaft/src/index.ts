import { createElement, Fragment } from './createElement';
import { render } from './renderer';
import { useState, useEffect, useMemo, useCallback } from './hooks';
import { ReaftElement, ReaftFC, Props, ReaftNode } from './types';

// Main Reaft object
const Reaft = {
  createElement,
  Fragment,
  render,
  useState,
  useEffect,
  useMemo,
  useCallback,
};

// Named exports for convenience
export {
  createElement,
  Fragment,
  render,
  useState,
  useEffect,
  useMemo,
  useCallback,
};

// Type exports
export type {
  ReaftElement,
  ReaftFC,
  Props,
  ReaftNode,
};

// Default export
export default Reaft;