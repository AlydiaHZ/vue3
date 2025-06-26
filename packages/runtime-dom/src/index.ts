import { patchProp } from './patchProp'

export * from '@vue/runtime-core'

import { nodeOps } from './nodeOps'

const renderOps = { patchProp, ...nodeOps }

export { renderOps }
