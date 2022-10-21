import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'

const API_URL = 'http://localhost:8860'

@Injectable({
    providedIn: 'root',
})
export class DataService {
    constructor(private http: HttpClient) {}

    public async getImage(request: ImageParams): Promise<string> {
        const url = API_URL + '/generate'
        return await firstValueFrom(
            this.http.post<string>(url, { parameters: request })
        )
    }

    public async getImageCached(
        imageParams: ImageParams
    ): Promise<string | null> {
        const url = API_URL + '/generate'
        return await firstValueFrom(
            this.http.post<string | null>(url, {
                parameters: imageParams,
                onlyCache: true,
            })
        )
    }
}

export interface ImageParams {
    prompt: string
    prompt_negative: string
    steps: number
    sampler: typeof SAMPLERS[number]
    cfg_scale: number
    seed: number
    height: number
    width: number
}

export const DEFAULT_PARAMS: ImageParams = {
    prompt: '',
    prompt_negative: '',
    steps: 1,
    sampler: 'Euler a',
    cfg_scale: 7,
    seed: -1,
    height: 512,
    width: 512,
} as const

export const SAMPLERS = [
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
