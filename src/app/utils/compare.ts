type PrimitiveValue = number | string | null | undefined | Function
export interface PrimitiveObject {
    [index: string]: PrimitiveValue | PrimitiveObject | PrimitiveArray
}
// Array of PrimitiveValue or PrimitiveObject of arbitrary depth
interface PrimitiveArray
    extends Array<PrimitiveValue | PrimitiveObject | PrimitiveArray> {}
type Primitive = PrimitiveValue | PrimitiveObject | PrimitiveArray

const DiffTypes = ['value', 'array', 'object', 'function'] as const
export type DiffType = typeof DiffTypes[number]

export interface Diff<T = any> {
    __type__: DiffType
    original: T | undefined
    update: T | undefined
    added: T | null
    removed: T | null
}

export interface DiffObject {
    [index: string]: Diff | DiffObject
}

/**
 * Returns an object with keys from both objects
 * The corresponding values are the "differences" for each key
 *
 * eg comparing
 *   original = { a: 1, b: [1],    c: 3 }
 *   update   = { a: 2, b: [1, 2], c: 3 }
 * yields
 *   {
 *      a: { original: 1,   updated: 2,     added: 2,   removed: 1},
 *      b: { original: [1], updated: [1,2], added: [2], removed: [] },
 *   }
 *
 * This is a shallow diff, keys pointing to functions and objects are ignored
 * For arrays, functions / objects / arrays, are also ignored
 *
 * @param original
 * @param update
 */
export function diffObjects(
    original: PrimitiveObject,
    update: PrimitiveObject
): any {
    const diff: DiffObject = {}
    let keys = [...Object.keys(original)]
    keys = keys.concat(
        ...Object.keys(update).filter((k) => false === keys.includes(k))
    )

    for (let k of keys) {
        const valO = original[k]
        const valU = update[k]

        if ([valO, valU].includes(undefined)) {
            const typeO = getType(valO)
            const typeU = getType(valU)
            if (typeO === 'value' && typeU === 'value') {
                diff[k] = {
                    __type__: 'value',
                    original: valO,
                    update: valU,
                    added: valU,
                    removed: valO,
                }
            }
            continue
        }

        if (false === compareTypes(valO, valU)) {
            throw new Error(
                `Value for key "${k}" is a different type:\n---\n${JSON.stringify(
                    valO
                )}\n---\n${JSON.stringify(valU)}`
            )
        }

        switch (getType(valO)) {
            case 'value':
                const isChanged = valO !== valU

                if (isChanged) {
                    diff[k] = {
                        __type__: 'value',
                        original: valO,
                        update: valU,
                        added: valU,
                        removed: valO,
                    }
                }
                break
            case 'array':
                const added = getArrayChanges(
                    valO as PrimitiveArray,
                    valU as PrimitiveArray
                )
                const removed = getArrayChanges(
                    valU as PrimitiveArray,
                    valO as PrimitiveArray
                )

                if (added.length > 0 || removed.length > 0) {
                    diff[k] = {
                        __type__: 'array',
                        original: valO,
                        update: valU,
                        added: getArrayChanges(
                            valO as PrimitiveArray,
                            valU as PrimitiveArray
                        ),
                        removed: getArrayChanges(
                            valU as PrimitiveArray,
                            valO as PrimitiveArray
                        ),
                    }
                }
                break
            case 'object':
                break
            case 'function':
                break
        }
    }

    return diff

    function getType(x: Primitive): DiffType {
        if (typeof x === 'function') {
            return 'function'
        } else if (typeof x !== 'object') {
            return 'value'
        } else if (x === null) {
            return 'value'
        } else if (x.constructor.name === 'array') {
            return 'array'
        } else {
            return 'object'
        }
    }

    function getArrayChanges(
        original: PrimitiveArray,
        update: PrimitiveArray
    ): Array<PrimitiveValue> {
        const changes: PrimitiveValue[] = []

        original = original.filter((val) => getType(val as any) === 'value')
        update = update.filter((val) => getType(val as any) === 'value')

        original.forEach((og) => {
            const idx = update.findIndex((up) => og === up)
            if (idx === -1) changes.push(og as PrimitiveValue)
            else update.splice(idx, 1)
        })

        return changes
    }
}

export function compareObjects(
    left: PrimitiveObject,
    right: PrimitiveObject
): boolean {
    const keysL = Object.keys(left).sort()
    const keysR = Object.keys(right).sort()
    if (compareArrays(keysL, keysR) === false) {
        return false
    }

    for (let i = 0; i < keysL.length; i++) {
        const valL = left[keysL[i]]
        const valR = right[keysR[i]]

        if (typeof valL !== typeof valR) {
            return false
        }
        const type = typeof valL

        if (valL === null) {
            if (valR !== null) return false
        } else if (type !== 'object') {
            if (valL !== valR) return false
        } else {
            if (
                compareObjects(
                    valL as PrimitiveObject,
                    valR as PrimitiveObject
                ) === false
            )
                return false
        }
    }

    return true
}

export function compareArrays<T>(left: Array<T>, right: Array<T>): boolean {
    if (left.length !== right.length) {
        return false
    }

    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) {
            return false
        }
    }

    return true
}

function compareTypes(
    left: PrimitiveObject[string],
    right: PrimitiveObject[string]
): boolean {
    const typeL = typeof left
    const typeR = typeof right
    const ctorL = left?.constructor.name
    const ctorR = right?.constructor.name

    if (typeL !== typeR) {
        return false
    } else if (ctorL !== ctorR) {
        return false
    } else if (left === null) {
        return right === null
    } else {
        return true
    }
}
