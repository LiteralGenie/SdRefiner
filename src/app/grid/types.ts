import { AxisId, AxisInterface } from './axis'

/**
 * @todo
 * {
 *   baseParams,
 *   axes: {
 *     xId,
 *     xValues,
 *     yId,
 *     yValues
 *   }
 * }
 */
export interface Grid<X = any, Y = any> {
    baseParams: ImageParams
    xAxis: AxisInterface<X>
    xValues: X[]
    yAxis: AxisInterface<Y>
    yValues: Y[]
}

export type GridForm = {
    baseParams: ImageParams
    axisOptions: typeof DEFAULT_AXIS_OPTIONS
    activeAxis: {
        x: AxisId
        y: AxisId
    }
}

export const DEFAULT_AXIS_OPTIONS = {
    prompt: [] as string[],
    prompt_negative: [] as string[],
    steps: [10, 20, 30, 40] as number[],
    sampler: ['Euler a', 'LMS', 'DPM adaptive', 'DPM2 Karras'] as Sampler[],
    cfg: [5, 7, 9, 11, 13],
    seed: [12345, 54321, 6789, 9876],
    size: [
        [256, 768],
        [768, 768],
        [1536, 768],
        [2048, 768],
    ],
}

export const DEFAULT_PARAMS: ImageParams = {
    prompt: '',
    prompt_negative: '',
    steps: 20,
    sampler: 'Euler a',
    cfg_scale: 7,
    seed: -1,
    height: 512,
    width: 512,
} as const

export interface ImageParams {
    prompt: string
    prompt_negative: string
    steps: number
    sampler: Sampler
    cfg_scale: number
    seed: number
    height: number
    width: number
}

const SAMPLERS = [
    'Euler a',
    'Euler',
    'LMS',
    'Heun',
    'DPM2',
    'DPM2 a',
    'DPM fast',
    'DPM adaptive',
    'LMS Karras',
    'DPM2 Karras',
    'DPM2 a Karras',
    'DDIM',
    'PLMS',
] as const

export type Sampler = typeof SAMPLERS[number]
