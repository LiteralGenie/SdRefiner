import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { Component } from '@angular/core'

@Component({
    selector: 'app-grid-settings',
    templateUrl: './grid-settings.component.html',
    styleUrls: ['./grid-settings.component.scss'],
})
export class GridSettingsComponent {
    test = [1, 2, 3, 4, 5, 6]

    drop(event: CdkDragDrop<number[]>) {
        moveItemInArray(this.test, event.previousIndex, event.currentIndex)
    }
}
