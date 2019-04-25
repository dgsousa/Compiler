

class SymbolTable {
    constructor() {
        this.counts = {
            var: 0,
            arg: 0,
            field: 0,
            static: 0
        }
        this.classVars = {};
        this.subRoutineVars = {};
    }

    define(name, type, kind) {
        const entry = { type, kind, index: this.counts[kind] };
        (kind === 'STATIC' || kind === 'FIELD')
            ? this.classVars[name] = entry
            : this.subRoutineVars[name] = entry;
        this.counts[kind]++;
    }

    startSubroutine() {
        this.subRoutineVars = {};
    }

    varCount(varKind) {
        return this.counts[varKind];
    }

    fieldOf = (fieldName, varName) => {
        if(this.subRoutineVars[varName]) return this.subRoutineVars[varName][fieldName];
        else if(this.classVars[varName]) return this.classVars[varName][fieldName];
    }

    kindOf(varName) {
        return this.fieldOf('kind', varName) || 'NONE';
    }

    typeOf(varName) {
        return this.fieldOf('type', varName);
    }

    indexOf(varName) {
        return this.fieldOf('index', varName);
    }
}