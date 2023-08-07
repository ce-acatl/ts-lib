export class Injector {
    dependencies: Map<string, any> = new Map();
    set(nameOfDependency: string, dependency: any) {
        this.dependencies.set(nameOfDependency, dependency);
    }
    get(object: any) {
        const objectName = object.name;
        return this.dependencies.get(objectName);
    }
}