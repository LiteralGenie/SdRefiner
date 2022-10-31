import {
    createAction,
    createFeatureSelector,
    createReducer,
    on,
    props,
} from '@ngrx/store'
import { DEFAULT_AXIS_OPTIONS, DEFAULT_PARAMS, Grid, GridForm } from './types'

/** Actions */
export const createGrid = createAction('Create Grid', props<Grid>())
export const updateGridForm = createAction(
    'Update Grid Form',
    props<GridForm>()
)

/** Reducers */
export const gridReducer = createReducer<Grid | null>(
    null,
    on(createGrid, (state, grid) => grid)
)
export const gridFormReducer = createReducer<GridForm>(
    {
        baseParams: DEFAULT_PARAMS,
        axisOptions: DEFAULT_AXIS_OPTIONS,
        activeAxis: { x: 'size', y: 'seed' },
    },
    on(updateGridForm, (state, form) => form)
)

/** Selectors */
export const selectGrid = createFeatureSelector<Readonly<Grid>>('grid')
export const selectGridForm =
    createFeatureSelector<Readonly<GridForm>>('gridForm')

/** Effects */

/** Helpers */
