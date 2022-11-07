import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { DEFAULT_AXIS_OPTIONS, DEFAULT_PARAMS, GridForm } from '../types'

@Injectable({
    providedIn: 'root',
})
export class GridSettingsService {
    reload$ = new Subject<any>()

    gridForm!: GridForm

    constructor() {
        const savedGrid = window.localStorage.getItem('gridForm')
        if (savedGrid) {
            this.gridForm = JSON.parse(savedGrid)
        } else {
            this.gridForm = {
                baseParams: DEFAULT_PARAMS,
                axisOptions: DEFAULT_AXIS_OPTIONS,
                activeAxis: { x: 'size', y: 'seed' },
            }
        }

        this.reload$.subscribe(() => {
            window.localStorage.setItem(
                'gridForm',
                JSON.stringify(this.gridForm)
            )
        })
    }
}
