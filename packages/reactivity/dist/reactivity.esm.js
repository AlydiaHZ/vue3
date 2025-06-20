// packages/reactivity/src/effect.ts
var activeSub;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  depsHead;
  depsTail;
  run() {
    const prevSub = activeSub;
    activeSub = this;
    try {
      return this.fn();
    } finally {
      activeSub = prevSub;
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

// packages/reactivity/src/system.ts
function link(dep, sub) {
  const newLink = {
    sub,
    nextSub: void 0,
    prevSub: void 0,
    dep,
    nextDep: void 0,
    prevDep: void 0
  };
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink;
    newLink.prevSub = dep.subsTail;
    dep.subsTail = newLink;
  } else {
    dep.subsHead = newLink;
    dep.subsTail = newLink;
  }
}
function propagate(subs) {
  let link2 = subs;
  let queuedEffect = [];
  while (link2) {
    queuedEffect.push(link2.sub);
    link2 = link2.nextSub;
  }
  queuedEffect.forEach((effect2) => effect2.notify());
}

// packages/reactivity/src/ref.ts
var RefImpl = class {
  _value;
  subsHead;
  subsTail;
  constructor(value) {
    this._value = value;
  }
  get value() {
    trackRef(this);
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
    triggerRef(this);
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
export {
  RefImpl,
  activeSub,
  effect,
  link,
  propagate,
  ref,
  trackRef,
  triggerRef
};
//# sourceMappingURL=reactivity.esm.js.map
