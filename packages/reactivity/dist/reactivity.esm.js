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
  sub.update();
  propagate(sub.subsHead);
}
function propagate(subs) {
  let link2 = subs;
  let queuedEffect = [];
  while (link2) {
    const sub = link2.sub;
    if (!sub.tracking) {
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
  tracking;
  run() {
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
  const dep = depsMap.get(key);
  if (!depsMap || !dep) return;
  propagate(dep.subsHead);
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
    const res = Reflect.set(target, key, newValue, receiver);
    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue;
      return res;
    }
    if (hasChanged(newValue, oldValue)) trigger(target, key);
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
function isRef(r) {
  return r ? r["__v_isRef" /* IS_REF */] === true : false;
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
  tracking;
  ["__v_isRef" /* IS_REF */] = true;
  get value() {
    this.update();
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
      this._value = this.fn();
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
export {
  ComputedRefImpl,
  ReactiveEffect,
  activeSub,
  computed,
  effect,
  isReactive,
  isRef,
  reactive,
  ref,
  setActiveSub,
  trackRef,
  triggerRef
};
//# sourceMappingURL=reactivity.esm.js.map
