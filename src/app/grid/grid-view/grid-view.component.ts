import { Platform } from '@angular/cdk/platform'
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    ViewChild,
} from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Store } from '@ngrx/store'
import { ContextMenuComponent } from '@perfectmemory/ngx-contextmenu'
import * as d3 from 'd3'
import { filter, map, Observable, share, shareReplay, tap } from 'rxjs'
import { DataService, Image } from 'src/app/services/data.service'
import { GridSettingsService } from '../grid-settings/grid-settings.service'
import { selectGrid } from '../store'
import { Grid } from '../types'

@Component({
    selector: 'app-grid-view',
    templateUrl: './grid-view.component.html',
    styleUrls: ['./grid-view.component.scss'],
})
export class GridViewComponent {
    @Input() onSettingsUpdate!: () => void

    @ViewChild('containerEl') containerEl!: ElementRef<Element>
    @ViewChild('contextMenu') contextMenu!: any

    scale = 1
    padding = 30
    private spinnerSize = 24
    private spinnerScale = 4

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
                .map((val) => val)

            const colWidths = images[0]
                .map((_, i) => maxWidth(i, images))
                .map((val) => val)

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

            return new GridView(
                rowTracks,
                colTracks,
                images,
                grid.xAxis.name,
                grid.yAxis.name
            )

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
        this.gridView$.subscribe(() => this.setZoom(1, 0, 0, 500))
    }

    private zoomBehavior = d3.zoom()
    ngAfterViewInit() {
        const containerEl = this.containerEl.nativeElement

        const zoomBehavior = this.zoomBehavior.interpolate(d3.interpolate)
        d3.select(this.containerEl.nativeElement).call(zoomBehavior)

        zoomBehavior.on('zoom', ({ transform: { k, x, y } }) => {
            this.closeContextMenu()

            const imGrid = d3
                .select(containerEl)
                .selectChild('svg')
                .selectChild('g')
            const yAxis = d3.select(containerEl.children[2].children[0])
            const xAxis = d3.select(containerEl.children[1].children[0])

            imGrid.attr('transform', `translate(${x}, ${y}) scale(${k})`)

            yAxis
                .style('transform', `translate(0, ${y}px)`)
                .style('transform-origin', '0 0')

            xAxis
                .style('transform', `translate(${x}px, 0)`)
                .style('transform-origin', '0 0')

            this.scale = k
        })

        zoomBehavior.on('end', ({ sourceEvent, transform: tfm }) => {
            this.gridView$.subscribe((gridView) => {
                if (!sourceEvent) return

                const gridHeight = gridView.rows.reduce(
                    (total, track) => total + track.dim,
                    this.padding * gridView.rows.length
                )
                const gridWidth = gridView.cols.reduce(
                    (total, track) => total + track.dim,
                    this.padding * gridView.cols.length
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
                        .duration(350)
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

    onCopyImage(image: Image): void {
        if (this.platform.FIREFOX) {
            this.snackBar.open('To copy images, try shift + right-click', 'OK')
        } else {
            this.snackBar.open(`@TODO`)
        }
        // Use clipboard api for chrome but itll require https
    }

    onCtxMenuOpen(menu: ContextMenuComponent<any>): void {
        const image: Image = menu!.value.image
        const copyImageOption = menu.menuItems.get(0)
        const loadOption = menu.menuItems.get(2)
        const regnerateOption = menu.menuItems.get(3)

        copyImageOption!.disabled = image.status !== 'LOADED'
        loadOption!.disabled = image.status !== 'IDLE'
        regnerateOption!.disabled = image.status !== 'LOADED'

        this.cdr.detectChanges()
    }

    onLoadImage($event: any) {
        const image: Image = $event.value.image
        image.loadCached().then(() => image.load())
        this.cdr.detectChanges()
    }

    onForceLoadImage($event: any) {
        const image: Image = $event.value.image
        image.data = undefined
        image.status = 'IDLE'
        image.load()
        this.cdr.detectChanges()
    }

    onSettingsExport($event: any) {
        const image: Image = $event.value.image

        this.gridSettingsService.gridForm = {
            ...this.gridSettingsService.gridForm,
            baseParams: image.params,
        }
        this.gridSettingsService.reload$.next(null)

        this.onSettingsUpdate()
    }

    get status$() {
        return this.gridView$.pipe(
            map((gridView) => {
                const numLoaded = gridView.images.reduce((total, row) => {
                    return (
                        total +
                        row.filter((cell) => cell.status === 'LOADED').length
                    )
                }, 0)
                const numCells = gridView.rows.length * gridView.cols.length

                return {
                    title: `${gridView.yTitle} vs ${gridView.xTitle}`,
                    loaded: `${numLoaded} of ${numCells} loaded`,
                }
            })
        )
    }

    closeContextMenu(): void {
        this.contextMenu.contextMenuStack.closeAll()
    }

    setZoom(scale: number, x: number, y: number, duration = 0) {
        const containerEl = this.containerEl.nativeElement
        d3.select(containerEl)
            .transition()
            .duration(duration)
            .call(
                this.zoomBehavior.transform,
                d3.zoomIdentity.scale(scale).translate(x, y)
            )
    }

    @HostListener('window:keydown.r', ['$event'])
    onKeydownR(ev: KeyboardEvent) {
        const tgt = ev.target as HTMLElement
        if (tgt.nodeName !== 'TEXTAREA' && tgt.nodeName !== 'INPUT') {
            this.setZoom(1, 0, 0, 500)
            ev.preventDefault()
        } else console.log(ev)
    }

    getContainerPosition(cell: Cell, idxRow: number, idxCol: number) {
        const { width: imWidth, height: imHeight } = cell.image.params
        const {
            x: cellX,
            y: cellY,
            width: cellWidth,
            height: cellHeight,
        } = cell
        const remWidth = cellWidth - imWidth
        const remHeight = cellHeight - imHeight
        const padX = this.padding * (idxCol + 1)
        const padY = this.padding * (idxRow + 1)

        return {
            x: cellX + padX + remWidth / 2,
            y: cellY + padY + remHeight / 2,
            width: imWidth,
            height: imHeight,
        }
    }

    getSpinnerPosition(cell: Cell, idxRow: number, idxCol: number): string {
        const containerPos = this.getContainerPosition(cell, idxRow, idxCol)

        const centerX = containerPos.x + containerPos.width / 2
        const centerY = containerPos.y + containerPos.height / 2
        const scaleOffset = (this.spinnerScale * this.spinnerSize) / 2

        return `translate(${centerX - scaleOffset}px, ${
            centerY - scaleOffset
        }px) scale(${this.spinnerScale})`
    }

    constructor(
        private store: Store,
        private ds: DataService,
        private snackBar: MatSnackBar,
        private platform: Platform,
        private cdr: ChangeDetectorRef,
        private gridSettingsService: GridSettingsService
    ) {}
}

type Cell = {
    height: number
    width: number
    x: number
    y: number
    image: Image
}

class GridView {
    constructor(
        public rows: Track[],
        public cols: Track[],
        public images: Image[][],
        public xTitle: string,
        public yTitle: string
    ) {}

    cellAt(row: number, col: number): Cell {
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
