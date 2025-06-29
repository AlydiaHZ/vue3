// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  // 插入节点
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
  },
  // 创建元素
  createElement(type) {
    return document.createElement(type);
  },
  // 设置内容
  setElementText(el, text) {
    el.textContent = text;
  },
  // 移除元素
  remove(el) {
    const parentNode = el.parentNode;
    if (parentNode) {
      parentNode.removeChild(el);
    }
  },
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text);
  },
  // 设置文本节点
  setText(node, text) {
    return node.nodeValue = text;
  },
  // 获取父节点
  parentNode(el) {
    return el.parentNode;
  },
  // 获取下一个兄弟节点
  nextSibling(el) {
    return el.nextSibling;
  },
  // DOM 查询
  querySelector(selector) {
    return document.querySelector(selector);
  }
};

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value != void 0) {
    el.className = value;
  } else {
    el.removeAttribute("class");
  }
}

// packages/runtime-dom/src/general.ts
var isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
(key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);

// packages/shared/src/utils.ts
var EMPTY_ARR = Object.freeze([]);
var isArray = Array.isArray;
var isFunction = (val) => typeof val === "function";
var isString = (val) => typeof val === "string";
var isObject = (val) => val !== null && typeof val === "object";
var cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
var camelizeRE = /-(\w)/g;
var camelize = cacheStringFunction(
  (str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
  }
);
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
);
var capitalize = cacheStringFunction((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});
var toHandlerKey = cacheStringFunction(
  (str) => {
    const s = str ? `on${capitalize(str)}` : ``;
    return s;
  }
);
var hasChanged = (value, oldValue) => !Object.is(value, oldValue);

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString(next);
  if (next && !isCssString) {
    if (prev) {
      if (!isString(prev)) {
        for (const key in prev) {
          if (next[key] == null) style[key] = null;
        }
      } else {
        for (const prevStyle of prev.split(";")) {
          const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
          if (next[key] == null) style[key] = null;
        }
      }
    }
    for (const key in next) {
      style[key] = next[key];
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function addEventListener(el, event, handler) {
  el.addEventListener(event, handler);
}
function removeEventListener(el, event, handler) {
  el.removeEventListener(event, handler);
}
var veiKey = Symbol("_vei");
function patchEvent(el, rawName, eventValue) {
  const invokers = el[veiKey] ??= {};
  const existingInvoker = invokers[rawName];
  if (eventValue && existingInvoker) {
    existingInvoker.value = eventValue;
  } else {
    const name = rawName.slice(2).toLowerCase();
    if (eventValue) {
      const invoker = invokers[rawName] = createInvoker(eventValue);
      addEventListener(el, name, invoker);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker);
      invokers[rawName] = void 0;
    }
  }
}
function createInvoker(eventValue) {
  const invoker = (e) => invoker.value(e);
  invoker.value = eventValue;
  return invoker;
}

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value == void 0) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/patchProp.ts
var patchProp = (el, key, prevValue, nextValue) => {
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
};

// packages/reactivity/src/system.ts
var linkPool;
function link(dep, sub) {
  const currentDep = sub.depsTail;
  const nextDep = currentDep === void 0 ? sub.depsHead : currentDep.nextDep;
  if (nextDep?.dep === dep) {
    sub.depsTail = nextDep;
    return;
  }
  let newLink;
  if (linkPool) {
    newLink = linkPool;
    linkPool = linkPool.nextDep;
    newLink.nextDep = nextDep;
    newLink.dep = dep;
    newLink.sub = sub;
  } else {
    newLink = {
      sub,
      nextSub: void 0,
      prevSub: void 0,
      dep,
      nextDep
    };
  }
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subsHead = newLink;
    dep.subsTail = newLink;
  }
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink;
    sub.depsTail = newLink;
  } else {
    sub.depsHead = newLink;
    sub.depsTail = newLink;
  }
}
function processComputedUpdate(sub) {
  if (sub.subsHead && sub.update()) {
    propagate(sub.subsHead);
  }
}
function propagate(subs) {
  let link2 = subs;
  let queuedEffect = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true;
      if ("update" in sub) {
        processComputedUpdate(sub);
      } else {
        queuedEffect.push(sub);
      }
    }
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.notify());
}
function startTracking(sub) {
  sub.tracking = true;
  sub.depsTail = void 0;
}
function endTracking(sub) {
  sub.tracking = false;
  const depsTail = sub.depsTail;
  sub.dirty = false;
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep);
      depsTail.nextDep = void 0;
    }
  } else if (sub.depsHead) {
    clearTracking(sub.depsHead);
    sub.depsHead = void 0;
  }
}
function clearTracking(link2) {
  while (link2) {
    const { nextDep, nextSub, dep, prevSub } = link2;
    if (prevSub) {
      prevSub.nextSub = nextSub;
      link2.nextSub = void 0;
    } else {
      dep.subsHead = nextSub;
    }
    if (nextSub) {
      nextSub.prevSub = prevSub;
      link2.prevSub = void 0;
    } else {
      dep.subsTail = prevSub;
    }
    link2.dep = link2.sub = void 0;
    link2.nextDep = linkPool;
    linkPool = link2;
    link2 = nextDep;
  }
}

// packages/reactivity/src/effect.ts
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  depsHead;
  depsTail;
  tracking = false;
  dirty = false;
  // 表示这个 effect 是否激活
  active = true;
  run() {
    if (!this.active) {
      return this.fn();
    }
    const prevSub = activeSub;
    setActiveSub(this);
    startTracking(this);
    try {
      return this.fn();
    } finally {
      setActiveSub(prevSub);
      endTracking(this);
    }
  }
  /**
   * 通知更新的方法，如果依赖的数据发生变化，会调用这个函数
   */
  notify() {
    this.scheduler();
  }
  /**
   * 默认调用 run，如果用户传了，那以用户的为主
   */
  scheduler() {
    this.run();
  }
  stop() {
    if (this.active) {
      startTracking(this);
      endTracking(this);
      this.active = false;
    }
  }
};
function effect(fn, options) {
  const e = new ReactiveEffect(fn);
  Object.assign(e, options);
  e.run();
  const runner = e.run.bind(e);
  runner.effect = e;
  return runner;
}
var activeSub = void 0;
function setActiveSub(sub) {
  activeSub = sub;
}

// packages/reactivity/src/dep.ts
var Dep = class {
  subsHead;
  subsTail;
};
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeSub) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = /* @__PURE__ */ new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }
  link(dep, activeSub);
}
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const targetArray = isArray(target);
  if (targetArray && key === "length") {
    const length = target.length;
    depsMap.forEach((dep, depKey) => {
      if (depKey >= length || depKey === "length") {
        propagate(dep.subsHead);
      }
    });
  } else {
    const dep = depsMap.get(key);
    if (!dep) return;
    propagate(dep.subsHead);
  }
}

// packages/reactivity/src/baseHandlers.ts
var BaseReactiveHandler = class {
  get(target, key, receiver) {
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isRef(res)) return res.value;
    if (isObject(res)) return reactive(res);
    return res;
  }
};
var MutableReactiveHandler = class extends BaseReactiveHandler {
  set(target, key, newValue, receiver) {
    const oldValue = target[key];
    const targetIsArray = isArray(target);
    const oldLength = targetIsArray ? target.length : 0;
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue;
      return true;
    }
    const res = Reflect.set(target, key, newValue, receiver);
    if (hasChanged(newValue, oldValue)) trigger(target, key);
    const newLength = targetIsArray ? target.length : 0;
    if (targetIsArray && newLength !== oldLength && key !== "length") {
      trigger(target, "length");
    }
    return res;
  }
};
var mutableHandlers = new MutableReactiveHandler();

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
var reactiveSet = /* @__PURE__ */ new WeakSet();
function createReactiveObject(target) {
  if (!isObject(target)) return target;
  const existedProxy = reactiveMap.get(target);
  if (existedProxy) return existedProxy;
  if (isReactive(target)) return target;
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  reactiveSet.add(proxy);
  return proxy;
}
function isReactive(target) {
  return reactiveSet.has(target);
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  _value;
  subsHead;
  subsTail;
  ["__v_isRef" /* IS_REF */] = true;
  constructor(value) {
    this._value = isObject(value) ? reactive(value) : value;
  }
  get value() {
    trackRef(this);
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this._value)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      triggerRef(this);
    }
  }
};
function ref(value) {
  return new RefImpl(value);
}
function trackRef(dep) {
  if (activeSub) link(dep, activeSub);
}
function triggerRef(dep) {
  if (dep.subsHead) {
    propagate(dep.subsHead);
  }
}
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
  }
  ["__v_isRef" /* IS_REF */] = true;
  get value() {
    return this._object[this._key];
  }
  set value(newVal) {
    this._object[this._key] = newVal;
  }
};
function unref(ref2) {
  return isRef(ref2) ? ref2.value : ref2;
}
function isRef(r) {
  return r ? r["__v_isRef" /* IS_REF */] === true : false;
}
function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}
function toRefs(target) {
  const res = {};
  for (const key in target) {
    res[key] = new ObjectRefImpl(target, key);
  }
  return res;
}
function proxyRefs(target) {
  return new Proxy(target, {
    get(...args) {
      const res = Reflect.get(...args);
      return unref(res);
    },
    set(target2, key, newValue, receiver) {
      const oldValue = target2[key];
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue;
        return true;
      }
      return Reflect.set(target2, key, newValue, receiver);
    }
  });
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(fn, setter) {
    this.fn = fn;
    this.setter = setter;
  }
  _value = void 0;
  // Dependency
  subsHead;
  subsTail;
  // Subscriber
  depsHead;
  depsTail;
  ["__v_isRef" /* IS_REF */] = true;
  tracking = false;
  dirty = true;
  get value() {
    if (this.dirty) {
      this.update();
    }
    if (activeSub) link(this, activeSub);
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this._value = newValue;
    } else {
      console.warn("readonly");
    }
  }
  update() {
    const prevSub = activeSub;
    setActiveSub(this);
    startTracking(this);
    try {
      const oldValue = this._value;
      this._value = this.fn();
      return hasChanged(oldValue, this._value);
    } finally {
      setActiveSub(prevSub);
      endTracking(this);
    }
  }
};
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/watch.ts
function watch(source, cb, options = {}) {
  let { immediate, once, deep } = options;
  if (once) {
    const _cb = cb;
    cb = (...args) => {
      _cb(...args);
      stop();
    };
  }
  let getter;
  if (isRef(source)) {
    getter = () => source.value;
  } else if (isReactive(source)) {
    getter = () => source;
    if (!deep) deep = true;
  } else if (isFunction(source)) {
    getter = source;
  }
  if (deep) {
    const baseGetter = getter;
    const depth = deep === true ? Infinity : deep;
    getter = () => traverse(baseGetter(), depth);
  }
  let oldValue;
  let cleanup = null;
  function onCleanup(cb2) {
    cleanup = cb2;
  }
  function job() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    const newValue = effect2.run();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue;
  }
  const effect2 = new ReactiveEffect(getter);
  effect2.scheduler = job;
  if (immediate) {
    job();
  } else {
    oldValue = effect2.run();
  }
  function stop() {
    effect2.stop();
  }
  return stop;
}
function traverse(value, depth = Infinity, seen = /* @__PURE__ */ new Set()) {
  if (depth <= 0 || !isObject(value) || seen.has(value)) return value;
  depth--;
  seen.add(value);
  for (const key in value) {
    traverse(value[key], depth, seen);
  }
  return value;
}

// packages/runtime-core/src/vnode.ts
function createVNode(type, props, children = null) {
  let shapeFlag;
  if (isString(type)) {
    shapeFlag = 1 /* ELEMENT */;
  }
  if (isString(children)) {
    shapeFlag |= 8 /* TEXT_CHILDREN */;
  } else if (isArray(children)) {
    shapeFlag |= 16 /* ARRAY_CHILDREN */;
  }
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    // 做 diff 用的
    key: props?.key,
    // 虚拟节点要挂载的元素
    el: null,
    shapeFlag
  };
  return vnode;
}
function isVNode(value) {
  return value?.__v_isVNode;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

// packages/runtime-core/src/renderer.ts
function createRenderer(options) {
  return baseCreateRenderer(options);
}
function baseCreateRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText
  } = options;
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  };
  const patchProps = (el, oldProps, newProps) => {
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
    if (newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key]);
      }
    }
  };
  const patchChildren = (n1, n2) => {
    const el = n2.el;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(n1.children);
      }
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children);
      }
    } else {
      if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, "");
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(n2.children, el);
        }
      } else {
        if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(
              n1.children,
              n2.children,
              el
            );
          } else {
            unmountChildren(n1.children);
          }
        } else {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(n2.children, el);
          }
        }
      }
    }
  };
  const patchKeyedChildren = (c1, c2, container) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      const nextPos = e2 + 1;
      const anchor = nextPos < c2.length ? c2[nextPos].el : null;
      while (i <= e2) {
        patch(null, c2[i++], container, anchor);
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i++]);
      }
    }
    console.log("i,e1,e2 ==> ", i, e1, e2);
  };
  const patchElement = (n1, n2) => {
    const el = n2.el = n1.el;
    const oldProps = n1.props;
    const newProps = n2.props;
    patchProps(el, oldProps, newProps);
    patchChildren(n1, n2);
  };
  const mountElement = (vnode, container, anchor = null) => {
    const { type, props, children, shapeFlag } = vnode;
    const el = hostCreateElement(type);
    vnode.el = el;
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else {
      if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
      }
    }
    hostInsert(el, container, anchor);
  };
  const mountChildren = (children, el) => {
    for (const child of children) patch(null, child, el);
  };
  const unmountChildren = (children) => {
    for (const child of children) unmount(child);
  };
  const unmount = (vnode) => {
    const { children, shapeFlag } = vnode;
    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      unmountChildren(children);
    }
    hostRemove(vnode.el);
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  let l = arguments.length;
  if (l === 2) {
    if (isArray(propsOrChildren)) {
      return createVNode(type, null, propsOrChildren);
    }
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren, children);
    }
    return createVNode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      children = [...arguments].slice(2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

// packages/runtime-dom/src/index.ts
var renderOps = { patchProp, ...nodeOps };
var renderer = createRenderer(renderOps);
function render(vnode, container) {
  renderer.render(vnode, container);
}
export {
  ComputedRefImpl,
  ReactiveEffect,
  activeSub,
  computed,
  createRenderer,
  createVNode,
  effect,
  h,
  isReactive,
  isRef,
  isSameVNodeType,
  isVNode,
  proxyRefs,
  reactive,
  ref,
  render,
  renderOps,
  setActiveSub,
  toRef,
  toRefs,
  trackRef,
  triggerRef,
  unref,
  watch
};
//# sourceMappingURL=vue.esm.js.map
