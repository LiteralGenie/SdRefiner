import { NgModule } from '@angular/core'
import { DragDropModule } from '@angular/cdk/drag-drop'
import { BrowserModule } from '@angular/platform-browser'

import { HttpClientModule } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { StoreModule } from '@ngrx/store'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { GridSettingsComponent } from './grid-settings/grid-settings.component'
import { gridReducer } from './grid/store'
import { TextFieldModule } from '@angular/cdk/text-field'
import { MatSelectModule } from '@angular/material/select'
import { MatDividerModule } from '@angular/material/divider'

@NgModule({
    declarations: [AppComponent, GridSettingsComponent],
    imports: [
        StoreModule.forRoot({ grid: gridReducer }),
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        MatToolbarModule,
        MatSidenavModule,
        MatButtonModule,
        MatTabsModule,
        FormsModule,
        MatFormFieldModule,
        MatChipsModule,
        MatInputModule,
        MatIconModule,
        DragDropModule,
        TextFieldModule,
        MatDividerModule,
        MatSelectModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
