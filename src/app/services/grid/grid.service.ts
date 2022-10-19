import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'
import { ImageParams } from '../data.service'
import { Axis } from './axis'

@Injectable({
    providedIn: 'root',
})
export class GridService {
    grid$ = new Subject<Grid>()

    public createGrid<X, Y>(
        baseParams: ImageParams,
        xAxis: Axis<X>,
        xValues: X[],
        yAxis: Axis<Y>,
        yValues: Y[]
    ): void {}
}

export class Cell {
    constructor(public readonly params: ImageParams) {}
}

export class Grid<X = any, Y = any> {
    constructor(
        private cells: Cell[][],
        private xAxis: Axis<X>,
        yAxis: Axis<Y>
    ) {}
}
