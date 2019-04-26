class VMWriter {
    constructor(filePath) {
        this.filePath = filePath;
        console.log(this.filePath);
    }

    writePush() {
        
    }

    writePop() {

    }

    writeArithmetic() {

    }

    writeLabel() {

    }

    writeGoto() {

    }

    writeIf() {

    }

    writeCall() {

    }

    writeFunction(name, numLocals) {
        console.log(`function ${name} ${numLocals}`);
    }

    writeReturn() {

    }

    close() {

    }
}

module.exports = VMWriter;