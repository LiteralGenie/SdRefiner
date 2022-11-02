import { Component, ElementRef, HostListener, ViewChild } from '@angular/core'
import { Store } from '@ngrx/store'
import * as d3 from 'd3'
import { filter, map, Observable, share, shareReplay, tap } from 'rxjs'
import { DataService, Image } from 'src/app/services/data.service'
import { selectGrid } from '../store'
import { Grid } from '../types'

@Component({
    selector: 'app-grid-view',
    templateUrl: './grid-view.component.html',
    styleUrls: ['./grid-view.component.scss'],
})
export class GridViewComponent {
    @ViewChild('containerEl') containerEl!: ElementRef<Element>
    scale = 1
    isPressingSpace = false

    private grid$ = this.store.select(selectGrid).pipe(
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

            function maxHeight(row: number, images: Image[][]): number {
                return Math.max(
                    ...images[row].map((cell) => cell.params.height)
                )
            }

            function maxWidth(col: number, images: Image[][]): number {
                return Math.max(
                    ...images
                        .map((row) => row[col])
                        .map((cell) => cell.params.width)
                )
            }
        }),
        tap((grid) => {
            const cells = grid.images.flatMap((row) => row)
            this.ds.queueBatchLoad(cells)
        }),
        shareReplay(1)
    )

    ngOnInit() {
        this.grid$.subscribe(this.loadGrid.bind(this))
    }

    ngAfterViewInit() {
        const containerEl = this.containerEl.nativeElement
        const imGrid = d3
            .select(containerEl)
            .selectChild('svg')
            .selectChild('g')
        const yAxis = d3.select(containerEl.children[2].children[0])
        const xAxis = d3.select(containerEl.children[1].children[0])

        const zoomBehavior = d3.zoom().interpolate(d3.interpolate)
        d3.select(this.containerEl.nativeElement).call(zoomBehavior)

        zoomBehavior.on('zoom', ({ transform: tfm }) => {
            imGrid.attr('transform', tfm.toString())

            yAxis
                .style('transform', `translate(0, ${tfm.y}px)`)
                .style('transform-origin', '0 0')

            xAxis
                .style('transform', `translate(${tfm.x}px, 0)`)
                .style('transform-origin', '0 0')

            this.scale = tfm.k
        })

        zoomBehavior.on('end', ({ sourceEvent, transform: tfm }) => {
            this.gridView$.subscribe((gridView) => {
                if (!sourceEvent) return

                const gridHeight = gridView.rows.reduce(
                    (total, track) => total + track.dim,
                    0
                )
                const gridWidth = gridView.cols.reduce(
                    (total, track) => total + track.dim,
                    0
                )

                const vpHeight = containerEl.clientHeight
                const vpWidth = containerEl.clientWidth

                const realSize = { x: gridWidth * tfm.k, y: gridHeight * tfm.k }

                const minX = -realSize.x * 0.8
                const maxX = vpWidth * 0.8
                const minY = -realSize.y * 0.8
                const maxY = vpHeight * 0.8

                const { x, y } = tfm

                let tgtX, tgtY
                if (x < minX) tgtX = minX
                else if (x > maxX) tgtX = maxX
                if (y < minY) tgtY = minY
                else if (y > maxY) tgtY = maxY

                if (tgtX !== undefined || tgtY !== undefined) {
                    d3.select(containerEl)
                        .transition()
                        .duration(750)
                        .call(
                            zoomBehavior.transform,
                            d3.zoomIdentity
                                .scale(tfm.k)
                                .translate(
                                    (tgtX || x) / tfm.k,
                                    (tgtY || y) / tfm.k
                                )
                        )
                }
            })
        })
    }

    private loadGrid(grid: Grid): Image[][] {
        const images: Image[][] = []
        const { baseParams, xAxis, xValues, yAxis, yValues } = grid

        yValues.forEach((yVal) => {
            const row: Image[] = []
            let paramsRow = yAxis.mapParams(baseParams, yVal)

            xValues.forEach((xVal) => {
                const paramsCell = xAxis.mapParams(paramsRow, xVal)
                row.push(new Image(this.ds, paramsCell))
            })

            images.push(row)
        })

        return images
    }

    constructor(private store: Store, private ds: DataService) {}

    /* prettier-ignore */ @HostListener('document:keydown.space') onSpaceDown() { this.isPressingSpace = true }
    /* prettier-ignore */ @HostListener('document:keyup.space') onSpaceUp() { this.isPressingSpace = false }
}

class GridView {
    constructor(
        public rows: Track[],
        public cols: Track[],
        public images: Image[][]
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
