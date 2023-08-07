export class FakeDBService {
    customResponse: any;
    persistDBModelsPayload: any;
    async persistDBModels(config: any) {
        this.persistDBModelsPayload = config;
        return new Promise((r) => {
            return r(!!this.customResponse ? this.customResponse : true);
        });
    }
}