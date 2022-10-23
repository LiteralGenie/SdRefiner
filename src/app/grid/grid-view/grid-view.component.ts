import { Component, ElementRef, ViewChild } from '@angular/core'
import { Store } from '@ngrx/store'
import * as d3 from 'd3'
import {
    filter,
    map,
    Observable,
    ReplaySubject,
    share,
    tap,
    withLatestFrom,
} from 'rxjs'
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
    images$ = new ReplaySubject<GridImage[][]>(1)

    tracks$: Observable<[Track[], Track[], GridImage[][]]> = this.images$.pipe(
        withLatestFrom(this.grid$),
        map(([images, grid]) => {
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
                return new Track(
                    rowHeights[i],
                    colWidths,
                    rowTitles[i],
                    colTitles
                )
            })
            const colTracks = images[0].map((_, i) => {
                return new Track(
                    colWidths[i],
                    rowHeights,
                    colTitles[i],
                    rowTitles
                )
            })

            return [rowTracks, colTracks, images] as [
                Track[],
                Track[],
                GridImage[][]
            ]

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
        share()
    )

    @ViewChild('containerEl') containerEl!: ElementRef<Element>
    scale = 1

    ngOnInit() {
        this.grid$.subscribe(this.loadGrid.bind(this))
        // this.images$.subscribe((x) => console.log('images', x))
        // this.tracks$.subscribe((x) => console.log('tracks', x))
        // this.rows$.subscribe((x) => console.log('rows', x))
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
            images.style(
                'transform',
                `translate(${tfm.x}px, ${tfm.y}px) scale(${tfm.k})`
            )
            //     .style('transform-origin', '0 0')

            // yAxis
            //     .style('transform', `translate(0, ${tfm.y}px)`)
            //     .style('transform-origin', '0 0')

            // xAxis
            //     .style('transform', `translate(${tfm.x}px, 0)`)
            //     .style('transform-origin', '0 0')

            this.scale = tfm.k
        })

        // dragBehavior.on('start', (ev, d: any) => {
        //     d.start = { x: ev.x, y: ev.y }
        //     d.scrollStart = { x: cell.scrollLeft, y: cell.scrollTop }
        // })

        // dragBehavior.on('drag', (ev, d: any) => {
        //     console.log(ev, d)
        //     cell.scrollTop = d.scrollStart.y - (ev.y - d.start.y)
        //     cell.scrollLeft = d.scrollStart.x - (ev.x - d.start.x)
        // })
    }

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

        // Load images
        images.forEach((row) => {
            row.forEach((cell) => {
                cell.loadCached()
            })
        })
        for (let row of images) {
            for (let cell of row) {
                await cell.load()
            }
        }

        this.images$.next(images)
    }

    constructor(private store: Store, private ds: DataService) {}
}

class Track {
    constructor(
        public dim: number,
        public scDims: number[],
        public title: string,
        public scTitles: string[]
    ) {
        const arrs = [scDims, scTitles]
        if (arrs.slice(1).some((lst) => lst.length !== arrs[0].length))
            throw Error('Secondary values have different lengths')
    }

    pos(index: number): number {
        return this.scDims
            .slice(0, index)
            .reduce((total, val) => total + val, 0)
    }
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
