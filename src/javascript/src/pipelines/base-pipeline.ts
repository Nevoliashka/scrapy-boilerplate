abstract class BasePipeline {
    abstract async process(): Promise<object>;

    async init() {

    }

    async beforeDestroy() {

    }
}
