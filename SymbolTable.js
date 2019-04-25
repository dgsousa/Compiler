const kindMap = {
    var: 'local',
    argument: 'argument',
    field: 'field',
    static: 'static',
}

class SymbolTable {
    constructor() {
        this.counts = {
            local: 0,
            argument: 0,
            field: 0,
            static: 0
        }
        this.classVars = {};
        this.subRoutineVars = {};
    }

    define(name, type, kind) {
        const entry = { type, kind, index: this.counts[kindMap[kind]] };
        (kind === 'static' || kind === 'field')
            ? this.classVars[name] = entry
            : this.subRoutineVars[name] = entry;
        this.counts[kindMap[kind]]++;
    }

    startSubroutine(type, kind) {
        if(kind === 'method') {
            this.subRoutineVars = {
                'this': { type, kind: 'argument', index: 0 }
            };
            this.counts.argument++;
        } else {
            this.subRoutineVars = {};
        }
    }

    varCount(varKind) {
        return this.counts[varKind];
    }

    fieldOf(fieldName, varName) {
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

module.exports = SymbolTable;