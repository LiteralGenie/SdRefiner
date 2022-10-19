import { ImageParams, Sampler } from '../data.service'

export interface Axis<T> {
    name: string
    mapParams: (params: ImageParams, value: T) => ImageParams
    mapDisplay: (params: ImageParams, value: T) => string
}

export const AxisPrompt: Axis<string> = {
    name: 'Prompt',
    mapParams: function (params, value) {
        params.prompt = value + params.prompt
        return params
    },
    mapDisplay: function (params, value) {
        return value
    },
}

export const AxisPromptNegative: Axis<string> = {
    name: 'Negative Prompt',
    mapParams: function (params, value) {
        params.prompt_negative = value + params.prompt_negative
        return params
    },
    mapDisplay: function (params, value) {
        return value
    },
}

export const AxisSteps: Axis<number> = {
    name: 'Steps',
    mapParams: function (params, value) {
        params.steps = value
        return params
    },
    mapDisplay: function (params, value) {
        return value.toString()
    },
}

export const AxisSampler: Axis<Sampler> = {
    name: 'Sampler',
    mapParams: function (params, value) {
        params.sampler = value
        return params
    },
    mapDisplay: function (params, value) {
        return value
    },
}

export const AxisCfgScale: Axis<number> = {
    name: 'CFG',
    mapParams: function (params, value) {
        params.cfg_scale = value
        return params
    },
    mapDisplay: function (params, value) {
        return value.toString()
    },
}

export const AxisSeed: Axis<number> = {
    name: 'Seed',
    mapParams: function (params, value) {
        params.seed = value
        return params
    },
    mapDisplay: function (params, value) {
        return value.toString()
    },
}

export const AxisSize: Axis<[number, number]> = {
    name: 'Size',
    mapParams: function (params, value) {
        params.width = value[0]
        params.height = value[1]
        return params
    },
    mapDisplay: function (params, value) {
        return `${value[0]}x${value[1]}`
    },
}
