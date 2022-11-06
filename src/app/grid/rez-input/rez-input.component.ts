import { Component, ElementRef, Input } from '@angular/core'
import { AbstractControl, NG_VALUE_ACCESSOR } from '@angular/forms'

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
export class RezInputComponent {
    @Input() control?: AbstractControl

    onInputBlur(inputVal: string, type: 'width' | 'height') {
        const currentVal = parseInt(inputVal) as number
        const newVal = Math.round(currentVal / 64) * 64

        if (type === 'width') this.width = newVal
        else this.height = newVal
    }

    constructor(private elementRef: ElementRef) {}

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

    width = -1
    setWidth(val: number) {
        this.width = val

        const controlVal = [...this.control?.value] || [this.width, this.height]
        controlVal[0] = val
        this.control?.setValue(controlVal)
    }

    height = -1
    setHeight(val: number) {
        this.height = val

        const controlVal = [...this.control?.value] || [this.width, this.height]
        controlVal[1] = val
        this.control?.setValue(controlVal)
    }

    ngAfterViewInit() {
        const controlVal = this.control!.value
        this.setWidth(controlVal[0])
        this.setHeight(controlVal[1])
    }
}
