export class DataCurator {

    #fields;

    constructor () {
        this.#fields = {};
    }

    curate(name, value, version) {

        let field = new CuratedField(name, value, version, Date.now());

        field.onmodified = (value) => {
            if (value != field.value) {
                fieldModified(field);
            }
        }

        return field.modified;
    }

    fieldModified(field) {

    }

    addField(field) {
        field.onmodified = 
    }

}

class CuratedField {

    name;
    loadedValue;
    loadedVersion;
    loadedTime;
    modifiedTime;
    modifiedValue;
    modifiedVersion;

    constructor(name, value, version, time) {
        this.name = name;
        this.loadedValue = value;
        this.loadedVersion = version;
        this.loadedTime = time
    }

    changed(value) {
        this.onchanged(value);
    }

    onchanged = (value) => {}

    modified(value) {
        this.onmodified(value);
    }

    onmodified = (value) => {}


}