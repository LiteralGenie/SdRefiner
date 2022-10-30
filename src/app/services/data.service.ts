import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import {
    concat,
    concatMap,
    defer,
    EMPTY,
    firstValueFrom,
    from,
    map,
    of,
    Subscription,
    switchMap,
    tap,
} from 'rxjs'

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
                only_cache: true,
            })
        )
    }

    private activeBatch: Subscription = EMPTY.subscribe()
    public queueBatchLoad(images: Image[]): void {
        this.activeBatch.unsubscribe()

        const loadCached$ = of(...images).pipe(
            concatMap((img) => from(img.loadCached()))
        )
        const load$ = of(...images).pipe(
            concatMap((img) => {
                return from(img.load())
            })
        )

        this.activeBatch = concat(loadCached$, load$).subscribe()
    }
}

export class Image {
    data?: string
    status: 'IDLE' | 'LOADING' | 'LOADED' = 'IDLE'

    constructor(private ds: DataService, public readonly params: ImageParams) {}

    public async loadCached(): Promise<boolean> {
        const response = await this.ds.getImageCached(this.params)
        if (!response) return false

        this.data = response
        return true
    }

    public async load() {
        if (this.status === 'LOADED' || this.status === 'LOADING') return

        this.status = 'LOADING'
        try {
            this.data = await this.ds.getImage(this.params)
            this.status = 'LOADED'
        } catch (e) {
            this.status = 'IDLE'
        }
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
