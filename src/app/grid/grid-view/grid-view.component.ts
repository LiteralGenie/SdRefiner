import { Component } from '@angular/core'
import { Store } from '@ngrx/store'
import { filter } from 'rxjs'
import { DataService } from 'src/app/services/data.service'
import { GridImage } from '../grid-image/grid-image.component'
import { selectGrid } from '../store'
import { Grid } from '../types'

@Component({
    selector: 'app-grid-view',
    templateUrl: './grid-view.component.html',
    styleUrls: ['./grid-view.component.scss'],
})
export class GridViewComponent {
    grid$ = this.store
        .select(selectGrid)
        .pipe(filter((grid) => !!grid))
        .subscribe(this.loadGrid.bind(this))
    images: GridImage[][] = []

    private async loadGrid(grid: Grid) {
        // Define image params
        const images: GridImage[][] = []
        const { baseParams, xAxis, xValues, yAxis, yValues } = grid

        yValues.forEach((yVal) => {
            const row: GridImage[] = []
            let paramsRow = yAxis.mapParams(baseParams, yVal)

            xValues.forEach((xVal) => {
                const paramsCell = xAxis.mapParams(paramsRow, xVal)
                row.push(new GridImage(this.ds, paramsCell))
            })

            images.push(row)
        })

        this.images = images

        // Load images
        this.images.forEach((row) => {
            row.forEach((cell) => {
                cell.loadCached()
            })
        })
        for (let row of images) {
            for (let cell of row) {
                await cell.load()
            }
        }
    }

    get gridStyles() {
        const rowHeights = this.images.map((_, i) => maxHeight(i, this.images))
        const colWidths = this.images[0].map((_, i) => maxWidth(i, this.images))

        return {
            display: 'grid',
            'grid-template-rows': rowHeights
                .map((height) => `${height}px`)
                .join(' '),
            'grid-template-columns': colWidths
                .map((width) => `${width}px`)
                .join(' '),
        }

        function maxWidth(col: number, images: GridImage[][]): number {
            return Math.max(
                ...images
                    .map((row) => row[col])
                    .map((cell) => cell.params.width)
            )
        }
        function maxHeight(row: number, images: GridImage[][]): number {
            return Math.max(...images[row].map((cell) => cell.params.height))
        }
    }

    get colWidths() {
        return this.images[0]
            .map((_, i) => maxWidth(i, this.images))
            .map((width) => `${width}px`)
            .join(' ')

        function maxWidth(col: number, images: GridImage[][]): number {
            return Math.max(
                ...images
                    .map((row) => row[col])
                    .map((cell) => cell.params.width)
            )
        }
    }

    get rowHeights() {
        return this.images
            .map((_, i) => maxHeight(i, this.images))
            .map((height) => `${height}px`)
            .join(' ')

        function maxHeight(row: number, images: GridImage[][]): number {
            return Math.max(...images[row].map((cell) => cell.params.height))
        }
    }

    constructor(private store: Store, private ds: DataService) {}
}
