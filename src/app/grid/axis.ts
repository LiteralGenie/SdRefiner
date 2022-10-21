import { ImageParams, Sampler } from './types'

export interface AxisInterface<T> {
    id: Readonly<string>
    name: Readonly<string>
    mapParams: (params: ImageParams, value: T) => ImageParams
    mapDisplay: (params: ImageParams, value: T) => string
}

export const AXIS_PROMPT = {
    id: 'prompt',
    name: 'Prompt',
    mapParams: (params, value) => {
        return {
            ...params,
            prompt: value + params.prompt
        }
    },
    mapDisplay: (params, value) => {
        return value
    },
} as const satisfies AxisInterface<string>

export const AXIS_PROMPT_NEGATIVE = {
    id: 'prompt_negative',
    name: 'Negative Prompt',
    mapParams: (params, value) => {
        return {
            ...params,
            prompt_negative: value + params.prompt_negative
        }
    },
    mapDisplay: (params, value) => {
        return value
    },
} as const satisfies AxisInterface<string>

export const AXIS_STEPS = {
    id: 'steps',
    name: 'Steps',
    mapParams: (params, value) => {
        return {
            ...params,
            steps: value   
        }
    },
    mapDisplay: (params, value) => {
        return value.toString()
    },
} as const satisfies AxisInterface<number>

export const AXIS_SAMPLER = {
    id: 'sampler',
    name: 'Sampler',
    mapParams: (params, value) => {
        return {
            ...params,
            sampler: value   
        }
    },
    mapDisplay: (params, value) => {
        return value
    },
} as const satisfies AxisInterface<Sampler>

export const AXIS_CFG_SCALE= {
    id: 'cfg',
    name: 'CFG',
    mapParams: (params, value) => {
        return {
            ...params,
            cfg_scale: value   
        }
    },
    mapDisplay: (params, value) => {
        return value.toString()
    },
} as const satisfies AxisInterface<number>

export const AXIS_SEED = {
    id: 'seed',
    name: 'Seed',
    mapParams: (params, value) => {
        return {
            ...params,
            seed: value   
        }
    },
    mapDisplay: (params, value) => {
        return value.toString()
    },
} as const satisfies AxisInterface<number>

export const AXIS_SIZE = {
    id: 'size',
    name: 'Size',
    mapParams: (params, value) => {
        return {
            ...params,
            width: value[0],
            height: value[1]   
        }
    },
    mapDisplay: (params, value) => {
        return `${value[0]}x${value[1]}`
    },
} as const satisfies AxisInterface<[number, number]>

export const AXES = {
    prompt: AXIS_PROMPT,
    prompt_negative: AXIS_PROMPT_NEGATIVE,
    steps: AXIS_STEPS,
    sampler: AXIS_SAMPLER,
    cfg: AXIS_CFG_SCALE,
    seed: AXIS_SEED,
    size: AXIS_SIZE,
} as const;

export type AxisId = keyof typeof AXES;
export type Axis = typeof AXES[AxisId]
export type AxisName = Axis['name']