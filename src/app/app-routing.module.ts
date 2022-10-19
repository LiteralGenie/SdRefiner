import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { StoreModule } from '@ngrx/store'

const routes: Routes = []

@NgModule({
    imports: [StoreModule.forRoot({}), RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
