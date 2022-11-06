import {
    Component,
    HostListener,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
    @ViewChild('drawer') drawer!: MatDrawer

    @HostListener('window:keydown.s', ['$event'])
    onKeydownR(ev: KeyboardEvent) {
        const tgt = ev.target as HTMLElement
        if (tgt.nodeName !== 'TEXTAREA' && tgt.nodeName !== 'INPUT') {
            console.log(ev)
            this.drawer.toggle()
            ev.preventDefault()
        }
    }
}
