import { Component, ElementRef, Input } from '@angular/core'
import { AbstractControl } from '@angular/forms'

@Component({
    selector: 'app-rez-input',
    templateUrl: './rez-input.component.html',
    styleUrls: ['./rez-input.component.scss'],
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

    get width() {
        return this.control?.value[0] || -1
    }
    set width(val: number) {
        const controlVal = [...this.control?.value] || [this.width, this.height]
        controlVal[0] = val
        this.control?.setValue(controlVal)
    }

    get height() {
        return this.control?.value[1] || -1
    }
    set height(val: number) {
        const controlVal = [...this.control?.value] || [this.width, this.height]
        controlVal[1] = val
        this.control?.setValue(controlVal)
    }

    ngAfterViewInit() {
        // const controlVal = this.control!.value
        // this.width = controlVal[0]
        // this.setHeight(controlVal[1])
    }
}
