import co from 'co';

const listen = co.wrap(function* listen(manager, dockerClient, filters, callbacks) {
    const eventStream = yield dockerClient.events(filters);

    eventStream.on('data', co.wrap(function* (data) {
        const event = JSON.parse(data);
        const type = event.Type;
        const action = event.Action;

        if (callbacks[type] && callbacks[type][action]) {
            const next = co.wrap(function* () {

                if (!manager._queue.length) {
                    manager._working = false;
                    return;
                }
                
                const [callback, event] = manager._queue.pop();
                yield callback(event, next);
            });

            if (!manager._working) {
                manager._working = true;
                yield callbacks[type][action](event, next);
                return;
            }

            manager._queue.push([callbacks[type][action], event]);
        }
    }));
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

        this._queue = [];
        this._working = false;
    }

    listen() {
        return listen(this, this._dockerClient, this._filters, this._callbacks);
    }
}

export function createDockerEventsManager(options) {
    return new DockerEventsManager(options);
}
