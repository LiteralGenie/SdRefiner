import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { TextFieldModule } from '@angular/cdk/text-field'
import { HttpClientModule } from '@angular/common/http'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTabsModule } from '@angular/material/tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { StoreModule } from '@ngrx/store'
import { StoreDevtoolsModule } from '@ngrx/store-devtools'
import { ContextMenuModule } from '@perfectmemory/ngx-contextmenu'
import { NgLetModule } from 'ng-let'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { GridSettingsComponent } from './grid/grid-settings/grid-settings.component'
import { GridViewComponent } from './grid/grid-view/grid-view.component'
import { gridFormReducer, gridReducer } from './grid/store'

@NgModule({
    declarations: [AppComponent, GridSettingsComponent, GridViewComponent],
    imports: [
        StoreModule.forRoot({ grid: gridReducer, gridForm: gridFormReducer }),
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
        TextFieldModule,
        MatDividerModule,
        MatSelectModule,
        NgLetModule,
        ReactiveFormsModule,
        StoreDevtoolsModule.instrument(),
        ContextMenuModule,
        MatCheckboxModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
