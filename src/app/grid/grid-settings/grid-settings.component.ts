import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
} from '@angular/core'
import { FormArray, FormControl, FormGroup } from '@angular/forms'
import { MatButton } from '@angular/material/button'
import { Store } from '@ngrx/store'
import { Diff, diffObjects } from '@src/app/utils/compare'
import {
    combineLatest,
    concat,
    EMPTY,
    filter,
    of,
    pairwise,
    Subscription,
} from 'rxjs'
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
    private activeGrid?: Grid
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

    constructor(private store: Store, private cdf: ChangeDetectorRef) {}

    ngOnInit() {
        // Update form if another component edits form
        this.subGridForm = this.store
            .select(selectGridForm)
            .subscribe((gridForm) => {
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
                const control = this.gridForm.get('axisOptions') as FormGroup
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

        this.gridForm.valueChanges.subscribe(this.updateStore.bind(this))

        this.subGrid = this.store.select(selectGrid).subscribe((grid) => {
            this.activeGrid = grid
        })

        // Calculate form changes
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

        // Swap axes if user picks same x / y axis
        const xAxis = this.gridForm.get('xAxis')
        const yAxis = this.gridForm.get('yAxis')
        combineLatest([
            concat(of(xAxis!.value), xAxis!.valueChanges),
            concat(of(yAxis!.value), yAxis!.valueChanges),
        ])
            .pipe(pairwise())
            .subscribe(([[oldX, oldY], [newX, newY]]) => {
                if (newX === newY) {
                    if (oldX === newX) xAxis?.setValue(oldY)
                    if (oldY === newY) yAxis?.setValue(oldX)
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

    onAxisButtonCycle(button: MatButton, direction: -1 | 1) {
        const currentEl = button._elementRef.nativeElement
        const parent = currentEl.parentElement as HTMLElement

        const buttons = Array.from(parent.children).filter(
            (el) => el.nodeName === 'BUTTON'
        ) as HTMLElement[]
        const input = parent.querySelector('input') as HTMLElement

        const idx = buttons.findIndex((el) => el === currentEl)
        let targetIdx = idx

        while (true) {
            targetIdx += direction

            if (targetIdx < 0 || targetIdx >= buttons.length) {
                input.focus()
                return
            }

            const target = buttons[targetIdx] as HTMLButtonElement
            if (!target.disabled) {
                target.focus()
                return
            }
        }
    }

    onAxisReorder(array: FormArray, currentIndex: number, nextIndex: number) {
        const control = array.at(currentIndex)

        if (nextIndex >= 0 && nextIndex < array.length) {
            array.removeAt(currentIndex, { emitEvent: false })
            array.insert(nextIndex, control)
        }
    }

    onAxisValueAdd(array: FormArray, currentIndex: number) {
        const control = array.at(currentIndex)
        const newControl = new FormControl(control.value)
        array.insert(currentIndex + 1, newControl)
    }

    onAxisValueRemove(array: FormArray, currentIndex: number) {
        array.removeAt(currentIndex)
    }

    ngAfterViewInit() {
        // this.save()
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

    getAxisDiff(type: 'xAxis' | 'yAxis'): Diff | undefined {
        const axis =
            type === 'xAxis' ? this.formDiff.xAxis : this.formDiff.yAxis
        if (axis.name) return axis.name

        const values =
            type === 'xAxis' ? this.formDiff.xValues : this.formDiff.yValues
        if (values) return values

        return undefined
    }

    get AXES() {
        return AXES
    }

    get hasChanges(): boolean {
        return Object.values(this.formDiff).some(
            (obj) => Object.keys(obj as any).length > 0
        )
    }

    trackByAxis(index: number, value: any) {
        return value
    }
}
