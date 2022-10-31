import { Component, ElementRef, HostBinding, Input } from '@angular/core'
import {
    ControlValueAccessor,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
} from '@angular/forms'
import { Subject } from 'rxjs'

type Resolution = [number | null, number | null]

@Component({
    selector: 'app-rez-input',
    templateUrl: './rez-input.component.html',
    styleUrls: ['./rez-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: RezInputComponent,
        },
    ],
})
export class RezInputComponent implements ControlValueAccessor {
    form = new FormGroup({
        0: new FormControl(null as Resolution[number]),
        1: new FormControl(null as Resolution[number]),
    })

    onInputBlur(formControlName: 0 | 1) {
        const control = this.form.controls[formControlName]
        const val = Math.round((control.value as number) / 64) * 64
        control.setValue(val)
    }

    stateChanges = new Subject<void>()
    @Input()
    public get value(): Resolution {
        const formVal = this.form.value as Resolution
        return [formVal[0], formVal[1]]
    }
    public set value(val: Resolution) {
        this.form.setValue(val)
        this.stateChanges.next()
    }

    ngOnDestroy() {
        this.stateChanges.complete()
    }

    static id = 0
    @HostBinding() id = `rez-input-${RezInputComponent.id++}`

    @Input()
    get placeholder(): string {
        return this._placeholder
    }
    set placeholder(plh) {
        this._placeholder = plh
        this.stateChanges.next()
    }
    private _placeholder = 'wtf'

    constructor(private elementRef: ElementRef) {}

    focused = false
    touched = false
    onTouched = () => {}
    onFocusIn(event: FocusEvent) {
        if (!this.focused) {
            this.focused = true
            this.stateChanges.next()
        }
    }
    onFocusOut(event: FocusEvent) {
        if (
            !this.elementRef.nativeElement.contains(
                event.relatedTarget as Element
            )
        ) {
            this.touched = true
            this.focused = false
            this.onTouched()
            this.stateChanges.next()
        }
    }

    get empty() {
        return this.value.includes(null)
    }

    @HostBinding('class.floating')
    get shouldLabelFloat() {
        return this.value.filter((dim) => dim !== null).length > 0
    }

    @Input()
    get disabled(): boolean {
        return this._disabled
    }
    set disabled(value: boolean) {
        this._disabled = !!value
        this._disabled ? this.form.disable() : this.form.enable()
        this.stateChanges.next()
    }
    private _disabled = false

    get errorState(): boolean {
        return this.form.invalid && this.touched
    }

    @Input()
    get required() {
        return this._required
    }
    set required(req) {
        this._required = !!req
        this.stateChanges.next()
    }
    private _required = false

    setDescribedByIds(ids: string[]) {
        const controlElement =
            this.elementRef.nativeElement.querySelector('.container')!
        controlElement.setAttribute('aria-describedby', ids.join(' '))
    }

    onContainerClick(event: MouseEvent) {
        if ((event.target as Element).tagName.toLowerCase() != 'input') {
            const inputs = this.elementRef.nativeElement.querySelector('input')

            for (let el of inputs) {
                if (el.value !== undefined) {
                    el.focus()
                    return
                }
            }
            inputs[0].focus()
        }
    }

    onChange = () => {}
    writeValue(val: Resolution | null): void {
        this.value = val || [null, null]
    }
    registerOnChange(fn: any): void {
        this.onChange = fn
    }
    registerOnTouched(fn: any): void {
        this.onTouched = fn
    }
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled
    }
}
