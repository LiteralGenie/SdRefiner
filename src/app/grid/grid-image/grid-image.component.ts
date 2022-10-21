import { Component, Input } from '@angular/core'
import { DataService } from 'src/app/services/data.service'
import { ImageParams } from '../types'

export class GridImage {
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
        this.data = await this.ds.getImage(this.params)
        this.status = 'LOADED'
    }
}

@Component({
    selector: 'app-grid-image',
    templateUrl: './grid-image.component.html',
    styleUrls: ['./grid-image.component.scss'],
})
export class GridImageComponent {
    @Input() img!: GridImage
}
