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

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isFunction(value) {
  return typeof value === "function";
}
var isArray = Array.isArray;
function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue);
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
export {
  ComputedRefImpl,
  ReactiveEffect,
  activeSub,
  computed,
  effect,
  isReactive,
  isRef,
  proxyRefs,
  reactive,
  ref,
  setActiveSub,
  toRef,
  toRefs,
  trackRef,
  triggerRef,
  unref,
  watch
};
//# sourceMappingURL=reactivity.esm.js.map
