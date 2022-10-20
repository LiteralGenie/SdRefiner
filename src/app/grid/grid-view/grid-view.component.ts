import { Component } from '@angular/core'
import { Store } from '@ngrx/store'
import { selectGrid } from '../store'
import { Grid } from '../types'

@Component({
    selector: 'app-grid-view',
    templateUrl: './grid-view.component.html',
    styleUrls: ['./grid-view.component.scss'],
})
export class GridViewComponent {
    grid$ = this.store.select(selectGrid).subscribe(this.loadGrid)

    private loadGrid(grid: Grid) {}

    constructor(private store: Store) {}
}
