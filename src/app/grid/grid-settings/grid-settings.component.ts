import { CdkDragDrop } from '@angular/cdk/drag-drop'
import { Component } from '@angular/core'
import { FormArray, FormControl, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { EMPTY, Subscription, tap } from 'rxjs'
import { AXES, AxisId } from '../axis'
import {
    createGrid,
    selectGrid,
    selectGridForm,
    updateGridForm,
} from '../store'
import { Grid } from '../types'

@Component({
    selector: 'app-grid-settings',
    templateUrl: './grid-settings.component.html',
    styleUrls: ['./grid-settings.component.scss'],
})
export class GridSettingsComponent {
    loaded = false
    activeGrid?: Grid

    private subGridForm: Subscription = EMPTY.subscribe()
    private subGrid: Subscription = EMPTY.subscribe()

    gridForm = new FormGroup({
        baseParams: new FormGroup({
            prompt: new FormControl(''),
            prompt_negative: new FormControl(''),
            sampler: new FormControl(''),
            steps: new FormControl(-1),
            cfg_scale: new FormControl(-1),
            width: new FormControl(-1),
            height: new FormControl(-1),
            seed: new FormControl(-2),
        }),
        xAxis: new FormControl<AxisId>('steps'),
        yAxis: new FormControl<AxisId>('seed'),
        axisOptions: new FormGroup({} as any),
    })

    constructor(private store: Store) {
        this.subGridForm = this.store
            .select(selectGridForm)
            .pipe(
                tap((gridForm) => {
                    gridForm = JSON.parse(JSON.stringify(gridForm))
                    this.loaded = true

                    // Update base params
                    this.gridForm.patchValue(
                        {
                            baseParams: gridForm.baseParams,
                            xAxis: gridForm.activeAxis.x,
                            yAxis: gridForm.activeAxis.y,
                        },
                        { emitEvent: false }
                    )

                    // Update axis options
                    const control = this.gridForm.get(
                        'axisOptions'
                    ) as FormGroup
                    for (let name of Object.keys(control.controls)) {
                        control.removeControl(name, { emitEvent: false })
                    }
                    for (let name of Object.keys(gridForm.axisOptions)) {
                        const value = gridForm.axisOptions[name as AxisId]
                        const ctrl = new FormArray(
                            value.map((x) => new FormControl(x))
                        )
                        control.addControl(name, ctrl, { emitEvent: false })
                    }
                })
            )
            .subscribe()

        this.gridForm.valueChanges.subscribe(this.updateStore)

        this.subGrid = this.store.select(selectGrid).subscribe((grid) => {
            this.activeGrid = grid
        })
    }

    ngOnDestroy() {
        this.subGridForm.unsubscribe()
        this.subGrid.unsubscribe()
    }

    private updateStore(form?: typeof this.gridForm.value): void {
        form = form || this.gridForm.value
        this.store.dispatch(
            updateGridForm({
                baseParams: form.baseParams as any,
                axisOptions: JSON.parse(JSON.stringify(form.axisOptions)),
                activeAxis: {
                    x: form.xAxis as AxisId,
                    y: form.yAxis as AxisId,
                },
            })
        )
    }

    save() {
        const form = this.gridForm.value
        const xAxisId = form.xAxis as AxisId
        const yAxisId = form.yAxis as AxisId
        this.store.dispatch(
            createGrid({
                baseParams: form.baseParams as any,
                xAxis: AXES[xAxisId],
                xValues: form.axisOptions![xAxisId],
                yAxis: AXES[yAxisId],
                yValues: form.axisOptions![yAxisId],
            })
        )
    }

    reset() {
        if (!this.activeGrid) return

        // Reset base params
        this.gridForm.patchValue(
            {
                baseParams: this.activeGrid.baseParams,
                xAxis: this.activeGrid.xAxis.id as AxisId,
                yAxis: this.activeGrid.yAxis.id as AxisId,
            },
            { emitEvent: false }
        )

        // Reset axes
        const axisOptions = this.gridForm.controls['axisOptions'] as FormGroup
        const xAxis = axisOptions.controls[
            this.activeGrid.xAxis.id
        ] as FormArray
        const yAxis = axisOptions.controls[
            this.activeGrid.yAxis.id
        ] as FormArray
        xAxis.clear({ emitEvent: false })
        yAxis.clear({ emitEvent: false })
        for (let xVal of this.activeGrid.xValues) {
            xAxis.push(new FormControl(xVal), { emitEvent: false })
        }
        for (let yVal of this.activeGrid.yValues) {
            yAxis.push(new FormControl(yVal), { emitEvent: false })
        }

        // Notify form update
        this.updateStore()
    }

    drop(event: CdkDragDrop<number[]>) {}
}
