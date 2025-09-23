const ReactLite = (() => {
  const TEXT_ELEMENT = 'TEXT_ELEMENT';
  const Fragment = Symbol('fragment');

  function createTextElement(text) {
    return {
      type: TEXT_ELEMENT,
      props: {
        nodeValue: text == null ? '' : String(text),
        children: []
      }
    };
  }

  function flattenChildren(children) {
    const result = [];
    children.forEach((child) => {
      if (Array.isArray(child)) {
        result.push(...flattenChildren(child));
      } else if (child === false || child === true || child == null) {
        return;
      } else if (typeof child === 'object') {
        result.push(child);
      } else {
        result.push(createTextElement(child));
      }
    });
    return result;
  }

  function createElement(type, props, ...children) {
    const normalizedChildren = flattenChildren(children);
    const finalProps = Object.assign({}, props, {
      children: normalizedChildren
    });
    return {
      type,
      props: finalProps
    };
  }

  const isEvent = (key) => key.startsWith('on');
  const isProperty = (key) => key !== 'children' && key !== 'ref' && key !== 'dangerouslySetInnerHTML';

  function createDom(fiber) {
    const { type, props } = fiber;
    let dom;

    if (type === TEXT_ELEMENT) {
      dom = document.createTextNode(props.nodeValue || '');
    } else if (type === Fragment) {
      dom = document.createDocumentFragment();
    } else {
      dom = document.createElement(type);
    }

    updateDom(dom, {}, props);

    return dom;
  }

  function updateStyle(dom, prevStyle = {}, nextStyle = {}) {
    const style = dom.style;
    if (!style) return;

    Object.keys(prevStyle).forEach((key) => {
      if (!(key in nextStyle)) {
        style[key] = '';
      }
    });

    Object.keys(nextStyle).forEach((key) => {
      style[key] = nextStyle[key];
    });
  }

  function setRef(ref, value) {
    if (typeof ref === 'function') {
      try {
        ref(value);
      } catch (error) {
        console.error('Error calling ref function', error);
      }
    } else if (ref && typeof ref === 'object') {
      ref.current = value;
    }
  }

  function updateDom(dom, prevProps, nextProps) {
    const prev = prevProps || {};
    const next = nextProps || {};

    // Remove old event listeners
    Object.keys(prev)
      .filter(isEvent)
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        const prevHandler = prev[name];
        const nextHandler = next[name];
        if (!nextHandler || prevHandler !== nextHandler) {
          dom.removeEventListener(eventType, prevHandler);
        }
      });

    // Remove old properties
    Object.keys(prev)
      .filter(isProperty)
      .forEach((name) => {
        if (!(name in next)) {
          if (name === 'className') {
            dom.removeAttribute('class');
          } else if (name === 'style') {
            updateStyle(dom, prev.style, {});
          } else if (name in dom) {
            try {
              dom[name] = '';
            } catch (error) {
              dom.removeAttribute(name);
            }
          } else {
            dom.removeAttribute(name);
          }
        }
      });

    // Set new properties
    Object.keys(next)
      .filter(isProperty)
      .forEach((name) => {
        const value = next[name];
        if (name === 'className') {
          dom.setAttribute('class', value != null ? value : '');
        } else if (name === 'style' && typeof value === 'object') {
          updateStyle(dom, prev.style || {}, value);
        } else if (name === 'value' && dom.tagName === 'INPUT') {
          if (dom.value !== value) {
            dom.value = value == null ? '' : value;
          }
        } else if (name === 'checked' && dom.tagName === 'INPUT') {
          dom.checked = Boolean(value);
        } else if (value == null) {
          dom.removeAttribute(name);
        } else {
          try {
            dom[name] = value;
          } catch (error) {
            dom.setAttribute(name, value);
          }
        }
      });

    if ('dangerouslySetInnerHTML' in next) {
      const html = next.dangerouslySetInnerHTML;
      if (html && typeof html.__html === 'string') {
        dom.innerHTML = html.__html;
      }
    }

    // Attach new events
    Object.keys(next)
      .filter(isEvent)
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        const handler = next[name];
        if (handler !== prev[name]) {
          dom.addEventListener(eventType, handler);
        }
      });

    // Handle refs
    if (prev.ref && prev.ref !== next.ref) {
      setRef(prev.ref, null);
    }
    if (next.ref && next.ref !== prev.ref) {
      setRef(next.ref, dom);
    }
  }

  function commitDeletion(fiber, domParent) {
    if (!fiber) return;
    cleanupHooks(fiber);

    if (fiber.dom && fiber.dom.parentNode) {
      if (fiber.props && fiber.props.ref) {
        setRef(fiber.props.ref, null);
      }
      domParent.removeChild(fiber.dom);
    } else if (fiber.child) {
      commitDeletion(fiber.child, domParent);
    }
  }

  let nextUnitOfWork = null;
  let currentRoot = null;
  let wipRoot = null;
  let deletions = [];
  let wipFiber = null;
  let hookIndex = 0;
  let pendingEffects = [];

  const idleCallback = typeof window !== 'undefined' && window.requestIdleCallback
    ? window.requestIdleCallback.bind(window)
    : (cb) => setTimeout(() => cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50)
    }), 1);

  const cancelIdle = typeof window !== 'undefined' && window.cancelIdleCallback
    ? window.cancelIdleCallback.bind(window)
    : clearTimeout;

  let workLoopHandle = null;

  function ensureWorkLoop() {
    if (workLoopHandle == null) {
      workLoopHandle = idleCallback(workLoop);
    }
  }

  function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && wipRoot) {
      commitRoot();
    }

    if (nextUnitOfWork) {
      workLoopHandle = idleCallback(workLoop);
    } else {
      workLoopHandle = null;
    }
  }

  function render(element, container) {
    if (!container) {
      throw new Error('ReactLite: container element is required for render.');
    }
    wipRoot = {
      dom: container,
      props: {
        children: [element]
      },
      alternate: currentRoot
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
    ensureWorkLoop();
  }

  function scheduleUpdate() {
    if (!currentRoot) return;
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
    ensureWorkLoop();
  }

  function performUnitOfWork(fiber) {
    const isFunctionComponent = typeof fiber.type === 'function';
    if (isFunctionComponent) {
      updateFunctionComponent(fiber);
    } else {
      updateHostComponent(fiber);
    }

    if (fiber.child) {
      return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }
    return null;
  }

  function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    const children = [fiber.type(fiber.props || {})];
    reconcileChildren(fiber, children);
  }

  function updateHostComponent(fiber) {
    if (!fiber.dom) {
      fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children || []);
  }

  function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;

    const elementArray = Array.isArray(elements) ? elements : [elements];

    while (index < elementArray.length || oldFiber != null) {
      const element = elementArray[index];
      let newFiber = null;

      const sameType = oldFiber && element && element.type === oldFiber.type;

      if (sameType) {
        newFiber = {
          type: oldFiber.type,
          props: element.props,
          dom: oldFiber.dom,
          parent: wipFiber,
          alternate: oldFiber,
          effectTag: 'UPDATE'
        };
      }
      if (element && !sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: 'PLACEMENT'
        };
      }
      if (oldFiber && !sameType) {
        oldFiber.effectTag = 'DELETION';
        deletions.push(oldFiber);
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }

      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (prevSibling) {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index++;
    }
  }

  function commitRoot() {
    deletions.forEach((fiber) => {
      const parent = getParentDom(fiber);
      if (parent) {
        commitDeletion(fiber, parent);
      }
    });
    commitWork(wipRoot.child);
    flushEffects();
    currentRoot = wipRoot;
    wipRoot = null;
  }

  function getParentDom(fiber) {
    let parentFiber = fiber.parent;
    while (parentFiber && !parentFiber.dom) {
      parentFiber = parentFiber.parent;
    }
    return parentFiber ? parentFiber.dom : null;
  }

  function commitWork(fiber) {
    if (!fiber) {
      return;
    }

    let domParentFiber = fiber.parent;
    while (domParentFiber && !domParentFiber.dom) {
      domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber ? domParentFiber.dom : null;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
      if (fiber.props && fiber.props.ref) {
        setRef(fiber.props.ref, fiber.dom);
      }
      domParent && domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate ? fiber.alternate.props : {}, fiber.props);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
  }

  function cleanupHooks(fiber) {
    if (!fiber) return;
    if (fiber.hooks) {
      fiber.hooks.forEach((hook) => {
        if (hook && hook.tag === 'effect' && typeof hook.cleanup === 'function') {
          try {
            hook.cleanup();
          } catch (error) {
            console.error('Error during effect cleanup', error);
          }
        }
      });
    }
  }

  function flushEffects() {
    const effects = pendingEffects;
    pendingEffects = [];
    effects.forEach(({ hook, prevCleanup }) => {
      if (typeof prevCleanup === 'function') {
        try {
          prevCleanup();
        } catch (error) {
          console.error('Error during effect cleanup', error);
        }
      }
      const cleanup = hook.effect();
      if (typeof cleanup === 'function') {
        hook.cleanup = cleanup;
      } else {
        hook.cleanup = undefined;
      }
    });
  }

  function useState(initial) {
    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex];
    const hook = {
      state: oldHook ? oldHook.state : (typeof initial === 'function' ? initial() : initial),
      queue: []
    };

    if (oldHook) {
      hook.queue = oldHook.queue.slice();
      hook.queue.forEach((action) => {
        hook.state = typeof action === 'function' ? action(hook.state) : action;
      });
      hook.queue = [];
    }

    const setState = (action) => {
      hook.queue.push(action);
      scheduleUpdate();
    };

    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
  }

  function useReducer(reducer, initialArg, init) {
    const initial = init ? init(initialArg) : initialArg;
    const [state, setState] = useState(initial);
    const dispatch = (action) => {
      setState((prev) => reducer(prev, action));
    };
    return [state, dispatch];
  }

  function depsChanged(prevDeps, deps) {
    if (!prevDeps || !deps) return true;
    if (prevDeps.length !== deps.length) return true;
    for (let i = 0; i < deps.length; i++) {
      if (!Object.is(prevDeps[i], deps[i])) {
        return true;
      }
    }
    return false;
  }

  function useEffect(effect, deps) {
    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex];

    const hook = {
      tag: 'effect',
      deps,
      effect,
      cleanup: oldHook ? oldHook.cleanup : undefined
    };

    const shouldRun = depsChanged(oldHook ? oldHook.deps : undefined, deps);
    if (shouldRun) {
      pendingEffects.push({ hook, prevCleanup: oldHook ? oldHook.cleanup : undefined });
    }

    wipFiber.hooks.push(hook);
    hookIndex++;
  }

  function useLayoutEffect(effect, deps) {
    // For simplicity, treat layout effect as normal effect in this minimal implementation
    useEffect(effect, deps);
  }

  function useMemo(factory, deps) {
    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex];

    const shouldRun = depsChanged(oldHook ? oldHook.deps : undefined, deps);
    const hook = {
      tag: 'memo',
      deps,
      value: shouldRun ? factory() : oldHook ? oldHook.value : factory()
    };

    wipFiber.hooks.push(hook);
    hookIndex++;
    return hook.value;
  }

  function useCallback(callback, deps) {
    return useMemo(() => callback, deps);
  }

  function useRef(initialValue) {
    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex];
    const hook = {
      tag: 'ref',
      ref: oldHook ? oldHook.ref : { current: initialValue }
    };
    wipFiber.hooks.push(hook);
    hookIndex++;
    return hook.ref;
  }

  const React = {
    createElement,
    Fragment,
    useState,
    useReducer,
    useEffect,
    useLayoutEffect,
    useMemo,
    useCallback,
    useRef
  };

  const ReactDOM = {
    render: (element, container) => render(element, container)
  };

  React.Fragment = Fragment;

  return { React, ReactDOM };
})();

const React = ReactLite.React;
const ReactDOM = ReactLite.ReactDOM;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { React, ReactDOM };
}

if (typeof define === 'function' && define.amd) {
  define(() => ({ React, ReactDOM }));
}

const globalScope = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : globalThis;

if (globalScope) {
  globalScope.ReactLite = ReactLite;
  globalScope.React = React;
  globalScope.ReactDOM = ReactDOM;
}
