import { Component, ElementRef, ViewChild } from '@angular/core'
import { Store } from '@ngrx/store'
import * as d3 from 'd3'
import { filter, map, Observable, share, tap } from 'rxjs'
import { DataService } from 'src/app/services/data.service'
import { selectGrid } from '../store'
import { Grid, ImageParams } from '../types'

@Component({
    selector: 'app-grid-view',
    templateUrl: './grid-view.component.html',
    styleUrls: ['./grid-view.component.scss'],
})
export class GridViewComponent {
    grid$ = this.store.select(selectGrid).pipe(
        filter((grid) => !!grid),
        share()
    )

    gridView$: Observable<GridView> = this.grid$.pipe(
        map((grid) => {
            const images = this.loadGrid(grid)

            // Dims
            const rowHeights = images
                .map((_, i) => maxHeight(i, images))
                .map((val) => val * this.scale)

            const colWidths = images
                .map((_, i) => maxWidth(i, images))
                .map((val) => val * this.scale)

            // Titles
            const rowTitles = grid.yValues.map((val) =>
                grid.yAxis.mapDisplay(grid.baseParams, val)
            )
            const colTitles = grid.xValues.map((val) =>
                grid.xAxis.mapDisplay(grid.baseParams, val)
            )

            // Tracks
            const rowTracks = images.map((_, i) => {
                return new Track(rowHeights[i], rowTitles[i])
            })
            const colTracks = images[0].map((_, i) => {
                return new Track(colWidths[i], colTitles[i])
            })

            return new GridView(rowTracks, colTracks, images)

            function maxHeight(row: number, images: GridImage[][]): number {
                return Math.max(
                    ...images[row].map((cell) => cell.params.height)
                )
            }

            function maxWidth(col: number, images: GridImage[][]): number {
                return Math.max(
                    ...images
                        .map((row) => row[col])
                        .map((cell) => cell.params.width)
                )
            }
        }),
        tap(async (grid) => {
            console.log(grid.images)
            // Load cached images
            grid.images.forEach((row) => {
                row.forEach((cell) => {
                    cell.loadCached()
                })
            })

            // Generate the rest
            for (let row of grid.images) {
                for (let cell of row) {
                    await cell.load()
                }
            }
        }),
        share()
    )

    @ViewChild('containerEl') containerEl!: ElementRef<Element>
    scale = 1

    ngOnInit() {
        this.grid$.subscribe(this.loadGrid.bind(this))
    }

    ngAfterViewInit() {
        const el = this.containerEl.nativeElement
        const container = d3.select(el)
        const images = d3.select(el.children[3])
        const yAxis = d3.select(el.children[2])
        const xAxis = d3.select(el.children[1])

        const dragBehavior = d3.drag()
        const zoomBehavior = d3.zoom()
        container.call(zoomBehavior).datum({})

        zoomBehavior.on('zoom', ({ sourceEvent, transform: tfm }) => {
            images
                .style(
                    'transform',
                    `translate(${tfm.x}px, ${tfm.y}px) scale(${tfm.k})`
                )
                .style('transform-origin', '0 0')

            yAxis
                .style('transform', `translate(0, ${tfm.y}px)`)
                .style('transform-origin', '0 0')

            xAxis
                .style('transform', `translate(${tfm.x}px, 0)`)
                .style('transform-origin', '0 0')

            this.scale = tfm.k
        })
    }

    private loadGrid(grid: Grid): GridImage[][] {
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

        return images
    }

    constructor(private store: Store, private ds: DataService) {}
}

class GridView {
    constructor(
        public rows: Track[],
        public cols: Track[],
        public images: GridImage[][]
    ) {}

    cellAt(row: number, col: number) {
        const rowTrk = this.rows[row]
        const colTrk = this.cols[col]
        const x = this.cols
            .slice(0, col)
            .map((trk) => trk.dim)
            .reduce((total, val) => total + val, 0)
        const y = this.rows
            .slice(0, row)
            .map((trk) => trk.dim)
            .reduce((total, val) => total + val, 0)

        return {
            height: rowTrk.dim,
            width: colTrk.dim,
            x: x,
            y: y,
            image: this.images[row][col],
        }
    }
}

class Track {
    constructor(public dim: number, public title: string) {}
}

class GridImage {
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
