import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { DEFAULT_AXIS_OPTIONS, DEFAULT_PARAMS, GridForm } from '../types'

@Injectable({
    providedIn: 'root',
})
export class GridSettingsService {
    reload$ = new Subject<any>()

    gridForm: GridForm = {
        baseParams: DEFAULT_PARAMS,
        axisOptions: DEFAULT_AXIS_OPTIONS,
        activeAxis: { x: 'size', y: 'seed' },
    }
}
