import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormArray, FormControl, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { Diff, DiffObject, diffObjects } from '@src/app/utils/compare'
import { combineLatest, EMPTY, filter, Subscription, tap } from 'rxjs'
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridSettingsComponent {
    loaded = false
    activeGrid?: Grid
    formDiff: any = {
        baseParams: {},
        xAxis: {},
        yAxis: {},
        axisOptions: {},
    }
    showDiffs = false

    private subGridForm: Subscription = EMPTY.subscribe()
    private subGrid: Subscription = EMPTY.subscribe()
    private formChanges: Subscription = EMPTY.subscribe()

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

    constructor(private store: Store) {}

    ngOnInit() {
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

        this.gridForm.valueChanges.subscribe(this.updateStore.bind(this))

        this.subGrid = this.store.select(selectGrid).subscribe((grid) => {
            this.activeGrid = grid
        })

        this.formChanges = combineLatest([
            this.store.select(selectGrid),
            this.store.select(selectGridForm),
        ])
            .pipe(filter(([grid]) => !!grid))
            .subscribe(([grid]) => {
                grid = { ...grid }
                delete (grid as any).type
                const original = (grid || {}) as any
                const update = this.toGrid() as any
                this.formDiff = {
                    ...diffObjects(original || {}, update),
                    baseParams: diffObjects(
                        original?.baseParams || {},
                        update.baseParams
                    ),
                    xAxis: diffObjects(original?.xAxis || {}, update.xAxis),
                    yAxis: diffObjects(original?.yAxis || {}, update.yAxis),
                }
            })
    }

    ngOnDestroy() {
        this.subGridForm.unsubscribe()
        this.subGrid.unsubscribe()
        this.formChanges.unsubscribe()
    }

    private updateStore(
        form?: GridSettingsComponent['gridForm']['value']
    ): void {
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
        this.store.dispatch(createGrid(this.toGrid()))
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

    private toGrid(): Grid {
        const form = this.gridForm.value
        const xAxisId = form.xAxis as AxisId
        const yAxisId = form.yAxis as AxisId

        return {
            baseParams: form.baseParams as any,
            xAxis: AXES[xAxisId],
            xValues: form.axisOptions![xAxisId],
            yAxis: AXES[yAxisId],
            yValues: form.axisOptions![yAxisId],
        }
    }

    trackByIndex(index: number) {
        return index
    }

    onAxisButtonFocus($event: FocusEvent, input: HTMLElement) {
        console.log($event.relatedTarget)
        if (
            ($event.relatedTarget as HTMLElement | null)?.nodeName === 'BUTTON'
        ) {
            $event.preventDefault()
            input.focus()
            return
        }
    }

    ngAfterViewInit() {
        // this.save()
    }

    get AXES() {
        return AXES
    }

    getAxisDiff(type: 'xAxis' | 'yAxis'): Diff | undefined {
        const axis =
            type === 'xAxis' ? this.formDiff.xAxis : this.formDiff.yAxis
        if (axis.name) return axis.name

        const values =
            type === 'xAxis' ? this.formDiff.xValues : this.formDiff.yValues
        if (values) return values

        return undefined
    }
}
