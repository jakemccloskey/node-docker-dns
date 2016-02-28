import co from 'co';

const listen = co.wrap(function* listen(dockerClient, filters, callbacks) {
    const eventStream = yield dockerClient.events(filters);

    eventStream.on('data', (data) => {
        const event = JSON.parse(data);
        const type = event.Type;
        const action = event.Action;

        if (callbacks[type] && callbacks[type][action]) {
            callbacks[type][action](event);
        }
    });
});

class DockerEventsManager {
    constructor({dockerClient, callbacks}) {
        this._dockerClient = dockerClient;
        this._callbacks = callbacks;
        const type = Object.keys(callbacks);
        const event = Array.from(type.reduce((acc, type) => {
            Object.keys(callbacks[type]).forEach((e) => {
                acc.add(e);
            });
            return acc;
        }, new Set()));
        this._filters = {type, event};
    }

    listen() {
        return listen(this._dockerClient, this._filters, this._callbacks);
    }
}

export function createDockerEventsManager(options) {
    return new DockerEventsManager(options);
}
